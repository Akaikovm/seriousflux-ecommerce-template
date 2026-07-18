import { SETTINGS_KEY_TO_PAYMENT_METHOD } from "@/features/payments/lib/payment-provider-keys";
import { isPaymentProviderRegistered } from "@/features/payments/providers/registered-methods";
import type {
  PaymentProviderConfig,
  PaymentProviderSettingsKey,
  PaymentProvidersConfig,
} from "@/features/settings/types";

export type AdminPaymentProviderEntry = {
  key: PaymentProviderSettingsKey;
  config: PaymentProviderConfig;
};

/**
 * Payment-provider slots that have a registered implementation and can be
 * toggled in Admin Store Settings. Unregistered slots stay hidden.
 */
export function listAdminPaymentProviderEntries(
  config: PaymentProvidersConfig,
): AdminPaymentProviderEntry[] {
  const entries: AdminPaymentProviderEntry[] = [];

  for (const key of Object.keys(SETTINGS_KEY_TO_PAYMENT_METHOD) as PaymentProviderSettingsKey[]) {
    const method = SETTINGS_KEY_TO_PAYMENT_METHOD[key];
    if (!isPaymentProviderRegistered(method)) {
      continue;
    }
    entries.push({ key, config: config[key] });
  }

  entries.sort(
    (a, b) =>
      a.config.sortOrder - b.config.sortOrder || a.key.localeCompare(b.key),
  );

  return entries;
}
