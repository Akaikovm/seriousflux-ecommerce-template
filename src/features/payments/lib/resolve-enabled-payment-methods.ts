import { SETTINGS_KEY_TO_PAYMENT_METHOD } from "@/features/payments/lib/payment-provider-keys";
import {
  DEFAULT_PAYMENT_PROVIDERS,
  mapPaymentProvidersConfig,
  paymentProvidersFromLegacyFlags,
} from "@/features/payments/lib/default-payment-providers";
import { isPaymentProviderRegistered } from "@/features/payments/providers/registered-methods";
import type { CheckoutPaymentOption } from "@/features/payments/types";
import type {
  EnabledPaymentMethods,
  PaymentProvidersConfig,
} from "@/features/settings/types";

export {
  DEFAULT_PAYMENT_PROVIDERS,
  mapPaymentProvidersConfig,
  paymentProvidersFromLegacyFlags,
  toLegacyEnabledPaymentMethods,
} from "@/features/payments/lib/default-payment-providers";

type PaymentSettingsInput = {
  paymentProviders?: PaymentProvidersConfig;
  /** @deprecated RFC-015 shape — used only when `paymentProviders` is absent. */
  enabledPaymentMethods?: EnabledPaymentMethods;
};

/**
 * Resolves the canonical public provider config from StoreSettings.
 *
 * Precedence:
 * 1. `paymentProviders` (RFC-016.5)
 * 2. Legacy `enabledPaymentMethods` (RFC-015)
 * 3. Defaults — Mercado Pago + Cash on Delivery enabled
 */
export function resolvePaymentProvidersConfig(
  settings?: PaymentSettingsInput,
): PaymentProvidersConfig {
  if (settings?.paymentProviders) {
    return mapPaymentProvidersConfig(settings.paymentProviders);
  }

  if (settings?.enabledPaymentMethods) {
    return paymentProvidersFromLegacyFlags(settings.enabledPaymentMethods);
  }

  return mapPaymentProvidersConfig(undefined, DEFAULT_PAYMENT_PROVIDERS);
}

/**
 * Checkout payment options: registered providers that are enabled, sorted.
 *
 * Disabled or unregistered providers never appear.
 * Checkout must not assume Mercado Pago or Cash on Delivery exist.
 */
export function resolveCheckoutPaymentOptions(
  settings?: PaymentSettingsInput,
): CheckoutPaymentOption[] {
  const config = resolvePaymentProvidersConfig(settings);
  const options: CheckoutPaymentOption[] = [];

  for (const [settingsKey, entry] of Object.entries(config) as Array<
    [keyof PaymentProvidersConfig, PaymentProvidersConfig[keyof PaymentProvidersConfig]]
  >) {
    if (!entry.enabled) {
      continue;
    }

    const method = SETTINGS_KEY_TO_PAYMENT_METHOD[settingsKey];
    if (!isPaymentProviderRegistered(method)) {
      continue;
    }

    options.push({
      id: method,
      displayName: entry.displayName,
      description: entry.description,
      sortOrder: entry.sortOrder,
    });
  }

  options.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  return options;
}
