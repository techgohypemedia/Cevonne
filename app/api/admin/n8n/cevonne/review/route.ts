export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getCevonneContentReview } from "@/server/next/api/cevonne-content-automation";
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
    const result = await getCevonneContentReview();
    return jsonResponse(result, 200);
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        status: "ERROR",
        display_status: "Needs Attention",
        title: "Review Load Failed",
        message: "We couldn't load the review content. Please try again.",
        action_needed: "Retry request.",
        can_approve: false,
        can_reject: false,
        can_execute: false,
        can_retry: true,
        timestamp: new Date().toISOString(),
        items: [],
      },
      500
    );
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}
