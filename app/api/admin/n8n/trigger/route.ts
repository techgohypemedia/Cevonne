export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { env } from "@/server/config";
import { postN8nWebhook } from "@/lib/n8n-client";
import { getAuthUser, jsonResponse } from "@/server/next/route-utils";

const WORKFLOW_WEBHOOK_MAP: Record<
  number,
  {
    name: string;
    path: string;
    envUrl?: string;
    event: string;
    httpMethod?: "GET" | "POST";
  }
> = {
  1: {
    name: "Workflow 1 – Instagram Trend Research",
    path: "g12-public-trend-fetch",
    envUrl: process.env.N8N_G12_PUBLIC_TREND_FETCH_URL,
    event: "INSTAGRAM_TREND_SCAN",
    httpMethod: "POST",
  },
  2: {
    name: "Workflow 2 – AI Content Generation Studio",
    path: "g4-content-landing-check",
    envUrl: process.env.N8N_G4_CONTENT_CHECK_URL,
    event: "CONTENT_STUDIO_GENERATE",
    httpMethod: "POST",
  },
  3: {
    name: "Workflow 3 – Content Publishing & Storage",
    path: "g5-publishing-action",
    envUrl: process.env.N8N_G5_PUBLISHING_ACTION_URL,
    event: "STORAGE_PUBLISH_TRIGGER",
    httpMethod: "POST",
  },
  4: {
    name: "Workflow 4 – Meta & WhatsApp Health Monitor",
    path: "cevonne/health-check",
    envUrl: process.env.N8N_G2_HEALTH_CHECK_URL,
    event: "META_WA_HEALTH_CHECK",
    httpMethod: "POST",
  },
  5: {
    name: "Workflow 5 – WhatsApp Quiz & Cart Recovery Router",
    path: "g6-quiz-intake",
    envUrl: process.env.N8N_G6_QUIZ_INTAKE_URL,
    event: "QUIZ_CART_RECOVERY_ROUTER",
    httpMethod: "POST",
  },
  6: {
    name: "Workflow 6 – Discount Offer + Ad Coupon Health & Expiry Monitor",
    path: "cevonne/coupon-health-check",
    envUrl: process.env.N8N_G7_OFFER_SAFETY_CHECK_URL,
    event: "COUPON_EXPIRY_GUARD_CHECK",
    httpMethod: "POST",
  },
  7: {
    name: "Workflow 7 – Real-Time Low Stock Alert Sentinel",
    path: "cevonne/inventory-alert",
    envUrl: process.env.N8N_INVENTORY_ALERT_WEBHOOK_URL,
    event: "LOW_STOCK_ALERT",
    httpMethod: "POST",
  },
  8: {
    name: "Workflow 8 – UGC Creator Proof & Auto Permission",
    path: "g8-v2-ugc-intake",
    envUrl: process.env.N8N_G8_CREATOR_PROOF_REVIEW_URL,
    event: "UGC_CREATOR_PROOF_EVAL",
    httpMethod: "POST",
  },
  9: {
    name: "Workflow 9 – Meta Ads Daily Performance & ROAS Monitor",
    path: "cevonne/ads-monitor",
    envUrl: process.env.N8N_G9_AD_RECOMMENDATION_URL,
    event: "META_ROAS_SENTINEL_RUN",
    httpMethod: "POST",
  },
  10: {
    name: "Workflow 10 – SEO + CRO",
    path: "cevonne/g10-seo-cro-audit",
    envUrl: process.env.N8N_G10_SEO_CRO_AUDIT_URL,
    event: "SEO_CRO_AUDIT_TRIGGER",
    httpMethod: "POST",
  },
  11: {
    name: "Workflow 11 – Monday Founder Weekly Digest",
    path: "cevonne/weekly-digest",
    envUrl: process.env.N8N_G11_WEEKLY_DIGEST_URL,
    event: "FOUNDER_WEEKLY_DIGEST_GEN",
    httpMethod: "POST",
  },
  12: {
    name: "Workflow 12 – Customer Consent & Campaign Attribution",
    path: "cevonne/g3-consent-attribution",
    envUrl: process.env.N8N_G3_CONSENT_ATTRIBUTION_URL,
    event: "CONSENT_ATTRIBUTION_SYNC",
    httpMethod: "POST",
  },
};

