"use client";

import { useCallback, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck2,
  Globe,
  Layers,
  LineChart,
  Play,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
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

type GSCQueryItem = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: string;
  position: number;
  intent: "High Commercial" | "Brand Search" | "Product Discovery";
};

type AuditOutcomeRow = {
  time: string;
  result: "PASS" | "RECOMMENDATION_ONLY" | "DRY_RUN";
  eventType: string;
  summary: string;
  source: string;
};

const DEFAULT_GSC_QUERIES: GSCQueryItem[] = [
  {
    query: "luxury matte lipstick smudge proof",
    clicks: 1240,
    impressions: 18200,
    ctr: "6.8%",
    position: 3.2,
    intent: "High Commercial",
  },
  {
    query: "cevonne crimson velvet lipstick",
    clicks: 980,
    impressions: 4050,
    ctr: "24.2%",
    position: 1.1,
    intent: "Brand Search",
  },
  {
    query: "best non drying matte lipstick india",
    clicks: 650,
    impressions: 15800,
    ctr: "4.1%",
    position: 4.5,
    intent: "Product Discovery",
  },
  {
    query: "long lasting transfer proof lipstick luxe",
    clicks: 550,
    impressions: 14100,
    ctr: "3.9%",
    position: 5.8,
    intent: "High Commercial",
  },
];

const DEFAULT_RECENT_OUTCOMES: AuditOutcomeRow[] = [
  {
    time: "Friday · 10:00 AM",
    result: "RECOMMENDATION_ONLY",
    eventType: "SEO_CRO_SYNTHESIS",
    summary: "Weekly audit completed: Organic search traffic up +18.4%. AR shade try-on driving 14% lift in conversions.",
    source: "Google Search Console + GA4",
  },
  {
    time: "Thursday · 04:30 PM",
    result: "PASS",
    eventType: "GSC_RANK_TRACKING",
    summary: "48 commercial lipstick keywords monitored. Average top 3 ranking maintained for brand terms.",
    source: "Search Console API",
  },
  {
    time: "Wednesday · 11:15 AM",
    result: "PASS",
    eventType: "CRO_FUNNEL_CHECK",
    summary: "Mobile checkout velocity audited: 68.5% completion rate. Pincode autofill recommended for Step 2.",
    source: "Storefront Analytics",
  },
  {
    time: "Monday · 09:00 AM",
    result: "PASS",
    eventType: "PRODUCT_SCHEMA_AUDIT",
    summary: "Rich Snippets schema validated across all 4 lipstick shade pages with zero structured data warnings.",
    source: "Schema Validator",
  },
];

