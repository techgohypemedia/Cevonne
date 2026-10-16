"use client";

import React, { useState, useEffect } from "react";
import { Link } from "@/lib/router";
import {
  Package,
  ChevronRight,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  RefreshCw,
  ExternalLink,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserOrders } from "@/hooks/useUserOrders";
import { normalizeOrderStatus, type OrderStatus } from "@/types/order";

const STATUS_FLOW: Array<{
  status: OrderStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { status: "PENDING", label: "Pending", icon: Clock },
  { status: "PAID", label: "Paid", icon: ShieldCheck },
  { status: "PROCESSING", label: "Processing", icon: Package },
  { status: "SHIPPED", label: "Shipped", icon: Truck },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: MapPin },
  { status: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

const badgeForStatus = (status = "") => {
  const normalized = normalizeOrderStatus(status);
  switch (normalized) {
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "OUT_FOR_DELIVERY":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "SHIPPED":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "PROCESSING":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "CANCELLED":
      return "bg-neutral-100 text-neutral-700 border-neutral-300";
    case "REJECTED":
      return "bg-rose-100 text-rose-800 border-rose-300";
    case "PENDING":
    default:
      return "bg-amber-100 text-amber-800 border-amber-200";
  }
};

export default function Orders() {
  const { orders = [], loading: ordersLoading, refresh } = useUserOrders();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Poll for live seller updates every 15s if user has active in-progress orders
  useEffect(() => {
    const hasActiveOrders = orders.some((o) => {
      const s = normalizeOrderStatus(o.status);
      return s !== "DELIVERED";
    });

    if (!hasActiveOrders) return;

    const interval = setInterval(() => {
      refresh();
    }, 15000);

    return () => clearInterval(interval);
  }, [orders, refresh]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--primary)]">Order History & Tracking</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Live updates appear here instantly as our team processes, packs, and dispatches your order.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={ordersLoading || isRefreshing}
          className="rounded-full border-[var(--border)] text-xs font-medium self-start sm:self-auto hover:bg-[var(--accent)]"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${ordersLoading || isRefreshing ? "animate-spin" : ""}`} />
          Check Live Status
        </Button>
      </div>

      <div className="space-y-4">
        {ordersLoading && !orders.length ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[var(--primary)]" />
            Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center space-y-3">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/60 mx-auto" />
            <h3 className="font-semibold text-base text-[var(--primary)]">No orders yet</h3>
            <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto">
              Once you place an order in checkout, it will be displayed here with real-time tracking.
            </p>
            <Link
              to="/collections"
              className="inline-flex items-center rounded-full bg-[var(--primary)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow hover:opacity-95"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const orderId = order.id || order.number;
            const orderNumber = order.number || order.id;
            const status = normalizeOrderStatus(order.status);
            const activeIdx = STATUS_FLOW.findIndex((s) => s.status === status);
            const statusLabel = STATUS_FLOW.find((s) => s.status === status)?.label ?? status;
            const isExpanded = expandedId === orderId;
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <div
                key={orderId}
                className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Order Summary Row */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="flex items-start gap-4">
                    <div className="p-3.5 rounded-2xl bg-[var(--secondary-100,#f6edf7)] text-[var(--primary)] shrink-0">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-mono font-bold text-base text-[var(--primary)] tracking-wide">
                          {orderNumber}
                        </h3>
                        {status !== "DELIVERED" && status !== "CANCELLED" && status !== "REJECTED" && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        Placed on{" "}
                        {new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        • {items.length} item{items.length === 1 ? "" : "s"}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2.5">
                        <Badge
                          variant="outline"
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeForStatus(
                            status
                          )}`}
                        >
                          {status === "REJECTED" ? "Rejected" : status === "CANCELLED" ? "Cancelled" : statusLabel}
                        </Badge>
                        <span className="text-sm font-bold text-[var(--primary)]">
                          {order.totals?.total != null ? `₹${Number(order.totals.total).toLocaleString("en-IN")}` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-xs font-semibold text-[var(--primary)] hover:bg-[var(--secondary-100,#f6edf7)]"
                      onClick={() => setExpandedId((id) => (id === orderId ? null : orderId))}
                    >
                      {isExpanded ? "Hide Details" : status === "REJECTED" || status === "CANCELLED" ? "View Details" : "Track Order"}{" "}
                      <ChevronRight
                        className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </Button>
                  </div>
                </div>

                {/* Prominent Cancelled Alert if Order was Rejected or Cancelled */}
                {(status === "REJECTED" || status === "CANCELLED") && (
                  <div className="mt-4 rounded-2xl bg-rose-50 border border-rose-200/80 p-3.5 flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-xs">
                      <p className="font-bold text-rose-950">Your order has been cancelled</p>
                      <p className="text-rose-700">
                        This order was rejected or cancelled by the seller. Any payment made will be refunded to your original payment method within 3–5 business days.
                      </p>
                    </div>
                  </div>
                )}

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-[var(--border)] space-y-6 animate-in fade-in duration-300">
                    {/* Stepper Timeline or Cancelled Notice */}
                    {status === "REJECTED" || status === "CANCELLED" ? (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-center space-y-1.5">
                        <p className="font-bold text-sm text-rose-950">Order Terminated</p>
                        <p className="text-xs text-rose-700 max-w-md mx-auto">
                          This order will not be delivered. If you have any queries, please contact customer support.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                            Delivery Progress
                          </h4>
                          <Link
                            to={`/track?order=${orderNumber}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
                          >
                            Full Tracking Page <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                          {STATUS_FLOW.map((step, idx) => {
                            const isActive = idx === activeIdx;
                            const isDone = activeIdx >= idx;
                            const StepIcon = step.icon;

                            return (
                              <div
                                key={step.status}
                                className={`rounded-2xl border p-2.5 text-center transition-all ${
                                  isActive
                                    ? "border-[var(--primary)] bg-[var(--primary-100,#f6edf7)] text-[var(--primary)] font-bold shadow-sm"
                                    : isDone
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 font-medium"
                                    : "border-neutral-200/60 bg-neutral-50/50 text-neutral-400"
                                }`}
                              >
                                <div className="flex justify-center mb-1">
                                  {isDone ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  ) : (
                                    <StepIcon className="h-4 w-4" />
                                  )}
                                </div>
                                <p className="text-[11px] leading-tight">{step.label}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Carrier & Tracking Info if updated by seller */}
                    {(order.trackingNumber || order.carrier) && (
                      <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-neutral-800">
                          <Truck className="h-4 w-4 text-[var(--primary)]" />
                          <span>
                            Courier Partner: <strong>{order.carrier || "Express"}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Tracking Number: <strong className="font-mono">{order.trackingNumber}</strong>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Ordered Items with Images, Shades, Qty, and Price */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                        Items in this Order
                      </h4>

                      <div className="rounded-2xl border border-[var(--border)] divide-y divide-neutral-100 overflow-hidden bg-white">
                        {items.map((item: any, idx: number) => {
                          const itemImg =
                            (item.productImage && !item.productImage.includes("crayon") ? item.productImage : null) ||
                            (item.image && !item.image.includes("crayon") && !item.image.includes("-stroke") ? item.image : null) ||
                            (item.thumb && !item.thumb.includes("crayon") && !item.thumb.includes("-stroke") ? item.thumb : null) ||
                            "/assets/images/shades/cevonne-ruby-red.jpg";
                          const shadeLabel = item.shadeName || item.shade || "Default";
                          const hexColor = item.color || "#8b1e4b";

                          return (
                            <div key={idx} className="p-3.5 flex items-center gap-3 sm:gap-4">
                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm relative">
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

                              <div className="min-w-0 flex-1 space-y-0.5">
                                <p className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                                  {item.name}
                                </p>

                                <div className="flex items-center gap-1.5 text-xs">
                                  <span
                                    className="h-3 w-3 rounded-full border border-black/10 shrink-0 shadow-sm"
                                    style={{ backgroundColor: hexColor }}
                                  />
                                  <span className="text-neutral-600 font-medium">{shadeLabel}</span>
                                </div>

                                <p className="text-[11px] text-muted-foreground">
                                  Qty: <strong>{item.quantity || 1}</strong> × ₹
                                  {Number(item.price).toLocaleString("en-IN")}
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <p className="text-xs sm:text-sm font-bold text-[var(--primary)]">
                                  ₹{(Number(item.price) * (Number(item.quantity) || 1)).toLocaleString("en-IN")}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Shipping Address & Totals Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {order.shipping && (
                        <div className="rounded-2xl border border-[var(--border)] p-4 bg-neutral-50/60 space-y-1">
                          <p className="font-bold text-neutral-900 flex items-center gap-1 mb-1">
                            <MapPin className="h-3.5 w-3.5 text-[var(--primary)]" /> Shipping Details
                          </p>
                          <p className="font-semibold text-neutral-800">{order.shipping.fullName}</p>
                          <p className="text-muted-foreground">{order.shipping.address}</p>
                          <p className="text-muted-foreground">
                            {order.shipping.city} {order.shipping.postalCode ? `- ${order.shipping.postalCode}` : ""}
                          </p>
                          {order.shipping.phone && (
                            <p className="text-muted-foreground">Phone: {order.shipping.phone}</p>
                          )}
                        </div>
                      )}

                      <div className="rounded-2xl border border-[var(--border)] p-4 bg-neutral-50/60 space-y-1.5">
                        <p className="font-bold text-neutral-900 mb-1">Order Summary</p>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span>
                          <span>₹{Number(order.totals?.subtotal || 0).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Shipping Fee</span>
                          <span>
                            {Number(order.totals?.shippingFee) > 0
                              ? `₹${Number(order.totals.shippingFee).toLocaleString("en-IN")}`
                              : "FREE"}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-[var(--primary)] pt-1 border-t border-neutral-200">
                          <span>Total</span>
                          <span>₹{Number(order.totals?.total || 0).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
