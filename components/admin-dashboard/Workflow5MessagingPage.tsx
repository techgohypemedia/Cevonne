"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Clock3, Play, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import WorkflowDashboardShell from "@/components/admin-dashboard/WorkflowDashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { formatWorkflowDateTime, formatWorkflowRelativeTime } from "@/lib/admin/workflows";

type MessagingStatus = "PASS" | "BLOCK" | "DRY_RUN" | "ERROR";

type MessagingEventRow = {
  id: string;
  time: string;
  status: MessagingStatus;
  whatHappened: string;
  actionNeeded: string;
  details: string;
};

type Wf5DashboardResponse = {
  success: boolean;
  workflowId: string;
  status: MessagingStatus;
  latestResult: {
    status: MessagingStatus;
    handledAt: string | null;
    summary: string;
    details: string;
  };
  actionsNeeded: {
    message: string;
    buttonLabel: string;
  };
  recentEvents: MessagingEventRow[];
};

const statusBadgeTone = (status: MessagingStatus) => {
  switch (status) {
    case "PASS":
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    case "DRY_RUN":
      return "border-sky-300 bg-sky-50 text-sky-800";
    case "BLOCK":
      return "border-amber-300 bg-amber-50 text-amber-800";
    case "ERROR":
    default:
      return "border-rose-300 bg-rose-50 text-rose-800";
  }
};

const statusBadgeLabel = (status: MessagingStatus) => {
  switch (status) {
    case "PASS":
      return "Active · Healthy";
    case "DRY_RUN":
      return "Dry Run Passed";
    case "BLOCK":
      return "Safely Blocked";
    case "ERROR":
    default:
      return "Needs Attention";
  }
};

const formatTime = (value?: string | null) => {
  if (!value) return "Ready";
  return `${formatWorkflowDateTime(value)} · ${formatWorkflowRelativeTime(value)}`;
};

