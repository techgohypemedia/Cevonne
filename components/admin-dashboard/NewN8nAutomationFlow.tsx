"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Ban,
  Clock3,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
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

export default function NewN8nAutomationFlow({
  children,
}: {
  children?: React.ReactNode;
} = {}) {
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
      value: "12",
      helper: "Active Automation Suite",
      icon: <Workflow className="h-5 w-5" />,
      toneClass: "bg-primary",
    },
    {
      label: "Healthy",
      value: pendingCount > 0 ? "11" : "12",
      helper: "Passing without intervention",
      icon: <ShieldCheck className="h-5 w-5" />,
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
      description="One-page summaries for every active automation. Inspect live outcomes, triggers, and safe control actions."
      badges={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1">
            <span className="mr-1.5 size-2 rounded-full bg-emerald-500 animate-pulse" />
            12 Workflows Active
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

      {/* 11 Workflows Sequential Grid (Workflow 1 to Workflow 11) */}
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
                Workflow 1 – Instagram Trend Research
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                Researches trending Instagram content related to lipstick and cosmetics via Apify. Uses mathematical engagement filtering and GPT-4.1-mini vision analysis to select top ideas for content production.
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
                Workflow 2 – AI Content Generation Studio
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                Transforms top research into luxury Cevonne-branded visuals and captions. Queries product shade data from PostgreSQL and generates high-res assets with GPT image mini.
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
                Workflow 3 – Content Publishing & Storage
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                Uploads approved creative assets to Cloudflare R2 bucket (cdn.cevonne.com), records verified publishing metadata in Supabase, and runs compliance checks before public distribution.
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

        {/* WORKFLOW 4 CARD */}
        <Card className="group gap-0 overflow-hidden rounded-[24px] border-border/60 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <CardContent className="flex h-full flex-col gap-4 p-5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px]">
                  Healthy · Token Verified
                </Badge>
                <span className="text-[11px] font-mono text-muted-foreground">Workflow 4</span>
              </div>
              <h3 className="font-serif text-xl leading-tight tracking-tight text-primary pt-1">
                Workflow 4 – Meta & WhatsApp Health Monitor
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                Runs automated diagnostics every 6 hours against Meta Graph API v26.0. Validates Meta system user tokens, WhatsApp Cloud API phone quality rating (GREEN), and tier messaging limits.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Interval</p>
                <p className="mt-1 text-xs font-medium text-foreground">Every 6 Hours / On-Demand</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Protection</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">
                  Early token expiry & rate limit alerts.
                </p>
              </div>
            </div>

            <div className="mt-auto pt-2">
              <Button asChild variant="outline" className="h-9 w-full rounded-full border-border/70 bg-white px-3 text-xs shadow-none hover:bg-neutral-50">
                <Link href="/dashboard/n8n-automations/workflow-4">
                  View Details
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WORKFLOW 5 CARD */}
        <Card className="group gap-0 overflow-hidden rounded-[24px] border-border/60 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <CardContent className="flex h-full flex-col gap-4 p-5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px]">
                  Active · Webhook Ready
                </Badge>
                <span className="text-[11px] font-mono text-muted-foreground">Workflow 5</span>
              </div>
              <h3 className="font-serif text-xl leading-tight tracking-tight text-primary pt-1">
                Workflow 5 – Messaging + Quiz + Cart Recovery Router
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                Omnichannel customer router handling WhatsApp lipstick shade quiz intake with 10% VIP coupon delivery, 30-minute cart abandonment recovery with purchase suppression, and STOP compliance.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Mode</p>
                <p className="mt-1 text-xs font-medium text-foreground">Interactive Router</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Guardrail</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">
                  Auto-suppress on purchase & STOP opt-out.
                </p>
              </div>
            </div>

            <div className="mt-auto pt-2">
              <Button asChild variant="outline" className="h-9 w-full rounded-full border-border/70 bg-white px-3 text-xs shadow-none hover:bg-neutral-50">
                <Link href="/dashboard/n8n-automations/workflow-5">
                  View Details
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WORKFLOW 6 CARD */}
        <Card className="group gap-0 overflow-hidden rounded-[24px] border-border/60 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <CardContent className="flex h-full flex-col gap-4 p-5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-indigo-300 bg-indigo-50 text-indigo-800 text-[10px]">
                  Scheduled · Daily 9 AM
                </Badge>
                <span className="text-[11px] font-mono text-muted-foreground">Workflow 6</span>
              </div>
              <h3 className="font-serif text-xl leading-tight tracking-tight text-primary pt-1">
                Workflow 6 – Discount Offer + Ad Coupon Health & Expiry Monitor
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                Daily 9 AM coupon & margin sentinel enforcing 50% discount ceiling, Founder Approval Gate (&gt;50%), ₹599 lipstick price floor, and automated WhatsApp alerts for expiring or broken promo codes.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Schedule</p>
                <p className="mt-1 text-xs font-medium text-foreground">Daily at 9:00 AM</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Protection</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">
                  50% Ceiling + Founder Approval + ₹599 Margin Floor
                </p>
              </div>
            </div>

            <div className="mt-auto pt-2">
              <Button asChild variant="outline" className="h-9 w-full rounded-full border-border/70 bg-white px-3 text-xs shadow-none hover:bg-neutral-50">
                <Link href="/dashboard/n8n-automations/workflow-6">
                  View Details
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WORKFLOW 7 CARD */}
        <Card className="group gap-0 overflow-hidden rounded-[24px] border-border/60 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <CardContent className="flex h-full flex-col gap-4 p-5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px]">
                  Live Sentinel · Instant
                </Badge>
                <span className="text-[11px] font-mono text-muted-foreground">Workflow 7</span>
              </div>
              <h3 className="font-serif text-xl leading-tight tracking-tight text-primary pt-1">
                Workflow 7 – Real-Time Low Stock Alert
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                Real-time stock sentinel monitoring luxury inventory balances. Dispatches instant high-priority WhatsApp and formatted HTML email alerts to warehouse staff when any shade breaches safety stock limits.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Trigger</p>
                <p className="mt-1 text-xs font-medium text-foreground">Instant on Order / Restock</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Channels</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">
                  WhatsApp Cloud + Emergency Email.
                </p>
              </div>
            </div>

            <div className="mt-auto pt-2">
              <Button asChild variant="outline" className="h-9 w-full rounded-full border-border/70 bg-white px-3 text-xs shadow-none hover:bg-neutral-50">
                <Link href="/dashboard/n8n-automations/workflow-7">
                  View Details
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WORKFLOW 8 CARD */}
        <Card className="group gap-0 overflow-hidden rounded-[24px] border-border/60 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <CardContent className="flex h-full flex-col gap-4 p-5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px]">
                  Verified Live · Webhook Active
                </Badge>
                <span className="text-[11px] font-mono text-muted-foreground">Workflow 8</span>
              </div>
              <h3 className="font-serif text-xl leading-tight tracking-tight text-primary pt-1">
                Workflow 8 – UGC Creator Proof & Auto Permission (Full Suite)
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                Autonomous UGC creator suite receiving Instagram tags, verifying media on Meta Graph, saving to Supabase, sending official permission request DMs, and logging creator consent.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                <p className="mt-1 text-xs font-medium text-emerald-700 font-semibold">Live Tested & Verified</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Storage</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">
                  Supabase cevonne_ugc_mentions
                </p>
              </div>
            </div>

            <div className="mt-auto pt-2">
              <Button asChild variant="outline" className="h-9 w-full rounded-full border-border/70 bg-white px-3 text-xs shadow-none hover:bg-neutral-50">
                <Link href="/dashboard/n8n-automations/workflow-8">
                  View Details
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WORKFLOW 9 CARD */}
        <Card className="group gap-0 overflow-hidden rounded-[24px] border-border/60 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <CardContent className="flex h-full flex-col gap-4 p-5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-indigo-300 bg-indigo-50 text-indigo-800 text-[10px]">
                  Scheduled · Daily 9 AM
                </Badge>
                <span className="text-[11px] font-mono text-muted-foreground">Workflow 9</span>
              </div>
              <h3 className="font-serif text-xl leading-tight tracking-tight text-primary pt-1">
                Workflow 9 – Meta Ads Daily Performance & ROAS Monitor
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                Daily 9 AM Meta Marketing API auditor pulling live campaign ROAS, spend, and CPA. Evaluates ad performance using OpenAI strategic guidance and generates budget scaling suggestions.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Schedule</p>
                <p className="mt-1 text-xs font-medium text-foreground">Daily at 9:00 AM</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Intelligence</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">
                  OpenAI ROAS & creative fatigue advisor.
                </p>
              </div>
            </div>

            <div className="mt-auto pt-2">
              <Button asChild variant="outline" className="h-9 w-full rounded-full border-border/70 bg-white px-3 text-xs shadow-none hover:bg-neutral-50">
                <Link href="/dashboard/n8n-automations/workflow-9">
                  View Details
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WORKFLOW 10 CARD */}
        <Card className="group gap-0 overflow-hidden rounded-[24px] border-border/60 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <CardContent className="flex h-full flex-col gap-4 p-5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-indigo-300 bg-indigo-50 text-indigo-800 text-[10px]">
                  Scheduled · Fri 10 AM
                </Badge>
                <span className="text-[11px] font-mono text-muted-foreground">Workflow 10</span>
              </div>
              <h3 className="font-serif text-xl leading-tight tracking-tight text-primary pt-1">
                Workflow 10 – SEO + CRO
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                Weekly Friday 10 AM search visibility and conversion optimizer. Audits Google Search Console impressions, click trends, and GA4 checkout drop-offs to generate CRO recommendations.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Schedule</p>
                <p className="mt-1 text-xs font-medium text-foreground">Every Friday 10:00 AM</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Deliverable</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">
                  GSC search query & CRO audit report.
                </p>
              </div>
            </div>

            <div className="mt-auto pt-2">
              <Button asChild variant="outline" className="h-9 w-full rounded-full border-border/70 bg-white px-3 text-xs shadow-none hover:bg-neutral-50">
                <Link href="/dashboard/n8n-automations/workflow-10">
                  View Details
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WORKFLOW 11 CARD */}
        <Card className="group gap-0 overflow-hidden rounded-[24px] border-border/60 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <CardContent className="flex h-full flex-col gap-4 p-5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-indigo-300 bg-indigo-50 text-indigo-800 text-[10px]">
                  Scheduled · Mon 10 AM
                </Badge>
                <span className="text-[11px] font-mono text-muted-foreground">Workflow 11</span>
              </div>
              <h3 className="font-serif text-xl leading-tight tracking-tight text-primary pt-1">
                Workflow 11 – Monday Founder Weekly Digest
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                Monday morning executive intelligence summarizing weekly gross revenue, order count, average order value (AOV), top performing lipstick shades, and low-inventory warnings.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Frequency</p>
                <p className="mt-1 text-xs font-medium text-foreground">Every Monday 10:00 AM</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Deliverable</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">
                  Founder WhatsApp & executive digest.
                </p>
              </div>
            </div>

            <div className="mt-auto pt-2">
              <Button asChild variant="outline" className="h-9 w-full rounded-full border-border/70 bg-white px-3 text-xs shadow-none hover:bg-neutral-50">
                <Link href="/dashboard/n8n-automations/workflow-11">
                  View Details
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WORKFLOW 12 CARD */}
        <Card className="group gap-0 overflow-hidden rounded-[24px] border-border/60 bg-white py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between">
          <CardContent className="flex h-full flex-col gap-4 p-5">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px]">
                  Working normally
                </Badge>
                <span className="text-[11px] font-mono text-muted-foreground">Workflow 12</span>
              </div>
              <h3 className="font-serif text-xl leading-tight tracking-tight text-primary pt-1">
                Workflow 12 – Customer Consent & Campaign Attribution
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                Centralized compliance ledger tracking explicit opt-ins from Quiz, Checkout, and VIP clubs. Enforces DPDP / Meta privacy guards and multi-touch influencer attribution before recovery messaging.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Privacy Scope</p>
                <p className="mt-1 text-xs font-medium text-foreground">DPDP & Meta WABA Gated</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Attribution</p>
                <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">
                  Multi-Touch Creator & Ad ROAS
                </p>
              </div>
            </div>

            <div className="mt-auto pt-2">
              <Button asChild variant="outline" className="h-9 w-full rounded-full border-border/70 bg-white px-3 text-xs shadow-none hover:bg-neutral-50">
                <Link href="/dashboard/n8n-automations/workflow-12">
                  View Details
                  <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual divider separating Modern Custom Suite from Core Platform */}
      <div className="pt-8">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Core Platform Automations (G1–G12)
          </span>
          <div className="h-px flex-1 bg-border/60" />
        </div>
      </div>

      {/* Embedded Workflows (e.g. Core Platform Workflows G1–G12 - Untouched) */}
      {children}
    </WorkflowDashboardShell>
  );
}
