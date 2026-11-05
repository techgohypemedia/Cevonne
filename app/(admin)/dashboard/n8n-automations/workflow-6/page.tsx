import ModernWorkflowDetailPage from "@/components/admin-dashboard/ModernWorkflowDetailPage";

export default function Page() {
  return (
    <ModernWorkflowDetailPage
      config={{
        workflowNumber: 6,
        title: "Workflow 6 – Discount Offer + Ad Coupon Health & Expiry Monitor",
        badgeLabel: "Coupon Guard",
        statusBadge: {
          label: "Scheduled · Daily 9 AM",
          variant: "indigo",
        },
        description:
          "Daily 9 AM ad coupon guardian verifying website discount coupon health against paid ad campaigns. Flags expiring promo codes, low usage margins, and protects ad spend from broken voucher codes.",
        triggerType: "Schedule Trigger (Cron)",
        intervalOrWebhook: "Daily at 9:00 AM (Cron: 0 9 * * *)",
        protectionOrGuard: "Ad spend waste prevention on expired or broken promotional coupon codes",
        databaseOrStorage: "Website API (/api/orders/check-coupon)",
        simpleExplanation: {
          inputTitle: "Morning 9 AM Schedule",
          inputDesc: "Triggers every morning before daily ad campaign budgets scale on Meta and Google.",
          actionTitle: "Website Promo Code Validation",
          actionDesc: "Pings storefront API to verify active coupon codes, expiration dates, and discount margin floors.",
          outputTitle: "Protection Alert or Confirmation",
          outputDesc: "Alerts marketing team if an ad promo code is expiring within 48 hours, saving wasted ad budget.",
        },
        simulatedOutput: {
          channel: "Daily Promo Health Digest",
          recipientOrTarget: "Marketing Growth Team (WhatsApp & Email)",
          payloadOrMessage: `🛡️ CEVONNE COUPON HEALTH REPORT\n\n✅ Checked: 5 Active Promotional Codes\n\n1. VIP10: Valid · 10% Off · 42 Redemptions\n2. FESTIVE15: Valid · Expires in 5 Days\n3. LUXE20: Valid · Minimum Order ₹1,999\n\n⚠️ Warning: No broken or expired promo codes found in live Meta ads.\nAd spend efficiency protected.`,
          details: "Automated daily verification prevents sending paid ad traffic to broken 404 discount links.",
        },
        lanes: [
          {
            title: "Morning 9 AM Audit Trigger",
            description: "Automated cron schedule running daily at 9:00 AM before marketing campaigns scale daily ad budgets.",
            status: "Scheduled",
            tag: "Cron: 0 9 * * *",
          },
          {
            title: "Website Coupon Health Check",
            description: "Calls https://cevonne.vercel.app/api/orders/check-coupon to inspect code validity, usage limits, and expiration dates.",
            status: "Active",
            tag: "GET /api/orders/check-coupon",
          },
          {
            title: "Margin & Expiry Warning Filter",
            description: "Evaluates whether any active promo code has warnings, expires within 48 hours, or breaches minimum price floors.",
            status: "Active",
            tag: "Condition Filter",
          },
          {
            title: "Marketing Team Dispatch",
            description: "Alerts ad managers via WhatsApp & Email when an ad discount code is broken or about to lapse.",
            status: "Active",
            tag: "Ad Spend Protection",
          },
        ],
      }}
    />
  );
}
