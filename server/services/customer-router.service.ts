/**
 * Customer Router Service (Order Confirmation & Cart Recovery)
 * Sends real-time events to n8n for WhatsApp and Email notifications.
 */

export interface OrderNotificationPayload {
  orderNumber: string;
  customerName: string;
  email: string;
  phone?: string;
  totalAmount: number | string;
  items: Array<{
    name?: string;
    shade?: string;
    quantity?: number;
    price?: number | string;
  }>;
}

export interface AbandonedCartPayload {
  customerName?: string;
  email: string;
  phone?: string;
  items?: Array<{
    name?: string;
    shade?: string;
    quantity?: number;
  }>;
}

export async function triggerOrderConfirmationAlert(payload: OrderNotificationPayload): Promise<void> {
  const webhookUrl =
    process.env.N8N_CUSTOMER_ROUTER_WEBHOOK_URL ||
    `${process.env.N8N_BASE_URL || "https://n8n.cevonne.com/webhook"}/cevonne/customer-router`;

  fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.N8N_WEBHOOK_SHARED_SECRET
        ? { "X-N8N-Secret": process.env.N8N_WEBHOOK_SHARED_SECRET }
        : {}),
    },
    body: JSON.stringify({
      event: "ORDER_CREATED",
      order: payload,
      timestamp: new Date().toISOString(),
    }),
  }).catch((err) => {
    console.warn("[CustomerRouter] Failed to trigger order confirmation webhook:", err?.message || err);
  });
}

export async function triggerAbandonedCartAlert(payload: AbandonedCartPayload): Promise<void> {
  const webhookUrl =
    process.env.N8N_CUSTOMER_ROUTER_WEBHOOK_URL ||
    `${process.env.N8N_BASE_URL || "https://n8n.cevonne.com/webhook"}/cevonne/customer-router`;

  fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.N8N_WEBHOOK_SHARED_SECRET
        ? { "X-N8N-Secret": process.env.N8N_WEBHOOK_SHARED_SECRET }
        : {}),
    },
    body: JSON.stringify({
      event: "CART_ABANDONED",
      customerName: payload.customerName || "there",
      email: payload.email,
      phone: payload.phone || "",
      items: payload.items || [],
      timestamp: new Date().toISOString(),
    }),
  }).catch((err) => {
    console.warn("[CustomerRouter] Failed to trigger abandoned cart webhook:", err?.message || err);
  });
}