export default function CevonneWorkflow10Page() {
  const { authFetch } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [runningAudit, setRunningAudit] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState("https://www.cevonne.com/products");
  const [actionType, setActionType] = useState("cro_checkout_audit");
  const [queries, setQueries] = useState<GSCQueryItem[]>(DEFAULT_GSC_QUERIES);
  const [outcomes, setOutcomes] = useState<AuditOutcomeRow[]>(DEFAULT_RECENT_OUTCOMES);
  const [latestAudit, setLatestAudit] = useState({
    summary:
      "G10 completed the weekly search query and conversion funnel audit. Organic search impressions are up +18.4% WoW on high-intent beauty keywords. Storefront conversion rate is healthy at 2.84%, with AR shade try-on driving a +14% conversion lift.",
    checkedWhat: "Google Search Console (48 queries) & GA4 Checkout Funnel",
    actionNeeded: "Add pincode autofill on mobile checkout & update shade schema",
    checkedTime: "Friday · 10:00 AM · today",
    actions: [
      {
        label: "Product Schema",
        desc: "Add structured AggregateOffer schema on for Google Shopping Rich Snippets.",
        code: "/products/crimson-velvet",
      },
      {
        label: "Mobile CRO",
        desc: "Reduce mobile cart friction by pre-fetching delivery pincode estimates on Step 2.",
      },
      {
        label: "Keyword Scaling",
        desc: 'Create dedicated editorial swatch guide targeting "luxury smudge proof matte lipstick".',
      },
    ],
  });

  const fetchWorkflow10Data = useCallback(async () => {
    try {
      const res = await authFetch("/api/admin/n8n/workflow-10");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.queries) && data.queries.length > 0) {
            setQueries(data.queries);
          }
          if (Array.isArray(data.outcomes) && data.outcomes.length > 0) {
            setOutcomes(data.outcomes);
          }
        }
      }
    } catch (err) {
      console.warn("Could not load latest Workflow 10 data from n8n route:", err);
    }
  }, [authFetch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchWorkflow10Data();
      toast.success("Workflow 10 metrics refreshed from Google Search Console & GA4.");
    } catch {
      toast.error("Failed to refresh Workflow 10 metrics.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleExecuteAudit = async () => {
    setRunningAudit(true);
    try {
      const res = await authFetch("/api/admin/n8n/workflow-10", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl, actionType }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.newOutcome) {
          setOutcomes((prev) => [data.newOutcome, ...prev]);
        }
        if (data.updatedAudit) {
          setLatestAudit((prev) => ({
            ...prev,
            summary: data.updatedAudit.summary,
            checkedWhat: data.updatedAudit.checkedWhat,
            checkedTime: data.updatedAudit.checkedTime,
            actionNeeded: data.updatedAudit.actions?.[0]?.desc || prev.actionNeeded,
            actions: data.updatedAudit.actions || prev.actions,
          }));
        }
        if (Array.isArray(data.updatedQueries) && data.updatedQueries.length > 0) {
          setQueries(data.updatedQueries);
        }
        setRunDialogOpen(false);
        toast.success(data.message || "SEO & CRO recommendation generated via n8n!");
      } else {
        toast.error(data.message || "Failed to trigger n8n recommendation.");
      }
    } catch (err) {
      toast.error("Error connecting to n8n webhook.");
    } finally {
      setRunningAudit(false);
    }
  };

  return (
    <WorkflowDashboardShell
      eyebrow="WORKFLOW 10"
      title="Workflow 10 – SEO + CRO"
      description="Creates safe SEO and conversion recommendations without live code changes. Audits Google Search Console keywords and storefront checkout funnels."
      badges={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-indigo-300 bg-indigo-50 text-xs font-semibold text-indigo-800 px-3 py-1">
            <span className="mr-1.5 size-2 rounded-full bg-indigo-500 animate-pulse" />
            Scheduled · Friday 10 AM
          </Badge>
          <Badge variant="outline" className="border-border/70 bg-secondary/20 text-xs font-semibold text-muted-foreground px-3 py-1">
            Recommendation only
          </Badge>
          <Badge variant="outline" className="border-border/70 bg-white/80 text-xs font-mono text-muted-foreground px-3 py-1">
            GSC + GA4 Connected
          </Badge>
        </div>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full border-border/80 bg-white/90 text-xs font-medium text-foreground hover:bg-neutral-50 shadow-sm"
          >
            <Link href="/dashboard/n8n-automations">
              <ArrowLeft className="mr-1.5 size-3.5" />
              Back
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || runningAudit}
            className="rounded-full border-border/80 bg-white/90 text-xs font-medium text-foreground hover:bg-neutral-50 shadow-sm"
          >
            <RefreshCw className={cn("mr-1.5 size-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setRunDialogOpen(true)}
            disabled={runningAudit}
            className="rounded-full bg-primary px-4 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
          >
            <Play className="mr-1.5 size-3.5" />
            Generate SEO/CRO Recommendation
          </Button>
        </div>
      }
    >
      {/* LATEST CHECKED OUTCOME (Old G10 Luxury Layout with Updated Data) */}
      <Card id="latest-outcome" className="overflow-hidden rounded-[28px] border-border/60 bg-white shadow-sm">
        <CardHeader className="space-y-2 p-6 md:p-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1.5">
              <CardTitle className="font-serif text-2xl tracking-tight text-primary">
                Latest Checked Outcome
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-muted-foreground">
                The most recent checked result, shown in plain language. Nothing was executed live.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full border-indigo-300 bg-indigo-50 text-[11px] font-semibold text-indigo-800 px-3 py-1">
                RECOMMENDATION ONLY
              </Badge>
              <Badge variant="outline" className="rounded-full border-border/70 bg-secondary/20 px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                Handled Friday · 10:00 AM
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6 pt-0 md:p-8 md:pt-0">
          {/* Summary Box */}
          <div className="rounded-2xl border border-border/60 bg-muted/15 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">What happened</p>
            <p className="mt-2 text-base leading-7 text-foreground text-pretty">
              {latestAudit.summary}
            </p>
          </div>

          {/* 4 Details Grid */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What was checked</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {latestAudit.checkedWhat}
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action needed</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {latestAudit.actionNeeded}
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Checked time</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {latestAudit.checkedTime}
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Result</p>
              <div className="mt-2">
                <Badge variant="outline" className="border-indigo-300 bg-indigo-50 text-[11px] font-semibold text-indigo-800 px-3 py-1">
                  RECOMMENDATION ONLY
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2-COLUMN SECTION: Actions Needed (Left) & Saved Output (Right) */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Actions Needed Card */}
        <Card id="actions-needed" className="rounded-[28px] border-border/60 bg-white shadow-sm">
          <CardHeader className="space-y-1.5 p-6 md:p-8">
            <CardTitle className="font-serif text-2xl tracking-tight text-primary">Actions Needed</CardTitle>
            <CardDescription className="text-sm leading-6 text-muted-foreground">
              The next safe step, written for the client.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-0 md:p-8 md:pt-0">
            <div className="rounded-2xl border border-border/60 bg-muted/15 p-5 space-y-3">
              <p className="text-sm font-semibold text-foreground">Prioritized Growth Actions:</p>
              <ul className="text-xs leading-relaxed text-muted-foreground space-y-2 list-disc list-inside">
                {latestAudit.actions.map((act, idx) => (
                  <li key={idx}>
                    <strong className="text-foreground">{act.label}:</strong> {act.desc}{" "}
                    {act.code && (
                      <code className="text-primary font-mono text-[11px]">{act.code}</code>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                className="h-10 rounded-full px-5 text-xs font-semibold"
                onClick={() => setRunDialogOpen(true)}
              >
                <Play className="mr-1.5 size-3.5" />
                Generate New Recommendation
              </Button>
              <Button asChild variant="outline" className="h-10 rounded-full border-border/70 bg-white px-5 text-xs">
                <a href="#recent-outcomes">
                  <ArrowRight className="mr-1.5 size-3.5" />
                  View Audit History
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Saved Output Card */}
        <Card id="saved-output" className="rounded-[28px] border-border/60 bg-white shadow-sm">
          <CardHeader className="space-y-1.5 p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-serif text-2xl tracking-tight text-primary">Saved Output</CardTitle>
                <CardDescription className="text-sm leading-6 text-muted-foreground">
                  The clean result saved for client review.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-border/70 bg-white text-xs font-mono text-muted-foreground">
                GSC Query Tracker
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 md:p-8 md:pt-0">
            <div className="overflow-hidden rounded-xl border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">Top Search Query</TableHead>
                    <TableHead className="text-xs text-center">Position</TableHead>
                    <TableHead className="text-xs text-center">CTR</TableHead>
                    <TableHead className="text-right text-xs">Intent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queries.map((q) => (
                    <TableRow key={q.query} className="hover:bg-neutral-50/60">
                      <TableCell className="font-medium text-xs text-foreground">
                        {q.query}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-semibold text-primary">
                        #{q.position}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-emerald-700 font-semibold">
                        {q.ctr}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-semibold",
                            q.intent === "Brand Search"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : "border-indigo-300 bg-indigo-50 text-indigo-800"
                          )}
                        >
                          {q.intent}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RECENT OUTCOMES TABLE (Old G10 Audit History) */}
      <Card id="recent-outcomes" className="overflow-hidden rounded-[28px] border-border/60 bg-white shadow-sm">
        <CardHeader className="space-y-1.5 p-6 md:p-8">
          <CardTitle className="font-serif text-2xl tracking-tight text-primary">Recent Outcomes</CardTitle>
          <CardDescription className="text-sm leading-6 text-muted-foreground">
            The latest workflow events and audit runs, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs">Result</TableHead>
                  <TableHead className="text-xs">Event Type</TableHead>
                  <TableHead className="text-xs">Audit Summary</TableHead>
                  <TableHead className="text-right text-xs">Source Platform</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outcomes.map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-neutral-50/60">
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {row.time}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold",
                          row.result === "PASS"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-indigo-300 bg-indigo-50 text-indigo-800"
                        )}
                      >
                        {row.result}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-primary font-semibold">
                      {row.eventType}
                    </TableCell>
                    <TableCell className="text-xs text-foreground max-w-md leading-relaxed">
                      {row.summary}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-muted-foreground">
                      {row.source}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* RUN RECOMMENDATION DIALOG (Old G10 Modal Form) */}
      <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
        <DialogContent className="sm:max-w-[540px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-primary">
              Generate SEO / CRO Recommendation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Creates a safe diagnostic recommendation for client review without executing any live storefront change.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Target Page URL</label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://www.cevonne.com/products"
                className="w-full rounded-xl border border-border/70 bg-neutral-50/60 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Audit Focus Type</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full rounded-xl border border-border/70 bg-neutral-50/60 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="cro_checkout_audit">Storefront Conversion Funnel (CRO)</option>
                <option value="gsc_keyword_audit">Google Search Console Organic Rankings</option>
                <option value="product_rich_schema">Product Schema &amp; Rich Snippets</option>
                <option value="mobile_speed_core_vitals">Mobile Core Web Vitals &amp; Page Speed</option>
              </select>
            </div>
          </div>

          <DialogFooter className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRunDialogOpen(false)}
              className="rounded-full text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteAudit}
              disabled={runningAudit}
              className="rounded-full bg-primary text-xs font-semibold text-white hover:bg-primary/90"
            >
              {runningAudit ? "Generating..." : "Generate Recommendation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkflowDashboardShell>
  );
}

