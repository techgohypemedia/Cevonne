export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { executeCevonneContent } from "@/server/next/api/cevonne-content-automation";
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

  const body = (await readJsonBody(request)) as { research_item_id?: string } | undefined;
  if (!body || typeof body !== "object") {
    return jsonResponse({ message: "Invalid JSON body" }, 400);
  }

  const { research_item_id } = body;
  if (!research_item_id || typeof research_item_id !== "string") {
    return jsonResponse({ message: "research_item_id is required" }, 400);
  }

  try {
    const result = await executeCevonneContent(research_item_id);
    return jsonResponse(result, result.success ? 200 : 502);
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        status: "ERROR",
        display_status: "Needs Attention",
        title: "Execution Failed",
        message: "The content could not be executed. Please review and try again.",
        action_needed: "Review and retry.",
        can_approve: false,
        can_reject: false,
        can_execute: true,
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
