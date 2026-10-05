"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  FileCheck2,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import WorkflowDashboardShell from "@/components/admin-dashboard/WorkflowDashboardShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
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

const extractHashtags = (caption?: string | null): string[] => {
  if (!caption) return [];
  const matches = caption.match(/#[a-zA-Z0-9_]+/g);
  return matches ? matches.slice(0, 8) : [];
};

export default function CevonneWorkflow2Page() {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingItems, setPendingItems] = useState<PublishingRecord[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [itemToReject, setItemToReject] = useState<PublishingRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PublishingRecord | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const fetchReviewItems = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await authFetch("/api/admin/n8n/cevonne/review");
      if (res.ok) {
        const data = await res.json();
        setPendingItems(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchReviewItems();
  }, [fetchReviewItems]);

  const handleApprove = async (researchItemId: string) => {
    setApprovingId(researchItemId);
    toast.loading("Approving content...", { id: "wf2-approve" });

    try {
      const res = await authFetch("/api/admin/n8n/cevonne/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ research_item_id: researchItemId, action: "approve" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Content approved successfully. Forwarded to Workflow 3.", { id: "wf2-approve" });
        await fetchReviewItems();
      } else {
        toast.error("Approval failed. Please try again.", { id: "wf2-approve" });
      }
    } catch {
      toast.error("Approval failed. Please try again.", { id: "wf2-approve" });
    } finally {
      setApprovingId(null);
    }
  };

  const confirmReject = async () => {
    if (!itemToReject) return;
    const researchItemId = itemToReject.research_item_id;
    setRejectingId(researchItemId);
    setItemToReject(null);
    toast.loading("Rejecting content...", { id: "wf2-reject" });

    try {
      const res = await authFetch("/api/admin/n8n/cevonne/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ research_item_id: researchItemId, action: "reject" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Content rejected.", { id: "wf2-reject" });
        await fetchReviewItems();
      } else {
        toast.error("Rejection failed.", { id: "wf2-reject" });
      }
    } catch {
      toast.error("Rejection failed.", { id: "wf2-reject" });
    } finally {
      setRejectingId(null);
    }
  };

  const handleCopyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    toast.success("Caption copied to clipboard");
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  return (
    <WorkflowDashboardShell
      eyebrow="CEVONNE WORKFLOW 2"
      title="AI Content Generation"
      description="Takes selected research content and converts it into original Cevonne-style content using AI. Generates creative images, captions, concepts, and supports both single-image and carousel content."
      badges={
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-semibold px-3 py-1",
              pendingItems.length > 0 ? "border-amber-300 bg-amber-50 text-amber-800" : "border-emerald-300 bg-emerald-50 text-emerald-800"
            )}
          >
            <span className="mr-1.5 size-2 rounded-full bg-current animate-pulse" />
            {pendingItems.length > 0 ? `${pendingItems.length} Waiting for Review` : "Working normally"}
          </Badge>
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="h-9 rounded-full border-border/70 bg-white px-3.5 text-xs font-medium shadow-sm">
            <Link href="/dashboard/n8n-automations">
              <ArrowLeft className="mr-1.5 size-3.5" />
              Back to Overview
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchReviewItems}
            disabled={refreshing}
            className="rounded-full border-border/80 bg-white/90 text-xs font-medium text-foreground hover:bg-neutral-50 shadow-sm"
          >
            <RefreshCw className={`mr-1.5 size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
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
            {pendingItems.length > 0 ? "Waiting for Approval" : "Working Normally"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">AI creative engine ready</p>
        </Card>

        <Card className="rounded-[20px] border-border/60 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Creative Formats
          </span>
          <div className="mt-2 text-xl font-serif font-bold text-foreground">Single & Carousel</div>
          <p className="mt-1 text-xs text-muted-foreground">High-resolution Cevonne visuals</p>
        </Card>

        <Card className="rounded-[20px] border-border/60 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Pending Items
          </span>
          <div className="mt-2 text-xl font-serif font-bold text-foreground">{pendingItems.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Awaiting human sign-off</p>
        </Card>

        <Card className="rounded-[20px] border-border/60 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
            Action Needed
          </span>
          <div className="mt-2 text-xl font-serif font-bold text-primary">
            {pendingItems.length > 0 ? "Review Content" : "No action needed"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {pendingItems.length > 0 ? "Approve or reject items" : "All batches reviewed"}
          </p>
        </Card>
      </div>

      {/* Review Queue Cards */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-semibold text-primary">Generated Content Review</h3>
            <p className="text-xs text-muted-foreground">
              Review captions, concepts, and images. Human approval is required before execution in Workflow 3.
            </p>
          </div>
        </div>

        {loading ? (
          <Card className="rounded-[24px] border-border/60 bg-white p-6 shadow-sm">
            <Skeleton className="h-6 w-1/3 rounded-full" />
            <Skeleton className="mt-4 h-36 w-full rounded-2xl" />
          </Card>
        ) : pendingItems.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {pendingItems.map((item) => (
              <Card
                key={item.research_item_id}
                className="overflow-hidden rounded-[24px] border-border/60 bg-white shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100">
                    {item.image_urls &&
                    item.image_urls.length > 0 &&
                    !imageErrors[item.research_item_id] ? (
                      <Image
                        src={item.image_urls[0]}
                        alt="Generated preview"
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
                          Cevonne Studio Render
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/95 text-foreground text-[10px] font-semibold shadow-sm backdrop-blur-sm">
                        {item.generated_content_type || "Instagram Content"}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h4 className="font-serif text-base font-semibold text-primary">
                      {item.content_concept || "Lipstick Content Concept"}
                    </h4>

                    {item.generated_caption && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                          <span>Caption</span>
                          <button
                            onClick={() => handleCopyCaption(item.generated_caption!)}
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            {copiedCaption ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                            {copiedCaption ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <p className="line-clamp-3 text-xs leading-relaxed text-foreground/90 whitespace-pre-line bg-neutral-50/70 p-3 rounded-xl border border-border/50">
                          {item.generated_caption}
                        </p>
                      </div>
                    )}

                    {extractHashtags(item.generated_caption).length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {extractHashtags(item.generated_caption).slice(0, 4).map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-border/50 bg-neutral-50/40 p-4 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRecord(item)}
                    className="rounded-full text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="mr-1 size-3.5" />
                    Details
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setItemToReject(item)}
                      disabled={rejectingId === item.research_item_id || approvingId === item.research_item_id}
                      className="rounded-full border-rose-200 bg-white text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      <ThumbsDown className="mr-1.5 size-3" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(item.research_item_id)}
                      disabled={approvingId === item.research_item_id || rejectingId === item.research_item_id}
                      className="rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                    >
                      {approvingId === item.research_item_id ? (
                        <>
                          <Loader2 className="mr-1.5 size-3 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <ThumbsUp className="mr-1.5 size-3" />
                          Approve
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-[24px] border-dashed border-border/80 bg-white/70 p-8 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-neutral-100 text-muted-foreground">
              <FileCheck2 className="size-6" />
            </div>
            <h4 className="mt-4 font-serif text-lg font-semibold text-foreground">Nothing waiting for review</h4>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
              There is currently no generated content requiring approval. Run Workflow 1 to research trends and generate new concepts.
            </p>
            <div className="mt-4">
              <Button asChild size="sm" className="rounded-full bg-primary px-5 text-xs font-semibold text-white">
                <Link href="/dashboard/n8n-automations/workflow-1">Go to Workflow 1</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Reject Confirmation Modal */}
      <AlertDialog open={Boolean(itemToReject)} onOpenChange={(open) => !open && setItemToReject(null)}>
        <AlertDialogContent className="rounded-[24px] border-border/80 bg-white p-6 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl text-primary">Reject this content?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground">
              This content will not be executed. You can re-run Workflow 1 later to generate fresh alternative concepts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex items-center gap-2 pt-2">
            <AlertDialogCancel className="rounded-full text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              className="rounded-full bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Reject Content
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Modal */}
      <Dialog open={Boolean(selectedRecord)} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl rounded-[28px] border-border/80 bg-white p-6 shadow-xl sm:p-7">
          <DialogHeader>
            <Badge variant="outline" className="w-fit text-[10px]">
              {selectedRecord?.generated_content_type || "Instagram Content"}
            </Badge>
            <DialogTitle className="font-serif text-2xl text-primary mt-1">
              {selectedRecord?.content_concept || "Content Details"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Detailed inspection of research concepts, imagery, and marketing copy.
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

              {selectedRecord.image_urls && selectedRecord.image_urls.length > 0 && (
                <div>
                  <span className="font-semibold text-muted-foreground block pb-1.5">Images</span>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedRecord.image_urls.map((url, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-neutral-100">
                        <Image src={url} alt="Generated content" fill sizes="200px" className="object-cover" unoptimized />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)} className="rounded-full text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkflowDashboardShell>
  );
}
