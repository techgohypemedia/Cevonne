"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "@/lib/router";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { normalizeOrderStatus, type OrderStatus } from "@/types/order";

const TRACKING_STEPS: Array<{
  status: OrderStatus;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    status: "PENDING",
    label: "Order Placed",
    desc: "Order confirmed & awaiting processing",
    icon: Clock,
  },
  {
    status: "PAID",
    label: "Payment Confirmed",
    desc: "Payment verified by finance team",
    icon: ShieldCheck,
  },
  {
    status: "PROCESSING",
    label: "Packed & Prepared",
    desc: "Items inspected & packed in luxury packaging",
    icon: Package,
  },
  {
    status: "SHIPPED",
    label: "Shipped",
    desc: "Handed over to our courier partner",
    icon: Truck,
  },
  {
    status: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    desc: "Courier executive is reaching your doorstep",
    icon: MapPin,
  },
  {
    status: "DELIVERED",
    label: "Delivered",
    desc: "Package delivered safely",
    icon: CheckCircle2,
  },
];

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get("order") || "";
  const [orderQuery, setOrderQuery] = useState(initialOrder);
  const [activeOrderNumber, setActiveOrderNumber] = useState(initialOrder);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchTracking = useCallback(async (orderNum: string) => {
    if (!orderNum.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/track?number=${encodeURIComponent(orderNum.trim())}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("No order found with this Order ID. Please check the ID and try again.");
        }
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to retrieve order tracking");
      }
      const data = await res.json();
      setOrder(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setOrder(null);
      setError(err?.message || "Could not track order.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialOrder) {
      setOrderQuery(initialOrder);
      setActiveOrderNumber(initialOrder);
      fetchTracking(initialOrder);
    }
  }, [initialOrder, fetchTracking]);

  // Auto-poll every 12 seconds if order is active and not delivered
  useEffect(() => {
    if (!activeOrderNumber || !order) return;
    const currentStatus = normalizeOrderStatus(order?.status);
    if (currentStatus === "DELIVERED") return;

    const interval = setInterval(() => {
      fetchTracking(activeOrderNumber);
    }, 12000);

    return () => clearInterval(interval);
  }, [activeOrderNumber, order, fetchTracking]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderQuery.trim()) {
      setActiveOrderNumber(orderQuery.trim());
      fetchTracking(orderQuery.trim());
    }
  };

  const currentStatus = normalizeOrderStatus(order?.status);
  const activeStepIndex = TRACKING_STEPS.findIndex((s) => s.status === currentStatus);
  const safeActiveIndex = activeStepIndex >= 0 ? activeStepIndex : 0;

  return (
    <div className="min-h-screen bg-[var(--accent,#faf5f1)] pt-24 pb-16 lg:pt-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <Badge
            variant="outline"
            className="border-[var(--secondary-300,#ead2ef)] text-[var(--primary,#4b0d4b)] uppercase tracking-widest text-[11px] px-3 py-1 font-semibold"
          >
            Real-Time Tracking
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--primary,#4b0d4b)]">
            Track Your Cevonne Order
          </h1>
          <p className="text-sm text-[var(--muted-foreground,#78716c)] max-w-lg mx-auto">
            Enter your order number below to check real-time dispatch, packaging, and delivery updates.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto mt-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="e.g. ORD-M7K9..."
                className="pl-10 h-12 rounded-full border-[var(--border,#e5e5e5)] bg-white text-sm shadow-sm focus-visible:ring-[var(--primary,#4b0d4b)] uppercase font-mono"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !orderQuery.trim()}
              className="h-12 px-6 rounded-full bg-[var(--primary,#4b0d4b)] hover:bg-[var(--primary-700,#3d0a45)] text-white font-semibold text-xs uppercase tracking-wider shadow-md"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Track"}
            </Button>
          </form>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50/90 p-5 text-center text-sm text-red-800 shadow-sm mb-8 animate-in fade-in duration-300">
            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="font-semibold">{error}</p>
            <p className="text-xs text-red-600 mt-1">
              Double check the order number in your confirmation message or view your{" "}
              <Link to="/profile/orders" className="underline font-semibold">
                Order History
              </Link>
              .
            </p>
          </div>
        )}

        {/* Loaded Order View */}
        {order && (
          <div className="space-y-6 animate-in fade-in duration-400">
            {/* Top Bar with Status and Live Pulse */}
            <div className="rounded-3xl border border-[var(--border,#e5e5e5)] bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-[var(--primary,#4b0d4b)]">
                    {order.number || order.id}
                  </span>
                  {currentStatus === "REJECTED" || currentStatus === "CANCELLED" ? (
                    <span className="text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-600 inline-block" />
                      Order Cancelled
                    </span>
                  ) : (
                    <>
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs text-emerald-700 font-medium">Live Synchronized</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTracking(order.number || order.id)}
                  disabled={loading}
                  className="rounded-full border-[var(--border,#e5e5e5)] text-xs font-medium text-[var(--primary,#4b0d4b)] hover:bg-[var(--accent,#faf5f1)]"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Badge
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    currentStatus === "DELIVERED"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : currentStatus === "REJECTED" || currentStatus === "CANCELLED"
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : "bg-[var(--primary-100,#f6edf7)] text-[var(--primary,#4b0d4b)] border-[var(--secondary-300,#ead2ef)]"
                  }`}
                >
                  {currentStatus === "REJECTED"
                    ? "Rejected"
                    : currentStatus === "CANCELLED"
                    ? "Cancelled"
                    : TRACKING_STEPS.find((s) => s.status === currentStatus)?.label || currentStatus}
                </Badge>
              </div>
            </div>

            {/* If Order is Rejected or Cancelled */}
            {currentStatus === "REJECTED" || currentStatus === "CANCELLED" ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 sm:p-8 text-center space-y-3 shadow-sm">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-1">
                  <XCircle className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-rose-950">Your Order has been Cancelled</h3>
                <p className="text-sm text-rose-800 max-w-lg mx-auto leading-relaxed">
                  This order was rejected / cancelled by the seller. If payment was already made, your full refund will be processed back to your original payment method within 3–5 business days.
                </p>
                <div className="pt-2">
                  <Link
                    to="/profile/orders"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 underline hover:text-rose-950"
                  >
                    View All Orders & History <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Visual Stepper */
              <div className="rounded-3xl border border-[var(--border,#e5e5e5)] bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="text-base font-bold text-[var(--primary,#4b0d4b)] mb-6 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Delivery Journey
                </h2>

              {/* Desktop Stepper */}
              <div className="hidden md:grid md:grid-cols-6 relative gap-2 text-center">
                {/* Horizontal Progress Line */}
                <div className="absolute top-5 left-10 right-10 h-1 bg-neutral-100 -z-0">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--primary,#4b0d4b)] to-emerald-500 transition-all duration-500"
                    style={{
                      width: `${(safeActiveIndex / (TRACKING_STEPS.length - 1)) * 100}%`,
                    }}
                  />
                </div>

                {TRACKING_STEPS.map((step, idx) => {
                  const isDone = idx < safeActiveIndex;
                  const isCurrent = idx === safeActiveIndex;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.status} className="relative z-10 flex flex-col items-center group">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isDone
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                            : isCurrent
                            ? "bg-[var(--primary,#4b0d4b)] text-white ring-4 ring-[var(--secondary-300,#ead2ef)] shadow-lg"
                            : "bg-neutral-100 text-neutral-400 border border-neutral-200"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <StepIcon className="h-4 w-4" />
                        )}
                      </div>
                      <p
                        className={`text-xs font-semibold mt-3 ${
                          isCurrent
                            ? "text-[var(--primary,#4b0d4b)] font-bold"
                            : isDone
                            ? "text-neutral-800"
                            : "text-neutral-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug px-1 line-clamp-2">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Vertical Stepper */}
              <div className="md:hidden space-y-6 relative pl-6 border-l-2 border-neutral-100 ml-4">
                {TRACKING_STEPS.map((step, idx) => {
                  const isDone = idx < safeActiveIndex;
                  const isCurrent = idx === safeActiveIndex;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.status} className="relative flex items-start gap-4">
                      <div
                        className={`absolute -left-[35px] top-0 h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                            ? "bg-[var(--primary,#4b0d4b)] text-white ring-4 ring-[var(--secondary-300,#ead2ef)]"
                            : "bg-neutral-100 text-neutral-400 border border-neutral-200"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <StepIcon className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            isCurrent
                              ? "text-[var(--primary,#4b0d4b)] font-bold"
                              : isDone
                              ? "text-neutral-900"
                              : "text-neutral-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Carrier & Tracking details if available */}
              {(order.trackingNumber || order.carrier) && (
                <div className="mt-8 rounded-2xl bg-[var(--primary-100,#f6edf7)]/60 border border-[var(--secondary-300,#ead2ef)] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[var(--primary,#4b0d4b)]">
                    <Truck className="h-4 w-4" />
                    <span>
                      Courier: <strong>{order.carrier || "Express Logistics"}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      AWB / Tracking #: <strong className="font-mono">{order.trackingNumber}</strong>
                    </span>
                  </div>
                  {lastRefreshed && (
                    <span className="text-[11px] text-muted-foreground">
                      Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

            {/* Ordered Products (with images, shades, prices) */}
            <div className="rounded-3xl border border-[var(--border,#e5e5e5)] bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--border,#e5e5e5)] pb-4 mb-4">
                <h2 className="text-base font-bold text-[var(--primary,#4b0d4b)] flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Ordered Items ({Array.isArray(order.items) ? order.items.length : 0})
                </h2>
                <span className="text-xs text-muted-foreground">
                  Payment: <strong className="uppercase">{order.paymentMethod || "Prepaid"}</strong>
                </span>
              </div>

              <div className="divide-y divide-neutral-100">
                {Array.isArray(order.items) &&
                  order.items.map((item: any, idx: number) => {
                    const itemImg =
                      (item.productImage && !item.productImage.includes("crayon") ? item.productImage : null) ||
                      (item.image && !item.image.includes("crayon") && !item.image.includes("-stroke") ? item.image : null) ||
                      (item.thumb && !item.thumb.includes("crayon") && !item.thumb.includes("-stroke") ? item.thumb : null) ||
                      "/assets/images/shades/cevonne-ruby-red.jpg";
                    const shadeLabel = item.shadeName || item.shade || "Selected Shade";
                    const hexColor = item.color || "#8b1e4b";

                    return (
                      <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                        {/* Thumbnail */}
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm">
                          <img
                            src={itemImg}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.fallbackApplied) {
                                target.dataset.fallbackApplied = "true";
                                target.src = "/assets/images/product1.png";
                              }
                            }}
                          />
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <h4 className="text-sm font-bold text-neutral-900 truncate">{item.name}</h4>

                          {/* Shade pill with swatch */}
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className="inline-block h-3.5 w-3.5 rounded-full border border-black/10 shadow-sm shrink-0"
                              style={{ backgroundColor: hexColor }}
                            />
                            <span className="font-medium text-neutral-600">{shadeLabel}</span>
                            {item.sku && item.sku !== "0" && (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                • {item.sku}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground">
                            Qty: <strong className="text-neutral-900">{item.quantity || 1}</strong> × ₹
                            {Number(item.price).toLocaleString("en-IN")}
                          </p>
                        </div>

                        {/* Line total */}
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-[var(--primary,#4b0d4b)]">
                            ₹{(Number(item.price) * (Number(item.quantity) || 1)).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Totals Summary */}
              <div className="mt-6 border-t border-[var(--border,#e5e5e5)] pt-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{Number(order.totals?.subtotal || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>
                    {Number(order.totals?.shippingFee) > 0
                      ? `₹${Number(order.totals.shippingFee).toLocaleString("en-IN")}`
                      : "FREE"}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-[var(--primary,#4b0d4b)] text-base pt-2 border-t border-neutral-100">
                  <span>Total Amount</span>
                  <span>₹{Number(order.totals?.total || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Shipping Destination */}
            {order.shipping && (
              <div className="rounded-3xl border border-[var(--border,#e5e5e5)] bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold text-[var(--primary,#4b0d4b)] mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Delivery Address
                </h2>
                <div className="text-xs text-neutral-700 space-y-1 leading-relaxed">
                  <p className="font-semibold text-neutral-900 text-sm">{order.shipping.fullName}</p>
                  <p>{order.shipping.address}</p>
                  <p>
                    {order.shipping.city} {order.shipping.postalCode ? `- ${order.shipping.postalCode}` : ""}
                  </p>
                  {order.shipping.phone && <p>Phone: {order.shipping.phone}</p>}
                </div>
              </div>
            )}

            {/* Footer Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <Link
                to="/profile/orders"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary,#4b0d4b)] hover:underline"
              >
                Go to My Orders <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/collections"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-neutral-900"
              >
                Continue Shopping <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
