import type { StoreSettingsFormValues } from "@/features/admin/settings/store-settings-form-schema";
import type { StoreSettingsFormData } from "@/features/admin/settings/store-settings-form-data";

/**
 * Deep-clone form values into a stable snapshot for dirty comparison.
 */
export function cloneStoreSettingsFormValues(
  settings: StoreSettingsFormData | StoreSettingsFormValues,
): StoreSettingsFormValues {
  return {
    ...settings,
    hero: { ...settings.hero },
    paymentProviders: {
      mercadopago: { ...settings.paymentProviders.mercadopago },
      cashOnDelivery: { ...settings.paymentProviders.cashOnDelivery },
      stripe: { ...settings.paymentProviders.stripe },
      paypal: { ...settings.paymentProviders.paypal },
      bankTransfer: { ...settings.paymentProviders.bankTransfer },
    },
    notifications: { ...settings.notifications },
    inventory: { ...settings.inventory },
  };
}

/**
 * Structural equality for form dirty tracking.
 */
export function areStoreSettingsFormValuesEqual(
  a: StoreSettingsFormValues,
  b: StoreSettingsFormValues,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
