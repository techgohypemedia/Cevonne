"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import WorkflowDashboardShell from "@/components/admin-dashboard/WorkflowDashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import {
  formatWorkflowDateTime,
  formatWorkflowRelativeTime,
} from "@/lib/admin/workflows";

type DigestEventRow = {
  id: string;
  time: string;
  status: "PASS" | "BLOCK" | "DRY_RUN" | "ERROR";
  whatHappened: string;
  actionNeeded: string;
  details: string;
};

type Wf11DashboardData = {
  success: boolean;
  status: string;
  latestResult: {
    badge: string;
    routeLabel: string;
    summary: string;
    time: string | null;
  };
  actionsNeeded: string;
  recentEvents: DigestEventRow[];
};

const statusBadgeClass = (status: string) => {
  switch (status.toUpperCase()) {
    case "PASS":
    case "PROCESSED":
    case "LIVE KPIS READY":
    case "HEALTHY & ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "BLOCK":
    case "ERROR":
    case "NEEDS ATTENTION":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "DRY_RUN":
    case "PENDING REVIEW":
    case "REVIEW NEEDED":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
};

export default function Workflow11WeeklyDigestPage() {
  const { authFetch } = useAuth();
  const [data, setData] = useState<Wf11DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [note, setNote] = useState(
    "Manual Founder Weekly Digest check from Workflow 11 Dashboard"
  );
  const [submitting, setSubmitting] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);

  const loadData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const res = await authFetch("/api/admin/workflow-dashboard/wf11", {
          cache: "no-store",
        });
        const json = (await res.json()) as Wf11DashboardData & {
          message?: string;
        };
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Could not load Workflow 11 data.");
        }
        setData(json);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to load Workflow 11 data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authFetch]
  );

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  const handleRunDigest = async () => {
    setSubmitting(true);
    setTestOutput(null);
    try {
      const res = await authFetch("/api/admin/workflow-dashboard/wf11", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
        response?: unknown;
      };
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Weekly Digest run failed.");
      }
      toast.success(json.message || "Weekly Digest triggered.");
      setTestOutput(JSON.stringify(json.response ?? json, null, 2));
      await loadData(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to run Weekly Digest."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const overallStatus = data?.status || "Ready";
  const latestTime = data?.latestResult?.time ?? null;
  const recentEvents = data?.recentEvents ?? [];

  return (
    <WorkflowDashboardShell
      eyebrow="WORKFLOW DETAIL"
      title="Workflow 11 – Monday Founder Weekly Digest"
      description="Monday 10 AM executive intelligence summarizing weekly gross revenue, orders, AOV, and low-inventory warnings from live store data."
      badges={
        <>
          <Badge variant="outline" className={statusBadgeClass(overallStatus)}>
            {overallStatus}
          </Badge>
          <Badge
            variant="outline"
            className="border-stone-200 bg-stone-50 text-stone-600"
          >
            {latestTime
              ? `Updated ${formatWorkflowRelativeTime(latestTime)}`
              : "Scheduled · Mon 10 AM"}
          </Badge>
        </>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild type="button" variant="outline" size="sm">
            <Link href="/dashboard/n8n-automations">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadData(true)}
            disabled={refreshing || loading}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-[#3d0833] text-white hover:bg-[#2a0523]"
            onClick={() => {
              setTestOutput(null);
              setDialogOpen(true);
            }}
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Run Weekly Digest
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="border-stone-200/80 bg-white/95 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
            <div>
              <CardTitle className="font-serif text-xl font-semibold text-[#3d0833]">
                Latest Weekly Digest Result
              </CardTitle>
              <CardDescription className="text-xs text-stone-500">
                The most recent 7-day executive summary & digest status, shown in plain language.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={statusBadgeClass(
                  data?.latestResult?.badge || "Ready"
                )}
              >
                {data?.latestResult?.badge || "Ready"}
              </Badge>
              <Badge
                variant="outline"
                className="border-stone-200 bg-stone-50 text-stone-700"
              >
                {data?.latestResult?.routeLabel || "Cron: Mon 10 AM"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-stone-700">
              {loading
                ? "Loading live 7-day revenue, orders & digest status..."
                : data?.latestResult?.summary ||
                  "Workflow 11 is ready. Click Run Weekly Digest to generate an executive briefing."}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-stone-200/80 bg-white/95 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-xl font-semibold text-[#3d0833]">
                Actions Needed
              </CardTitle>
              <CardDescription className="text-xs text-stone-500">
                The next safe step, written for the client.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
                {loading
                  ? "Checking weekly KPIs and inventory alerts..."
                  : data?.actionsNeeded || "No immediate action needed."}
              </div>
              <Button
                type="button"
                size="sm"
                className="bg-[#3d0833] text-white hover:bg-[#2a0523]"
                onClick={() => {
                  setTestOutput(null);
                  setDialogOpen(true);
                }}
              >
                <Play className="mr-1.5 h-3.5 w-3.5" />
                Run Weekly Digest
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-stone-200/80 bg-white/95 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-xl font-semibold text-[#3d0833]">
              Recent Weekly Digest Results
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              Live 7-day commerce pulse & recent digest runs, newest first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-6 text-center text-sm text-stone-500">
                Loading recent weekly digest events...
              </div>
            ) : recentEvents.length === 0 ? (
              <div className="py-6 text-center text-sm text-stone-500">
                No digest events recorded yet. Click Run Weekly Digest to generate one now.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow className="border-stone-200 hover:bg-transparent">
                      <TableHead className="w-[15%] text-xs font-semibold text-stone-700">
                        Time
                      </TableHead>
                      <TableHead className="w-[11%] text-xs font-semibold text-stone-700">
                        Status
                      </TableHead>
                      <TableHead className="w-[28%] text-xs font-semibold text-stone-700">
                        What happened
                      </TableHead>
                      <TableHead className="w-[24%] text-xs font-semibold text-stone-700">
                        Action needed
                      </TableHead>
                      <TableHead className="w-[22%] text-xs font-semibold text-stone-700">
                        Details
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentEvents.map((row) => (
                      <TableRow key={row.id} className="border-stone-100">
                        <TableCell className="whitespace-normal break-words align-top text-xs text-stone-600">
                          {formatWorkflowDateTime(row.time)}
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge
                            variant="outline"
                            className={statusBadgeClass(row.status)}
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-normal break-words align-top text-xs text-stone-800">
                          {row.whatHappened}
                        </TableCell>
                        <TableCell className="whitespace-normal break-words align-top text-xs text-stone-600">
                          {row.actionNeeded}
                        </TableCell>
                        <TableCell className="whitespace-normal break-words align-top font-mono text-[11px] text-stone-500">
                          {row.details}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#3d0833]">
              Run Founder Weekly Digest
            </DialogTitle>
            <DialogDescription>
              Generates an executive weekly summary across orders, revenue, and stock health via live Workflow 11.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="wf11-note">Digest Note</Label>
              <Input
                id="wf11-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note for this digest run"
              />
            </div>

            {testOutput && (
              <div className="max-h-40 overflow-auto rounded-md border border-stone-200 bg-stone-50 p-3 font-mono text-[11px] text-stone-700">
                <pre className="whitespace-pre-wrap break-words">
                  {testOutput}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              className="bg-[#3d0833] text-white hover:bg-[#2a0523]"
              onClick={() => void handleRunDigest()}
              disabled={submitting}
            >
              {submitting ? "Running..." : "Generate Digest"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkflowDashboardShell>
  );
}

