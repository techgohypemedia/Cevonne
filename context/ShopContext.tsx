"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export interface CartItem {
  key: string;
  id?: string;
  slug?: string;
  name?: string;
  price?: number | string | null;
  currency?: string;
  image?: string | null;
  thumb?: string | null;
  color?: string | null;
  shadeName?: string | null;
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
  return {
    ...item,
    price: validPrice,
    currency,
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

  useEffect(() => {
    setCartItems(readStored(CART_KEY, []));
    setWishlist(readStored(WISHLIST_KEY, []));
    isHydrated.current = true;
  }, []);

  const addToCart = (item: CartItem) => {
    const itemKey = item?.key || item?.id || item?.slug;
    if (!itemKey) return false;
    const cleanItem = sanitizeCartItem({ ...item, key: String(itemKey) });
    const incomingQty = Math.max(1, Number(cleanItem.quantity) || 1);
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (entry) => entry.key === cleanItem.key
      );
      if (existingIndex > -1) {
        return prev.map((entry, idx) =>
          idx === existingIndex
            ? {
                ...entry,
                ...cleanItem,
                price: Number(cleanItem.price) > 0 ? Number(cleanItem.price) : (Number(entry.price) > 0 ? Number(entry.price) : 899),
                quantity: (Number(entry.quantity) || 1) + incomingQty,
              }
            : entry
        );
      }
      return [...prev, { ...cleanItem, quantity: incomingQty }];
    });
    return true;
  };

  const updateQuantity = (key: string, quantity: number) => {
    if (!key) return;
    const qty = Math.floor(Number(quantity));
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(key);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? {
              ...item,
              price: Number(item.price) > 0 ? Number(item.price) : 899,
              currency: item.currency === "INR" || !item.currency ? "₹" : item.currency,
              quantity: qty,
            }
          : item
      )
    );
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
