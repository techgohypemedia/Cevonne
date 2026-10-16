import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, CheckCircle2, ChevronDown, CreditCard, MapPin, Truck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/components/admin-dashboard/utils";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/api";
import { getNextOrderStatus, normalizeOrderStatus, type Order, type OrderStatus } from "@/types/order";

const statusStyles: Record<OrderStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  PAID: "border-sky-200 bg-sky-50 text-sky-700",
  PROCESSING: "border-violet-200 bg-violet-50 text-violet-700",
  SHIPPED: "border-blue-200 bg-blue-50 text-blue-700",
  OUT_FOR_DELIVERY: "border-indigo-200 bg-indigo-50 text-indigo-700",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-neutral-300 bg-neutral-100 text-neutral-700",
  REJECTED: "border-rose-300 bg-rose-100 text-rose-800",
};

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Awaiting payment",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

const actionLabels: Record<OrderStatus, string> = {
  PENDING: "Mark paid",
  PAID: "Start processing",
  PROCESSING: "Mark shipped",
  SHIPPED: "Out for delivery",
  OUT_FOR_DELIVERY: "Mark delivered",
  DELIVERED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

type OrdersPanelProps = {
  orders?: Order[];
  loading?: boolean;
  refresh?: () => void;
};

const normalizeStatus = (status?: string | null) => normalizeOrderStatus(status);

export function OrdersPanel({ orders = [], loading = false, refresh }: OrdersPanelProps) {
  const { authFetch } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const sorted = Array.isArray(orders)
    ? [...orders].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
    : [];
  const visible = sorted.slice(0, 6);

  const summary = {
    total: sorted.length,
    pending: sorted.filter((o) => normalizeStatus(o.status) === "PENDING").length,
    inTransit: sorted.filter((o) => {
      const status = normalizeStatus(o.status);
      return status !== "PENDING" && status !== "DELIVERED";
    }).length,
    revenue: sorted.reduce((acc, order) => acc + (Number(order?.totals?.total) || 0), 0),
  };

  const handleSetStatus = async (order: Order, next: OrderStatus) => {
    setUpdatingId(order.id);
    try {
      const response = await authFetch(`${API_BASE}/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) {
        if (response.status === 403) {
          toast.error("Only admins can update order status.");
          return;
        }
        const message = await response.text().catch(() => "");
        throw new Error(message || "Failed to update order status");
      }
      toast.success(`Order ${order?.number || order?.id} marked ${statusLabels[next] ?? next}`);
      refresh?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dashboard:data:refresh"));
      }
    } catch (err: any) {
      console.error("Order update failed", err);
      toast.error(err?.message || "Unable to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAdvance = (order: Order) => {
    const current = normalizeStatus(order?.status);
    const next = getNextOrderStatus(current);
    handleSetStatus(order, next);
  };

  return (
    <Card id="orders" className="border-none bg-white/95 shadow-sm">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Orders & Shipping</CardTitle>
          <CardDescription>Live customer orders with products, shades, and instant sync.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {summary.total} orders
          </Badge>
          <Badge className="rounded-full bg-amber-100 text-amber-800 border-amber-200">
            {summary.pending} awaiting payment
          </Badge>
          <Badge className="rounded-full bg-emerald-100 text-emerald-800 border-emerald-200">
            {summary.inTransit} packing/shipping
          </Badge>
        </div>
      </CardHeader>
      <div className="mx-4 mb-1 h-1 rounded-full bg-gradient-to-r from-primary/80 via-secondary/60 to-primary/40" />
      <CardContent className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white p-3"
            >
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
          ))
        ) : visible.length ? (
          visible.map((order) => {
            const status = normalizeStatus(order.status);
            const shipping = (order.shipping as any) || {};
            const payment = order.paymentMethod || "card";
            const total = order?.totals?.total ?? 0;
            const items = Array.isArray(order.items) ? order.items : [];
            const isExpanded = expandedId === (order.id || order.number);
            const orderKey = order.id || order.number;
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={orderKey}
                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-white p-3.5 shadow-sm transition-all"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  {/* Left Column: Thumbnails + Order Info */}
                  <div className="flex items-start gap-3">
                    {/* Products Thumbnail Strip */}
                    <div className="flex -space-x-2.5 shrink-0 pt-0.5">
                      {items.length > 0 ? (
                        items.slice(0, 2).map((item: any, idx: number) => (
                          <img
                            key={idx}
                            src={item.image || item.thumb || "/assets/images/shades/cevonne-ruby-red.jpg"}
                            alt={item.name}
                            className="h-12 w-12 rounded-xl border-2 border-white object-cover shadow-sm bg-neutral-100"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.fallbackApplied) {
                                target.dataset.fallbackApplied = "true";
                                target.src = "/assets/images/product1.png";
                              }
                            }}
                          />
                        ))
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                          {(order.number || order.id || "ORD").slice(-4)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedId((prev) => (prev === orderKey ? null : orderKey))}
                          className="text-sm font-bold text-foreground hover:text-primary transition-colors text-left"
                        >
                          {order.number || order.id}
                        </button>
                        <Badge
                          variant="outline"
                          className={`rounded-full text-xs ${statusStyles[status] ?? ""}`}
                        >
                          {statusLabels[status] ?? status}
                        </Badge>
                      </div>

                      {/* Item Preview Line */}
                      {items.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground truncate max-w-[160px]">
                            {items[0]?.name}
                          </span>
                          {items[0]?.color && (
                            <span
                              className="h-2.5 w-2.5 rounded-full border shrink-0"
                              style={{ backgroundColor: items[0].color }}
                            />
                          )}
                          <span className="text-[11px] truncate max-w-[100px]">
                            {items[0]?.shadeName || items[0]?.shade}
                          </span>
                          {items.length > 1 && (
                            <span className="text-[10px] font-semibold text-primary">
                              +{items.length - 1} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {shipping.city || shipping.address || "Ship to be added"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5" />
                          {payment === "cod" ? "Cash on delivery" : payment.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Amount + Status Dropdown + Quick Advance */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100">
                    <div className="flex flex-col text-left md:text-right text-sm font-semibold text-foreground">
                      <span>{formatCurrency(total)}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {items.length} item{items.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Direct Status Selector */}
                      <Select
                        value={status}
                        onValueChange={(val) => handleSetStatus(order, val as OrderStatus)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="h-8 w-[125px] rounded-full border-border/80 text-[11px] font-medium bg-white">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="PAID">Paid</SelectItem>
                          <SelectItem value="PROCESSING">Processing</SelectItem>
                          <SelectItem value="SHIPPED">Shipped</SelectItem>
                          <SelectItem value="OUT_FOR_DELIVERY">Out for Deliv.</SelectItem>
                          <SelectItem value="DELIVERED">Delivered</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full h-8 text-xs font-semibold"
                        onClick={() => handleAdvance(order)}
                        disabled={status === "DELIVERED" || isUpdating}
                      >
                        {status === "DELIVERED" ? (
                          <>
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Truck className="mr-1 h-3.5 w-3.5" />
                            {actionLabels[status] ?? "Next"}
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-full h-8 text-xs px-2"
                        onClick={() => setExpandedId((prev) => (prev === orderKey ? null : orderKey))}
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Products Details Drawer in card */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 space-y-3 animate-in fade-in duration-200">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Products in this order:
                    </p>
                    <div className="divide-y divide-neutral-100 rounded-xl bg-neutral-50/80 p-2.5">
                      {items.map((item: any, i: number) => {
                        const itemImg =
                          (item.productImage && !item.productImage.includes("crayon") ? item.productImage : null) ||
                          (item.image && !item.image.includes("crayon") && !item.image.includes("-stroke") ? item.image : null) ||
                          (item.thumb && !item.thumb.includes("crayon") && !item.thumb.includes("-stroke") ? item.thumb : null) ||
                          "/assets/images/shades/cevonne-ruby-red.jpg";
                        const shadeLabel = item.shadeName || item.shade || "Selected Shade";
                        const hexColor = item.color || "#8b1e4b";

                        return (
                          <div key={i} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={itemImg}
                                alt={item.name}
                                className="h-10 w-10 rounded-lg object-cover border border-neutral-200 bg-white shrink-0"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (!target.dataset.fallbackApplied) {
                                    target.dataset.fallbackApplied = "true";
                                    target.src = "/assets/images/product1.png";
                                  }
                                }}
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">{item.name}</p>
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full border shrink-0"
                                    style={{ backgroundColor: hexColor }}
                                  />
                                  <span>{shadeLabel}</span>
                                  <span>• Qty: {item.quantity || 1}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0 font-semibold text-foreground">
                              {formatCurrency(Number(item.price || 0) * (Number(item.quantity) || 1))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {shipping && (
                      <p className="text-[11px] text-muted-foreground">
                        Deliver to: <strong className="text-foreground">{shipping.fullName}</strong>,{" "}
                        {shipping.address}, {shipping.city} {shipping.postalCode ? `(${shipping.postalCode})` : ""} •{" "}
                        {shipping.phone ? `Phone: ${shipping.phone}` : ""}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
            No test orders yet. Place one in checkout to see shipping details here.
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-1">
          <Badge variant="secondary" className="rounded-full">
            Total collected: {formatCurrency(summary.revenue)}
          </Badge>
          <Badge variant="outline" className="rounded-full">
            Updates synchronize immediately with customer tracking.
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
