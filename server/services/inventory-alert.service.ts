/**
 * Real-Time Low-Stock Alert Service
 * Fires n8n webhook when a shade's stock quantity falls below the threshold (default: 5).
 */

export interface LowStockAlertPayload {
  productName: string;
  shadeName: string;
  shadeCode?: string;
  quantity: number;
  threshold?: number;
}

export async function triggerLowStockAlertIfRequired(payload: LowStockAlertPayload): Promise<void> {
  const threshold = payload.threshold ?? 5;

  if (payload.quantity > threshold) {
    return;
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
      product_name: payload.productName || "Cevonne Lipstick",
      shade_name: payload.shadeName || "Standard Shade",
      shade_code: payload.shadeCode || "",
      current_stock: payload.quantity,
      threshold,
      timestamp: new Date().toISOString(),
    }),
  }).catch((error) => {
    console.warn("[InventoryAlert] Failed to notify n8n low-stock webhook:", error?.message || error);
  });
}

