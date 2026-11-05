import ModernWorkflowDetailPage from "@/components/admin-dashboard/ModernWorkflowDetailPage";

export default function Page() {
  return (
    <ModernWorkflowDetailPage
      config={{
        workflowNumber: 8,
        title: "Workflow 8 – UGC Creator Proof & Auto Permission (Full Suite)",
        badgeLabel: "Creator Proof Suite",
        statusBadge: {
          label: "Verified Live · Webhook Active",
          variant: "emerald",
        },
        description:
          "Autonomous UGC creator suite receiving Instagram tags, verifying media on Meta Graph, saving to Supabase, sending official permission request DMs, and logging creator consent.",
        triggerType: "Meta Graph Webhook",
        intervalOrWebhook: "Webhook: g8-v3-meta-instagram-webhook / Permission Webhook",
        protectionOrGuard: "Brand safety AI review, commercial rights consent logging, and FTC disclosure compliance",
        databaseOrStorage: "Supabase cevonne_ugc_mentions Table",
        simpleExplanation: {
          inputTitle: "Instagram Tag or Mention",
          inputDesc: "A creator posts a reel or photo and tags @cevonneofficial on Instagram.",
          actionTitle: "Auto Ingest & Rights Request",
          actionDesc: "Meta notifies n8n -> media is saved to Supabase -> brand sends an official permission request DM.",
          outputTitle: "Consent Registry & Thank You DM",
          outputDesc: "When creator replies 'Yes', consent is recorded in Supabase and an automated thank-you DM is sent.",
        },
        simulatedOutput: {
          channel: "Instagram Official Brand Direct DM",
          recipientOrTarget: "Creator: @mdhatim013__ (Verified Live Test)",
          payloadOrMessage: `✨ Hello @mdhatim013__!\n\nWe absolutely love your post featuring Cevonne! Would you give us permission to feature your media across our official website and social channels?\n\nPlease reply "Yes" to grant permission.\n\n— Cevonne Luxury Cosmetics Team`,
          details: "Verified live with @mdhatim013__ on Meta Graph API with consent recorded in Supabase cevonne_ugc_mentions.",
        },
        lanes: [
          {
            title: "Meta Webhook Handshake & Verification",
            description: "Handles GET hub.challenge verification from Meta Developer App to keep webhook subscription continuously alive.",
            status: "Verified",
            tag: "GET /g8-v3-meta-instagram-webhook",
          },
          {
            title: "Instagram Mention & Media Verification",
            description: "Receives Instagram mentions of @cevonneofficial, fetches HD media and caption via Meta Graph API v26.0.",
            status: "Active",
            tag: "POST Ingestion",
          },
          {
            title: "Automated Permission Request DM",
            description: "Sends automated official brand permission DM to the creator requesting consent to feature their post.",
            status: "Verified",
            tag: "Direct DM Dispatch",
          },
          {
            title: "Supabase Consent Registry",
            description: "Records creator permissions, proof status ('granted', 'pending', 'rejected'), and media URLs into cevonne_ugc_mentions.",
            status: "Active",
            tag: "Table: cevonne_ugc_mentions",
          },
        ],
      }}
    />
  );
}
