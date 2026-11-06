/**
 * Real-Time Low-Stock & Ad Spend Protection Alert Service
 * Fires n8n Workflow 7 when:
 * 1. An Active Ad Product falls below 10 units (Early Warning) or hits 0 units (Emergency Pause Ad).
 * 2. A Normal Organic Product falls below 5 units (Standard Warehouse Restock).
 */

export interface LowStockAlertPayload {
  productName: string;
  shadeName: string;
  shadeCode?: string;
  quantity: number;
  threshold?: number;
  isAdProduct?: boolean;
  activeCampaign?: string;
}

// Active Meta Ad & Creator Promoted Shades Watchlist
export const ACTIVE_AD_CAMPAIGNS: Record<
  string,
  { campaignName: string; adSet: string; adPlatform: string }
> = {
  "royal rouge": {
    campaignName: "IG Reel – Royal Rouge Launch",
    adSet: "Interest: Luxury Cosmetics (Women 21-35)",
    adPlatform: "Meta Ads (Instagram)",
  },
  "crimson velvet": {
    campaignName: "Festive Glam – Crimson Special",
    adSet: "Retargeting: Add to Cart 14D",
    adPlatform: "Meta Ads Dynamic",
  },
  "nude allure": {
    campaignName: "Everyday Luxe – Nude Allure Series",
    adSet: "Lookalike 1%: Top Spenders",
    adPlatform: "Meta Ads (Instagram)",
  },
};

export function checkIsAdPromoted(shadeName?: string, shadeCode?: string): {
  isAdProduct: boolean;
  campaignName: string | null;
  adSet: string | null;
  adPlatform: string | null;
} {
  const normalizedShade = (shadeName || "").trim().toLowerCase();
  const normalizedCode = (shadeCode || "").trim().toLowerCase();

  for (const [key, info] of Object.entries(ACTIVE_AD_CAMPAIGNS)) {
    if (normalizedShade.includes(key) || (normalizedCode && normalizedCode.includes(key))) {
      return {
        isAdProduct: true,
        campaignName: info.campaignName,
        adSet: info.adSet,
        adPlatform: info.adPlatform,
      };
    }
  }

  return {
    isAdProduct: false,
    campaignName: null,
    adSet: null,
    adPlatform: null,
  };
}

export async function triggerLowStockAlertIfRequired(
  payload: LowStockAlertPayload
): Promise<void> {
  const adInfo = checkIsAdPromoted(payload.shadeName, payload.shadeCode);
  const isAdProduct = payload.isAdProduct ?? adInfo.isAdProduct;
  const activeCampaign = payload.activeCampaign || adInfo.campaignName || "Meta Active Ad Campaign";

  // Dynamic threshold:
  // - Active Ad Products: Alert at < 10 units (High sales velocity)
  // - Normal Products: Alert at <= 5 units (Standard warehouse restock)
  const defaultThreshold = isAdProduct ? 10 : 5;
  const threshold = payload.threshold ?? defaultThreshold;

  if (payload.quantity > threshold) {
    return;
  }

  // Determine Alert Tier
  let alertTier: "AD_OUT_OF_STOCK" | "AD_LOW_STOCK_WARNING" | "STANDARD_LOW_STOCK";
  let statusText: string;
  let formattedShadeName: string;

  if (isAdProduct) {
    if (payload.quantity <= 0) {
      alertTier = "AD_OUT_OF_STOCK";
      statusText = "🚨 PAUSE AD: 100% SOLD OUT";
      formattedShadeName = `${payload.shadeName || "Lipstick Shade"}${payload.shadeCode ? ` (${payload.shadeCode})` : ""} [ACTIVE AD]`;
    } else {
      alertTier = "AD_LOW_STOCK_WARNING";
      statusText = "⚠️ AD WARNING: HIGH BURN RATE (<10)";
      formattedShadeName = `${payload.shadeName || "Lipstick Shade"}${payload.shadeCode ? ` (${payload.shadeCode})` : ""} [ACTIVE AD]`;
    }
  } else {
    alertTier = "STANDARD_LOW_STOCK";
    statusText = payload.quantity <= 2 ? "CRITICAL LOW" : "LOW STOCK";
    formattedShadeName = `${payload.shadeName || "Lipstick Shade"}${payload.shadeCode ? ` (${payload.shadeCode})` : ""}`;
  }

  const webhookUrl =
    process.env.N8N_INVENTORY_ALERT_WEBHOOK_URL ||
    `${process.env.N8N_BASE_URL || "https://n8n.cevonne.com/webhook"}/cevonne/inventory-alert`;

  // Asynchronously fire the webhook so order/inventory APIs are never delayed or blocked
  fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.N8N_WEBHOOK_SHARED_SECRET
        ? { "X-N8N-Secret": process.env.N8N_WEBHOOK_SHARED_SECRET }
        : {}),
    },
    body: JSON.stringify({
      event: "LOW_STOCK_ALERT",
      alert_tier: alertTier,
      is_active_ad_product: isAdProduct,
      active_campaign: activeCampaign,
      product_name: payload.productName || "Cevonne Velvet Matte Lipstick",
      shade_name: payload.shadeName || "Standard Shade",
      shade_code: payload.shadeCode || "",
      formatted_shade_name: formattedShadeName,
      current_stock: payload.quantity,
      threshold,
      status_text: statusText,
      timestamp: new Date().toISOString(),
    }),
  }).catch((error) => {
    console.warn(
      "[InventoryAlert] Failed to notify n8n low-stock webhook:",
      error?.message || error
    );
  });
}
