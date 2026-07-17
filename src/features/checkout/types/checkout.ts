import type {
  CheckoutPaymentOption,
  PaymentMethod,
} from "@/features/payments/types";

/**
 * Checkout domain types (RFC-013, RFC-015, RFC-016.5).
 */

export type CheckoutShippingMethod = {
  id: string;
  label: string;
  cost: number;
};

/** Narrow settings bag passed into Checkout — avoids StoreSettings coupling. */
export type CheckoutSettingsProps = {
  currency: string;
  locale: string;
  country: string;
  shippingEnabled: boolean;
  /**
   * Enabled + registered payment options from StoreSettings.
   * Checkout must not assume any specific provider is present.
   */
  paymentOptions: CheckoutPaymentOption[];
};

export type CheckoutFormValues = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingMethodId: string;
  paymentMethod: PaymentMethod;
};
