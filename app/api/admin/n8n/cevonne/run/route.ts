export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { runCevonneContentWorkflow } from "@/server/next/api/cevonne-content-automation";
import { getAuthUser, jsonResponse, methodNotAllowed } from "@/server/next/route-utils";

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

  try {
    const result = await runCevonneContentWorkflow();
    return jsonResponse(result, result.success ? 200 : 502);
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        status: "ERROR",
        display_status: "Needs Attention",
        title: "Workflow Start Failed",
        message: "We couldn't start the workflow. Please try again.",
        action_needed: "Fix issue and retry.",
        can_approve: false,
        can_reject: false,
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
