"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Cloud,
  Copy,
  Database,
  ExternalLink,
  Eye,
  FileCheck2,
  HardDrive,
  Image as ImageIcon,
  Layers,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import WorkflowDashboardShell from "@/components/admin-dashboard/WorkflowDashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

type PublishingRecord = {
  research_item_id: string;
  rank?: number | null;
  generated_caption?: string | null;
  content_concept?: string | null;
  generated_content_type?: string | null;
  image_count?: number | null;
  r2_image_path?: string | string[] | null;
  image_urls?: string[];
  status: string;
  display_status: string;
  action_needed: string;
  created_at?: string | null;
};

type HistoryResponse = {
  success: boolean;
  history: PublishingRecord[];
  count: number;
  message?: string;
};

const extractHashtags = (caption?: string | null): string[] => {
  if (!caption) return [];
  const matches = caption.match(/#[a-zA-Z0-9_]+/g);
  return matches ? matches.slice(0, 8) : [];
};

export default function CevonneWorkflow3Page() {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [history, setHistory] = useState<PublishingRecord[]>([]);
  const [approvedItem, setApprovedItem] = useState<PublishingRecord | null>(null);
  const [lastExecutionResult, setLastExecutionResult] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PublishingRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"gallery" | "ready" | "published" | "table">("gallery");

  const fetchWorkflowData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [historyRes, reviewRes] = await Promise.all([
        authFetch("/api/admin/n8n/cevonne/history?limit=50"),
        authFetch("/api/admin/n8n/cevonne/review"),
      ]);

      let allRecords: PublishingRecord[] = [];

      if (historyRes.ok) {
        const histData: HistoryResponse = await historyRes.json();
        allRecords = histData.history || [];
        setHistory(allRecords);
      }

      if (reviewRes.ok) {
        const revData = await reviewRes.json();
        const reviewItems: PublishingRecord[] = revData.items || [];
        // Look for approved item in either review queue or database history
        const approved =
          reviewItems.find((i) => i.status === "approved") ||
          allRecords.find((i) => i.status === "approved") ||
          null;
        setApprovedItem(approved);
      } else {
        const approved = allRecords.find((i) => i.status === "approved") || null;
        setApprovedItem(approved);
      }
    } catch (e) {
      console.error("Failed to load Workflow 3 data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchWorkflowData();
  }, [fetchWorkflowData]);

  const handleExecute = async (researchItemId: string) => {
    setExecuting(true);
    toast.loading("Executing approved content to live publishing channels...", { id: "wf3-exec" });

    try {
      const res = await authFetch("/api/admin/n8n/cevonne/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ research_item_id: researchItemId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const feedback = data.display_status === "Published" ? "Published successfully" : "Execution completed";
        setLastExecutionResult(feedback);
        toast.success(data.message || feedback, { id: "wf3-exec" });
        await fetchWorkflowData();
      } else {
        toast.error(data.message || "Execution could not be completed. Check n8n webhook registration.", {
          id: "wf3-exec",
        });
      }
    } catch {
      toast.error("Execution could not be completed. Please check your connection.", { id: "wf3-exec" });
    } finally {
      setExecuting(false);
    }
  };

  const handleCopyCaption = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Caption copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Not recorded";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const readyToExecuteItems = history.filter((i) => i.status === "approved");
  const publishedItems = history.filter((i) => i.status === "published" || i.status === "publishing");

  const filteredItems =
    activeTab === "ready"
      ? readyToExecuteItems
      : activeTab === "published"
      ? publishedItems
      : history;

  return (
    <WorkflowDashboardShell
      eyebrow="CEVONNE WORKFLOW 3"
      title="Content Publishing & Storage"
      description="Handles the final content preparation and storage process. Generated images are uploaded to Cloudflare R2, their metadata is stored in Supabase, and approved content is prepared for publishing through the execution flow."
      badges={
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-semibold px-3 py-1",
              approvedItem
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-neutral-300 bg-neutral-50 text-neutral-800"
            )}
          >
            <span
              className={cn(
                "mr-1.5 size-2 rounded-full",
                approvedItem ? "bg-emerald-500 animate-pulse" : "bg-neutral-500"
              )}
            />
            {approvedItem ? "Approved – Ready for Execution" : "Working Normally"}
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
            onClick={fetchWorkflowData}
            disabled={refreshing}
            className="rounded-full border-border/80 bg-white/90 text-xs font-medium text-foreground hover:bg-neutral-50 shadow-sm"
          >
            <RefreshCw className={`mr-1.5 size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {approvedItem && (
            <Button
              size="sm"
              onClick={() => handleExecute(approvedItem.research_item_id)}
              disabled={executing}
              className="rounded-full bg-primary px-4 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              {executing ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Send className="mr-1.5 size-3.5" />
                  Execute Content
                </>
              )}
            </Button>
          )}
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
            {lastExecutionResult || (approvedItem ? "Ready to Execute" : "Working Normally")}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Publishing pipeline active</p>
        </Card>

        <Card className="rounded-[20px] border-border/60 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Asset Storage
          </span>
          <div className="mt-2 text-xl font-serif font-bold text-foreground">Cloudflare R2</div>
          <p className="mt-1 text-xs text-emerald-700 font-medium flex items-center gap-1">
            <Cloud className="size-3" />
            Bucket &apos;cevonne&apos; synced
          </p>
        </Card>

        <Card className="rounded-[20px] border-border/60 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Database Store
          </span>
          <div className="mt-2 text-xl font-serif font-bold text-foreground">Supabase</div>
          <p className="mt-1 text-xs text-emerald-700 font-medium flex items-center gap-1">
            <Database className="size-3" />
            cevonne_publishing connected
          </p>
        </Card>

        <Card className="rounded-[20px] border-border/60 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Saved Content Items
          </span>
          <div className="mt-2 text-xl font-serif font-bold text-primary">
            {history.length} Records
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {approvedItem ? "1 approved awaiting execution" : "Ready for new executions"}
          </p>
        </Card>
      </div>

      {/* Immediate Execution Banner (if approved item exists) */}
      {approvedItem && (
        <Card className="rounded-[24px] border-border/60 bg-gradient-to-r from-neutral-50 via-white to-emerald-50/40 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold w-fit">
                <CheckCircle2 className="mr-1 size-3" />
                Approved by Admin – Ready for Live Execution
              </Badge>
              <h4 className="font-serif text-lg font-semibold text-primary pt-1">
                {approvedItem.content_concept || "Approved Lipstick Content"}
              </h4>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                Images are synced in Cloudflare R2 and metadata is saved in Supabase. Dispatch this item to trigger live publication via n8n.
              </p>
            </div>

            <Button
              onClick={() => handleExecute(approvedItem.research_item_id)}
              disabled={executing}
              className="rounded-full bg-primary px-6 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 shrink-0 self-start sm:self-auto"
            >
              {executing ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Send className="mr-1.5 size-3.5" />
                  Execute Content
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Loaded Generated and Saved Data Section */}
      <div className="space-y-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-semibold text-primary">
              Generated Content & Cloudflare R2 Vault
            </h3>
            <p className="text-xs text-muted-foreground">
              Live content, imagery, and captions generated by n8n, stored in Cloudflare R2, and recorded in Supabase.
            </p>
          </div>

          {/* Tab Filters */}
          <div className="flex items-center rounded-full border border-border/70 bg-white p-1 shadow-sm text-xs">
            <button
              onClick={() => setActiveTab("gallery")}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-medium transition-colors",
                activeTab === "gallery" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Saved Content ({history.length})
            </button>
            <button
              onClick={() => setActiveTab("ready")}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-medium transition-colors",
                activeTab === "ready" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Ready to Execute ({readyToExecuteItems.length})
            </button>
            <button
              onClick={() => setActiveTab("published")}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-medium transition-colors",
                activeTab === "published" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Published ({publishedItems.length})
            </button>
            <button
              onClick={() => setActiveTab("table")}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-medium transition-colors",
                activeTab === "table" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Audit Log
            </button>
          </div>
        </div>

        {/* Tab 1: Visual Content Cards (Gallery View) */}
        {activeTab !== "table" && (
          <div>
            {loading ? (
              <div className="grid gap-5 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i} className="rounded-[24px] border-border/60 bg-white p-6 shadow-sm">
                    <div className="h-44 w-full rounded-2xl bg-neutral-100 animate-pulse" />
                    <div className="mt-4 h-4 w-3/4 rounded bg-neutral-100 animate-pulse" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-neutral-100 animate-pulse" />
                  </Card>
                ))}
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredItems.map((item) => (
                  <Card
                    key={item.research_item_id}
                    className="overflow-hidden rounded-[24px] border-border/60 bg-white shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors"
                  >
                    <div>
                      {/* Image Preview */}
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100">
                        {item.image_urls &&
                        item.image_urls.length > 0 &&
                        !imageErrors[item.research_item_id] ? (
                          <Image
                            src={item.image_urls[0]}
                            alt={item.content_concept || "Generated content"}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={() =>
                              setImageErrors((prev) => ({
                                ...prev,
                                [item.research_item_id]: true,
                              }))
                            }
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-amber-950 p-6 text-center text-white">
                            <div className="rounded-full bg-white/10 p-3 backdrop-blur-sm mb-2">
                              <Sparkles className="size-6 text-amber-300" />
                            </div>
                            <p className="font-serif text-xs font-semibold tracking-wide text-white/95 line-clamp-1">
                              {item.content_concept || "Cevonne AI Visual Asset"}
                            </p>
                            <span className="text-[9px] text-white/70 uppercase tracking-widest mt-1">
                              Stored in Cloudflare R2
                            </span>
                          </div>
                        )}

                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <Badge className="bg-white/95 text-foreground text-[10px] font-semibold shadow-sm backdrop-blur-sm">
                            {item.generated_content_type || "Instagram Content"}
                          </Badge>
                          {item.image_count && item.image_count > 1 ? (
                            <Badge className="bg-black/60 text-white text-[10px] font-semibold shadow-sm backdrop-blur-sm">
                              <Layers className="mr-1 size-2.5" />
                              {item.image_count} Slides
                            </Badge>
                          ) : null}
                        </div>

                        <div className="absolute top-3 right-3">
                          <Badge
                            className={cn(
                              "text-[10px] font-semibold shadow-sm backdrop-blur-sm",
                              item.status === "approved" && "bg-emerald-600 text-white",
                              item.status === "published" && "bg-sky-600 text-white",
                              item.status === "rejected" && "bg-rose-600 text-white",
                              item.status === "ready_for_review" && "bg-amber-600 text-white"
                            )}
                          >
                            {item.display_status || item.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Content Concept & Caption */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-muted-foreground">
                            ID: {item.research_item_id}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDate(item.created_at)}
                          </span>
                        </div>

                        <h4 className="font-serif text-base font-semibold text-primary leading-snug">
                          {item.content_concept || "Saved Lipstick Content"}
                        </h4>

                        {item.generated_caption && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                              <span>Generated Caption</span>
                              <button
                                onClick={() => handleCopyCaption(item.research_item_id, item.generated_caption!)}
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                              >
                                {copiedId === item.research_item_id ? (
                                  <Check className="size-3 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                                {copiedId === item.research_item_id ? "Copied" : "Copy"}
                              </button>
                            </div>
                            <p className="line-clamp-3 text-xs leading-relaxed text-foreground/90 whitespace-pre-line bg-neutral-50/70 p-3 rounded-xl border border-border/50">
                              {item.generated_caption}
                            </p>
                          </div>
                        )}

                        {/* Cloudflare R2 Storage Indicator */}
                        <div className="flex items-center justify-between rounded-xl bg-neutral-50/50 p-2.5 text-[11px] text-muted-foreground border border-border/40">
                          <span className="flex items-center gap-1.5">
                            <HardDrive className="size-3 text-emerald-600" />
                            Storage: Cloudflare R2
                          </span>
                          <span className="font-mono text-[10px] text-foreground/80 truncate max-w-[180px]">
                            {typeof item.r2_image_path === "string" ? item.r2_image_path : "Stored securely"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="border-t border-border/50 bg-neutral-50/40 p-4 flex items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRecord(item)}
                        className="rounded-full text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="mr-1 size-3.5" />
                        Inspect Details
                      </Button>

                      {item.status === "approved" ? (
                        <Button
                          size="sm"
                          onClick={() => handleExecute(item.research_item_id)}
                          disabled={executing}
                          className="rounded-full bg-primary px-4 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
                        >
                          <Send className="mr-1.5 size-3" />
                          Execute Now
                        </Button>
                      ) : item.status === "published" ? (
                        <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-800 text-[11px] font-medium py-1 px-2.5">
                          <CheckCircle2 className="mr-1 size-3 text-sky-600" />
                          Published
                        </Badge>
                      ) : (
                        <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
                          <Link href="/dashboard/n8n-automations/workflow-2">
                            Review in WF2
                            <ArrowRight className="ml-1 size-3" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-[24px] border-dashed border-border/80 bg-white/70 p-10 text-center shadow-sm space-y-3">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-neutral-100 text-muted-foreground">
                  <FileCheck2 className="size-6" />
                </div>
                <h4 className="font-serif text-lg font-semibold text-foreground">
                  No Generated Content Saved Yet
                </h4>
                <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground">
                  Content approved in Workflow 2 will be uploaded to Cloudflare R2, recorded in Supabase table <code className="font-mono text-[11px]">cevonne_publishing</code>, and appear here for live publishing execution.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <Button asChild size="sm" className="rounded-full bg-primary px-5 text-xs font-semibold text-white">
                    <Link href="/dashboard/n8n-automations/workflow-1">Run Workflow 1</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
                    <Link href="/dashboard/n8n-automations/workflow-2">Check Review Queue</Link>
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Tab 2: Database Audit Table */}
        {activeTab === "table" && (
          <Card className="rounded-[24px] border-border/60 bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-neutral-50/70">
                <TableRow className="border-border/60">
                  <TableHead className="text-xs font-semibold text-muted-foreground">Date & Time</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Record ID</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Content Concept</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">R2 Storage</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-muted-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length > 0 ? (
                  history.map((record, index) => (
                    <TableRow key={record.research_item_id || index} className="border-border/40 hover:bg-neutral-50/60">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(record.created_at)}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-medium text-foreground whitespace-nowrap">
                        {record.research_item_id}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-foreground font-medium">
                        {record.content_concept || record.generated_caption || "Lipstick Content Item"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {record.image_count ? `${record.image_count} Images in R2` : "Synced in R2"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-semibold",
                            record.status === "ready_for_review" && "border-amber-300 bg-amber-50 text-amber-800",
                            record.status === "approved" && "border-emerald-300 bg-emerald-50 text-emerald-800",
                            record.status === "rejected" && "border-rose-300 bg-rose-50 text-rose-800",
                            (record.status === "publishing" || record.status === "published") &&
                              "border-sky-300 bg-sky-50 text-sky-800"
                          )}
                        >
                          {record.display_status || record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
                          className="size-8 rounded-full p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                      No publishing activity recorded in Supabase table <code className="font-mono">cevonne_publishing</code> yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Details Modal */}
      <Dialog open={Boolean(selectedRecord)} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl rounded-[28px] border-border/80 bg-white p-6 shadow-xl sm:p-7">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-fit text-[10px]">
                {selectedRecord?.generated_content_type || "Instagram Content"}
              </Badge>
              <span className="text-[11px] font-mono text-muted-foreground">
                {selectedRecord?.research_item_id}
              </span>
            </div>
            <DialogTitle className="font-serif text-2xl text-primary mt-1">
              {selectedRecord?.content_concept || "Saved Content Details"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Inspection of generated visuals stored in Cloudflare R2 and copy recorded in Supabase.
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 py-2 text-xs">
              <div>
                <span className="font-semibold text-muted-foreground block pb-1">Generated Caption</span>
                <div className="rounded-2xl border border-border/70 bg-neutral-50/70 p-4 leading-relaxed whitespace-pre-line max-h-44 overflow-y-auto">
                  {selectedRecord.generated_caption || "No caption available."}
                </div>
              </div>

              {extractHashtags(selectedRecord.generated_caption).length > 0 && (
                <div>
                  <span className="font-semibold text-muted-foreground block pb-1">Hashtags</span>
                  <div className="flex flex-wrap gap-1">
                    {extractHashtags(selectedRecord.generated_caption).map((tag, idx) => (
                      <span key={idx} className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecord.image_urls && selectedRecord.image_urls.length > 0 && (
                <div>
                  <span className="font-semibold text-muted-foreground block pb-1.5">Cloudflare R2 Stored Images</span>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedRecord.image_urls.map((url, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-neutral-100">
                        <Image src={url} alt="Stored content" fill sizes="200px" className="object-cover" unoptimized />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border/60 bg-neutral-50/50 p-3 text-[11px] text-muted-foreground space-y-1">
                <div className="flex items-center justify-between">
                  <span>Cloudflare R2 Path:</span>
                  <span className="font-mono text-foreground">{typeof selectedRecord.r2_image_path === "string" ? selectedRecord.r2_image_path : "Configured"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Supabase Table:</span>
                  <span className="font-mono text-foreground">cevonne_publishing</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Created At:</span>
                  <span>{formatDate(selectedRecord.created_at)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)} className="rounded-full text-xs">
              Close
            </Button>

            {selectedRecord?.status === "approved" && (
              <Button
                size="sm"
                onClick={() => {
                  const id = selectedRecord.research_item_id;
                  setSelectedRecord(null);
                  handleExecute(id);
                }}
                disabled={executing}
                className="rounded-full bg-primary px-4 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
              >
                <Send className="mr-1.5 size-3" />
                Execute This Content
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkflowDashboardShell>
  );
}
