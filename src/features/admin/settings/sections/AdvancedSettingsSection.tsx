"use client";

import type { SettingsSectionProps } from "@/features/admin/settings/types/settings-section";
import { AdminSectionDivider } from "@/features/admin/ui/AdminSection";
import { Switch } from "@/shared/ui/Switch";

/**
 * Rarely touched / operational flags. Future integrations land here.
 */
export function AdvancedSettingsSection({
  values,
  disabled,
  setField,
}: SettingsSectionProps) {
  return (
    <div className="flex flex-col gap-5">
      <Switch
        name="maintenanceMode"
        label="Maintenance mode"
        helperText="When on, the storefront should show maintenance and block commerce."
        checked={values.maintenanceMode}
        disabled={disabled}
        onChange={(event) => setField("maintenanceMode", event.target.checked)}
      />

      <AdminSectionDivider
        title="Coming next"
        hint="Analytics, SEO, integrations, and experimental options will land in this section."
      />
    </div>
  );
}
