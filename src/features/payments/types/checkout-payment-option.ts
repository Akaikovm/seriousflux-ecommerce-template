import type { PaymentMethod } from "./payment-method";

/**
 * Public, customer-facing payment option resolved for checkout (RFC-016.5).
 *
 * Built from StoreSettings.paymentProviders ∩ provider registry.
 * Never includes secrets — display metadata only.
 */
export type CheckoutPaymentOption = {
  id: PaymentMethod;
  displayName: string;
  description: string;
  sortOrder: number;
};
