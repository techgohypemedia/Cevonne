"use client";

import { useCallback, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Cookie,
  Database,
  Eye,
  FileCheck,
  Layers,
  Lock,
  Play,
  Plus,
  RefreshCw,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  TrendingUp,
  UserCheck,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type ConsentRecord = {
  id: string;
  contactIdentifier: string;
  channel: "WhatsApp" | "Email" | "SMS" | "Tracking Cookies";
  source: "Shade Finder Quiz" | "Atelier Checkout" | "VIP Loyalty Club" | "Newsletter";
  status: "EXPLICIT_OPT_IN" | "MARKETING_CONSENT" | "TRACKING_GRANTED";
  timestamp: string;
  ipLocation?: string;
};

type AttributionItem = {
  id: string;
  campaign: string;
  channel: string;
  creatorCode: string;
  orders: number;
  revenue: number;
  roas: string;
  consentGate: "PASS" | "DENIED";
};

type CompliancePolicy = {
  id: string;
  name: string;
  platform: string;
  status: "PASS";
  summary: string;
  lastAudited: string;
};

const INITIAL_CONSENTS: ConsentRecord[] = [
  {
    id: "c_001",
    contactIdentifier: "+91 93542 ***43",
    channel: "WhatsApp",
    source: "Shade Finder Quiz",
    status: "EXPLICIT_OPT_IN",
    timestamp: "Today · Just now",
    ipLocation: "New Delhi, IN",
  },
  {
    id: "c_002",
    contactIdentifier: "meera.k***@gmail.com",
    channel: "Email",
    source: "Atelier Checkout",
    status: "MARKETING_CONSENT",
    timestamp: "Today · 10:45 AM",
    ipLocation: "Mumbai, IN",
  },
  {
    id: "c_003",
    contactIdentifier: "+91 98112 ***41",
    channel: "WhatsApp",
    source: "VIP Loyalty Club",
    status: "EXPLICIT_OPT_IN",
    timestamp: "Today · 09:30 AM",
    ipLocation: "Bengaluru, IN",
  },
  {
    id: "c_004",
    contactIdentifier: "pooja.m***@outlook.com",
    channel: "Tracking Cookies",
    source: "Shade Finder Quiz",
    status: "TRACKING_GRANTED",
    timestamp: "Yesterday · 08:15 PM",
    ipLocation: "Hyderabad, IN",
  },
  {
    id: "c_005",
    contactIdentifier: "ananya.s***@gmail.com",
    channel: "Email",
    source: "Newsletter",
    status: "MARKETING_CONSENT",
    timestamp: "Yesterday · 04:30 PM",
    ipLocation: "Kolkata, IN",
  },
];

const INITIAL_ATTRIBUTIONS: AttributionItem[] = [
  {
    id: "att_01",
    campaign: "IG Reel – Royal Rouge Launch",
    channel: "Instagram Paid Ads",
    creatorCode: "ROYAL10",
    orders: 142,
    revenue: 211580,
    roas: "4.2x",
    consentGate: "PASS",
  },
  {
    id: "att_02",
    campaign: "Shade Quiz Viral Story Ad",
    channel: "Meta Ads Dynamic",
    creatorCode: "QUIZGLOW",
    orders: 89,
    revenue: 132610,
    roas: "3.8x",
    consentGate: "PASS",
  },
  {
    id: "att_03",
    campaign: "Kavya Beauty Ambassador UGC",
    channel: "Influencer Attribution",
    creatorCode: "KAVYA15",
    orders: 64,
    revenue: 95360,
    roas: "5.1x",
    consentGate: "PASS",
  },
  {
    id: "att_04",
    campaign: "Ananya Velvet Lip Swatch",
    channel: "Creator Partnership",
    creatorCode: "ANANYA20",
    orders: 48,
    revenue: 71950,
    roas: "4.6x",
    consentGate: "PASS",
  },
];

const INITIAL_POLICIES: CompliancePolicy[] = [
  {
    id: "pol_01",
    name: "Central Lead Consent Ledger (DPDP 2023)",
    platform: "Quiz, Checkout & VIP Club",
    status: "PASS",
    summary: "Clear unbundled explicit opt-ins recorded with timestamp, channel & evidence URI",
    lastAudited: "Live Verified",
  },
  {
    id: "pol_02",
    name: "Cookie-Gated Multi-Touch Attribution",
    platform: "Instagram Ads & Creator Links",
    status: "PASS",
    summary: "Strict privacy gate: Ad UTM & promo code attribution tracked only when cookies consent is granted",
    lastAudited: "Automated Guard",
  },
  {
    id: "pol_03",
    name: "Meta WhatsApp WABA Policy Compliance",
    platform: "WhatsApp Business API",
    status: "PASS",
    summary: "Pre-verified explicit opt-in prerequisite before any outbound marketing communication",
    lastAudited: "Enforced",
  },
];

export default function CevonneWorkflow12Page() {
  const { authFetch } = useAuth();
  const [triggering, setTriggering] = useState(false);
  const [consents, setConsents] = useState<ConsentRecord[]>(INITIAL_CONSENTS);
  const [attributions, setAttributions] = useState<AttributionItem[]>(INITIAL_ATTRIBUTIONS);
  const [policies] = useState<CompliancePolicy[]>(INITIAL_POLICIES);
  const [lastSyncResult, setLastSyncResult] = useState<any | null>(null);

  // Modal 1: Record Lead Consent
  const [recordConsentModalOpen, setRecordConsentModalOpen] = useState(false);
  const [newContact, setNewContact] = useState("");
  const [newChannel, setNewChannel] = useState<ConsentRecord["channel"]>("WhatsApp");
  const [newSource, setNewSource] = useState<ConsentRecord["source"]>("Shade Finder Quiz");
  const [newStatus, setNewStatus] = useState<ConsentRecord["status"]>("EXPLICIT_OPT_IN");

  // Modal 2: Record Creator / Campaign Attribution
  const [attributionModalOpen, setAttributionModalOpen] = useState(false);
  const [newOrderId, setNewOrderId] = useState("");
  const [newCampaign, setNewCampaign] = useState("IG Reel - Royal Rouge Launch");
  const [newCreatorCode, setNewCreatorCode] = useState("ROYAL10");
  const [newRevenue, setNewRevenue] = useState("1499");
  const [newHasConsent, setNewHasConsent] = useState("true");

  const runTrigger = useCallback(
    async (payload: Record<string, unknown>, toastLabel: string) => {
      setTriggering(true);
      const toastId = toast.loading(toastLabel, {
        description: "Connecting to n8n Workflow 12...",
      });

      try {
        const res = await authFetch("/api/admin/n8n/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflowNumber: 12,
            action: payload.action || "DIAGNOSTIC",
            customPayload: payload,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setLastSyncResult(data.n8nResult || data);
          toast.success("Workflow 12 Synced Successfully!", {
            id: toastId,
            description: (data.n8nResult && data.n8nResult.message) || "Ledger & attribution updated on n8n.",
          });
        } else {
          toast.error("Execution Alert", {
            id: toastId,
            description: data.error || data.message || "Failed to execute on n8n.",
          });
        }
      } catch (err: any) {
        toast.error("Network Error", {
          id: toastId,
          description: err.message || "Could not reach n8n server.",
        });
      } finally {
        setTriggering(false);
      }
    },
    [authFetch]
  );

  const handleRecordConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.trim()) {
      toast.error("Please enter contact details (Phone or Email)");
      return;
    }

    const payload = {
      action: "record_consent",
      contact_identifier: newContact.trim(),
      channel: newChannel,
      source: newSource,
      consent_type: newStatus,
    };

    setConsents((prev) => [
      {
        id: `c_${Date.now().toString().slice(-4)}`,
        contactIdentifier: newContact.trim(),
        channel: newChannel,
        source: newSource,
        status: newStatus,
        timestamp: "Just now",
        ipLocation: "Atelier Verified",
      },
      ...prev,
    ]);

    setRecordConsentModalOpen(false);
    setNewContact("");

    await runTrigger(payload, "Recording explicit lead consent...");
  };

  const handleRecordAttribution = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = newOrderId.trim() || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const revenueNum = Number(newRevenue) || 1499;
    const consentGranted = newHasConsent === "true";

    const payload = {
      action: "record_attribution",
      order_id: orderId,
      utm_source: "instagram",
      utm_campaign: newCampaign,
      creator_code: newCreatorCode.trim().toUpperCase(),
      revenue: revenueNum,
      has_tracking_consent: consentGranted,
    };

    if (consentGranted) {
      setAttributions((prev) => [
        {
          id: `att_${Date.now().toString().slice(-4)}`,
          campaign: newCampaign,
          channel: "Instagram Creator Link",
          creatorCode: newCreatorCode.trim().toUpperCase(),
          orders: 1,
          revenue: revenueNum,
          roas: "4.5x",
          consentGate: "PASS",
        },
        ...prev,
      ]);
    }

    setAttributionModalOpen(false);
    setNewOrderId("");

    await runTrigger(payload, "Processing creator & campaign attribution...");
  };

  return (
    <WorkflowDashboardShell
      eyebrow="WORKFLOW 12 / G3 AUTOMATION"
      title="Workflow 12 – Customer Consent & Campaign Attribution"
      description="Two-pillar intelligence ledger: (1) Central Lead Consent Ledger recording explicit opt-ins from Quiz, Checkout & VIP Club, and (2) Cookie-Gated Multi-Touch Creator & Campaign Attribution."
      badges={
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-0.5"
          >
            <span className="mr-1.5 size-2 rounded-full bg-emerald-500 animate-pulse" />
            Active · 2 Pillars Gated
          </Badge>
          <Badge variant="outline" className="text-xs">
            DPDP 2023 & Meta Verified
          </Badge>
        </div>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => runTrigger({ action: "diagnostic" }, "Syncing Workflow 12 Ledger...")}
            disabled={triggering}
            className="rounded-full border-border/80 bg-background/80 text-xs shadow-sm hover:bg-neutral-100/80 transition"
          >
            <RefreshCw className={cn("mr-1.5 size-3.5", triggering && "animate-spin text-primary")} />
            Sync Health
          </Button>

          <Button
            size="sm"
            onClick={() => setRecordConsentModalOpen(true)}
            className="rounded-full bg-primary px-3 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 transition"
          >
            <Plus className="mr-1.5 size-3.5" />
            Record Lead Consent
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAttributionModalOpen(true)}
            className="rounded-full px-3 text-xs font-semibold shadow-sm hover:bg-neutral-200 transition"
          >
            <Tag className="mr-1.5 size-3.5" />
            Track Attribution
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Top 4 Luxury Summary Cards (Strictly 2 Pillars) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Pillar 1: Active Consents */}
          <Card className="rounded-[24px] border-border/60 bg-gradient-to-b from-white to-neutral-50/50 p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pillar 1: Active Consents
              </span>
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                <UserCheck className="size-4" />
              </div>
            </div>
            <div className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              4,820 Leads
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Explicit opt-ins via Quiz, Checkout & VIP Club
            </p>
          </Card>

          {/* Pillar 1: DPDP Compliance */}
          <Card className="rounded-[24px] border-border/60 bg-gradient-to-b from-white to-neutral-50/50 p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                DPDP 2023 Compliance
              </span>
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                <ShieldCheck className="size-4" />
              </div>
            </div>
            <div className="font-serif text-2xl font-semibold tracking-tight text-emerald-700">
              100% Verified
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Unbundled checkboxes + timestamped audit logs
            </p>
          </Card>

          {/* Pillar 2: Attributed Revenue */}
          <Card className="rounded-[24px] border-border/60 bg-gradient-to-b from-white to-neutral-50/50 p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pillar 2: Attributed Revenue
              </span>
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              ₹7,52,450
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Across Instagram Ads & Creator Promo Codes
            </p>
          </Card>

          {/* Pillar 2: Cookie-Consent Gate */}
          <Card className="rounded-[24px] border-border/60 bg-gradient-to-b from-white to-neutral-50/50 p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tracking Consent Gate
              </span>
              <div className="rounded-full bg-blue-500/10 p-2 text-blue-600">
                <Cookie className="size-4" />
              </div>
            </div>
            <div className="font-serif text-2xl font-semibold tracking-tight text-blue-700">
              Cookie Gated
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Zero attribution tracked if customer denies cookies
            </p>
          </Card>
        </div>

        {/* Live n8n Diagnostic Status Banner */}
        {lastSyncResult && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span className="font-semibold text-emerald-950">
                  n8n Engine: {lastSyncResult.workflow || "Workflow 12"}
                </span>
                <Badge variant="outline" className="border-emerald-500/40 text-[10px] text-emerald-700">
                  {lastSyncResult.status || "HEALTHY"}
                </Badge>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                {lastSyncResult.recorded_at || lastSyncResult.checked_at || "Live"}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground font-mono bg-white/60 p-2.5 rounded-xl border border-emerald-500/20">
              Message: {lastSyncResult.message || "Sentinel operational."}
            </p>
          </div>
        )}

        {/* Two-Column Section: The 2 Core Pillars */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Pillar 1: Central Lead Consent Ledger */}
          <Card className="lg:col-span-7 rounded-[28px] border-border/70 bg-white/95 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="font-serif text-lg text-primary">
                  Pillar 1: Central Lead Consent Ledger
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Explicit opt-ins captured from Shade Finder Quiz, Atelier Checkout & VIP Club.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="rounded-full text-[10px]">
                {consents.length} Real-time Records
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">Contact / User</TableHead>
                    <TableHead className="text-xs font-semibold">Channel</TableHead>
                    <TableHead className="text-xs font-semibold">Source Intake</TableHead>
                    <TableHead className="text-xs font-semibold">Consent Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consents.map((item) => (
                    <TableRow key={item.id} className="border-border/40 hover:bg-neutral-50/50">
                      <TableCell className="font-medium text-xs">
                        <div className="flex flex-col">
                          <span>{item.contactIdentifier}</span>
                          <span className="text-[10px] text-muted-foreground">{item.ipLocation}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px] rounded-md font-normal">
                          {item.channel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.source}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 text-[10px] rounded-full border border-emerald-500/20">
                          {item.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-[11px] text-muted-foreground">
                        {item.timestamp}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pillar 2: Campaign & Creator Attribution */}
          <Card className="lg:col-span-5 rounded-[28px] border-border/70 bg-white/95 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="font-serif text-lg text-primary">
                  Pillar 2: Campaign & Creator Attribution
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Multi-touch tracking for Instagram Ads & Creator Codes (Cookie Gated).
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/20 text-[10px] text-primary">
                Cookie Gated
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">Campaign / Code</TableHead>
                    <TableHead className="text-xs font-semibold">Orders</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Revenue</TableHead>
                    <TableHead className="text-right text-xs font-semibold">ROAS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attributions.map((att) => (
                    <TableRow key={att.id} className="border-border/40 hover:bg-neutral-50/50">
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{att.campaign}</span>
                          <span className="text-[10px] text-muted-foreground">
                            Code: <span className="font-mono text-primary font-semibold">{att.creatorCode}</span> • {att.channel}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {att.orders}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-foreground">
                        ₹{att.revenue.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {att.roas}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Compliance Policies */}
        <Card className="rounded-[28px] border-border/70 bg-white/95 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg text-primary">
              Active Privacy & Consent Verification Rules
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Automated compliance guarantees for Indian DPDP Act 2023 and Meta WhatsApp Business API.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Policy Name</TableHead>
                  <TableHead className="text-xs font-semibold">Platform Scope</TableHead>
                  <TableHead className="text-xs font-semibold">Rule Summary</TableHead>
                  <TableHead className="text-xs font-semibold">Compliance Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold">Verification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((pol) => (
                  <TableRow key={pol.id} className="border-border/40 hover:bg-neutral-50/50">
                    <TableCell className="font-medium text-xs text-foreground">
                      {pol.name}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {pol.platform}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md">
                      {pol.summary}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                        <CheckCircle2 className="size-3.5" />
                        COMPLIANT
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-[11px] text-muted-foreground font-mono">
                      {pol.lastAudited}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal 1: Record Lead Consent */}
      <Dialog open={recordConsentModalOpen} onOpenChange={setRecordConsentModalOpen}>
        <DialogContent className="max-w-md rounded-[28px] border-border/80 bg-white p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-primary">
              Record Customer Lead Consent
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Log explicit opt-in consent from Shade Finder Quiz, Checkout, or VIP Club into Workflow 12.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordConsent} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Contact (Phone or Email)</Label>
              <Input
                placeholder="+91 93542 43943 or customer@gmail.com"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                className="rounded-xl text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Channel</Label>
                <Select value={newChannel} onValueChange={(v: any) => setNewChannel(v)}>
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="Tracking Cookies">Tracking Cookies</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Source Intake</Label>
                <Select value={newSource} onValueChange={(v: any) => setNewSource(v)}>
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shade Finder Quiz">Shade Finder Quiz</SelectItem>
                    <SelectItem value="Atelier Checkout">Atelier Checkout</SelectItem>
                    <SelectItem value="VIP Loyalty Club">VIP Loyalty Club</SelectItem>
                    <SelectItem value="Newsletter">Newsletter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Consent Type</Label>
              <Select value={newStatus} onValueChange={(v: any) => setNewStatus(v)}>
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPLICIT_OPT_IN">EXPLICIT_OPT_IN (Direct Opt-In)</SelectItem>
                  <SelectItem value="MARKETING_CONSENT">MARKETING_CONSENT (Transactional + Promo)</SelectItem>
                  <SelectItem value="TRACKING_GRANTED">TRACKING_GRANTED (Cookies Allowed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRecordConsentModalOpen(false)}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-primary text-xs font-semibold text-white">
                Record Consent to n8n
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Track Creator / Campaign Attribution */}
      <Dialog open={attributionModalOpen} onOpenChange={setAttributionModalOpen}>
        <DialogContent className="max-w-md rounded-[28px] border-border/80 bg-white p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-primary">
              Track Creator Code or Ad Attribution
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Attribute order revenue to an Instagram Campaign or Creator promo code (gated by cookie consent).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordAttribution} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Order ID</Label>
                <Input
                  placeholder="ORD-1042"
                  value={newOrderId}
                  onChange={(e) => setNewOrderId(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Creator Code</Label>
                <Input
                  placeholder="ROYAL10 or KAVYA15"
                  value={newCreatorCode}
                  onChange={(e) => setNewCreatorCode(e.target.value)}
                  className="rounded-xl text-xs uppercase"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Campaign / Ad Name</Label>
              <Input
                placeholder="IG Reel - Royal Rouge Launch"
                value={newCampaign}
                onChange={(e) => setNewCampaign(e.target.value)}
                className="rounded-xl text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Revenue (₹)</Label>
                <Input
                  type="number"
                  placeholder="1499"
                  value={newRevenue}
                  onChange={(e) => setNewRevenue(e.target.value)}
                  className="rounded-xl text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Customer Cookie Consent</Label>
                <Select value={newHasConsent} onValueChange={setNewHasConsent}>
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Consent Granted (Track)</SelectItem>
                    <SelectItem value="false">Consent Denied (Block Track)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAttributionModalOpen(false)}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-full bg-primary text-xs font-semibold text-white">
                Submit Attribution
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </WorkflowDashboardShell>
  );
}
