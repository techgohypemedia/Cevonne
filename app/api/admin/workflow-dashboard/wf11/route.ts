export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getPrisma } from "@/server/db/prismaClient";
import { getAuthUser, jsonResponse } from "@/server/next/route-utils";

const NEW_WF11_WEBHOOK_URL =
  process.env.N8N_NEW_WF11_WEEKLY_DIGEST_URL ||
  "https://n8n.cevonne.com/webhook/cevonne/weekly-digest";

type EventStatus = "PASS" | "BLOCK" | "DRY_RUN" | "ERROR";

type DigestEventRow = {
  id: string;
  time: string;
  status: EventStatus;
  whatHappened: string;
  actionNeeded: string;
  details: string;
};

const toIso = (val: Date | string | null | undefined) => {
  if (!val) return new Date().toISOString();
  const d = val instanceof Date ? val : new Date(val);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

export async function GET(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return jsonResponse({ message: "Unauthorized" }, 401);
  }
  if (auth.role !== "ADMIN") {
    return jsonResponse({ message: "Forbidden" }, 403);
  }

  try {
    const prisma = await getPrisma();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [weeklyOrders, lowStockCount] = await Promise.all([
      prisma.order
        .findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            number: true,
            status: true,
            totals: true,
            createdAt: true,
          },
        })
        .catch(() => []),
      prisma.inventory
        .count({
          where: { quantity: { lte: 5 } },
        })
        .catch(() => 0),
    ]);

    let grossRevenue = 0;
    for (const o of weeklyOrders) {
      const totals = (o.totals || {}) as Record<string, unknown>;
      const amt = Number(totals.total ?? totals.grandTotal ?? totals.subtotal ?? 0);
      if (Number.isFinite(amt)) grossRevenue += amt;
    }
    const orderCount = weeklyOrders.length;
    const aov = orderCount > 0 ? Math.round(grossRevenue / orderCount) : 0;

    const events: DigestEventRow[] = [
      {
        id: `live-weekly-kpi-${new Date().toISOString().slice(0, 13)}`,
        time: weeklyOrders[0]?.createdAt ? toIso(weeklyOrders[0].createdAt) : new Date().toISOString(),
        status: lowStockCount > 0 ? "DRY_RUN" : "PASS",
        whatHappened: `Live 7-Day Commerce Pulse: ₹${Math.round(grossRevenue).toLocaleString("en-IN")} gross revenue across ${orderCount} order(s) (AOV: ₹${aov.toLocaleString("en-IN")}).`,
        actionNeeded:
          lowStockCount > 0
            ? `${lowStockCount} SKU(s) at or below 5 units stock — included in Founder Weekly Digest watch.`
            : "No stockout risks. Ready for Monday 10 AM Founder Digest.",
        details: `Source: Neon PostgreSQL (Last 7 Days) · Low-stock SKUs: ${lowStockCount} · Webhook: cevonne/weekly-digest`,
      },
    ];

    const status = lowStockCount > 0 ? "Review Needed" : "Healthy & Active";

    const latestResult = {
      badge: orderCount > 0 ? "Live KPIs Ready" : "Ready",
      routeLabel: "Cron: Mon 10:00 AM · cevonne/weekly-digest",
      summary: `Live 7-Day Summary: ₹${Math.round(grossRevenue).toLocaleString("en-IN")} gross revenue, ${orderCount} order(s), AOV ₹${aov.toLocaleString("en-IN")}, ${lowStockCount} low-stock SKU(s).`,
      time: events[0]?.time || null,
    };

    const actionsNeeded =
      lowStockCount > 0
        ? `${lowStockCount} low-stock SKU(s) flagged for the Monday Founder Weekly Digest. Click Run Weekly Digest to send a live WhatsApp digest now.`
        : "No immediate action needed. Monday 10 AM Founder Weekly Digest is active with live order & inventory metrics.";

    return jsonResponse(
      {
        success: true,
        status,
        latestResult,
        actionsNeeded,
        recentEvents: events,
      },
      200,
      { "Cache-Control": "no-store" }
    );
  } catch (error) {
    console.error("[WF11 Dashboard] GET error:", error);
    return jsonResponse(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to load Workflow 11 live data.",
      },
      500
    );
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return jsonResponse({ message: "Unauthorized" }, 401);
  }
  if (auth.role !== "ADMIN") {
    return jsonResponse({ message: "Forbidden" }, 403);
  }

  try {
    const res = await fetch(NEW_WF11_WEBHOOK_URL, {
      method: "GET",
      cache: "no-store",
    });

    const rawText = await res.text().catch(() => "");
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : null;
    } catch {
      parsed = { raw: rawText };
    }

    const hasError =
      !res.ok ||
      Boolean(parsed && ("error" in parsed || String(parsed.status || "").toUpperCase() === "ERROR"));

    if (hasError) {
      const errMsg =
        (parsed?.error as { message?: string } | undefined)?.message ||
        (typeof parsed?.message === "string" ? parsed.message : null) ||
        `Workflow 11 webhook returned status ${res.status}.`;
      return jsonResponse(
        {
          success: false,
          message: errMsg,
          response: parsed,
        },
        502
      );
    }

    return jsonResponse(
      {
        success: true,
        message:
          (typeof parsed?.message === "string" && parsed.message) ||
          "Workflow 11 Founder Weekly Digest executed successfully.",
        response: parsed,
      },
      200
    );
  } catch (error) {
    console.error("[WF11 Dashboard] POST error:", error);
    return jsonResponse(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to run Workflow 11 Weekly Digest.",
      },
      502
    );
  }
}
