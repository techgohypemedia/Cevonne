export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getFloatingVideoConfig } from "@/server/services/floating-video";

export async function GET() {
  try {
    const config = await getFloatingVideoConfig();
    return NextResponse.json({
      success: true,
      video: config,
    });
  } catch (error) {
    console.error("GET /api/floating-video error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load floating video configuration" },
      { status: 500 }
    );
  }
}
