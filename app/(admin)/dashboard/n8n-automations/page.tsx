// =========================================================================================
// N8N AUTOMATION DASHBOARD ROUTE
// =========================================================================================
// To switch back to the previous G1-G12 Workflow Dashboard at any time:
// 1. Uncomment the `WorkflowDashboardOverview` import and return statement below.
// 2. Comment out the `NewN8nAutomationFlow` component.
// Refer to `README.md` in this directory for detailed instructions.
// =========================================================================================

// --- [ACTIVE] NEW N8N AUTOMATION FLOW ---
import NewN8nAutomationFlow from "@/components/admin-dashboard/NewN8nAutomationFlow";

// --- [ARCHIVED / PRESERVED] PREVIOUS G1-G12 WORKFLOW DASHBOARD ---
// import WorkflowDashboardOverview from "@/components/admin-dashboard/WorkflowDashboardOverview";

export default function Page({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  // Option A (Active): Show the new N8N automation flow
  return <NewN8nAutomationFlow />;

  // Option B (To revert/uncomment the old flow):
  // Uncomment the line below (and its import above) to restore the previous 12-workflow dashboard:
  // return <WorkflowDashboardOverview />;
}