export async function GET(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || auth.role !== "ADMIN") {
      return jsonResponse({ success: false, message: "Unauthorized" }, 401);
    }

    const { searchParams } = new URL(request.url);
    const wfNum = Number(searchParams.get("workflow")) || 1;
    const wfMeta = WORKFLOW_WEBHOOK_MAP[wfNum] || WORKFLOW_WEBHOOK_MAP[1];

    return jsonResponse({
      success: true,
      workflowNumber: wfNum,
      workflowName: wfMeta.name,
      status: "CONNECTED",
      endpoint: `${process.env.N8N_BASE_URL || "https://n8n.cevonne.com/webhook"}/${wfMeta.path}`,
      lastVerified: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Workflow Trigger GET] Error:", error);
    return jsonResponse({ success: false, message: "Failed to query workflow" }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth || auth.role !== "ADMIN") {
      return jsonResponse({ success: false, message: "Unauthorized" }, 401);
    }

    const body = (await request.json().catch(() => ({}))) as {
      workflowNumber?: number;
      action?: string;
      customPayload?: Record<string, unknown>;
    };

    const wfNum = Number(body.workflowNumber) || 1;
    const wfMeta = WORKFLOW_WEBHOOK_MAP[wfNum];

    if (!wfMeta) {
      return jsonResponse(
        { success: false, message: `Workflow #${wfNum} is not configured.` },
        400
      );
    }

    const n8nBase = process.env.N8N_BASE_URL || "https://n8n.cevonne.com/webhook";
    const webhookUrl = wfMeta.envUrl || `${n8nBase}/${wfMeta.path}`;

    const payload = {
      event: wfMeta.event,
      workflow_number: wfNum,
      workflow_name: wfMeta.name,
      triggered_by: auth.email || "website_admin",
      triggered_at: new Date().toISOString(),
      ...(body.customPayload || {}),
    };

    let n8nResult: any = null;
    let n8nHttpStatus = 200;
    let executionSuccess = true;
    let errorMessage = "";

    try {
      if (wfMeta.httpMethod === "GET") {
        const response = await fetch(webhookUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.N8N_WEBHOOK_SHARED_SECRET
              ? { "X-N8N-Secret": process.env.N8N_WEBHOOK_SHARED_SECRET }
              : {}),
          },
        });

        n8nHttpStatus = response.status;
        const text = await response.text();
        try {
          n8nResult = JSON.parse(text);
        } catch {
          n8nResult = { responseText: text };
        }

        if (!response.ok || n8nResult?.error) {
          executionSuccess = false;
          errorMessage =
            n8nResult?.error?.message ||
            n8nResult?.message ||
            `n8n execution failed with status ${response.status}`;
        }
      } else {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.N8N_WEBHOOK_SHARED_SECRET
              ? { "X-N8N-Secret": process.env.N8N_WEBHOOK_SHARED_SECRET }
              : {}),
          },
          body: JSON.stringify(payload),
        });

        n8nHttpStatus = response.status;
        const text = await response.text();
        try {
          n8nResult = JSON.parse(text);
        } catch {
          n8nResult = { responseText: text };
        }

        if (!response.ok || n8nResult?.error || n8nResult?.status === "BLOCK") {
          executionSuccess = false;
          errorMessage =
            n8nResult?.error?.message ||
            n8nResult?.fail_reason?.message ||
            n8nResult?.message ||
            `n8n execution returned status ${response.status}`;
        }
      }
    } catch (err) {
      executionSuccess = false;
      n8nHttpStatus = 500;
      errorMessage = err instanceof Error ? err.message : "Failed to connect to n8n";
      n8nResult = { error: errorMessage };
    }

    const executedAt = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    if (!executionSuccess) {
      return jsonResponse(
        {
          success: false,
          workflowNumber: wfNum,
          workflowName: wfMeta.name,
          webhookUrl,
          httpStatus: n8nHttpStatus,
          error: errorMessage,
          message: `n8n ${wfMeta.name} execution failed: ${errorMessage}`,
          executedAt,
          n8nResult,
        },
        n8nHttpStatus >= 400 && n8nHttpStatus < 600 ? n8nHttpStatus : 400
      );
    }

    return jsonResponse({
      success: true,
      workflowNumber: wfNum,
      workflowName: wfMeta.name,
      webhookUrl,
      httpStatus: n8nHttpStatus,
      status: n8nResult?.status || "HEALTHY",
      message: `${wfMeta.name} executed successfully on n8n!`,
      executedAt,
      n8nResult,
    });
  } catch (error) {
    console.error("[Workflow Trigger POST] Error:", error);
    return jsonResponse(
      {
        success: false,
        message: "Failed to dispatch trigger to n8n",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
}

