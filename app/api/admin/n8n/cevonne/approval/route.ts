export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { submitCevonneApproval } from "@/server/next/api/cevonne-content-automation";
import { getAuthUser, jsonResponse, methodNotAllowed, readJsonBody } from "@/server/next/route-utils";

const unauthorizedResponse = () => jsonResponse({ message: "Unauthorized" }, 401);
const forbiddenResponse = () => jsonResponse({ message: "Forbidden" }, 403);

export async function POST(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return unauthorizedResponse();
  }

  if (auth.role !== "ADMIN") {
    return forbiddenResponse();
  }

  const body = (await readJsonBody(request)) as { research_item_id?: string; action?: string } | undefined;
  if (!body || typeof body !== "object") {
    return jsonResponse({ message: "Invalid JSON body" }, 400);
  }

  const { research_item_id, action } = body;
  if (!research_item_id || typeof research_item_id !== "string") {
    return jsonResponse({ message: "research_item_id is required" }, 400);
  }

  if (action !== "approve" && action !== "reject") {
    return jsonResponse({ message: "action must be 'approve' or 'reject'" }, 400);
  }

  try {
    const result = await submitCevonneApproval(research_item_id, action);
    return jsonResponse(result, result.success ? 200 : 502);
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        status: "ERROR",
        display_status: "Needs Attention",
        title: "Action Failed",
        message: action === "approve" ? "We couldn't approve this content." : "We couldn't reject this content.",
        action_needed: "Review and retry.",
        can_approve: action === "approve",
        can_reject: true,
        can_execute: false,
        can_retry: true,
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
}

export async function GET() {
  return methodNotAllowed(["POST"]);
}
