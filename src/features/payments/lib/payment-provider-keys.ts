import type { PaymentMethod } from "@/features/payments/types";
import type { PaymentProviderSettingsKey } from "@/features/settings/types";

/**
 * Maps StoreSettings keys → checkout / order payment method ids.
 * Settings use camelCase; method ids use snake_case for multi-word providers.
 */
export const SETTINGS_KEY_TO_PAYMENT_METHOD: Record<
  PaymentProviderSettingsKey,
  PaymentMethod
> = {
  mercadopago: "mercadopago",
  cashOnDelivery: "cash_on_delivery",
  stripe: "stripe",
  paypal: "paypal",
  bankTransfer: "bank_transfer",
};
