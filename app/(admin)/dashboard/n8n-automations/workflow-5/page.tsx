import ModernWorkflowDetailPage from "@/components/admin-dashboard/ModernWorkflowDetailPage";

export default function Page() {
  return (
    <ModernWorkflowDetailPage
      config={{
        workflowNumber: 5,
        title: "Workflow 5 – Messaging + Quiz + Cart Recovery Router",
        badgeLabel: "Omnichannel Journey",
        statusBadge: {
          label: "Active · Webhook Ready",
          variant: "emerald",
        },
        description:
          "Omnichannel customer router handling WhatsApp lipstick shade quiz intake with 10% VIP coupon delivery, 30-minute cart abandonment recovery with purchase suppression, and STOP compliance.",
        triggerType: "Meta Graph Webhook",
        intervalOrWebhook: "WhatsApp Cloud Webhook + Storefront Cart Events",
        protectionOrGuard: "Immediate STOP opt-out suppression and purchase-based cart reminder cancellation",
        databaseOrStorage: "Supabase + WhatsApp Cloud API",
        simpleExplanation: {
          inputTitle: "Customer Quiz or Abandoned Cart",
          inputDesc: "Customer completes shade quiz or leaves items in cart for 30 minutes without checkout.",
          actionTitle: "Automated Journey Router",
          actionDesc: "Evaluates purchase history, verifies customer has not replied STOP, and formats personalized message.",
          outputTitle: "WhatsApp VIP Discount or Recovery",
          outputDesc: "Customer receives their perfect shade recommendation with a 10% VIP code or cart link on WhatsApp.",
        },
        simulatedOutput: {
          channel: "WhatsApp Cloud API Message",
          recipientOrTarget: "Customer: +91 98765 43210",
          payloadOrMessage: `💄 Hello Gorgeous!\n\nBased on your quiz, your signature match is *Cevonne Crimson Velvet*.\n\nEnjoy an exclusive 10% VIP welcome gift on your first order:\n🎁 Coupon Code: *VIP10*\n\nTap to complete your order with free delivery:\n👉 https://www.cevonne.com/cart?discount=VIP10\n\n(Reply STOP anytime to unsubscribe)`,
          details: "Delivered via Meta WhatsApp Cloud API with auto-suppression if order is placed.",
        },
        lanes: [
          {
            title: "WhatsApp Lipstick Shade Quiz Intake",
            description: "Receives user undertone and preference quiz selections, calculates recommended shade, and replies with 10% VIP coupon code.",
            status: "Active",
            tag: "Inbound Quiz Webhook",
          },
          {
            title: "30-Minute Abandoned Cart Recovery",
            description: "Waits 30 minutes after checkout abandonment. Checks purchase status and sends personalized shade reminder if unpurchased.",
            status: "Active",
            tag: "30-Min Recovery Timer",
          },
          {
            title: "Instant Purchase Suppression",
            description: "Haults cart recovery sequence instantly when order completion is recorded, ensuring customers never receive reminder after purchasing.",
            status: "Active",
            tag: "Order Guardrail",
          },
          {
            title: "STOP Keyword Compliance Handler",
            description: "Detects 'STOP', 'UNSUBSCRIBE', or 'CANCEL' from customer and immediately blocks future marketing messages.",
            status: "Verified",
            tag: "DPDP / Compliance",
          },
        ],
      }}
    />
  );
}
