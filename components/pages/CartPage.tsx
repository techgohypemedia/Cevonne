"use client";

import React from "react"
import { Link } from "react-router-dom"
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useShop } from "@/context/ShopContext"
import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  calculateShippingFee,
  getRemainingForFreeShipping,
  isEligibleForFreeShipping,
} from "@/lib/shipping"

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, subtotal, totalCount } = useShop()
  const currencySymbol = cartItems[0]?.currency === "INR" || !cartItems[0]?.currency ? "₹" : cartItems[0].currency
  const hasItems = cartItems.length > 0

  const isFreeShipping = isEligibleForFreeShipping(subtotal)
  const shippingFee = calculateShippingFee(subtotal, totalCount)
  const total = subtotal + shippingFee
  const remainingForFreeShipping = getRemainingForFreeShipping(subtotal)
  const shippingProgress = Math.min(100, Math.round((subtotal / (FREE_SHIPPING_THRESHOLD + 1)) * 100))

  return (
    <div className="min-h-screen bg-[var(--accent)] text-[var(--primary)]">
      <div className="mx-auto max-w-5xl px-4 pt-24 pb-12 lg:pt-32 lg:pb-16">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--primary)]">Shopping Cart</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {hasItems
                ? `You have ${totalCount} item${totalCount === 1 ? "" : "s"} in your cart`
                : "Your cart is currently empty"}
            </p>
          </div>
          {hasItems && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-medium text-rose-500 hover:text-rose-700 transition self-start sm:self-auto"
            >
              Clear all items
            </button>
          )}
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            {hasItems ? (
              <ul className="space-y-4">
                {cartItems.map((item) => {
                  const qty = Math.max(1, Number(item.quantity) || 1)
                  const rawPrice = Number(item.price)
                  const unitPrice = Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : 899
                  const lineTotal = unitPrice * qty
                  const itemImg = item.thumb || item.image
                  const itemCurrency = item.currency === "INR" || !item.currency ? "₹" : item.currency

                  return (
                    <li
                      key={item.key}
                      className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-neutral-100 overflow-hidden border border-[var(--border)]">
                        {itemImg ? (
                          <img
                            src={itemImg}
                            alt={String(item.productName || item.name || "Product")}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div
                            className="h-full w-full"
                            style={{ backgroundColor: item.color || "#222" }}
                          />
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-between gap-3">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-semibold text-base text-[var(--primary)] leading-snug">
                              {String(item.productName || item.name || "")}
                            </h3>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.key)}
                              className="text-neutral-400 hover:text-rose-600 transition p-1"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {(item.shadeName || item.color) && (
                            <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                              {item.color && (
                                <span
                                  className="h-3 w-3 rounded-full border border-black/10 inline-block shrink-0"
                                  style={{ backgroundColor: item.color }}
                                />
                              )}
                              <span>{item.shadeName || "Selected Shade"}</span>
                            </div>
                          )}

                          <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                            Unit Price: {itemCurrency}{unitPrice.toLocaleString("en-IN")}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/60">
                          {/* Stepper */}
                          <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden bg-neutral-50 dark:bg-neutral-900">
                            <button
                              type="button"
                              onClick={() => {
                                if (qty <= 1) {
                                  removeFromCart(item.key)
                                } else {
                                  updateQuantity(item.key, qty - 1)
                                }
                              }}
                              className="px-2.5 py-1.5 text-neutral-600 hover:text-black hover:bg-neutral-200 transition"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-3 text-xs font-semibold text-[var(--primary)] min-w-[28px] text-center">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.key, qty + 1)}
                              className="px-2.5 py-1.5 text-neutral-600 hover:text-black hover:bg-neutral-200 transition"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Line total */}
                          <div className="text-right">
                            <span className="text-xs text-[var(--muted-foreground)] block">Total</span>
                            <span className="font-bold text-base text-[var(--primary)]">
                              {itemCurrency}{lineTotal.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
                <div className="mb-4 rounded-full bg-neutral-100 p-5 text-neutral-400">
                  <ShoppingBag className="h-10 w-10 stroke-[1.5]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--primary)]">Your cart is empty</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)] max-w-sm">
                  Looks like you haven&apos;t added any luxury cosmetics yet. Discover our latest collections now.
                </p>
                <Link to="/search" className="mt-6">
                  <Button className="rounded-full px-8 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-700)] shadow-sm">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            )}
          </section>

          {hasItems && (
            <aside className="h-fit space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--primary)]">Order Summary</h2>

              {/* Free shipping progress indicator */}
              <div className="rounded-xl border border-[var(--border)] bg-neutral-50/80 dark:bg-neutral-900/40 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  {isFreeShipping ? (
                    <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
                      <span>🎉</span> Free Shipping Unlocked!
                    </span>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">
                      Add <strong className="text-[var(--primary)]">{currencySymbol}{remainingForFreeShipping}</strong> more for <strong className="text-emerald-600">FREE Shipping</strong>
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                    {isFreeShipping ? "100%" : `${shippingProgress}%`}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${isFreeShipping ? 100 : shippingProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>Subtotal ({totalCount} item{totalCount === 1 ? "" : "s"})</span>
                  <span className="font-medium text-[var(--primary)]">{currencySymbol}{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>Shipping</span>
                  {isFreeShipping ? (
                    <div className="flex items-center gap-1.5">
                      <span className="line-through text-xs text-[var(--muted-foreground)]">
                        {currencySymbol}{STANDARD_SHIPPING_FEE}
                      </span>
                      <span className="text-emerald-600 font-semibold">Free</span>
                    </div>
                  ) : (
                    <span className="font-medium text-[var(--primary)]">{currencySymbol}{shippingFee}</span>
                  )}
                </div>
                <div className="border-t border-[var(--border)] pt-4 flex justify-between text-base font-bold text-[var(--primary)]">
                  <span>Total</span>
                  <span>{currencySymbol}{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <Link to="/checkout" className="block">
                  <Button className="w-full h-12 rounded-full bg-neutral-950 text-white hover:bg-neutral-800 font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md">
                    Proceed to Checkout <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/search" className="block">
                  <Button variant="outline" className="w-full h-11 rounded-full border-[var(--border)] text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--primary)]">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
              <p className="text-center text-xs text-[var(--muted-foreground)]">
                Secure checkout • Free standard delivery on orders above {currencySymbol}{FREE_SHIPPING_THRESHOLD}
              </p>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
