export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getPrisma } from "@/server/db/prismaClient";
import { buildG7SubmissionMessage } from "@/lib/admin/g7-dashboard-summary";
import { getAuthUser, invalidJsonResponse, jsonResponse, methodNotAllowed, readJsonBody } from "@/server/next/route-utils";

const unauthorizedResponse = () => jsonResponse({ message: "Unauthorized" }, 401);
const forbiddenResponse = () => jsonResponse({ message: "Forbidden" }, 403);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const pickText = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }
  const text = value.trim();
  return text ? text : null;
};

export async function POST(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return unauthorizedResponse();
  }

  if (auth.role !== "ADMIN") {
    return forbiddenResponse();
  }

  const body = await readJsonBody(request);
  if (body instanceof Response) {
    return body;
  }

  if (body !== undefined && !isRecord(body)) {
    return invalidJsonResponse();
  }

  const sku = pickText(body?.sku);
  const urgencyClaim = pickText(body?.urgency_claim);
  const discountCode = pickText(body?.discount_code);
  const intendedUse = pickText(body?.intended_use) ?? "ORGANIC_POST";
  const requestedByWorkflow = pickText(body?.requested_by_workflow) ?? "G4";
  const actor = pickText(body?.actor) ?? "admin_ui";

  if (!sku) {
    return jsonResponse(
      {
        status: "ERROR",
        message: "Please enter a product SKU before checking offer proof.",
      },
      400,
    );
  }

  try {
    const prisma = await getPrisma();
    const now = new Date();

    // 1. Look up real Shade and Inventory stock in Neon
    const matchedShade = await prisma.shade.findFirst({
      where: {
        OR: [
          { sku: { equals: sku, mode: "insensitive" } },
          { name: { contains: sku, mode: "insensitive" } },
        ],
      },
      include: {
        inventory: true,
        product: true,
      },
    });

    const productName = matchedShade
      ? `${matchedShade.product.name} (${matchedShade.name})`
      : `Product SKU: ${sku}`;
    const stockAvailable = matchedShade?.inventory?.quantity ?? 15;

    let status: "PASS" | "BLOCK" | "NEEDS_EVIDENCE" = "PASS";
    let failReason: string | null = null;
    let failureReasons: string[] = [];
    let customMessage: string | null = null;

    // 2. Validate Discount Code if provided
    if (discountCode) {
      const discount = await prisma.cevonne_discounts.findFirst({
        where: { code: { equals: discountCode.toUpperCase() } },
      });

      if (!discount) {
        status = "BLOCK";
        failReason = "DISCOUNT_CODE_NOT_FOUND_IN_NEON";
        failureReasons.push("DISCOUNT_CODE_NOT_FOUND_IN_NEON");
        customMessage = `Discount code "${discountCode}" was not found in the store database.`;
      } else {
        const isExpired = discount.ends_at && new Date(discount.ends_at) <= now;
        const notStarted = discount.starts_at && new Date(discount.starts_at) > now;
        const limitReached = discount.usage_limit_total ? discount.used_count >= discount.usage_limit_total : false;
        const isFounderApproved = Boolean(
          discount.notes && /\[?(FOUNDER_APPROVED|ADMIN_APPROVED|FOUNDER_OVERRIDE)\]?/i.test(discount.notes)
        );
        const dValue = Number(discount.discount_value || 0);
        const isExtreme = (discount.discount_type === "PERCENTAGE" || discount.discount_type === "PERCENT") && dValue > 50 && !isFounderApproved;

        if (discount.status !== "ACTIVE") {
          status = "BLOCK";
          failReason = "DISCOUNT_NOT_ACTIVE";
          failureReasons.push("DISCOUNT_NOT_ACTIVE");
          customMessage = `Coupon "${discountCode}" status is ${discount.status}. Only active coupons can be advertised.`;
        } else if (isExpired) {
          status = "BLOCK";
          failReason = "DISCOUNT_EXPIRED";
          failureReasons.push("DISCOUNT_EXPIRED");
          customMessage = `Coupon "${discountCode}" has expired. Do not use expired vouchers in live ads.`;
        } else if (notStarted) {
          status = "BLOCK";
          failReason = "DISCOUNT_NOT_ACTIVE";
          failureReasons.push("DISCOUNT_NOT_ACTIVE");
          customMessage = `Coupon "${discountCode}" has not started yet.`;
        } else if (limitReached) {
          status = "BLOCK";
          failReason = "DISCOUNT_NOT_ACTIVE";
          failureReasons.push("DISCOUNT_NOT_ACTIVE");
          customMessage = `Coupon "${discountCode}" usage limit has been reached.`;
        } else if (isExtreme) {
          status = "BLOCK";
          failReason = "MARGIN_CEILING_BREACH";
          failureReasons.push("MARGIN_CEILING_BREACH");
          customMessage = `Coupon "${discountCode}" (${dValue}% OFF) breaches 50% margin ceiling without Founder Approval authorization.`;
        }
      }
    }

    // 3. Validate Urgency / Stock Claim
    if (status === "PASS" && stockAvailable === 0) {
      status = "BLOCK";
      failReason = "OUT_OF_STOCK";
      failureReasons.push("OUT_OF_STOCK");
      customMessage = `Product (${productName}) is 100% sold out in the warehouse. Stop ad spend immediately.`;
    }

    if (status === "PASS" && urgencyClaim && /only\s+[123]\s+left/i.test(urgencyClaim) && stockAvailable > 25) {
      status = "NEEDS_EVIDENCE";
      failReason = "STOCK_MISMATCH";
      failureReasons.push("STOCK_MISMATCH");
      customMessage = `Scarcity claim "${urgencyClaim}" does not match warehouse stock (${stockAvailable} units available). ASCI dark-pattern alert.`;
    }

    const message = customMessage || buildG7SubmissionMessage({
      status,
      failReason,
      failureReasons,
    });

    // 4. Record into Neon g7_offer_change_log for audit history
    try {
      await prisma.g7_offer_change_log.create({
        data: {
          sku,
          product_id: productName,
          change_type: "OFFER_SAFETY_PROOF_RUN",
          reason: message,
          status,
          old_payload: {
            urgency_claim: urgencyClaim,
            intended_use: intendedUse,
            requested_by_workflow: requestedByWorkflow,
            actor,
          },
          new_payload: {
            discount_code: discountCode,
            stock_available: stockAvailable,
            discount_status: discountCode ? (status === "PASS" ? "Active" : "Blocked") : "No discount",
          },
        },
      });
    } catch (dbErr) {
      console.warn("Could not save to g7_offer_change_log:", dbErr);
    }

    return jsonResponse(
      {
        status,
        message,
        handled_at: now.toISOString(),
      },
      200,
    );
  } catch (error) {
    console.error("G7 run proof error:", error);
    return jsonResponse(
      {
        status: "ERROR",
        message: "Offer proof check encountered an error while verifying Neon store database.",
      },
      500,
    );
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}
