import ModernWorkflowDetailPage from "@/components/admin-dashboard/ModernWorkflowDetailPage";

export default function Page() {
  return (
    <ModernWorkflowDetailPage
      config={{
        workflowNumber: 11,
        title: "Workflow 11 – Monday Founder Weekly Digest",
        badgeLabel: "Founder Intelligence",
        statusBadge: {
          label: "Scheduled · Mon 10 AM",
          variant: "indigo",
        },
        description:
          "Monday morning executive intelligence summarizing weekly gross revenue, order count, average order value (AOV), top performing lipstick shades, and low-inventory warnings.",
        triggerType: "Schedule Trigger (Cron)",
        intervalOrWebhook: "Weekly Monday 10:00 AM (Cron: 0 10 * * 1)",
        protectionOrGuard: "Executive visibility on margin health, top-selling shades, and operational bottlenecks",
        databaseOrStorage: "Prisma PostgreSQL Orders + Supabase Store Data",
        simpleExplanation: {
          inputTitle: "Monday Morning 10 AM Cron",
          inputDesc: "Triggers automatically at the beginning of each week to synthesize last 7 days of e-commerce numbers.",
          actionTitle: "Revenue & Stock Data Synthesis",
          actionDesc: "Pulls all completed orders from PostgreSQL, computes gross sales, AOV, returns, and inventory stock burn rates.",
          outputTitle: "Founder WhatsApp Executive Briefing",
          outputDesc: "A concise, luxury formatted executive summary sent straight to Founder's phone before Monday morning meetings.",
        },
        simulatedOutput: {
          channel: "Founder Executive WhatsApp Digest",
          recipientOrTarget: "Founder: +91 93542 43943",
          payloadOrMessage: `💎 CEVONNE FOUNDER WEEKLY DIGEST 💎\n\n📅 Week: 27 Oct - 02 Nov\n\n💰 Total Gross Revenue: ₹3,42,850\n📦 Total Orders Delivered: 184\n🎯 Average Order Value (AOV): ₹1,863\n\n🔥 Best-Selling Shades:\n1. Crimson Velvet: 78 units (Top Performer)\n2. Nude Allure: 46 units\n3. Berry Luxe: 35 units\n4. Royal Plum: 25 units\n\n⚠️ Low Inventory Watch:\nAll shades currently safe in warehouse. Zero stockouts. Have a great week ahead!`,
          details: "Automated Monday executive intelligence replaces hours of manual spreadsheet compiling.",
        },
        lanes: [
          {
            title: "Monday 10 AM Cron Schedule",
            description: "Automated schedule triggered at the start of every business week to summarize previous week's commerce KPIs.",
            status: "Scheduled",
            tag: "Cron: 0 10 * * 1",
          },
          {
            title: "Revenue & Order Volume Synthesis",
            description: "Calculates total gross sales, completed orders, pending shipments, returns, and average order value (AOV).",
            status: "Active",
            tag: "Commerce Synthesis",
          },
          {
            title: "Top Shade Sales & Velocity Watch",
            description: "Ranks best-selling lipstick shades of the week and cross-references remaining warehouse stock levels.",
            status: "Active",
            tag: "Product Velocity",
          },
          {
            title: "Founder WhatsApp Executive Digest",
            description: "Formats and sends a beautiful executive briefing directly to the Founder's WhatsApp and email inbox.",
            status: "Active",
            tag: "Executive Digest",
          },
        ],
      }}
    />
  );
}
