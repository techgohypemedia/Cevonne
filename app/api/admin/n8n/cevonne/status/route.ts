export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getCevonneContentStatus, getCevonneFlowsSummary } from "@/server/next/api/cevonne-content-automation";
import { getAuthUser, jsonResponse, methodNotAllowed } from "@/server/next/route-utils";

const unauthorizedResponse = () => jsonResponse({ message: "Unauthorized" }, 401);
const forbiddenResponse = () => jsonResponse({ message: "Forbidden" }, 403);

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return unauthorizedResponse();
  }

  if (auth.role !== "ADMIN") {
    return forbiddenResponse();
  }

  try {
    const [statusResult, flowsResult] = await Promise.all([
      getCevonneContentStatus(),
      getCevonneFlowsSummary(),
    ]);

    return jsonResponse(
      {
        ...statusResult,
        flows: flowsResult.flows,
        flowStats: flowsResult.stats,
      },
      200
    );
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        status: "ERROR",
        display_status: "Needs Attention",
        title: "Status Check Failed",
        message: "We couldn't load the latest workflow information. Try again.",
        action_needed: "Retry request.",
        can_approve: false,
        can_reject: false,
        can_execute: false,
        can_retry: true,
        timestamp: new Date().toISOString(),
        flows: [],
      },
      500
    );
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}
