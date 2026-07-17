/**
 * Checkout-selectable payment method ids (RFC-016.5).
 *
 * Values map 1:1 to `PaymentProviderId` on orders.
 * Reserved ids (stripe, paypal, bank_transfer) exist so Store Settings can
 * configure them before a provider implementation is registered.
 *
 * Only methods that are both **enabled in settings** and **registered**
 * appear at checkout.
 */
export const PAYMENT_METHODS = [
  "mercadopago",
  "cash_on_delivery",
  "stripe",
  "paypal",
  "bank_transfer",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
