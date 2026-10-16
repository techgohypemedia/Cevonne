"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { toast } from "sonner";

export interface CartItem {
  key: string;
  id?: string;
  slug?: string;
  name?: string;
  productName?: string;
  price?: number | string | null;
  currency?: string;
  image?: string | null;
  thumb?: string | null;
  color?: string | null;
  shade?: string | null;
  shadeName?: string | null;
  sku?: string | null;
  shadeId?: string | null;
  productId?: string | null;
  stock?: number | null;
  maxQuantity?: number | null;
  quantity?: number | null;
  [key: string]: unknown;
}

export interface ShopContextValue {
  cartItems: CartItem[];
  wishlist: CartItem[];
  addToCart: (item: CartItem) => boolean;
  removeFromCart: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  toggleWishlist: (item: CartItem) => "added" | "removed" | "none";
  removeFromWishlist: (key: string) => void;
  drawerOpen: boolean;
  drawerView: string;
  openDrawer: (view?: string) => void;
  closeDrawer: () => void;
  clearCart: () => void;
  subtotal: number;
  totalCount: number;
}

const ShopContext = createContext<ShopContextValue | undefined>(undefined);
const CART_KEY = "marvella:cart";
const WISHLIST_KEY = "marvella:wishlist";

const sanitizeCartItem = (item: CartItem): CartItem => {
  const priceNum = Number(item.price);
  const validPrice = Number.isFinite(priceNum) && priceNum > 0 ? priceNum : 899;
  const currency = item.currency === "INR" || !item.currency ? "₹" : item.currency;
  const stock =
    typeof item.stock === "number"
      ? item.stock
      : typeof item.maxQuantity === "number"
      ? item.maxQuantity
      : undefined;
  return {
    ...item,
    price: validPrice,
    currency,
    stock,
    maxQuantity: stock,
  };
};

const readStored = (key: string, fallback: CartItem[] = []) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : fallback;
    if (!Array.isArray(parsed)) return fallback;
    return parsed.map(sanitizeCartItem);
  } catch (err) {
    console.warn(`Failed to read ${key} from storage`, err);
    return fallback;
  }
};

