export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAuthUser } from "@/server/next/route-utils";
import {
  getFloatingVideoConfig,
  updateFloatingVideoConfig,
  deleteFloatingVideoConfig,
} from "@/server/services/floating-video";

const requireAdmin = async (request: Request) => {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return null;
};

export async function GET(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const config = await getFloatingVideoConfig();
    return NextResponse.json({ success: true, video: config });
  } catch (error) {
    console.error("GET /api/admin/floating-video error:", error);
    return NextResponse.json({ message: "Failed to fetch floating video" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const updated = await updateFloatingVideoConfig(body);
    return NextResponse.json({ success: true, video: updated });
  } catch (error) {
    console.error("POST /api/admin/floating-video error:", error);
    return NextResponse.json({ message: "Failed to update floating video" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const result = await deleteFloatingVideoConfig();
    return NextResponse.json({ success: true, video: result, message: "Floating video removed" });
  } catch (error) {
    console.error("DELETE /api/admin/floating-video error:", error);
    return NextResponse.json({ message: "Failed to delete floating video" }, { status: 500 });
  }
}
