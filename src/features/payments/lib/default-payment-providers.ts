import type {
  EnabledPaymentMethods,
  PaymentProviderConfig,
  PaymentProvidersConfig,
} from "@/features/settings/types";

/**
 * Default public payment-provider configuration (RFC-016.5).
 *
 * Mercado Pago + Cash on Delivery enabled; future providers present but off.
 * Used when Firestore has neither `paymentProviders` nor legacy flags.
 */
export const DEFAULT_PAYMENT_PROVIDERS: PaymentProvidersConfig = {
  mercadopago: {
    enabled: true,
    displayName: "Mercado Pago",
    description: "Pay with cards or Mercado Pago",
    sortOrder: 1,
  },
  cashOnDelivery: {
    enabled: true,
    displayName: "Cash on Delivery",
    description: "Pay when receiving the order",
    sortOrder: 2,
  },
  stripe: {
    enabled: false,
    displayName: "Stripe",
    description: "",
    sortOrder: 3,
  },
  paypal: {
    enabled: false,
    displayName: "PayPal",
    description: "",
    sortOrder: 4,
  },
  bankTransfer: {
    enabled: false,
    displayName: "Bank Transfer",
    description: "",
    sortOrder: 5,
  },
};

export function toLegacyEnabledPaymentMethods(
  config: PaymentProvidersConfig,
): EnabledPaymentMethods {
  return {
    mercadopago: config.mercadopago.enabled,
    cashOnDelivery: config.cashOnDelivery.enabled,
  };
}

function mergeProviderConfig(
  defaults: PaymentProviderConfig,
  raw: unknown,
): PaymentProviderConfig {
  if (!raw || typeof raw !== "object") {
    return { ...defaults };
  }

  const data = raw as Record<string, unknown>;

  return {
    enabled:
      typeof data.enabled === "boolean" ? data.enabled : defaults.enabled,
    displayName:
      typeof data.displayName === "string" && data.displayName.trim()
        ? data.displayName
        : defaults.displayName,
    description:
      typeof data.description === "string"
        ? data.description
        : defaults.description,
    sortOrder:
      typeof data.sortOrder === "number" && Number.isFinite(data.sortOrder)
        ? data.sortOrder
        : defaults.sortOrder,
  };
}

/**
 * Maps raw Firestore `paymentProviders` onto the full config, filling gaps.
 */
export function mapPaymentProvidersConfig(
  raw: unknown,
  defaults: PaymentProvidersConfig = DEFAULT_PAYMENT_PROVIDERS,
): PaymentProvidersConfig {
  if (!raw || typeof raw !== "object") {
    return {
      mercadopago: { ...defaults.mercadopago },
      cashOnDelivery: { ...defaults.cashOnDelivery },
      stripe: { ...defaults.stripe },
      paypal: { ...defaults.paypal },
      bankTransfer: { ...defaults.bankTransfer },
    };
  }

  const data = raw as Record<string, unknown>;

  return {
    mercadopago: mergeProviderConfig(defaults.mercadopago, data.mercadopago),
    cashOnDelivery: mergeProviderConfig(
      defaults.cashOnDelivery,
      data.cashOnDelivery,
    ),
    stripe: mergeProviderConfig(defaults.stripe, data.stripe),
    paypal: mergeProviderConfig(defaults.paypal, data.paypal),
    bankTransfer: mergeProviderConfig(defaults.bankTransfer, data.bankTransfer),
  };
}

/**
 * Builds `paymentProviders` from legacy `enabledPaymentMethods` flags.
 */
export function paymentProvidersFromLegacyFlags(
  flags: EnabledPaymentMethods,
  defaults: PaymentProvidersConfig = DEFAULT_PAYMENT_PROVIDERS,
): PaymentProvidersConfig {
  return {
    ...mapPaymentProvidersConfig(undefined, defaults),
    mercadopago: {
      ...defaults.mercadopago,
      enabled: flags.mercadopago,
    },
    cashOnDelivery: {
      ...defaults.cashOnDelivery,
      enabled: flags.cashOnDelivery,
    },
  };
}
