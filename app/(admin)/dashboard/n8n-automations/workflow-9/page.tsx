import ModernWorkflowDetailPage from "@/components/admin-dashboard/ModernWorkflowDetailPage";

export default function Page() {
  return (
    <ModernWorkflowDetailPage
      config={{
        workflowNumber: 9,
        title: "Workflow 9 – Meta Ads Daily Performance & ROAS Monitor",
        badgeLabel: "Ad Intelligence",
        statusBadge: {
          label: "Scheduled · Daily 9 AM",
          variant: "indigo",
        },
        description:
          "Daily 9 AM Meta Marketing API auditor pulling live campaign ROAS, spend, and CPA. Evaluates ad performance using OpenAI strategic guidance and generates budget scaling suggestions.",
        triggerType: "Schedule Trigger (Cron)",
        intervalOrWebhook: "Daily at 9:00 AM (Cron: 0 9 * * *)",
        protectionOrGuard: "Unprofitable ad spend cut-off, CPA spike alerts, and creative fatigue detection",
        databaseOrStorage: "Meta Marketing API v26.0 + OpenAI Analysis",
        simpleExplanation: {
          inputTitle: "Daily Morning 9 AM Cron",
          inputDesc: "Triggers every morning to extract the previous 24 hours of Meta ad campaign metrics.",
          actionTitle: "Meta Marketing API + AI Analysis",
          actionDesc: "Pulls spend, impressions, CTR, CPA, and purchase ROAS, then evaluates performance using GPT-4.",
          outputTitle: "Strategic Scaling Briefing",
          outputDesc: "Delivers recommended budget shifts (e.g. scale top ad set by 20%, pause fatigued creatives) to WhatsApp.",
        },
        simulatedOutput: {
          channel: "Executive Meta Ads Daily Audit",
          recipientOrTarget: "Founder & Growth Lead (WhatsApp)",
          payloadOrMessage: `📊 CEVONNE META ADS PERFORMANCE BRIEFING\n\n• Yesterday Spend: ₹12,450\n• Purchases: 28 orders\n• Gross Revenue: ₹48,970\n• Blended ROAS: 3.93x (Target: 3.0x)\n• Cost per Acquisition (CPA): ₹444\n\n💡 AI Strategic Recommendation:\nTop winning ad set 'Crimson Velvet - Reel Hook 02' is scaling at 4.6x ROAS with low fatigue. Recommend increasing daily budget by +15%.`,
          details: "Automated ROAS auditing ensures marketing budget is maximized for profitable revenue.",
        },
        lanes: [
          {
            title: "Morning 9 AM Campaign Trigger",
            description: "Automated schedule triggered every morning to analyze previous 24 hours ad performance.",
            status: "Scheduled",
            tag: "Cron: 0 9 * * *",
          },
          {
            title: "Meta Ads Marketing API Extraction",
            description: "Queries active ad sets, impression counts, spend, link clicks, cost-per-acquisition (CPA), and purchase ROAS.",
            status: "Active",
            tag: "Marketing API v26.0",
          },
          {
            title: "OpenAI Strategic Advisory Analysis",
            description: "Passes performance metrics to GPT-4 model to identify underperforming ad creatives and recommend budget scale opportunities.",
            status: "Active",
            tag: "AI ROAS Advisor",
          },
          {
            title: "Founder Performance Briefing",
            description: "Dispatches formatted performance summary and scaling recommendations directly to the growth team.",
            status: "Active",
            tag: "WhatsApp & Dashboard",
          },
        ],
      }}
    />
  );
}
