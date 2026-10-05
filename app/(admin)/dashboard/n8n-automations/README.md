# Cevonne N8N Automations & Flow Architecture

This document details the active 3-workflow architecture, its dedicated sub-pages, and how to switch back to the legacy G1–G12 overview at any time.

---

## 1. Quick Summary of Pages & Routes

| View / Flow | Route | Description |
| :--- | :--- | :--- |
| **Workflow Dashboard (Overview)** | `/dashboard/n8n-automations` | High-level 5 metric cards + 3 G-series workflow cards with **View Details** buttons. |
| **Workflow 1** | `/dashboard/n8n-automations/workflow-1` | **Instagram Research & Trend Analysis**: collects posts, scores engagement, and triggers research. |
| **Workflow 2** | `/dashboard/n8n-automations/workflow-2` | **AI Content Generation**: creative studio, single & carousel reviews, captions, hashtags, and **Approve / Reject** buttons. |
| **Workflow 3** | `/dashboard/n8n-automations/workflow-3` | **Content Publishing & Storage**: Cloudflare R2 storage verification, Supabase metadata sync, and **Execute** publishing controls. |

---

## 2. Dedicated Workflow Specifications

### 1. Cevonne Workflow 1 – Instagram Research & Trend Analysis
- **Route:** `/dashboard/n8n-automations/workflow-1`
- **Component:** `components/admin-dashboard/CevonneWorkflow1Page.tsx`
- **Purpose:** Researches trending Instagram content related to lipstick/beauty. It collects posts, analyzes their engagement and relevance, evaluates the content using AI, and selects the top-performing content ideas for further processing.
- **Controls:** `Run Workflow 1` (calls `POST /api/admin/n8n/cevonne/run`).

### 2. Cevonne Workflow 2 – AI Content Generation
- **Route:** `/dashboard/n8n-automations/workflow-2`
- **Component:** `components/admin-dashboard/CevonneWorkflow2Page.tsx`
- **Purpose:** Takes the selected research content and converts it into original Cevonne-style content using AI. It generates creative images, captions, concepts, and supports both single-image and carousel content.
- **Controls:** Direct **Approve** and **Reject** buttons with confirmation modal (calls `POST /api/admin/n8n/cevonne/approval`).

### 3. Cevonne Workflow 3 – Content Publishing & Storage
- **Route:** `/dashboard/n8n-automations/workflow-3`
- **Component:** `components/admin-dashboard/CevonneWorkflow3Page.tsx`
- **Purpose:** Handles final content preparation and storage process. Generated images are uploaded to Cloudflare R2, their metadata is stored in Supabase, and approved content is prepared for publishing through the execution flow.
- **Controls:** **Execute Content** button (calls `POST /api/admin/n8n/cevonne/execute`), and live audit table from Supabase `cevonne_publishing`.

---

## 3. How to Switch Back (Uncomment the Legacy G1–G12 Overview)

Open [app/(admin)/dashboard/n8n-automations/page.tsx](file:///e:/Cevonne/Cevonne/app/(admin)/dashboard/n8n-automations/page.tsx):

```tsx
// 1. Uncomment this import:
import WorkflowDashboardOverview from "@/components/admin-dashboard/WorkflowDashboardOverview";

export default function Page() {
  // 2. Return the legacy dashboard:
  return <WorkflowDashboardOverview />;

  // (Commented out new flow):
  // return <NewN8nAutomationFlow />;
}
```

Save the file and refresh your browser. The G1–G12 12-workflow dashboard will immediately render.
