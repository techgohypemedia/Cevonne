export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getPrisma } from "@/server/db/prismaClient";
import { getAuthUser, jsonResponse, methodNotAllowed } from "@/server/next/route-utils";
import { checkIsAdPromoted } from "@/server/services/inventory-alert.service";

export async function GET(request: Request) {
  try {
    const prisma = await getPrisma();
    const records = await prisma.inventory.findMany({
      orderBy: { quantity: "asc" },
      include: {
        shade: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    const items = records.map((rec) => {
      const productName = rec.shade?.product?.name || "Cevonne Luxury Lipstick";
      const shadeName = rec.shade?.name || "Lipstick Shade";
      const adInfo = checkIsAdPromoted(shadeName, rec.shade?.sku || undefined);
      const isAdProduct = adInfo.isAdProduct;

      // Ad products alert at < 10 units; standard products alert at <= 5 units
      const threshold = isAdProduct ? 10 : 5;
      const isLowStock = rec.quantity <= threshold;

      let alertTier: "AD_OUT_OF_STOCK" | "AD_LOW_STOCK_WARNING" | "STANDARD_LOW_STOCK" | "SAFE";
      let statusText: string;

      if (isAdProduct) {
        if (rec.quantity <= 0) {
          alertTier = "AD_OUT_OF_STOCK";
          statusText = "🚨 PAUSE AD: 100% SOLD OUT";
        } else if (rec.quantity <= 10) {
          alertTier = "AD_LOW_STOCK_WARNING";
          statusText = "⚠️ AD WARNING: HIGH BURN RATE (<10)";
        } else {
          alertTier = "SAFE";
          statusText = "IN STOCK";
        }
      } else {
        if (rec.quantity <= 2) {
          alertTier = "STANDARD_LOW_STOCK";
          statusText = "CRITICAL LOW";
        } else if (rec.quantity <= 5) {
          alertTier = "STANDARD_LOW_STOCK";
          statusText = "LOW STOCK";
        } else {
          alertTier = "SAFE";
          statusText = "IN STOCK";
        }
      }

      return {
        id: rec.id,
        shadeId: rec.shadeId,
        productName,
        shadeName,
        shadeCode: rec.shade?.sku || "",
        color: rec.shade?.hexColor || "#b91c1c",
        quantity: rec.quantity,
        threshold,
        isLowStock,
        isAdProduct,
        activeCampaign: adInfo.campaignName,
        alertTier,
        statusText,
        updatedAt: rec.updatedAt.toISOString(),
      };
    });

    const lowStockCount = items.filter((i) => i.isLowStock).length;
    const adLowStockCount = items.filter((i) => i.isAdProduct && i.isLowStock).length;

    return jsonResponse({
      success: true,
      items,
      totalCount: items.length,
      lowStockCount,
      adLowStockCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[LowStockCheck] Error fetching inventory:", error);
    return jsonResponse(
      {
        success: false,
        message: "Failed to load inventory status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser(request);
    const body = (await request.json().catch(() => ({}))) as {
      forceTest?: boolean;
      shadeId?: string;
    };

    const prisma = await getPrisma();
    const records = await prisma.inventory.findMany({
      orderBy: { quantity: "asc" },
      include: {
        shade: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    const items = records.map((rec) => {
      const productName = rec.shade?.product?.name || "Cevonne Luxury Lipstick";
      const shadeName = rec.shade?.name || "Lipstick Shade";
      const adInfo = checkIsAdPromoted(shadeName, rec.shade?.sku || undefined);
      const isAdProduct = adInfo.isAdProduct;

      const threshold = isAdProduct ? 10 : 5;
      const isLowStock = rec.quantity <= threshold;

      let alertTier: "AD_OUT_OF_STOCK" | "AD_LOW_STOCK_WARNING" | "STANDARD_LOW_STOCK";
      let statusText: string;
      let formattedShadeName: string;

      if (isAdProduct) {
        if (rec.quantity <= 0) {
          alertTier = "AD_OUT_OF_STOCK";
          statusText = "🚨 PAUSE AD: 100% SOLD OUT";
          formattedShadeName = `${shadeName}${rec.shade?.sku ? ` (${rec.shade.sku})` : ""} [ACTIVE AD]`;
        } else {
          alertTier = "AD_LOW_STOCK_WARNING";
          statusText = "⚠️ AD WARNING: HIGH BURN RATE (<10)";
          formattedShadeName = `${shadeName}${rec.shade?.sku ? ` (${rec.shade.sku})` : ""} [ACTIVE AD]`;
        }
      } else {
        alertTier = "STANDARD_LOW_STOCK";
        statusText = rec.quantity <= 2 ? "CRITICAL LOW" : "LOW STOCK";
        formattedShadeName = `${shadeName}${rec.shade?.sku ? ` (${rec.shade.sku})` : ""}`;
      }

      return {
        id: rec.id,
        shadeId: rec.shadeId,
        productName,
        shadeName,
        shadeCode: rec.shade?.sku || "",
        formattedShadeName,
        color: rec.shade?.hexColor || "#b91c1c",
        quantity: rec.quantity,
        threshold,
        isLowStock,
        isAdProduct,
        activeCampaign: adInfo.campaignName || "Meta Ads Campaign",
        alertTier,
        statusText,
        updatedAt: rec.updatedAt.toISOString(),
      };
    });

    let targetItems = items.filter((i) => i.isLowStock);

    if (body.forceTest && targetItems.length === 0 && items.length > 0) {
      // If forcing a test run, simulate with first item
      targetItems = [{ ...items[0], quantity: Math.min(items[0].quantity, 7) }];
    } else if (body.shadeId) {
      const specific = items.find((i) => i.shadeId === body.shadeId || i.id === body.shadeId);
      if (specific) {
        targetItems = [specific];
      }
    }

    if (targetItems.length === 0) {
      return jsonResponse({
        success: true,
        triggered: false,
        message: "All shades are currently safely stocked. No alerts triggered.",
        lowStockCount: 0,
        items,
      });
    }

    const webhookUrl =
      process.env.N8N_INVENTORY_ALERT_WEBHOOK_URL ||
      `${process.env.N8N_BASE_URL || "https://n8n.cevonne.com/webhook"}/cevonne/inventory-alert`;

    const dispatchResults = await Promise.all(
      targetItems.map(async (item) => {
        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(process.env.N8N_WEBHOOK_SHARED_SECRET
                ? { "X-N8N-Secret": process.env.N8N_WEBHOOK_SHARED_SECRET }
                : {}),
            },
            body: JSON.stringify({
              event: "LOW_STOCK_ALERT",
              alert_tier: item.alertTier,
              is_active_ad_product: item.isAdProduct,
              active_campaign: item.activeCampaign,
              product_name: item.productName,
              shade_name: item.shadeName,
              shade_code: item.shadeCode,
              formatted_shade_name: item.formattedShadeName,
              current_stock: item.quantity,
              threshold: item.threshold,
              status_text: item.statusText,
              timestamp: new Date().toISOString(),
            }),
          });

          return {
            shadeName: item.shadeName,
            isAdProduct: item.isAdProduct,
            status: res.status,
            ok: res.ok,
          };
        } catch (err) {
          return {
            shadeName: item.shadeName,
            isAdProduct: item.isAdProduct,
            status: 500,
            ok: false,
            error: err instanceof Error ? err.message : "Fetch failed",
          };
        }
      })
    );

    const anySuccess = dispatchResults.some((r) => r.ok);

    return jsonResponse({
      success: true,
      triggered: true,
      anySuccess,
      message: anySuccess
        ? `Alert triggered successfully to n8n! High-priority WhatsApp alert dispatched for ${targetItems.map((t) => t.shadeName).join(", ")}.`
        : `Dispatched to n8n webhook with status: ${dispatchResults.map((r) => r.status).join(", ")}.`,
      dispatchResults,
      alertedCount: targetItems.length,
      items,
    });
  } catch (error) {
    console.error("[LowStockCheck] Error triggering alert:", error);
    return jsonResponse(
      {
        success: false,
        message: "Failed to trigger alert",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
}
