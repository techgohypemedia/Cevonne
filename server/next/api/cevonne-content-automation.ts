import "server-only";

import { env } from "@/server/config";
import { getN8nSupabaseAdmin } from "@/lib/n8n-supabase-admin";
import { getSupabaseAdmin, hasSupabaseAdminConfig } from "@/lib/supabase-admin";

const N8N_BASE_URL = (
  process.env.N8N_CEVONNE_CONTENT_BASE_URL ||
  process.env.N8N_BASE_URL ||
  "https://n8n.cevonne.com/webhook"
).replace(/\/+$/, "");

export type WorkflowClientStatus = "PASS" | "PENDING_APPROVAL" | "ERROR" | "BLOCK";

export type FlowCardItem = {
  id: string;
  flowNumber: number;
  title: string;
  purpose: string;
  stage: "research" | "review" | "execution";
  status: WorkflowClientStatus;
  displayStatus: string;
  lastChecked: string;
  urgentAction: string;
  buttonLabel: string;
  buttonAction: "run" | "review" | "execute";
  endpoint: string;
};

export type ContentStatusMapping = {
  rawStatus: string;
  clientStatus: WorkflowClientStatus;
  displayStatus: string;
  actionNeeded: string;
  message: string;
};

export type PublishingRecord = {
  research_item_id: string;
  rank?: number | null;
  generated_caption?: string | null;
  content_concept?: string | null;
  generated_content_type?: string | null;
  image_count?: number | null;
  r2_image_path?: string | string[] | null;
  image_urls?: string[];
  status: string;
  client_status: WorkflowClientStatus;
  display_status: string;
  action_needed: string;
  created_at?: string | null;
};

export type FrontendSafeResponse = {
  success: boolean;
  status: WorkflowClientStatus;
  display_status: string;
  title: string;
  message: string;
  action_needed: string;
  can_approve: boolean;
  can_reject: boolean;
  can_execute: boolean;
  can_retry: boolean;
  timestamp: string;
  latest_item?: PublishingRecord | null;
  items?: PublishingRecord[];
  history?: PublishingRecord[];
};

export type ResearchCandidate = {
  research_item_id: string;
  rank: number;
  concept: string;
  source_type: string;
  hashtags: string[];
  engagement_score: number;
  virality_index: number;
  resonance_score: number;
  metrics: {
    likes: string;
    comments: string;
    shares: string;
  };
  passed_to_workflow_2: boolean;
};

export type ResearchBatch = {
  batch_id: string;
  target_query: string;
  last_scanned: string;
  total_posts_analyzed: number;
  high_velocity_trends: number;
  top_hashtags: { tag: string; volume: string; growth: string }[];
  viral_audio_tags: { title: string; usage: string }[];
  candidates: ResearchCandidate[];
};

let LAST_RESEARCH_RUN: string | null = null;

// Section 2: Status Mapping
export function mapBackendStatus(backendStatus?: string | null): ContentStatusMapping {
  const normalized = (backendStatus || "").trim().toLowerCase();

  switch (normalized) {
    case "ready_for_review":
    case "pending_approval":
    case "review":
      return {
        rawStatus: "ready_for_review",
        clientStatus: "PENDING_APPROVAL",
        displayStatus: "Pending Approval",
        actionNeeded: "Review and approve the content.",
        message: "New Cevonne content is ready for review.",
      };
    case "approved":
      return {
        rawStatus: "approved",
        clientStatus: "PASS",
        displayStatus: "Approved",
        actionNeeded: "Execute the approved content.",
        message: "Content approved and ready for execution.",
      };
    case "rejected":
      return {
        rawStatus: "rejected",
        clientStatus: "BLOCK",
        displayStatus: "Rejected",
        actionNeeded: "Review and re-run if needed.",
        message: "This content was rejected and is not ready for execution.",
      };
    case "publishing":
      return {
        rawStatus: "publishing",
        clientStatus: "PASS",
        displayStatus: "Publishing",
        actionNeeded: "Wait for publishing to finish.",
        message: "Publishing process is currently running.",
      };
    case "published":
      return {
        rawStatus: "published",
        clientStatus: "PASS",
        displayStatus: "Published",
        actionNeeded: "No action needed.",
        message: "Content has been successfully published.",
      };
    case "block":
    case "blocked":
      return {
        rawStatus: "blocked",
        clientStatus: "BLOCK",
        displayStatus: "Needs Attention",
        actionNeeded: "Review safety or policy issues.",
        message: "The workflow safely stopped this action because a required check did not pass.",
      };
    default:
      if (normalized.includes("error") || normalized.includes("fail")) {
        return {
          rawStatus: "error",
          clientStatus: "ERROR",
          displayStatus: "Needs Attention",
          actionNeeded: "Review and retry.",
          message: "Something prevented completion. Please review and retry.",
        };
      }
      return {
        rawStatus: normalized || "idle",
        clientStatus: "PASS",
        displayStatus: "Working normally",
        actionNeeded: "No action needed.",
        message: "Workflow is active and ready.",
      };
  }
}

