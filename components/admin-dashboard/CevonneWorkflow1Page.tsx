"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Hash,
  HelpCircle,
  Info,
  Instagram,
  Loader2,
  Music2,
  Play,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import WorkflowDashboardShell from "@/components/admin-dashboard/WorkflowDashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

type ResearchCandidate = {
  research_item_id: string;
  rank: number;
  concept: string;
  source_type: string;
  hashtags: string[];
  engagement_score: number;
  virality_index: number;
  resonance_score: number;
  metrics: {
    likes: string;
    comments: string;
    shares: string;
  };
  passed_to_workflow_2: boolean;
};

type ResearchBatch = {
  batch_id: string;
  target_query: string;
  last_scanned: string;
  total_posts_analyzed: number;
  high_velocity_trends: number;
  top_hashtags: { tag: string; volume: string; growth: string }[];
  viral_audio_tags: { title: string; usage: string }[];
  candidates: ResearchCandidate[];
};

export default function CevonneWorkflow1Page() {
  const { authFetch } = useAuth();
  const [running, setRunning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [batchData, setBatchData] = useState<ResearchBatch | null>(null);
  const [runStep, setRunStep] = useState<number | null>(null);

  const fetchResearchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await authFetch("/api/admin/n8n/cevonne/research");
      if (res.ok) {
        const data = await res.json();
        if (data.batch) {
          setBatchData(data.batch);
        }
        if (data.lastRun) {
          setLastRun(data.lastRun);
        }
      }
    } catch (e) {
      console.error("Failed to load research data:", e);
    } finally {
      setRefreshing(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchResearchData();
  }, [fetchResearchData]);

  const handleRunWorkflow = async () => {
    if (running) return;
    setRunning(true);
    setRunStep(1);
    toast.loading("Step 1/3: Triggering n8n Instagram research webhook...", { id: "wf1-run" });

    try {
      const res = await authFetch("/api/admin/n8n/cevonne/run", { method: "POST" });
      const data = await res.json();

      setRunStep(2);
      toast.loading("Step 2/3: Ingesting high-velocity hashtags & beauty reels...", { id: "wf1-run" });

      await new Promise((r) => setTimeout(r, 900));

      setRunStep(3);
      toast.loading("Step 3/3: Scoring virality & passing candidate concepts to Workflow 2...", {
        id: "wf1-run",
      });

      await new Promise((r) => setTimeout(r, 700));

      if (res.ok && data.success) {
        toast.success("Instagram trend research completed. Top ideas forwarded to Workflow 2!", {
          id: "wf1-run",
        });
        setLastRun(new Date().toISOString());
        await fetchResearchData();
      } else {
        toast.error("Workflow could not be started. Please try again.", { id: "wf1-run" });
      }
    } catch {
      toast.error("Workflow could not be started. Please try again.", { id: "wf1-run" });
    } finally {
      setRunning(false);
      setRunStep(null);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Not run yet";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <WorkflowDashboardShell
      eyebrow="CEVONNE WORKFLOW 1"
      title="Instagram Research & Trend Analysis"
      description="Researches trending Instagram content related to lipstick/beauty, collects posts, analyzes engagement, evaluates relevance with AI, and selects top-performing ideas."
      badges={
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1"
          >
            <span className="mr-1.5 size-2 rounded-full bg-emerald-500 animate-pulse" />
            Working normally
          </Badge>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="h-9 rounded-full border-border/70 bg-white px-3.5 text-xs font-medium shadow-sm hover:bg-neutral-50"
          >
            <Link href="/dashboard/n8n-automations">
              <ArrowLeft className="mr-1.5 size-3.5" />
              Back to Overview
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchResearchData}
            disabled={refreshing}
            className="rounded-full border-border/80 bg-white/90 text-xs font-medium text-foreground hover:bg-neutral-50 shadow-sm"
          >
            <RefreshCw className={`mr-1.5 size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleRunWorkflow}
            disabled={running}
            className="rounded-full bg-primary px-4 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
          >
            {running ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Researching...
              </>
            ) : (
              <>
                <Play className="mr-1.5 size-3.5" />
                Run Workflow 1
              </>
            )}
          </Button>
        </div>
      }
    >
      {/* 4 Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-[20px] border-border/60 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Current Status
          </span>
          <div className="mt-2 text-xl font-serif font-bold text-foreground">
            {running ? "Scanning Trends..." : "Working Normally"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Instagram collector active</p>
        </Card>

        <Card className="rounded-[20px] border-border/60 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Target Domain
          </span>
          <div className="mt-2 text-xl font-serif font-bold text-foreground">Lipstick & Beauty</div>
          <p className="mt-1 text-xs text-muted-foreground">High-engagement public posts</p>
        </Card>

        <Card className="rounded-[20px] border-border/60 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Last Checked
          </span>
          <div className="mt-2 text-xl font-serif font-bold text-foreground">{formatDate(lastRun)}</div>
          <p className="mt-1 text-xs text-muted-foreground">Automated trend scan</p>
        </Card>

        <Card className="rounded-[20px] border-border/60 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Next Safe Action
          </span>
          <div className="mt-2 text-xl font-serif font-bold text-primary">Run Research Batch</div>
          <p className="mt-1 text-xs text-muted-foreground">Fetch newest lipstick trends</p>
        </Card>
      </div>

      {/* Main Working Panel: Instagram Intelligence Engine */}
      <Card className="rounded-[24px] border-border/60 bg-white p-6 shadow-sm">
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-pink-50 p-3 text-pink-700">
                <Instagram className="size-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-primary">
                  Instagram Trend Intelligence Engine
                </h3>
                <p className="text-xs text-muted-foreground">
                  Automated pipeline collecting high-velocity beauty posts, scoring engagement, and filtering concepts.
                </p>
              </div>
            </div>

            <Button
              onClick={handleRunWorkflow}
              disabled={running}
              className="rounded-full bg-primary px-6 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 self-start sm:self-auto"
            >
              {running ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Running Research...
                </>
              ) : (
                <>
                  <Play className="mr-1.5 size-3.5" />
                  Run Workflow 1
                </>
              )}
            </Button>
          </div>

          {/* Stepper Status during run */}
          {running && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2.5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-primary flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  Live Execution in Progress
                </span>
                <span className="text-muted-foreground">Step {runStep || 1} of 3</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div
                  className={`rounded-lg p-2 border ${
                    (runStep || 1) >= 1
                      ? "border-primary/40 bg-white font-medium text-foreground"
                      : "border-border/40 text-muted-foreground"
                  }`}
                >
                  1. Trigger n8n Webhook
                </div>
                <div
                  className={`rounded-lg p-2 border ${
                    (runStep || 1) >= 2
                      ? "border-primary/40 bg-white font-medium text-foreground"
                      : "border-border/40 text-muted-foreground"
                  }`}
                >
                  2. Scrape Trends & Audio
                </div>
                <div
                  className={`rounded-lg p-2 border ${
                    (runStep || 1) >= 3
                      ? "border-primary/40 bg-white font-medium text-foreground"
                      : "border-border/40 text-muted-foreground"
                  }`}
                >
                  3. Forward to Workflow 2
                </div>
              </div>
            </div>
          )}

          {/* 3 Pipeline Architecture Cards */}
          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-2xl border border-border/60 bg-neutral-50/70 p-4 space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                1. Data Collection
              </span>
              <p className="font-semibold text-foreground text-sm">Post Scraping & Media Extraction</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Discovers top lipstick trends, reel audio tags, and popular beauty hashtags across public channels.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-neutral-50/70 p-4 space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                2. AI Relevance & Virality
              </span>
              <p className="font-semibold text-foreground text-sm">Engagement Quality Analysis</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Evaluates like-to-comment velocity, brand safety, and resonance with Cevonne&apos;s product catalog.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-neutral-50/70 p-4 space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                3. Handoff to Workflow 2
              </span>
              <p className="font-semibold text-foreground text-sm">Selected Candidate Queue</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Passes top-performing candidate ideas to Workflow 2 for creative concept, caption, and image generation.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Discovered Trends & Research Batch Stream */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-serif text-lg font-semibold text-primary">
              Discovered Trend Signals & Candidate Stream
            </h3>
            <p className="text-xs text-muted-foreground">
              Real-time intelligence extracted by Workflow 1 and prepared for AI Content Generation in Workflow 2.
            </p>
          </div>

          <Badge variant="outline" className="border-border bg-white text-muted-foreground text-xs self-start sm:self-auto">
            <Radio className="mr-1.5 size-3 text-emerald-500 animate-pulse" />
            Batch: {batchData?.batch_id || (lastRun ? "Run Recorded" : "Awaiting Trigger")}
          </Badge>
        </div>

        {batchData && (batchData.top_hashtags?.length > 0 || batchData.viral_audio_tags?.length > 0) ? (
          <>
            {/* Trending Hashtags & Audio Signals Row */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Trending Hashtags */}
              <Card className="rounded-[20px] border-border/60 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="rounded-lg bg-pink-50 p-1.5 text-pink-700">
                    <Hash className="size-4" />
                  </div>
                  <h4 className="font-serif text-sm font-semibold text-foreground">
                    High-Velocity Beauty Hashtags
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {batchData.top_hashtags.map((tagItem) => (
                    <div
                      key={tagItem.tag}
                      className="flex items-center justify-between rounded-xl bg-neutral-50/70 px-3 py-2 text-xs"
                    >
                      <span className="font-medium text-foreground">{tagItem.tag}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">{tagItem.volume}</span>
                        <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] font-semibold px-2 py-0.5">
                          <TrendingUp className="mr-1 size-2.5" />
                          {tagItem.growth}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Trending Audio & Media Tags */}
              <Card className="rounded-[20px] border-border/60 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="rounded-lg bg-purple-50 p-1.5 text-purple-700">
                    <Music2 className="size-4" />
                  </div>
                  <h4 className="font-serif text-sm font-semibold text-foreground">
                    Viral Beauty Audio & Reel Formats
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {batchData.viral_audio_tags.map((audioItem) => (
                    <div
                      key={audioItem.title}
                      className="flex items-center justify-between rounded-xl bg-neutral-50/70 px-3 py-2 text-xs"
                    >
                      <div className="truncate pr-2">
                        <p className="font-medium text-foreground truncate">{audioItem.title}</p>
                        <p className="text-[10px] text-muted-foreground">Original Audio Tag</p>
                      </div>
                      <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-800 text-[10px] font-semibold px-2 py-0.5 shrink-0">
                        <Flame className="mr-1 size-2.5 text-purple-600" />
                        {audioItem.usage}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Candidates if returned */}
            {batchData.candidates && batchData.candidates.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-base font-semibold text-primary flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-500" />
                    Selected Candidate Concepts Passed to Workflow 2
                  </h4>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary font-semibold hover:bg-neutral-100"
                  >
                    <Link href="/dashboard/n8n-automations/workflow-2">
                      Open Workflow 2 Queue
                      <ArrowRight className="ml-1.5 size-3.5" />
                    </Link>
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {batchData.candidates.map((candidate) => (
                    <Card
                      key={candidate.research_item_id}
                      className="rounded-[22px] border-border/60 bg-white p-5 shadow-sm space-y-4 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-[11px] font-semibold">
                            Rank #{candidate.rank}
                          </Badge>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {candidate.research_item_id}
                          </span>
                        </div>

                        <Badge
                          variant="outline"
                          className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] font-medium"
                        >
                          <CheckCircle2 className="mr-1 size-3 text-emerald-600" />
                          Forwarded to Workflow 2
                        </Badge>
                      </div>

                      <div>
                        <h5 className="font-serif text-base font-semibold text-foreground leading-snug">
                          {candidate.concept}
                        </h5>
                        <p className="text-xs text-muted-foreground mt-1">
                          Source: {candidate.source_type}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 rounded-xl bg-neutral-50/70 p-3 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase block font-medium">Virality</span>
                          <span className="font-bold text-foreground text-sm">{candidate.virality_index}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase block font-medium">Engagement</span>
                          <span className="font-bold text-foreground text-sm">{candidate.engagement_score}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase block font-medium">Resonance</span>
                          <span className="font-bold text-emerald-700 text-sm">{candidate.resonance_score}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                        <div className="flex items-center gap-3">
                          <span>❤️ {candidate.metrics.likes}</span>
                          <span>💬 {candidate.metrics.comments}</span>
                          <span>↗️ {candidate.metrics.shares}</span>
                        </div>

                        <Button
                          asChild
                          size="sm"
                          className="h-8 rounded-full bg-primary px-3 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
                        >
                          <Link href="/dashboard/n8n-automations/workflow-2">
                            Inspect in Workflow 2
                            <ArrowRight className="ml-1 size-3" />
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <Card className="rounded-[22px] border-border/60 bg-white p-8 text-center space-y-3 shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-neutral-50 text-muted-foreground">
              <Search className="size-6" />
            </div>
            <h4 className="font-serif text-base font-semibold text-foreground">
              {lastRun ? "Trend Research Run Triggered" : "No Trend Batch Loaded Yet"}
            </h4>
            <p className="max-w-md mx-auto text-xs text-muted-foreground leading-relaxed">
              {lastRun
                ? `Workflow 1 was executed at ${formatDate(lastRun)}. n8n is running in the background and forwarding generated content directly to Workflow 2.`
                : "Click 'Run Workflow 1' to start the live n8n Instagram research engine. Once n8n evaluates trending lipstick content, candidate ideas will appear in Workflow 2 for approval."}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <Button
                onClick={handleRunWorkflow}
                disabled={running}
                size="sm"
                className="rounded-full bg-primary px-5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
              >
                <Play className="mr-1.5 size-3.5" />
                Run Workflow 1
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
              >
                <Link href="/dashboard/n8n-automations/workflow-2">
                  Check Workflow 2 Queue
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Client-Friendly Architecture Explanation */}
        <Card className="rounded-[22px] border-border/60 bg-gradient-to-r from-neutral-50 via-white to-pink-50/20 p-5 text-xs shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary shrink-0 mt-0.5">
              <Info className="size-4" />
            </div>
            <div className="space-y-1.5 leading-relaxed">
              <h5 className="font-semibold text-foreground text-sm">
                How Workflow 1 Feeds the Content Engine
              </h5>
              <p className="text-muted-foreground">
                When you click <strong>Run Workflow 1</strong>, the system triggers the n8n background research webhook. It crawls high-velocity beauty trends, scores engagement velocity, and filters candidate ideas matching Cevonne&apos;s product standard.
              </p>
              <p className="text-muted-foreground">
                Candidate concepts (such as <code>RES-0012</code> and <code>RES-0013</code>) automatically advance to <strong>Workflow 2 (AI Content Generation)</strong> where AI writes captions and generates visual assets for admin review and approval.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </WorkflowDashboardShell>
  );
}
