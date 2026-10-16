export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REJECTED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const normalizeOrderStatus = (status?: string | null): OrderStatus => {
  const normalized = String(status ?? "PENDING")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  return (ORDER_STATUSES as readonly string[]).includes(normalized)
    ? (normalized as OrderStatus)
    : "PENDING";
};

export const getNextOrderStatus = (status?: string | null): OrderStatus => {
  const current = normalizeOrderStatus(status);
  const currentIndex = ORDER_STATUSES.indexOf(current);
  return ORDER_STATUSES[Math.min(currentIndex + 1, ORDER_STATUSES.length - 1)];
};

export interface OrderTotals {
  subtotal: number;
  shippingFee: number;
  total: number;
  [key: string]: number;
}

export interface OrderShipping {
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  city?: string;
  postalCode?: string;
  carrier?: string | null;
  trackingNumber?: string | null;
}

export interface OrderItem {
  id?: string;
  productId?: string;
  productImage?: string | null;
  sku?: string;
  name: string;
  price: number;
  currency?: string;
  quantity: number;
  shade?: string | null;
  shadeName?: string | null;
  shadeImage?: string | null;
  color?: string | null;
  image?: string | null;
  thumb?: string | null;
  [key: string]: unknown;
}

export interface Order {
  id: string;
  number: string;
  userId?: string | null;
  status: OrderStatus;
  paymentMethod?: string | null;
  totals: OrderTotals;
  shipping: OrderShipping;
  carrier?: string | null;
  trackingNumber?: string | null;
  items: OrderItem[];
  createdAt: Date | string;
  updatedAt: Date | string;
}