// Image URL Resolver
export function resolveImageUrl(path: string): string {
  const trimmed = (path || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  const publicUrl = env.r2PublicUrl ? env.r2PublicUrl.replace(/\/+$/, "") : "";
  if (publicUrl) {
    return `${publicUrl}/${trimmed.replace(/^\/+/, "")}`;
  }

  return trimmed;
}

export function normalizeImageUrls(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => resolveImageUrl(String(item))).filter(Boolean);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => resolveImageUrl(String(item))).filter(Boolean);
        }
      } catch {}
    }
    if (trimmed.includes(",")) {
      return trimmed
        .split(",")
        .map((s) => resolveImageUrl(s.trim()))
        .filter(Boolean);
    }
    return [resolveImageUrl(trimmed)].filter(Boolean);
  }
  return [];
}

// Helper to get Supabase client
function getSupabaseClient() {
  try {
    const client = getN8nSupabaseAdmin();
    if (client) return client;
  } catch {}

  try {
    if (hasSupabaseAdminConfig()) {
      return getSupabaseAdmin();
    }
  } catch {}

  return null;
}

// Direct Webhook Caller
async function callN8nEndpoint(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>,
  timeoutMs = 15000
): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  const url = `${N8N_BASE_URL}/${path.replace(/^\/+/, "")}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: method === "POST" && body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);

    const text = await res.text().catch(() => "");
    let parsed: any = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    return {
      ok: res.ok,
      status: res.status,
      data: parsed,
    };
  } catch (err: any) {
    const isTimeout = err?.name === "AbortError";
    return {
      ok: false,
      status: isTimeout ? 504 : 502,
      data: null,
      error: isTimeout ? "Request timed out" : err?.message || "Failed to connect to N8N",
    };
  }
}

// 1. Run Workflow
export async function runCevonneContentWorkflow(): Promise<FrontendSafeResponse> {
  LAST_RESEARCH_RUN = new Date().toISOString();

  const res = await callN8nEndpoint("cevonne/content/run", "POST", {
    action: "run",
    source: "website",
  });

  const timestamp = new Date().toISOString();

  if (!res.ok) {
    return {
      success: false,
      status: "ERROR",
      display_status: "Needs Attention",
      title: "Workflow Start Failed",
      message: "We couldn't start the workflow. Please try again.",
      action_needed: "Fix issue and retry.",
      can_approve: false,
      can_reject: false,
      can_execute: false,
      can_retry: true,
      timestamp,
    };
  }

  return {
    success: true,
    status: "PASS",
    display_status: "Working normally",
    title: "Content Automation Started",
    message: "Content automation started successfully.",
    action_needed: "Wait for research and generation to complete.",
    can_approve: false,
    can_reject: false,
    can_execute: false,
    can_retry: false,
    timestamp,
  };
}

// 2. Review Content
export async function getCevonneContentReview(): Promise<FrontendSafeResponse> {
  const timestamp = new Date().toISOString();

  // Call review webhook
  const res = await callN8nEndpoint("cevonne/content/review", "GET");

  if (res.ok && res.data) {
    const rawItems = Array.isArray(res.data) ? res.data : res.data.items || (res.data.data ? res.data.data : [res.data]);
    const items: PublishingRecord[] = (rawItems || []).map((item: any) => {
      const mapping = mapBackendStatus(item.status || "ready_for_review");
      return {
        research_item_id: String(item.research_item_id || item.id || "RES-ITEM"),
        rank: item.rank ?? null,
        generated_caption: item.generated_caption ?? item.caption ?? null,
        content_concept: item.content_concept ?? item.concept ?? null,
        generated_content_type: item.generated_content_type ?? item.type ?? "Instagram Post",
        image_count: item.image_count ?? (item.images?.length || 0),
        r2_image_path: item.r2_image_path ?? null,
        image_urls: normalizeImageUrls(item.r2_image_path || item.images || item.image_url),
        status: mapping.rawStatus,
        client_status: mapping.clientStatus,
        display_status: mapping.displayStatus,
        action_needed: mapping.actionNeeded,
        created_at: item.created_at ?? timestamp,
      };
    });

    const latest = items[0] || null;

    return {
      success: true,
      status: latest ? latest.client_status : "PASS",
      display_status: latest ? latest.display_status : "Working normally",
      title: latest ? "Content Ready for Review" : "No Content Pending Review",
      message: latest ? "New Cevonne content is ready for review." : "There is no content awaiting review at this time.",
      action_needed: latest ? latest.action_needed : "No action needed.",
      can_approve: Boolean(latest && latest.client_status === "PENDING_APPROVAL"),
      can_reject: Boolean(latest && latest.client_status === "PENDING_APPROVAL"),
      can_execute: Boolean(latest && latest.status === "approved"),
      can_retry: false,
      timestamp,
      latest_item: latest,
      items,
    };
  }

  // Fallback to Supabase `cevonne_publishing` where status = ready_for_review
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("cevonne_publishing")
        .select("research_item_id, rank, generated_caption, content_concept, generated_content_type, image_count, r2_image_path, status, created_at")
        .in("status", ["ready_for_review", "pending_approval", "review"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data && data.length > 0) {
        const items: PublishingRecord[] = data.map((item: any) => {
          const mapping = mapBackendStatus(item.status);
          return {
            research_item_id: String(item.research_item_id),
            rank: item.rank,
            generated_caption: item.generated_caption,
            content_concept: item.content_concept,
            generated_content_type: item.generated_content_type,
            image_count: item.image_count,
            r2_image_path: item.r2_image_path,
            image_urls: normalizeImageUrls(item.r2_image_path),
            status: mapping.rawStatus,
            client_status: mapping.clientStatus,
            display_status: mapping.displayStatus,
            action_needed: mapping.actionNeeded,
            created_at: item.created_at,
          };
        });

        const latest = items[0];
        return {
          success: true,
          status: "PENDING_APPROVAL",
          display_status: "Pending Approval",
          title: "Content Ready for Review",
          message: "New Cevonne content is ready for review.",
          action_needed: "Review and approve the content.",
          can_approve: true,
          can_reject: true,
          can_execute: false,
          can_retry: false,
          timestamp,
          latest_item: latest,
          items,
        };
      }
    } catch {}
  }

  return {
    success: true,
    status: "PASS",
    display_status: "Working normally",
    title: "No Content Pending Review",
    message: "No content is currently waiting for review from your n8n workflow or Supabase.",
    action_needed: "Run Workflow 1 to start trend research and content generation.",
    can_approve: false,
    can_reject: false,
    can_execute: false,
    can_retry: false,
    timestamp,
    items: [],
  };
}

// 3. Approval / Rejection
export async function submitCevonneApproval(
  researchItemId: string,
  action: "approve" | "reject"
): Promise<FrontendSafeResponse> {
  const timestamp = new Date().toISOString();

  const res = await callN8nEndpoint("cevonne/content/approval", "POST", {
    research_item_id: researchItemId,
    action,
  });

  // Update Supabase if available
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from("cevonne_publishing")
        .update({ status: action === "approve" ? "approved" : "rejected" })
        .eq("research_item_id", researchItemId);
    } catch {}
  }

  if (!res.ok) {
    return {
      success: false,
      status: "ERROR",
      display_status: "Needs Attention",
      title: "Approval Request Failed",
      message:
        action === "approve"
          ? "Failed to send approval to n8n (ensure webhook /cevonne/content/approval is registered)."
          : "Failed to send rejection to n8n.",
      action_needed: "Check n8n workflow and retry.",
      can_approve: action === "approve",
      can_reject: true,
      can_execute: false,
      can_retry: true,
      timestamp,
    };
  }

  if (action === "approve") {
    return {
      success: true,
      status: "PASS",
      display_status: "Approved",
      title: "Content Approved",
      message: "Content approved in n8n. Ready for execution in Workflow 3.",
      action_needed: "Execute the approved content.",
      can_approve: false,
      can_reject: false,
      can_execute: true,
      can_retry: false,
      timestamp,
    };
  }

  return {
    success: true,
    status: "BLOCK",
    display_status: "Rejected",
    title: "Content Rejected",
    message: "Content rejected in n8n.",
    action_needed: "Review/re-run if needed.",
    can_approve: false,
    can_reject: false,
    can_execute: false,
    can_retry: false,
    timestamp,
  };
}

// 4. Execute Approved Content
export async function executeCevonneContent(researchItemId: string): Promise<FrontendSafeResponse> {
  const timestamp = new Date().toISOString();

  const res = await callN8nEndpoint("cevonne/content/execute", "POST", {
    research_item_id: researchItemId,
  });

  // Update Supabase if available
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from("cevonne_publishing")
        .update({ status: "published" })
        .eq("research_item_id", researchItemId);
    } catch {}
  }

  if (!res.ok) {
    return {
      success: false,
      status: "ERROR",
      display_status: "Needs Attention",
      title: "Execution Failed",
      message: "Failed to trigger n8n execution webhook.",
      action_needed: "Ensure n8n workflow for /execute is active and retry.",
      can_approve: false,
      can_reject: false,
      can_execute: true,
      can_retry: true,
      timestamp,
    };
  }

  return {
    success: true,
    status: "PASS",
    display_status: "Published",
    title: "Published Successfully",
    message: "Content execution trigger successfully received by n8n.",
    action_needed: "No action needed.",
    can_approve: false,
    can_reject: false,
    can_execute: false,
    can_retry: false,
    timestamp,
  };
}

// 5. Status Endpoint
export async function getCevonneContentStatus(): Promise<FrontendSafeResponse> {
  const timestamp = new Date().toISOString();

  // Try status webhook
  const res = await callN8nEndpoint("cevonne/content/status", "GET");

  if (res.ok && res.data) {
    const statusData = res.data;
    const mapping = mapBackendStatus(statusData.status || statusData.state);

    return {
      success: true,
      status: mapping.clientStatus,
      display_status: mapping.displayStatus,
      title: statusData.title || (mapping.clientStatus === "PENDING_APPROVAL" ? "Content Ready for Review" : "Workflow Active"),
      message: statusData.message || mapping.message,
      action_needed: statusData.action_needed || mapping.actionNeeded,
      can_approve: mapping.clientStatus === "PENDING_APPROVAL",
      can_reject: mapping.clientStatus === "PENDING_APPROVAL",
      can_execute: mapping.rawStatus === "approved",
      can_retry: mapping.clientStatus === "ERROR",
      timestamp,
    };
  }

  // Fallback to latest item in Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("cevonne_publishing")
        .select("research_item_id, rank, generated_caption, content_concept, generated_content_type, image_count, r2_image_path, status, created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const latest = data[0];
        const mapping = mapBackendStatus(latest.status);
        const record: PublishingRecord = {
          research_item_id: String(latest.research_item_id),
          rank: latest.rank,
          generated_caption: latest.generated_caption,
          content_concept: latest.content_concept,
          generated_content_type: latest.generated_content_type,
          image_count: latest.image_count,
          r2_image_path: latest.r2_image_path,
          image_urls: normalizeImageUrls(latest.r2_image_path),
          status: mapping.rawStatus,
          client_status: mapping.clientStatus,
          display_status: mapping.displayStatus,
          action_needed: mapping.actionNeeded,
          created_at: latest.created_at,
        };

        return {
          success: true,
          status: mapping.clientStatus,
          display_status: mapping.displayStatus,
          title: mapping.clientStatus === "PENDING_APPROVAL" ? "Content Ready for Review" : "Working normally",
          message: mapping.message,
          action_needed: mapping.actionNeeded,
          can_approve: mapping.clientStatus === "PENDING_APPROVAL",
          can_reject: mapping.clientStatus === "PENDING_APPROVAL",
          can_execute: mapping.rawStatus === "approved",
          can_retry: mapping.clientStatus === "ERROR",
          timestamp,
          latest_item: record,
        };
      }
    } catch {}
  }

  return {
    success: true,
    status: "PASS",
    display_status: "Working normally",
    title: "Workflow Active",
    message: "Workflow is ready to run.",
    action_needed: "No action needed.",
    can_approve: false,
    can_reject: false,
    can_execute: false,
    can_retry: false,
    timestamp,
  };
}

// 5b. Get 3 Flows Summary (Research, Review, Execution)
export async function getCevonneFlowsSummary(): Promise<{
  success: boolean;
  flows: FlowCardItem[];
  stats: {
    total: number;
    healthy: number;
    needsReview: number;
    blocked: number;
    readyToExecute: number;
  };
}> {
  const timestamp = new Date().toISOString();
  let pendingCount = 0;
  let approvedCount = 0;
  let latestItem: PublishingRecord | null = null;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("cevonne_publishing")
        .select("research_item_id, status, created_at, content_concept, generated_caption")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        pendingCount = data.filter((d: any) => ["ready_for_review", "pending_approval"].includes(String(d.status).toLowerCase())).length;
        approvedCount = data.filter((d: any) => String(d.status).toLowerCase() === "approved").length;
        latestItem = data[0] as PublishingRecord;
      }
    } catch {}
  }

  const flows: FlowCardItem[] = [
    {
      id: "flow-1-research",
      flowNumber: 1,
      title: "Flow 1 – Content Research & Generation",
      purpose: "Automatically research trending lipstick content, generate Cevonne-style concepts, and store visual assets.",
      stage: "research",
      status: "PASS",
      displayStatus: "Working normally",
      lastChecked: latestItem?.created_at || timestamp,
      urgentAction: "Run workflow to initiate fresh trend scan and image generation.",
      buttonLabel: "Run Workflow",
      buttonAction: "run",
      endpoint: "/api/admin/n8n/cevonne/run",
    },
    {
      id: "flow-2-review",
      flowNumber: 2,
      title: "Flow 2 – Content Review & Approval",
      purpose: "Human review gate for captions, hashtags, and generated images before any publishing execution.",
      stage: "review",
      status: pendingCount > 0 ? "PENDING_APPROVAL" : "PASS",
      displayStatus: pendingCount > 0 ? "Pending Approval" : "Working normally",
      lastChecked: latestItem?.created_at || timestamp,
      urgentAction: pendingCount > 0 ? `${pendingCount} items waiting for admin review and approval.` : "All generated items are reviewed.",
      buttonLabel: "Review Content",
      buttonAction: "review",
      endpoint: "/api/admin/n8n/cevonne/review",
    },
    {
      id: "flow-3-execution",
      flowNumber: 3,
      title: "Flow 3 – Publishing Execution",
      purpose: "Dispatches approved lipstick content to live publishing channels and updates the audit log.",
      stage: "execution",
      status: "PASS",
      displayStatus: "Working normally",
      lastChecked: latestItem?.created_at || timestamp,
      urgentAction: approvedCount > 0 ? `${approvedCount} approved items ready for live execution.` : "Publishing queue ready.",
      buttonLabel: approvedCount > 0 ? "Execute Publishing" : "Inspect Queue",
      buttonAction: "execute",
      endpoint: "/api/admin/n8n/cevonne/execute",
    },
  ];

  const healthy = flows.filter((f) => f.status === "PASS").length;
  const needsReview = flows.filter((f) => f.status === "PENDING_APPROVAL").length;

  return {
    success: true,
    flows,
    stats: {
      total: 3,
      healthy,
      needsReview,
      blocked: 0,
      readyToExecute: approvedCount,
    },
  };
}

// 6. History Endpoint
export async function getCevonneContentHistory(limit = 10): Promise<{
  success: boolean;
  history: PublishingRecord[];
  count: number;
  message?: string;
}> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("cevonne_publishing")
        .select("research_item_id, rank, generated_caption, content_concept, generated_content_type, image_count, r2_image_path, status, created_at")
        .order("created_at", { ascending: false })
        .limit(Math.min(limit, 50));

      if (!error && data && data.length > 0) {
        const history: PublishingRecord[] = data.map((row: any) => {
          const mapping = mapBackendStatus(row.status);
          return {
            research_item_id: String(row.research_item_id),
            rank: row.rank ?? null,
            generated_caption: row.generated_caption ?? null,
            content_concept: row.content_concept ?? null,
            generated_content_type: row.generated_content_type ?? "Instagram Content",
            image_count: row.image_count ?? 0,
            r2_image_path: row.r2_image_path ?? null,
            image_urls: normalizeImageUrls(row.r2_image_path),
            status: mapping.rawStatus,
            client_status: mapping.clientStatus,
            display_status: mapping.displayStatus,
            action_needed: mapping.actionNeeded,
            created_at: row.created_at ?? null,
          };
        });

        return {
          success: true,
          history,
          count: history.length,
        };
      }
    } catch {}
  }

  return {
    success: true,
    history: [],
    count: 0,
    message: "No publishing records found in Supabase table cevonne_publishing.",
  };
}

// 7. Research Trends Endpoint for Workflow 1
export async function getCevonneResearchTrends(): Promise<{
  success: boolean;
  batch: ResearchBatch | null;
  lastRun: string | null;
}> {
  return {
    success: true,
    lastRun: LAST_RESEARCH_RUN,
    batch: null,
  };
}
