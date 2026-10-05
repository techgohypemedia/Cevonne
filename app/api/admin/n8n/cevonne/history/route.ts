export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getCevonneContentHistory } from "@/server/next/api/cevonne-content-automation";
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
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const result = await getCevonneContentHistory(Number.isNaN(limit) ? 10 : limit);
    return jsonResponse(result, 200);
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        history: [],
        count: 0,
        message: "We couldn't load workflow activity. Try again.",
      },
      500
    );
  }
}

export async function POST() {
  return methodNotAllowed(["GET"]);
}
