/**
 * Public payment-provider configuration stored in Firestore (RFC-016.5).
 *
 * SECURITY: This document is storefront-readable. Store ONLY public fields
 * (enabled, display labels, sort order). Never store access tokens, secret
 * keys, client secrets, or webhook secrets — those stay in server env vars.
 */

/** Firestore / StoreSettings keys for each known provider slot. */
export type PaymentProviderSettingsKey =
  | "mercadopago"
  | "cashOnDelivery"
  | "stripe"
  | "paypal"
  | "bankTransfer";

/**
 * Per-provider public config.
 * Credentials are never part of this shape.
 */
export interface PaymentProviderConfig {
  enabled: boolean;
  displayName: string;
  description: string;
  sortOrder: number;
}

/**
 * Full provider map on `settings/general`.
 * Every catalog slot is present so Admin can toggle without schema migrations.
 */
export type PaymentProvidersConfig = Record<
  PaymentProviderSettingsKey,
  PaymentProviderConfig
>;

/**
 * @deprecated Legacy boolean flags (RFC-015). Prefer `paymentProviders`.
 * Still read for backward compatibility when `paymentProviders` is absent.
 */
export interface EnabledPaymentMethods {
  mercadopago: boolean;
  cashOnDelivery: boolean;
}