export default function Workflow5MessagingPage() {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<Wf5DashboardResponse | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [customerName, setCustomerName] = useState("Admin Dry Run");
  const [phone, setPhone] = useState("917061009669");
  const [matchedShade, setMatchedShade] = useState("Cevonne Crimson Velvet");
  const [dryRun, setDryRun] = useState(true);

  const loadDashboard = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        const res = await authFetch("/api/admin/workflow-dashboard/wf5", {
          cache: "no-store",
        });
        if (res.ok) {
          const json = (await res.json()) as Wf5DashboardResponse;
          setData(json);
        } else {
          toast.error("Failed to load Workflow 5 status.");
        }
      } catch {
        toast.error("Network error loading Workflow 5.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authFetch]
  );

  useEffect(() => {
    void loadDashboard(true);
  }, [loadDashboard]);

  const handleRunDryRun = async () => {
    setRunning(true);
    try {
      const res = await authFetch("/api/admin/workflow-dashboard/wf5", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          matchedShade,
          dryRun,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(result.message || "Quiz Dry Run completed.");
        setDialogOpen(false);
        // Optimistically prepend the outcome and refresh
        if (result.outcome && data) {
          setData({
            ...data,
            status: result.status,
            latestResult: {
              status: result.status,
              handledAt: result.handledAt,
              summary: result.outcome.whatHappened,
              details: result.outcome.details,
            },
            recentEvents: [result.outcome, ...data.recentEvents],
          });
        }
        void loadDashboard(true);
      } else {
        toast.error(result.message || "Dry run failed.");
      }
    } catch {
      toast.error("Failed to trigger Workflow 5.");
    } finally {
      setRunning(false);
    }
  };

  const currentStatus: MessagingStatus = data?.status ?? "PASS";
  const latest = data?.latestResult;
  const recentEvents = data?.recentEvents ?? [];

  return (
    <WorkflowDashboardShell
      eyebrow="WORKFLOW DETAIL"
      title="Workflow 5 – Messaging + Quiz + Cart Recovery Router"
      description="Omnichannel customer router handling WhatsApp lipstick shade quiz intake with 10% VIP coupon delivery, 30-minute cart abandonment recovery with purchase suppression, and STOP compliance."
      badges={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("text-xs font-medium", statusBadgeTone(currentStatus))}>
            {statusBadgeLabel(currentStatus)}
          </Badge>
          <Badge variant="outline" className="border-border/70 bg-white text-xs text-muted-foreground">
            <Clock3 className="mr-1.5 size-3" />
            {latest?.handledAt ? formatTime(latest.handledAt) : "Webhook Ready"}
          </Badge>
        </div>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-lg border-border/80 bg-white text-xs">
            <Link href="/dashboard/n8n-automations">
              <ArrowLeft className="mr-1.5 size-3.5" />
              Back
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadDashboard(false)}
            disabled={refreshing}
            className="rounded-lg border-border/80 bg-white text-xs"
          >
            <RefreshCcw className={cn("mr-1.5 size-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="rounded-lg bg-primary px-4 text-xs font-semibold text-white hover:bg-primary/90"
          >
            <Play className="mr-1.5 size-3.5" />
            Run Quiz Dry Run
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full max-w-2xl rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card 1: Latest Messaging Result */}
          <Card className="rounded-2xl border-border/70 bg-white shadow-sm">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 pb-3">
              <div>
                <CardTitle className="font-serif text-xl font-semibold text-primary">
                  Latest Messaging Result
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  The most recent checked result, shown in plain language.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn("text-xs", statusBadgeTone(latest?.status ?? "PASS"))}>
                  {statusBadgeLabel(latest?.status ?? "PASS")}
                </Badge>
                <Badge variant="outline" className="border-border/70 bg-muted/20 text-xs text-muted-foreground">
                  Handled {latest?.handledAt ? formatWorkflowRelativeTime(latest.handledAt) : "Ready"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-4 text-sm text-foreground">
                <p>{latest?.summary}</p>
                {latest?.details ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">{latest.details}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Actions Needed */}
          <Card className="max-w-3xl rounded-2xl border-border/70 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-xl font-semibold text-primary">
                Actions Needed
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                The next safe step, written for the client.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-white px-4 py-3 text-sm text-foreground">
                {data?.actionsNeeded?.message}
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="rounded-lg bg-primary px-4 text-xs font-semibold text-white hover:bg-primary/90"
              >
                <Play className="mr-1.5 size-3.5" />
                {data?.actionsNeeded?.buttonLabel || "Run Quiz Dry Run"}
              </Button>
            </CardContent>
          </Card>

          {/* Card 3: Recent Messaging Results */}
          <Card className="rounded-2xl border-border/70 bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-xl font-semibold text-primary">
                Recent Messaging Results
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                The latest workflow events, newest first.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="pl-6 text-xs font-semibold">Time</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">What happened</TableHead>
                    <TableHead className="text-xs font-semibold">Action needed</TableHead>
                    <TableHead className="pr-6 text-xs font-semibold">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                        This workflow is ready. Run Quiz Dry Run to test the messaging route.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentEvents.map((row) => (
                      <TableRow key={row.id} className="border-border/40 hover:bg-neutral-50/60">
                        <TableCell className="pl-6 text-xs whitespace-nowrap text-muted-foreground">
                          {formatTime(row.time)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className={cn("text-[11px]", statusBadgeTone(row.status))}>
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-foreground max-w-xs">
                          {row.whatHappened}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs">
                          {row.actionNeeded}
                        </TableCell>
                        <TableCell className="pr-6 text-xs text-muted-foreground font-mono">
                          {row.details}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dry Run Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-primary">
              Run Quiz Dry Run (Workflow 5)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Test the WhatsApp Lipstick Shade Quiz & VIP10 Router safely via webhook.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="wf5-name" className="text-xs font-medium">
                Customer Name
              </Label>
              <Input
                id="wf5-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wf5-phone" className="text-xs font-medium">
                WhatsApp Number
              </Label>
              <Input
                id="wf5-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wf5-shade" className="text-xs font-medium">
                Matched Lipstick Shade
              </Label>
              <Input
                id="wf5-shade"
                value={matchedShade}
                onChange={(e) => setMatchedShade(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="wf5-dry-run"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="rounded border-border"
              />
              <Label htmlFor="wf5-dry-run" className="text-xs text-muted-foreground cursor-pointer">
                Safe Dry Run (do not dispatch live customer WhatsApp)
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleRunDryRun}
              disabled={running}
              className="rounded-lg bg-primary text-xs font-semibold text-white hover:bg-primary/90"
            >
              <Play className="mr-1.5 size-3.5" />
              {running ? "Running..." : "Run Quiz Dry Run"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkflowDashboardShell>
  );
}

