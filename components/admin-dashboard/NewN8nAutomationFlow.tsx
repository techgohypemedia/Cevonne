"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Ban,
  Clock3,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Workflow,
} from "lucide-react";
import Link from "next/link";

import WorkflowDashboardShell from "@/components/admin-dashboard/WorkflowDashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type PublishingRecord = {
  research_item_id: string;
  rank?: number | null;
  generated_caption?: string | null;
  content_concept?: string | null;
  status: string;
  created_at?: string | null;
};

const lastRunLabel = (value?: string | null) => {
  if (!value) return "Not run yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(date);
  return `${dateLabel} · today`;
};

export default function NewN8nAutomationFlow() {
  const { authFetch } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [latestItem, setLatestItem] = useState<PublishingRecord | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);

  const loadOverview = useCallback(async () => {
    setRefreshing(true);
    try {
      const [reviewRes, historyRes] = await Promise.all([
        authFetch("/api/admin/n8n/cevonne/review"),
        authFetch("/api/admin/n8n/cevonne/history?limit=10"),
      ]);

      if (reviewRes.ok) {
        const revData = await reviewRes.json();
        const items: PublishingRecord[] = revData.items || [];
        setPendingCount(items.length);
        const approved = items.filter((i) => i.status === "approved").length;
        setApprovedCount(approved);
      }

      if (historyRes.ok) {
        const histData = await historyRes.json();
        const hist = histData.history || [];
        if (hist.length > 0) {
          setLatestItem(hist[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const stats = [
    {
      label: "Workflows",
      value: "3",
      helper: "Content Automation Series",
      icon: <Workflow className="h-5 w-5" />,
      toneClass: "bg-primary",
    },
    {
      label: "Healthy",
      value: pendingCount > 0 ? "2" : "3",
      helper: "Passing without intervention",
      icon: <Sparkles className="h-5 w-5" />,
      toneClass: "bg-emerald-300",
    },
    {
      label: "Needs review",
      value: String(pendingCount),
      helper: "Waiting on human attention",
      icon: <ShieldAlert className="h-5 w-5" />,
      toneClass: "bg-amber-300",
    },
    {
      label: "Blocked",
      value: "0",
      helper: "Stopped for safety",
      icon: <Ban className="h-5 w-5" />,
      toneClass: "bg-rose-300",
    },
    {
      label: "Safe test",
      value: "Active",
      helper: "Live automated queue",
      icon: <Clock3 className="h-5 w-5" />,
      toneClass: "bg-cyan-300",
    },
  ];

  return (
    <WorkflowDashboardShell
      eyebrow="CEVONNE ADMIN"
      title="Workflow Dashboard"
      description="One-page summaries for every workflow. Open a workflow to inspect its latest outcome and next safe action."
      badges={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1">
            <span className="mr-1.5 size-2 rounded-full bg-emerald-500 animate-pulse" />
            3 Workflows Active
          </Badge>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadOverview}
            disabled={refreshing}
            className="rounded-full border-border/80 bg-white/90 text-xs font-medium text-foreground hover:bg-neutral-50 shadow-sm"
          >
            <RefreshCw className={cn("mr-1.5 size-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>

          <Button asChild size="sm" className="rounded-full bg-primary px-4 text-xs font-semibold text-white shadow-sm hover:bg-primary/90">
            <Link href="/dashboard/n8n-automations/workflow-1">
              <Play className="mr-1.5 size-3.5" />
              Open Workflow 1
            </Link>
          </Button>
        </div>
      }
    >
      {/* 5 Top Summary Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="gap-0 overflow-hidden rounded-2xl border-border/60 bg-white py-0 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <div className={cn("h-1.5 w-full rounded-full", stat.toneClass)} />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="font-serif text-4xl leading-none tracking-tight text-foreground">{stat.value}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{stat.helper}</p>
                </div>
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-muted/20 text-primary">
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3 Workflow Cards Grid (Clicking navigates to dedicated page) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* WORKFLOW 1 CARD */}
        <Card className="group gap-0 overflow-hidden rounded-[24px] border-border/60 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <CardContent className="flex h-full flex-col gap-4 p-5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px]">
                  Working normally
                </Badge>
                <span className="text-[11px] font-mono text-muted-foreground">Workflow 1</span>
              </div>
              <h3 className="font-serif text-xl leading-tight tracking-tight text-primary pt-1">
                1. Cevonne Workflow 1 – Instagram Research & Trend Analysis
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                This workflow researches trending Instagram content related to lipstick/beauty. It collects posts, analyzes their engagement and relevance, evaluates the content using AI, and selects the top-performing content ideas for further processing.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Last checked</p>
                <p className="mt-1 text-xs font-medium text-foreground">{lastRunLabel(latestItem?.created_at)}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Urgent action</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">
                  Run a research scan to fetch newest lipstick trends.
                </p>
              </div>
            </div>

            <div className="mt-auto pt-2">
              <Button asChild variant="outline" className="h-9 w-full rounded-full border-border/70 bg-white px-3 text-xs shadow-none hover:bg-neutral-50">
                <Link href="/dashboard/n8n-automations/workflow-1">
                  View Details
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WORKFLOW 2 CARD */}
        <Card className="group gap-0 overflow-hidden rounded-[24px] border-border/60 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <CardContent className="flex h-full flex-col gap-4 p-5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    pendingCount > 0
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : "border-emerald-300 bg-emerald-50 text-emerald-800"
                  )}
                >
                  {pendingCount > 0 ? `${pendingCount} Waiting for Approval` : "Working normally"}
                </Badge>
                <span className="text-[11px] font-mono text-muted-foreground">Workflow 2</span>
              </div>
              <h3 className="font-serif text-xl leading-tight tracking-tight text-primary pt-1">
                2. Cevonne Workflow 2 – AI Content Generation
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                This workflow takes the selected research content and converts it into original Cevonne-style content using AI. It generates the required creative images, captions, concepts, and supports both single-image and carousel content.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Last checked</p>
                <p className="mt-1 text-xs font-medium text-foreground">{lastRunLabel(latestItem?.created_at)}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Urgent action</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-primary font-semibold">
                  {pendingCount > 0 ? `${pendingCount} items waiting for review.` : "All content reviewed."}
                </p>
              </div>
            </div>

            <div className="mt-auto pt-2">
              <Button asChild variant="outline" className="h-9 w-full rounded-full border-border/70 bg-white px-3 text-xs shadow-none hover:bg-neutral-50">
                <Link href="/dashboard/n8n-automations/workflow-2">
                  View Details
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WORKFLOW 3 CARD */}
        <Card className="group gap-0 overflow-hidden rounded-[24px] border-border/60 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <CardContent className="flex h-full flex-col gap-4 p-5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px]">
                  {approvedCount > 0 ? "Approved – Ready" : "Working normally"}
                </Badge>
                <span className="text-[11px] font-mono text-muted-foreground">Workflow 3</span>
              </div>
              <h3 className="font-serif text-xl leading-tight tracking-tight text-primary pt-1">
                3. Cevonne Workflow 3 – Content Publishing & Storage
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                This workflow handles the final content preparation and storage process. Generated images are uploaded to Cloudflare R2, their metadata is stored in Supabase, and approved content is prepared for publishing through the execution flow.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Last checked</p>
                <p className="mt-1 text-xs font-medium text-foreground">{lastRunLabel(latestItem?.created_at)}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Urgent action</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">
                  {approvedCount > 0 ? `${approvedCount} approved assets waiting.` : "Publishing queue ready."}
                </p>
              </div>
            </div>

            <div className="mt-auto pt-2">
              <Button asChild variant="outline" className="h-9 w-full rounded-full border-border/70 bg-white px-3 text-xs shadow-none hover:bg-neutral-50">
                <Link href="/dashboard/n8n-automations/workflow-3">
                  View Details
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </WorkflowDashboardShell>
  );
}
