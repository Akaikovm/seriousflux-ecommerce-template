"use client";

import type { SettingsSectionProps } from "@/features/admin/settings/types/settings-section";
import { AdminSectionDivider } from "@/features/admin/ui/AdminSection";
import { Switch } from "@/shared/ui/Switch";

/**
 * Shipping feature flags. Future shipping options land here.
 */
export function ShippingSettingsSection({
  values,
  disabled,
  setField,
}: SettingsSectionProps) {
  return (
    <div className="flex flex-col gap-5">
      <Switch
        name="shippingEnabled"
        label="Shipping enabled"
        helperText="When off, checkout must not offer shipping."
        checked={values.shippingEnabled}
        disabled={disabled}
        onChange={(event) => setField("shippingEnabled", event.target.checked)}
      />

      <AdminSectionDivider
        title="Coming next"
        hint="Rates, zones, and carriers will appear here without moving this section."
      />
    </div>
  );
}
