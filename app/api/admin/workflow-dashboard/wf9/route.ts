export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { G9DateRange } from "@/lib/admin/g9-ads-optimizer";
import {
  getG9Activity,
  getG9Overview,
  getG9Recommendations,
  G9ServiceError,
  runG9Review,
} from "@/server/next/api/g9-ads-optimizer";
import { getAuthUser, jsonResponse, readJsonBody } from "@/server/next/route-utils";

type EventStatus = "PASS" | "BLOCK" | "DRY_RUN" | "ERROR";

type AdsEventRow = {
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

const mapG9Status = (status: string): EventStatus => {
  const upper = status.toUpperCase();
  if (upper.includes("BLOCK") || upper.includes("REJECT")) return "BLOCK";
  if (upper.includes("ISSUE") || upper.includes("ERROR")) return "ERROR";
  if (
    upper.includes("PENDING") ||
    upper.includes("ATTENTION") ||
    upper.includes("REVIEW") ||
    upper.includes("CHANGES") ||
    upper.includes("DRY_RUN")
  ) {
    return "DRY_RUN";
  }
  return "PASS";
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
    const [overview, recommendations, activity] = await Promise.all([
      getG9Overview().catch(() => null),
      getG9Recommendations({
        recommendation: "ALL",
        status: "ALL",
        dateRange: "LAST_30_DAYS",
      }).catch(() => []),
      getG9Activity(15).catch(() => ({ items: [] })),
    ]);

    const events: AdsEventRow[] = [];

    for (const rec of recommendations.slice(0, 12)) {
      const roasText =
        rec.metrics.roas !== null ? `${rec.metrics.roas.toFixed(2)}x ROAS` : "ROAS N/A";
      const spendText =
        rec.metrics.spend !== null
          ? `${rec.metrics.currency} ${rec.metrics.spend.toLocaleString("en-IN")}`
          : "Spend N/A";
      events.push({
        id: `g9-rec-${rec.key}`,
        time: toIso(rec.createdAt),
        status: mapG9Status(rec.status),
        whatHappened: `${rec.subjectLabel} — ${rec.kindLabel} (${rec.statusLabel}). ${rec.mainReason}`,
        actionNeeded: rec.requiresApproval
          ? "Review & approve or reject this budget/ad recommendation."
          : rec.canDryRun
            ? "Ready for safe Dry Run simulation."
            : "No immediate action needed.",
        details: `${rec.reference} · ${spendText} · ${roasText} · ${rec.performanceLabel}`,
      });
    }

    for (const act of (activity.items || []).slice(0, 12)) {
      const actRecord = act as unknown as Record<string, unknown>;
      const actId = String(actRecord.id || actRecord.key || Math.random());
      const actTime = toIso(
        (actRecord.occurredAt || actRecord.createdAt || actRecord.timestamp) as string | undefined
      );
      const actStatus = mapG9Status(String(actRecord.status || actRecord.type || "PASS"));
      const actTitle = String(
        actRecord.title || actRecord.summary || actRecord.message || "Meta Ads activity logged"
      );
      const actDetail = String(
        actRecord.detail || actRecord.description || actRecord.reference || "G9 Ads Monitor"
      );
      events.push({
        id: `g9-act-${actId}`,
        time: actTime,
        status: actStatus,
        whatHappened: actTitle,
        actionNeeded:
          actStatus === "ERROR"
            ? "Check Meta Marketing API connection or n8n logs."
            : actStatus === "DRY_RUN"
              ? "Review recommendation in Meta Ads queue."
              : "No action needed.",
        details: actDetail,
      });
    }

    events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const openCount = overview?.counts.openRecommendations ?? 0;
    const pendingCount = overview?.counts.pendingApproval ?? 0;
    const attentionCount = overview?.counts.needsAttention ?? 0;
    const latest = events[0] || null;

    const status =
      overview?.connection.metaAds === "UNAVAILABLE"
        ? "Needs Attention"
        : pendingCount > 0 || attentionCount > 0
          ? "Review Needed"
          : events.length > 0
            ? "Healthy & Active"
            : "Ready";

    const latestResult = latest
      ? {
          badge: latest.status === "PASS" ? "Processed" : latest.status === "DRY_RUN" ? "Pending Review" : latest.status,
          routeLabel: overview
            ? `Meta Ads: ${overview.connection.metaAds} · AI: ${overview.connection.aiAnalysis}`
            : "Meta Marketing API + OpenAI",
          summary: latest.whatHappened,
          time: overview?.lastUpdatedAt || latest.time,
        }
      : {
          badge: "Ready",
          routeLabel: "Scheduled · Daily 9 AM",
          summary:
            "Workflow 9 is ready. Run Ads Review Dry Run to pull live Meta Ads ROAS, spend, and AI scaling suggestions.",
          time: overview?.lastUpdatedAt ?? null,
        };

    const actionsNeeded =
      pendingCount > 0 || attentionCount > 0
        ? `${openCount} open recommendation(s) (${pendingCount} pending approval, ${attentionCount} needing attention). Review or run a safe Dry Run.`
        : "No immediate action needed. Daily 9 AM Meta Ads ROAS & spend monitor is active.";

    return jsonResponse(
      {
        success: true,
        status,
        latestResult,
        actionsNeeded,
        recentEvents: events.slice(0, 20),
        overview,
      },
      200,
      { "Cache-Control": "no-store" }
    );
  } catch (error) {
    console.error("[WF9 Dashboard] GET error:", error);
    return jsonResponse(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to load Workflow 9 live data.",
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
      dateRange?: G9DateRange;
      note?: string;
    } | null;

    const dateRange: G9DateRange =
      body?.dateRange && ["LAST_7_DAYS", "LAST_30_DAYS", "LAST_90_DAYS"].includes(body.dateRange)
        ? body.dateRange
        : "LAST_30_DAYS";
    const note = body?.note?.trim() || "Safe review triggered from Workflow 9 Dashboard";
    const actor = auth.email?.trim() || auth.name?.trim() || auth.id;

    const webhookUrl =
      process.env.N8N_ADS_MONITOR_WEBHOOK_URL ||
      `${(process.env.N8N_BASE_URL || "https://n8n.cevonne.com/webhook").replace(/\/+$/, "")}/cevonne/ads-monitor`;

    let n8nResponse: unknown = null;
    let n8nTriggered = false;

    try {
      const resp = await fetch(webhookUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
      n8nTriggered = resp.ok;
      const text = await resp.text();
      try {
        n8nResponse = JSON.parse(text);
      } catch {
        n8nResponse = { raw: text };
      }
    } catch (webhookErr) {
      console.warn("[WF9 Dashboard] Direct cevonne/ads-monitor GET fallback:", webhookErr);
      // Fallback: try POST in case n8n webhook method is configured as POST
      try {
        const respPost = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            action: "ads_monitor",
            date_range: dateRange,
            requested_by: actor,
            note,
            timestamp: new Date().toISOString(),
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(15_000),
        });
        n8nTriggered = respPost.ok;
        const textPost = await respPost.text();
        try {
          n8nResponse = JSON.parse(textPost);
        } catch {
          n8nResponse = { raw: textPost };
        }
      } catch (postErr) {
        console.warn("[WF9 Dashboard] Direct cevonne/ads-monitor POST fallback also failed:", postErr);
      }
    }

    // Also run legacy service review if available for database state persistence
    let legacyResult: unknown = null;
    try {
      legacyResult = await runG9Review({ dateRange, note }, actor);
    } catch {
      // safe fallback if old g9 webhook is not active
    }

    return jsonResponse(
      {
        success: true,
        message: n8nTriggered
          ? "Workflow 9 Meta Ads Review triggered live in n8n successfully."
          : "Workflow 9 review request submitted.",
        webhookUrl,
        n8nResponse,
        legacyResult,
      },
      200
    );
  } catch (error) {
    const status = error instanceof G9ServiceError ? error.status : 502;
    console.error("[WF9 Dashboard] POST error:", error);
    return jsonResponse(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to trigger Workflow 9 Meta Ads review.",
      },
      status
    );
  }
}