const persistStored = (key: string, value: CartItem[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to persist ${key} to storage`, err);
  }
};

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState("cart");
  const isHydrated = useRef(false);

  // Sync live stock from backend inventory database
  const syncInventory = async () => {
    try {
      const res = await fetch("/api/inventory");
      if (!res.ok) return;
      const records = await res.json();
      if (!Array.isArray(records) || records.length === 0) return;

      setCartItems((prev) => {
        if (!prev.length) return prev;
        let hasChanges = false;
        const updated = prev.map((item) => {
          const matched = records.find((rec: any) => {
            if (item.shadeId && rec.shadeId === item.shadeId) return true;
            if (item.sku && rec.shade?.sku && String(rec.shade.sku).trim().toLowerCase() === String(item.sku).trim().toLowerCase()) return true;
            if (item.key && (item.key.includes(rec.shadeId) || (rec.shade?.sku && item.key.includes(rec.shade.sku)))) return true;
            if (item.shadeName && rec.shade?.name && String(rec.shade.name).trim().toLowerCase() === String(item.shadeName).trim().toLowerCase()) return true;
            return false;
          });

          if (matched && typeof matched.quantity === "number") {
            const liveStock = matched.quantity;
            const currentQty = Number(item.quantity) || 1;
            const clampedQty = liveStock <= 0 ? 0 : Math.min(currentQty, liveStock);
            if (item.stock !== liveStock || currentQty !== clampedQty) {
              hasChanges = true;
              return {
                ...item,
                stock: liveStock,
                maxQuantity: liveStock,
                quantity: clampedQty,
              };
            }
          }
          return item;
        });

        return hasChanges ? updated : prev;
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setCartItems(readStored(CART_KEY, []));
    setWishlist(readStored(WISHLIST_KEY, []));
    isHydrated.current = true;
    syncInventory();
  }, []);

  useEffect(() => {
    if (drawerOpen && isHydrated.current) {
      syncInventory();
    }
  }, [drawerOpen]);

  const addToCart = (item: CartItem) => {
    const itemKey = item?.key || item?.id || item?.slug;
    if (!itemKey) return false;
    const cleanItem = sanitizeCartItem({ ...item, key: String(itemKey) });
    const incomingQty = Math.max(1, Number(cleanItem.quantity) || 1);

    const maxStock =
      typeof cleanItem.stock === "number"
        ? cleanItem.stock
        : typeof cleanItem.maxQuantity === "number"
        ? cleanItem.maxQuantity
        : null;

    if (maxStock !== null && maxStock <= 0) {
      toast.error(`${cleanItem.shadeName || cleanItem.name || "This shade"} is currently out of stock.`);
      return false;
    }

    let success = true;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (entry) => entry.key === cleanItem.key
      );
      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const currentQty = Number(existing.quantity) || 1;
        const effectiveStock =
          maxStock ??
          (typeof existing.stock === "number"
            ? existing.stock
            : typeof existing.maxQuantity === "number"
            ? existing.maxQuantity
            : null);

        if (effectiveStock !== null && currentQty >= effectiveStock) {
          toast.error(`Stock limit reached! Only ${effectiveStock} unit${effectiveStock === 1 ? "" : "s"} available in stock.`);
          success = false;
          return prev;
        }

        let newQty = currentQty + incomingQty;
        if (effectiveStock !== null && newQty > effectiveStock) {
          newQty = effectiveStock;
          toast.warning(`Only ${effectiveStock} unit${effectiveStock === 1 ? "" : "s"} available in stock. Quantity adjusted.`);
        }

        return prev.map((entry, idx) =>
          idx === existingIndex
            ? {
                ...entry,
                ...cleanItem,
                stock: effectiveStock ?? entry.stock,
                maxQuantity: effectiveStock ?? entry.maxQuantity,
                price: Number(cleanItem.price) > 0 ? Number(cleanItem.price) : (Number(entry.price) > 0 ? Number(entry.price) : 899),
                quantity: newQty,
              }
            : entry
        );
      }

      let initialQty = incomingQty;
      if (maxStock !== null && initialQty > maxStock) {
        initialQty = maxStock;
        toast.warning(`Only ${maxStock} unit${maxStock === 1 ? "" : "s"} available in stock. Quantity adjusted.`);
      }

      return [...prev, { ...cleanItem, stock: maxStock ?? cleanItem.stock, maxQuantity: maxStock ?? cleanItem.maxQuantity, quantity: initialQty }];
    });

    return success;
  };

  const updateQuantity = (key: string, quantity: number) => {
    if (!key) return;
    const qty = Math.floor(Number(quantity));
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(key);
      return;
    }

    setCartItems((prev) => {
      const item = prev.find((entry) => entry.key === key);
      if (!item) return prev;

      const currentQty = Number(item.quantity) || 1;
      const maxStock =
        typeof item.stock === "number"
          ? item.stock
          : typeof item.maxQuantity === "number"
          ? item.maxQuantity
          : null;

      if (maxStock !== null && qty > maxStock) {
        toast.error(`Only ${maxStock} unit${maxStock === 1 ? "" : "s"} available in stock.`);
        if (currentQty >= maxStock) {
          return prev;
        }
        return prev.map((entry) =>
          entry.key === key
            ? {
                ...entry,
                price: Number(entry.price) > 0 ? Number(entry.price) : 899,
                currency: entry.currency === "INR" || !entry.currency ? "₹" : entry.currency,
                quantity: maxStock,
              }
            : entry
        );
      }

      return prev.map((entry) =>
        entry.key === key
          ? {
              ...entry,
              price: Number(entry.price) > 0 ? Number(entry.price) : 899,
              currency: entry.currency === "INR" || !entry.currency ? "₹" : entry.currency,
              quantity: qty,
            }
          : entry
      );
    });
  };

  const removeFromCart = (key: string) => {
    if (!key) return;
    setCartItems((prev) => prev.filter((item) => item.key !== key));
  };

  const clearCart = () => setCartItems([]);

  const toggleWishlist = (item: CartItem) => {
    const itemKey = item?.key || item?.id || item?.slug;
    if (!itemKey) return "none";
    let status: "added" | "removed" | "none" = "none";
    const cleanItem = sanitizeCartItem({ ...item, key: String(itemKey) });
    setWishlist((prev) => {
      if (prev.some((entry) => entry.key === cleanItem.key)) {
        status = "removed";
        return prev.filter((entry) => entry.key !== cleanItem.key);
      }
      status = "added";
      return [...prev, cleanItem];
    });
    return status;
  };

  const removeFromWishlist = (key: string) => {
    if (!key) return;
    setWishlist((prev) => prev.filter((item) => item.key !== key));
  };

  const openDrawer = (view = "cart") => {
    setDrawerView(view === "wishlist" ? "wishlist" : "cart");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  useEffect(() => {
    if (!isHydrated.current) return;
    persistStored(CART_KEY, cartItems);
  }, [cartItems]);

  useEffect(() => {
    if (!isHydrated.current) return;
    persistStored(WISHLIST_KEY, wishlist);
  }, [wishlist]);

  const subtotal = useMemo(
    () =>
      cartItems.reduce((sum, item) => {
        const val = Number(item.price);
        const qty = Number(item.quantity) || 1;
        return sum + (Number.isFinite(val) ? val * qty : 0);
      }, 0),
    [cartItems]
  );

  const totalCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0),
    [cartItems]
  );

  const value = useMemo<ShopContextValue>(
    () => ({
      cartItems,
      wishlist,
      addToCart,
      removeFromCart,
      updateQuantity,
      toggleWishlist,
      removeFromWishlist,
      drawerOpen,
      drawerView,
      openDrawer,
      closeDrawer,
      clearCart,
      subtotal,
      totalCount,
    }),
    [cartItems, wishlist, drawerOpen, drawerView, subtotal, totalCount]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
