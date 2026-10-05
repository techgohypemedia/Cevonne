// =========================================================================================
// N8N AUTOMATION DASHBOARD ROUTE
// =========================================================================================
// Displays the new 3-workflow AI Content Engine (Workflow 1-3) at the top,
// with the Core Platform Automations (G1-G12) directly underneath in the same menu.
// =========================================================================================

import NewN8nAutomationFlow from "@/components/admin-dashboard/NewN8nAutomationFlow";
import WorkflowDashboardOverview from "@/components/admin-dashboard/WorkflowDashboardOverview";

export default function Page({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  return (
    <NewN8nAutomationFlow>
      <WorkflowDashboardOverview withoutShell />
    </NewN8nAutomationFlow>
  );
}

