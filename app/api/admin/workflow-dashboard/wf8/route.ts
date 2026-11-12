export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getG8DashboardData } from "@/server/next/api/g8-creator-proof";
import { getAuthUser, jsonResponse, readJsonBody } from "@/server/next/route-utils";

const N8N_WORKFLOW_8_ID = "mom9ArhIGtJ6KkWy";
const N8N_G8_INTAKE_WEBHOOK_URL =
  process.env.N8N_G8_UGC_INTAKE_URL || "https://n8n.cevonne.com/webhook/g8-v2-ugc-intake";

type UgcEventStatus = "PASS" | "BLOCK" | "DRY_RUN" | "ERROR";

type UgcEventRow = {
  id: string;
  time: string;
  status: UgcEventStatus;
  whatHappened: string;
  actionNeeded: string;
  details: string;
};

const toIso = (val: Date | string | null | undefined) => {
  if (!val) return new Date().toISOString();
  const d = val instanceof Date ? val : new Date(val);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

const mapUgcStatus = (status: string): UgcEventStatus => {
  const lower = status.toLowerCase();
  if (lower.includes("declined") || lower.includes("blocked") || lower.includes("revoked") || lower.includes("expired")) {
    return "BLOCK";
  }
  if (lower.includes("could not")) {
    return "ERROR";
  }
  if (lower.includes("awaiting") || lower.includes("needed") || lower.includes("required") || lower.includes("review")) {
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
    const actor = auth.email?.trim() || auth.name?.trim() || auth.id;
    const events: UgcEventRow[] = [];

    // 1. Fetch live Workflow 8 executions from n8n API
    const n8nApiKey = process.env.N8N_API_KEY || process.env.N8N_WEBHOOK_SHARED_SECRET;
    if (n8nApiKey) {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 5000);
        const execRes = await fetch(
          `https://n8n.cevonne.com/api/v1/executions?workflowId=${N8N_WORKFLOW_8_ID}&limit=8`,
          {
            headers: { "X-N8N-API-KEY": n8nApiKey },
            signal: controller.signal,
            cache: "no-store",
          }
        );
        clearTimeout(tid);
        if (execRes.ok) {
          const execData = (await execRes.json()) as { data?: Array<Record<string, unknown>> };
          for (const ex of execData.data || []) {
            const finished = Boolean(ex.finished);
            const statusStr = String(ex.status || (finished ? "success" : "error")).toLowerCase();
            const isSuccess = statusStr === "success" || finished;
            const startedAt = toIso((ex.startedAt || ex.createdAt) as string);
            const mode = String(ex.mode || "webhook");

            events.push({
              id: `n8n-exec-${ex.id}`,
              time: startedAt,
              status: isSuccess ? "PASS" : "ERROR",
              whatHappened: isSuccess
                ? `Workflow 8 (${mode}) processed UGC creator proof & permission check.`
                : `Workflow 8 (${mode}) execution encountered an error.`,
              actionNeeded: isSuccess
                ? "No action needed. UGC pipeline handled event."
                : "Inspect execution log in n8n Workflow 8.",
              details: `n8n Execution #${ex.id} · Mode: ${mode}`,
            });
          }
        }
      } catch (err) {
        console.warn("[WF8 Dashboard] n8n execution fetch skipped:", err);
      }
    }

    // 2. Fetch live UGC items from Supabase via getG8DashboardData
    let dashboardSummary: Record<string, unknown> | null = null;
    try {
      const dashboard = await getG8DashboardData(actor);
      dashboardSummary = dashboard.summary as unknown as Record<string, unknown>;
      for (const item of dashboard.items.slice(0, 15)) {
        const handle = item.creatorUsername ? `@${item.creatorUsername.replace(/^@/, "")}` : "Creator";
        events.push({
          id: `ugc-${item.itemKey}`,
          time: toIso(item.receivedAt),
          status: mapUgcStatus(item.currentStatus),
          whatHappened: `${handle} (${item.contentType}) — ${item.currentStatus}. Permission: ${item.permissionLabel} · Safety: ${item.safetyLabel}.`,
          actionNeeded: item.nextAction || "No action needed.",
          details: `Key: ${item.itemKey} · Rights: ${item.rightsLabel} · Disclosure: ${item.disclosureLabel}`,
        });
      }
    } catch (err) {
      console.warn("[WF8 Dashboard] G8 Supabase fetch skipped:", err);
    }

    events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const latest = events[0] || null;
    const errorCount = events.filter((e) => e.status === "ERROR").length;
    const blockCount = events.filter((e) => e.status === "BLOCK").length;
    const reviewCount = events.filter((e) => e.status === "DRY_RUN").length;

    const status =
      errorCount > 0
        ? "Needs Attention"
        : blockCount > 0 || reviewCount > 0
          ? "Review Needed"
          : events.length > 0
            ? "Healthy & Active"
            : "Ready";

    const latestResult = latest
      ? {
          badge: latest.status === "PASS" ? "Processed" : latest.status === "DRY_RUN" ? "Pending Review" : latest.status,
          routeLabel: latest.details,
          summary: latest.whatHappened,
          time: latest.time,
        }
      : {
          badge: "Ready",
          routeLabel: "UGC Intake + Permission",
          summary: "This workflow is ready. Run UGC Intake Dry Run to test creator permission & safety checks.",
          time: null,
        };

    const actionsNeeded =
      errorCount > 0
        ? `${errorCount} execution error(s) detected in recent Workflow 8 runs. Please check n8n logs or run a UGC Dry Run.`
        : reviewCount > 0
          ? `${reviewCount} creator UGC mention(s) are awaiting permission or safety/disclosure review.`
          : blockCount > 0
            ? `${blockCount} UGC item(s) were declined or blocked by brand safety/rights guardrails.`
            : "No immediate action needed. Workflow 8 is actively monitoring Instagram mentions, creator permissions, and brand safety.";

    return jsonResponse(
      {
        success: true,
        status,
        latestResult,
        actionsNeeded,
        recentEvents: events.slice(0, 20),
        summary: dashboardSummary,
      },
      200,
      { "Cache-Control": "no-store" }
    );
  } catch (error) {
    console.error("[WF8 Dashboard] GET error:", error);
    return jsonResponse(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to load Workflow 8 live data.",
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
      creatorUsername?: string;
      contentType?: string;
      caption?: string;
      sourceUrl?: string;
      dryRun?: boolean;
    } | null;

    const creatorUsername = (body?.creatorUsername || "cevonne.creator.test").trim().replace(/^@/, "");
    const contentType = (body?.contentType || "STORY").trim().toUpperCase();
    const caption = (body?.caption || "Loving my @cevonne lipmatte shade today! #cevonne").trim();
    const sourceUrl = (body?.sourceUrl || "https://instagram.com/p/dry-run-test").trim();
    const dryRun = body?.dryRun !== false;

    const secret = process.env.N8N_WEBHOOK_SHARED_SECRET || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (secret) {
      headers["x-cevonne-webhook-secret"] = secret;
      headers["x-n8n-webhook-secret"] = secret;
    }

    const payload = {
      source: "admin_dashboard_wf8_test",
      dry_run: dryRun,
      creator_username: creatorUsername,
      media_type: contentType,
      source_event: contentType === "STORY" ? "STORY_MENTION" : "POST_MENTION",
      caption,
      source_url: sourceUrl,
      timestamp: new Date().toISOString(),
    };

    const res = await fetch(N8N_G8_INTAKE_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const rawText = await res.text().catch(() => "");
    let parsed: unknown = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = { raw: rawText };
    }

    return jsonResponse(
      {
        success: res.ok,
        status: res.status,
        message: res.ok
          ? `Workflow 8 UGC Intake Dry Run completed (${res.status}).`
          : `Workflow 8 webhook returned status ${res.status}.`,
        response: parsed,
      },
      res.ok ? 200 : 502
    );
  } catch (error) {
    console.error("[WF8 Dashboard] POST error:", error);
    return jsonResponse(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to run Workflow 8 test.",
      },
      500
    );
  }
}

