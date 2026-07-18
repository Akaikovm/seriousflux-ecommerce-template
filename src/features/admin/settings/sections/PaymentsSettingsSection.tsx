"use client";

import { PaymentProvidersSettingsFields } from "@/features/admin/settings/PaymentProvidersSettingsFields";
import type { SettingsSectionProps } from "@/features/admin/settings/types/settings-section";

/**
 * Payment provider visibility and customer-facing labels.
 */
export function PaymentsSettingsSection({
  values,
  fieldErrors,
  disabled,
  setPaymentProviders,
}: SettingsSectionProps) {
  return (
    <PaymentProvidersSettingsFields
      value={values.paymentProviders}
      errors={fieldErrors.paymentProviders}
      disabled={disabled}
      onChange={setPaymentProviders}
    />
  );
}
