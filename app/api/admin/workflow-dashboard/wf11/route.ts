export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { WorkflowOutcomeSummary } from "@/lib/admin/workflows";
import { getPrisma } from "@/server/db/prismaClient";
import {
  loadWorkflowDashboardDetail,
  runWorkflowDashboardWorkflow,
} from "@/server/next/api/admin-workflow-dashboard";
import { getAuthUser, jsonResponse, readJsonBody } from "@/server/next/route-utils";

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

const mapEventStatus = (raw: string | null | undefined): EventStatus => {
  const upper = String(raw || "").toUpperCase();
  if (upper.includes("BLOCK")) return "BLOCK";
  if (upper.includes("ERROR") || upper.includes("FAIL")) return "ERROR";
  if (upper.includes("REVIEW") || upper.includes("PENDING") || upper.includes("DRY")) return "DRY_RUN";
  return "PASS";
};

const isWorkflowOutcomeSummary = (item: unknown): item is WorkflowOutcomeSummary =>
  typeof item === "object" && item !== null && "whatHappened" in item && "result" in item;

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

    const [g11Detail, weeklyOrders, lowStockCount] = await Promise.all([
      loadWorkflowDashboardDetail("G11").catch(() => null),
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

    const events: DigestEventRow[] = [];

    // 1. Live 7-day commerce snapshot from Neon DB
    events.push({
      id: `live-weekly-kpi-${new Date().toISOString().slice(0, 13)}`,
      time: weeklyOrders[0]?.createdAt ? toIso(weeklyOrders[0].createdAt) : new Date().toISOString(),
      status: lowStockCount > 0 ? "DRY_RUN" : "PASS",
      whatHappened: `Live 7-Day Commerce Pulse: ₹${Math.round(grossRevenue).toLocaleString("en-IN")} gross revenue across ${orderCount} order(s) (AOV: ₹${aov.toLocaleString("en-IN")}).`,
      actionNeeded:
        lowStockCount > 0
          ? `${lowStockCount} SKU(s) at or below 5 units stock — included in Founder Weekly Digest watch.`
          : "No stockout risks. Ready for Monday 10 AM Founder Digest.",
      details: `Source: Neon PostgreSQL (Last 7 Days) · Low-stock SKUs: ${lowStockCount}`,
    });

    // 2. Live G11 Supabase / n8n digest events
    const recentOutcomes = g11Detail?.recentOutcomes ?? [];
    for (let i = 0; i < recentOutcomes.length && i < 15; i += 1) {
      const ev = recentOutcomes[i];
      if (!isWorkflowOutcomeSummary(ev)) continue;
      events.push({
        id: `g11-${i}-${ev.time || ev.handledAt || "row"}`,
        time: toIso(ev.time || ev.handledAt),
        status: mapEventStatus(ev.result),
        whatHappened: ev.whatHappened || ev.summary || "Weekly Digest event recorded.",
        actionNeeded: ev.actionNeeded || "No action needed.",
        details: ev.sourceLabel || ev.whatWasChecked || "Workflow 11 · G11 Weekly Digest",
      });
    }

    events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const latestG11 = isWorkflowOutcomeSummary(g11Detail?.latestOutcome)
      ? g11Detail.latestOutcome
      : null;
    const errorCount = events.filter((e) => e.status === "ERROR").length;

    const status =
      errorCount > 0
        ? "Needs Attention"
        : lowStockCount > 0
          ? "Review Needed"
          : "Healthy & Active";

    const latestResult = {
      badge: latestG11?.result || (orderCount > 0 ? "Live KPIs Ready" : "Ready"),
      routeLabel: "Cron: Mon 10:00 AM · Neon + Supabase",
      summary:
        latestG11?.whatHappened && !latestG11.whatHappened.toLowerCase().includes("not run yet")
          ? `${latestG11.whatHappened} (Live 7d: ₹${Math.round(grossRevenue).toLocaleString("en-IN")} / ${orderCount} orders)`
          : `Live 7-Day Summary: ₹${Math.round(grossRevenue).toLocaleString("en-IN")} gross revenue, ${orderCount} order(s), AOV ₹${aov.toLocaleString("en-IN")}, ${lowStockCount} low-stock SKU(s).`,
      time: latestG11?.time || latestG11?.handledAt || events[0]?.time || null,
    };

    const actionsNeeded =
      latestG11?.actionNeeded ||
      (lowStockCount > 0
        ? `${lowStockCount} low-stock SKU(s) flagged for the Monday Founder Weekly Digest. You can run a Weekly Digest Dry Run anytime.`
        : "No immediate action needed. Monday 10 AM Founder Weekly Digest is active with live order & inventory metrics.");

    return jsonResponse(
      {
        success: true,
        status,
        latestResult,
        actionsNeeded,
        recentEvents: events.slice(0, 20),
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
    const body = (await readJsonBody(request)) as {
      targetWorkflowGroup?: string;
      platform?: string;
      note?: string;
    } | null;

    const actor = auth.email?.trim() || auth.name?.trim() || auth.id;
    const result = await runWorkflowDashboardWorkflow("G11", {
      runType: "weekly_digest",
      actor,
      note: body?.note?.trim() || "Manual Weekly Digest Dry Run from Workflow 11 Dashboard",
      targetWorkflowGroup: body?.targetWorkflowGroup || "ALL",
      platform: body?.platform || "ALL",
    });

    if (!result) {
      return jsonResponse(
        {
          success: false,
          message: "Workflow 11 Weekly Digest did not return a response.",
        },
        502
      );
    }

    return jsonResponse(
      {
        success: true,
        message: result.message || "Workflow 11 Founder Weekly Digest triggered successfully.",
        response: result,
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
