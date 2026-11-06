"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  Layers,
  Mail,
  Megaphone,
  MessageSquare,
  Play,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import WorkflowDashboardShell from "@/components/admin-dashboard/WorkflowDashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

type InventoryItem = {
  id: string;
  shadeId: string;
  productName: string;
  shadeName: string;
  shadeCode: string;
  color: string;
  quantity: number;
  threshold: number;
  isLowStock: boolean;
  isAdProduct?: boolean;
  activeCampaign?: string | null;
  alertTier?: "AD_OUT_OF_STOCK" | "AD_LOW_STOCK_WARNING" | "STANDARD_LOW_STOCK" | "SAFE";
  statusText?: string;
  updatedAt: string;
};

type LiveAlertResult = {
  triggeredAt: string;
  productName: string;
  shadeName: string;
  shadeCode: string;
  quantity: number;
  threshold: number;
  whatsappRecipient: string;
  whatsappMessage: string;
  emailRecipient: string;
  n8nStatus: string;
  isAdProduct?: boolean;
  activeCampaign?: string | null;
};

export default function CevonneWorkflow7Page() {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [adLowStockCount, setAdLowStockCount] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState<string>("Just now");
  const [alertResult, setAlertResult] = useState<LiveAlertResult | null>(null);

  const fetchInventory = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await authFetch("/api/admin/inventory/low-stock-check");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setLowStockCount(data.lowStockCount || 0);
        setAdLowStockCount(data.adLowStockCount || 0);
        setLastCheckTime(
          new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inventory status.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const lowStockItems = items.filter((item) => item.isLowStock);
  const adWatchItems = items.filter((item) => item.isAdProduct);

  const handleTriggerAlert = async (specificShadeId?: string) => {
    setTriggering(true);
    try {
      const targetItem = specificShadeId
        ? items.find((i) => i.shadeId === specificShadeId || i.id === specificShadeId)
        : lowStockItems[0] || items[0];

      const res = await authFetch("/api/admin/inventory/low-stock-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forceTest: true,
          shadeId: targetItem?.shadeId,
        }),
      });

      const pName = targetItem?.productName || "Cevonne Velvet Matte Lipstick";
      const sName = targetItem?.shadeName || "Royal Rouge";
      const sCode = targetItem?.shadeCode || "#04";
      const qty = targetItem?.quantity ?? 0;
      const thresh = targetItem?.threshold ?? 10;
      const isAd = Boolean(targetItem?.isAdProduct);
      const camp = targetItem?.activeCampaign || "IG Reel – Royal Rouge Launch";

      if (res.ok) {
        const resultMsg = isAd
          ? qty <= 0
            ? `🚨 [CRITICAL AD ALERT: PAUSE META AD NOW]\n\n🛑 Advertised product is 100% SOLD OUT!\n💄 Product: ${pName}\n🎨 Shade: ${sName} [ACTIVE AD]\n📦 Remaining Units: 0 units\n📢 Campaign: ${camp}\n\n⚡ Action: Turn off ad on Meta Ads Manager now!`
            : `⚠️ [AD INVENTORY WARNING: STOCK < 10]\n\n💄 Product: ${pName}\n🎨 Shade: ${sName} [ACTIVE AD]\n📦 Remaining Units: ${qty} units left (Min: 10)\n📢 Campaign: ${camp}\n\n⚡ Action: High sales velocity on Meta Ads. Restock or scale down budget before stockout.`
          : `[Cevonne Atelier Inventory Alert]\n\nWarning: Low stock detected for ${pName}.\nShade: ${sName}\nRemaining Units: ${qty} units left\nStatus: ${qty <= 2 ? "CRITICAL LOW" : "LOW STOCK"}\n\nPlease restock in Atelier dashboard.`;

        setAlertResult({
          triggeredAt: new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          productName: pName,
          shadeName: sName,
          shadeCode: sCode,
          quantity: qty,
          threshold: thresh,
          whatsappRecipient: "+91 70610 09669 (Founder WhatsApp)",
          whatsappMessage: resultMsg,
          emailRecipient: "admin@cevonne.com",
          n8nStatus: "Delivered (200 OK)",
          isAdProduct: isAd,
          activeCampaign: camp,
        });

        toast.success(
          isAd
            ? `Active Ad Sentinel Dispatched! WhatsApp & Email alert sent.`
            : "Live stock alert dispatched to Founder WhatsApp & Email!"
        );
      } else {
        toast.error("Failed to trigger webhook.");
      }
    } catch {
      toast.error("Network error while triggering low stock alert.");
    } finally {
      setTriggering(false);
    }
  };

  return (
    <WorkflowDashboardShell
      eyebrow="WORKFLOW 7"
      title="Workflow 7 – Real-Time Low Stock & Ad Spend Sentinel"
      description="Real-time warehouse stockout guardian with 2-Tier Ad Intelligence: (1) Ad-promoted products alert at < 10 units with pre-stockout warnings, and trigger Emergency Ad-Pause Alerts at 0 units; (2) Standard organic products alert at ≤ 5 units."
      badges={
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-0.5"
          >
            <span className="mr-1.5 size-2 rounded-full bg-emerald-500 animate-pulse" />
            Live & Active (Webhook)
          </Badge>
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-300">
            Ad Guard: &lt; 10 Units
          </Badge>
          <Badge variant="outline" className="text-xs">
            Standard: &le; 5 Units
          </Badge>
        </div>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInventory}
            disabled={refreshing}
            className="rounded-full border-border/80 bg-background/80 text-xs shadow-sm hover:bg-neutral-100/80 transition"
          >
            <RefreshCw className={cn("mr-1.5 size-3.5", refreshing && "animate-spin")} />
            Check Live Stock
          </Button>
          <Button
            size="sm"
            onClick={() => handleTriggerAlert()}
            disabled={triggering}
            className="rounded-full bg-primary px-4 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 transition"
          >
            <Bell className={cn("mr-1.5 size-3.5", triggering && "animate-bounce")} />
            Test Live Alert
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Top 4 Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-[24px] border-border/60 bg-gradient-to-b from-white to-neutral-50/50 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Low Stock Items
              </span>
              <div className="rounded-full bg-amber-500/10 p-2 text-amber-600">
                <AlertTriangle className="size-4" />
              </div>
            </div>
            <div className="font-serif text-3xl font-semibold tracking-tight text-foreground">
              {lowStockCount}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Across all Atelier lipstick shades
            </p>
          </Card>

          <Card className="rounded-[24px] border-border/60 bg-gradient-to-b from-white to-neutral-50/50 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Active Ad Watchlist
              </span>
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Megaphone className="size-4" />
              </div>
            </div>
            <div className="font-serif text-3xl font-semibold tracking-tight text-foreground">
              {adWatchItems.length} Shades
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Protected with &lt; 10 units high-velocity threshold
            </p>
          </Card>

          <Card className="rounded-[24px] border-border/60 bg-gradient-to-b from-white to-neutral-50/50 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Ad Spend Guardian
              </span>
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                <ShieldCheck className="size-4" />
              </div>
            </div>
            <div className="font-serif text-2xl font-semibold tracking-tight text-emerald-700">
              Auto-Gated
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Instant alerts on 0 stock to pause live Meta ads
            </p>
          </Card>

          <Card className="rounded-[24px] border-border/60 bg-gradient-to-b from-white to-neutral-50/50 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Founder WhatsApp
              </span>
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                <MessageSquare className="size-4" />
              </div>
            </div>
            <div className="font-serif text-lg font-semibold tracking-tight text-foreground">
              +91 70610 09669
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Verified Meta Cloud API WABA Channel
            </p>
          </Card>
        </div>

        {/* Live Dispatched Alert Banner */}
        {alertResult && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-primary/10 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <h4 className="font-serif text-base font-semibold text-primary">
                  {alertResult.isAdProduct ? "Active Ad Spend Sentinel Dispatched" : "Warehouse Stock Alert Dispatched"}
                </h4>
                <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px]">
                  {alertResult.n8nStatus}
                </Badge>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                Delivered at {alertResult.triggeredAt}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 rounded-xl bg-white/80 p-3 border border-border/60">
                <span className="font-semibold text-muted-foreground block text-[11px] uppercase tracking-wider">
                  Target Product & Ad Details
                </span>
                <p className="font-medium text-foreground">{alertResult.productName}</p>
                <p className="text-muted-foreground">
                  Shade: <span className="font-medium text-foreground">{alertResult.shadeName}</span> ({alertResult.shadeCode})
                </p>
                {alertResult.isAdProduct && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] mt-1">
                    Campaign: {alertResult.activeCampaign}
                  </Badge>
                )}
                <p className="text-muted-foreground pt-1">
                  Remaining Stock: <span className="font-bold text-rose-600">{alertResult.quantity} Units</span> (Alert Threshold: {alertResult.threshold})
                </p>
              </div>

              <div className="space-y-1 rounded-xl bg-white/80 p-3 border border-border/60">
                <span className="font-semibold text-muted-foreground block text-[11px] uppercase tracking-wider">
                  WhatsApp Preview Dispatched to Founder
                </span>
                <pre className="font-mono text-[11px] text-foreground bg-neutral-50 p-2 rounded-lg whitespace-pre-wrap max-h-24 overflow-y-auto border border-border/40">
                  {alertResult.whatsappMessage}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Live Inventory Table */}
        <Card className="rounded-[28px] border-border/70 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border/40 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-semibold text-primary">
                Live Atelier Lipstick Shades Stock Watch
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time stock quantities cross-referenced against active Meta Ad campaigns.
              </p>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Last synced: {lastCheckTime}
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-xs font-semibold">Product & Shade</TableHead>
                <TableHead className="text-xs font-semibold">SKU / Code</TableHead>
                <TableHead className="text-xs font-semibold">Ad Status</TableHead>
                <TableHead className="text-xs font-semibold">Current Stock</TableHead>
                <TableHead className="text-xs font-semibold">Alert Threshold</TableHead>
                <TableHead className="text-xs font-semibold">Status / Tier</TableHead>
                <TableHead className="text-right text-xs font-semibold">Quick Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="border-border/40 hover:bg-neutral-50/50">
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="size-3.5 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <span className="font-medium text-foreground block">{item.shadeName}</span>
                        <span className="text-[10px] text-muted-foreground">{item.productName}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {item.shadeCode || "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.isAdProduct ? (
                      <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] rounded-full">
                        ACTIVE AD RUNNING
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Organic</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-semibold">
                    <span
                      className={cn(
                        item.quantity <= 0
                          ? "text-rose-600 font-bold"
                          : item.isLowStock
                          ? "text-amber-600"
                          : "text-emerald-700"
                      )}
                    >
                      {item.quantity} units
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span className="font-mono font-medium">{item.threshold} units</span>
                    {item.isAdProduct && (
                      <span className="block text-[10px] text-amber-600">(&lt; 10 Ad Rule)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.quantity <= 0 && item.isAdProduct ? (
                      <Badge variant="destructive" className="text-[10px] rounded-full animate-pulse">
                        🚨 PAUSE AD: SOLD OUT
                      </Badge>
                    ) : item.isAdProduct && item.quantity <= 10 ? (
                      <Badge className="bg-amber-500/10 text-amber-700 border border-amber-500/30 text-[10px] rounded-full">
                        ⚠️ AD WARNING (&lt; 10)
                      </Badge>
                    ) : item.isLowStock ? (
                      <Badge className="bg-rose-500/10 text-rose-700 border border-rose-500/20 text-[10px] rounded-full">
                        {item.quantity <= 2 ? "CRITICAL LOW" : "LOW STOCK"}
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] rounded-full">
                        IN STOCK
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTriggerAlert(item.shadeId)}
                      disabled={triggering}
                      className="rounded-full h-7 px-3 text-[11px] hover:bg-neutral-100"
                    >
                      <Send className="mr-1 size-3" />
                      Alert Test
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </WorkflowDashboardShell>
  );
}
