import React, { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Minus, Plus, Trash2, ShoppingBag, Heart, ArrowRight } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useShop } from "@/context/ShopContext"
import { toast } from "sonner"
import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  calculateShippingFee,
  getRemainingForFreeShipping,
  isEligibleForFreeShipping,
} from "@/lib/shipping"

export default function ShopDrawer() {
  const {
    cartItems,
    wishlist,
    addToCart,
    removeFromCart,
    updateQuantity,
    removeFromWishlist,
    drawerOpen,
    drawerView,
    openDrawer,
    closeDrawer,
    subtotal,
    totalCount,
  } = useShop()
  const location = useLocation()
  const navigate = useNavigate()

  const view = drawerView
  const open = drawerOpen
  const currencySymbol = cartItems[0]?.currency === "INR" || !cartItems[0]?.currency ? "₹" : cartItems[0].currency;

  const isFreeShipping = isEligibleForFreeShipping(subtotal);
  const shippingFee = calculateShippingFee(subtotal, totalCount);
  const total = subtotal + shippingFee;
  const remainingForFreeShipping = getRemainingForFreeShipping(subtotal);
  const shippingProgress = Math.min(100, Math.round((subtotal / (FREE_SHIPPING_THRESHOLD + 1)) * 100));

  const handleClose = () => closeDrawer()

  const goToCart = () => {
    closeDrawer()
    navigate("/cart")
  }
  const goToWishlist = () => {
    closeDrawer()
    navigate("/wishlist")
  }
  const goToCheckout = () => {
    closeDrawer()
    navigate("/checkout")
  }

  // Close drawer if user visits dedicated /cart or /wishlist pages
  useEffect(() => {
    if (location.pathname === "/cart" || location.pathname === "/wishlist") {
      if (open) closeDrawer()
    }
  }, [location.pathname, open, closeDrawer])

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) handleClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-background border-l border-border flex flex-col p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold tracking-tight">
              {view === "wishlist" ? "Your Wishlist" : "Your Shopping Bag"}
            </SheetTitle>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800">
              {view === "wishlist" ? `${wishlist.length} item${wishlist.length === 1 ? "" : "s"}` : `${totalCount} item${totalCount === 1 ? "" : "s"}`}
            </span>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            {view === "wishlist"
              ? "Items you've bookmarked to shop later"
              : "Review your selected shades and items before checkout"}
          </SheetDescription>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => openDrawer("cart")}
              className={`flex-1 rounded-full py-1.5 text-xs font-medium tracking-wide transition ${
                view === "cart"
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              Cart ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => openDrawer("wishlist")}
              className={`flex-1 rounded-full py-1.5 text-xs font-medium tracking-wide transition ${
                view === "wishlist"
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              Wishlist ({wishlist.length})
            </button>
          </div>
        </SheetHeader>

        {/* Item List / Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {view === "cart" ? (
            cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                  <ShoppingBag className="h-8 w-8 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-neutral-900 text-base">Your cart is empty</h3>
                  <p className="text-xs text-neutral-500 max-w-xs">
                    Explore our luxury shades and formulas to find your signature look.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    closeDrawer()
                    navigate("/search")
                  }}
                  variant="outline"
                  className="rounded-full px-6 text-xs font-medium mt-2"
                >
                  Explore Collection
                </Button>
              </div>
            ) : (
              <>
                {/* Free shipping progress indicator */}
                <div className="mb-4 rounded-xl border border-border/80 bg-neutral-50/90 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    {isFreeShipping ? (
                      <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
                        <span>🎉</span> Free Shipping Unlocked!
                      </span>
                    ) : (
                      <span className="text-neutral-600 text-[11px]">
                        Add <strong className="text-neutral-900">{currencySymbol}{remainingForFreeShipping}</strong> more for <strong className="text-emerald-600 font-semibold">FREE Shipping</strong>
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-neutral-400">
                      {isFreeShipping ? "100%" : `${shippingProgress}%`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${isFreeShipping ? 100 : shippingProgress}%` }}
                    />
                  </div>
                </div>

                <ul className="space-y-4 divide-y divide-border/60">
                {cartItems.map((item) => {
                  const qty = Math.max(1, Number(item.quantity) || 1)
                  const rawPrice = Number(item.price)
                  const price = Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : 899
                  const lineTotal = price * qty
                  const itemImg = item.thumb || item.image
                  const itemCurrency = item.currency === "INR" || !item.currency ? "₹" : item.currency

                  return (
                    <li key={item.key} className="pt-4 first:pt-0 flex gap-3.5">
                      <div className="h-20 w-20 shrink-0 rounded-xl bg-neutral-100 border border-border/70 overflow-hidden flex items-center justify-center relative">
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

                      <div className="flex flex-1 flex-col justify-between min-w-0">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm text-neutral-900 leading-tight truncate">
                              {String(item.productName || item.name || "")}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.key)}
                              className="text-neutral-400 hover:text-rose-600 transition p-0.5"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {(item.shadeName || item.color) && (
                            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                              {item.color && (
                                <span
                                  className="h-2.5 w-2.5 rounded-full border border-black/10 inline-block shrink-0"
                                  style={{ backgroundColor: item.color }}
                                />
                              )}
                              <span className="truncate">{item.shadeName || "Shade"}</span>
                            </div>
                          )}

                          <div className="text-xs text-neutral-600">
                            {itemCurrency}{price.toLocaleString("en-IN")}
                          </div>
                        </div>

                        {/* Controls & Line Total */}
                        {(() => {
                          const maxStock = typeof item.stock === "number" ? item.stock : (typeof item.maxQuantity === "number" ? item.maxQuantity : null);
                          const isMaxStock = maxStock !== null && maxStock !== undefined && qty >= maxStock;

                          return (
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center border border-border rounded-lg bg-neutral-50 overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (qty <= 1) {
                                        removeFromCart(item.key)
                                      } else {
                                        updateQuantity(item.key, qty - 1)
                                      }
                                    }}
                                    className="px-2 py-1 text-neutral-600 hover:text-black hover:bg-neutral-200 transition"
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="px-2 text-xs font-semibold text-neutral-900 min-w-[20px] text-center">
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isMaxStock) {
                                        toast.error(`Only ${maxStock} unit${maxStock === 1 ? "" : "s"} available in stock.`);
                                        return;
                                      }
                                      updateQuantity(item.key, qty + 1);
                                    }}
                                    disabled={isMaxStock}
                                    className={`px-2 py-1 transition ${
                                      isMaxStock
                                        ? "text-neutral-300 cursor-not-allowed bg-neutral-100"
                                        : "text-neutral-600 hover:text-black hover:bg-neutral-200"
                                    }`}
                                    aria-label="Increase quantity"
                                    title={isMaxStock ? `Max ${maxStock} units in stock` : "Increase quantity"}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                                {isMaxStock && (
                                  <span className="text-[10px] text-amber-700 font-medium">
                                    Max in stock ({maxStock})
                                  </span>
                                )}
                              </div>

                              <span className="font-semibold text-sm text-neutral-900">
                                {itemCurrency}{lineTotal.toLocaleString("en-IN")}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </li>
                  )
                })}
              </ul>
              </>
            )
          ) : (
            /* Wishlist View */
            wishlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                  <Heart className="h-8 w-8 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-neutral-900 text-base">Your wishlist is empty</h3>
                  <p className="text-xs text-neutral-500 max-w-xs">
                    Save your favorite shades and looks while browsing to view them anytime.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    closeDrawer()
                    navigate("/search")
                  }}
                  variant="outline"
                  className="rounded-full px-6 text-xs font-medium mt-2"
                >
                  Browse Products
                </Button>
              </div>
            ) : (
              <ul className="space-y-4 divide-y divide-border/60">
                {wishlist.map((item) => {
                  const price = Number(item.price) || 0
                  const itemImg = item.thumb || item.image

                  return (
                    <li key={item.key} className="pt-4 first:pt-0 flex gap-3.5">
                      <div className="h-20 w-20 shrink-0 rounded-xl bg-neutral-100 border border-border/70 overflow-hidden flex items-center justify-center relative">
                        {itemImg ? (
                          <img
                            src={itemImg}
                            alt={item.name || "Product"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div
                            className="h-full w-full"
                            style={{ backgroundColor: item.color || "#222" }}
                          />
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-between min-w-0">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm text-neutral-900 leading-tight truncate">
                              {item.name}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeFromWishlist(item.key)}
                              className="text-neutral-400 hover:text-rose-600 transition p-0.5"
                              title="Remove from wishlist"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {(item.shadeName || item.color) && (
                            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                              {item.color && (
                                <span
                                  className="h-2.5 w-2.5 rounded-full border border-black/10 inline-block shrink-0"
                                  style={{ backgroundColor: item.color }}
                                />
                              )}
                              <span className="truncate">{item.shadeName || "Shade"}</span>
                            </div>
                          )}

                          {price > 0 && (
                            <div className="text-xs font-medium text-neutral-800">
                              {currencySymbol}{price.toLocaleString("en-IN")}
                            </div>
                          )}
                        </div>

                        <div className="pt-2 flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => {
                              addToCart({ ...item, quantity: 1 })
                              removeFromWishlist(item.key)
                              openDrawer("cart")
                            }}
                            className="h-8 rounded-full px-4 text-xs bg-neutral-900 text-white hover:bg-neutral-800"
                          >
                            Move to Cart
                          </Button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )
          )}
        </div>

        {/* Footer */}
        {view === "cart" && cartItems.length > 0 && (
          <SheetFooter className="px-6 py-5 border-t border-border bg-neutral-50/50 flex flex-col gap-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between items-center text-neutral-600 text-xs">
                <span>Shipping</span>
                {isFreeShipping ? (
                  <div className="flex items-center gap-1.5">
                    <span className="line-through text-neutral-400 text-[11px] font-normal">
                      {currencySymbol}{STANDARD_SHIPPING_FEE}
                    </span>
                    <span className="text-emerald-600 font-semibold">Free</span>
                  </div>
                ) : (
                  <span className="font-semibold text-neutral-800">
                    {currencySymbol}{shippingFee}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center text-neutral-600 text-xs">
                <span>Subtotal</span>
                <span>{currencySymbol}{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-base font-bold text-neutral-900 border-t border-border/60 pt-1.5">
                <span>Total</span>
                <span>{currencySymbol}{total.toLocaleString("en-IN")}</span>
              </div>
              <p className="text-[11px] text-muted-foreground text-center pt-0.5">
                {isFreeShipping
                  ? "Free shipping applied on orders above ₹999"
                  : "Free shipping available on orders above ₹999"}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                className="w-full h-11 rounded-full bg-neutral-950 text-white hover:bg-neutral-800 font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm"
                onClick={goToCheckout}
              >
                Checkout <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 rounded-full text-xs font-semibold border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                onClick={goToCart}
              >
                View Full Cart
              </Button>
            </div>
          </SheetFooter>
        )}

        {view === "wishlist" && wishlist.length > 0 && (
          <SheetFooter className="px-6 py-5 border-t border-border bg-neutral-50/50 flex flex-col gap-2">
            <Button
              className="w-full h-11 rounded-full bg-neutral-950 text-white hover:bg-neutral-800 font-semibold text-xs tracking-wider uppercase"
              onClick={goToWishlist}
            >
              Manage Full Wishlist
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
