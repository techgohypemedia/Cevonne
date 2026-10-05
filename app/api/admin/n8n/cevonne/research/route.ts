export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getCevonneResearchTrends } from "@/server/next/api/cevonne-content-automation";
import { getAuthUser, jsonResponse } from "@/server/next/route-utils";

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
    const result = await getCevonneResearchTrends();
    return jsonResponse(result, 200);
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        message: "Failed to load research trends.",
      },
      500
    );
  }
}
