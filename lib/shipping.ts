export const FREE_SHIPPING_THRESHOLD = 999;
export const STANDARD_SHIPPING_FEE = 149;

/**
 * Checks if order subtotal qualifies for free shipping (orders above ₹999).
 */
export function isEligibleForFreeShipping(subtotal: number): boolean {
  return Number(subtotal) > FREE_SHIPPING_THRESHOLD;
}

/**
 * Calculates shipping fee:
 * - Free (0) if subtotal is above ₹999.
 * - Standard fee (149) if subtotal <= ₹999 and there are items.
 * - 0 if cart is empty.
 */
export function calculateShippingFee(subtotal: number, itemCount: number = 1): number {
  if (itemCount <= 0 || Number(subtotal) <= 0) return 0;
  return isEligibleForFreeShipping(subtotal) ? 0 : STANDARD_SHIPPING_FEE;
}

/**
 * Calculates amount remaining to reach free shipping threshold.
 * If already above ₹999, returns 0.
 * Otherwise returns the gap needed to cross ₹999 (e.g. ₹1000 - subtotal).
 */
export function getRemainingForFreeShipping(subtotal: number): number {
  if (isEligibleForFreeShipping(subtotal)) return 0;
  const num = Math.max(0, Number(subtotal) || 0);
  return Math.max(0, FREE_SHIPPING_THRESHOLD - num + 1);
}
