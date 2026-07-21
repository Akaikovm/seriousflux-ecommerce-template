"use client";

import type { SettingsSectionProps } from "@/features/admin/settings/types/settings-section";
import { AdminSectionDivider } from "@/features/admin/ui/AdminSection";
import { useT } from "@/i18n";
import { Switch } from "@/shared/ui/Switch";

/**
 * Rarely touched / operational flags. Future integrations land here.
 */
export function AdvancedSettingsSection({
  values,
  disabled,
  setField,
}: SettingsSectionProps) {
  const t = useT();

  return (
    <div className="flex flex-col gap-4">
      <Switch
        name="maintenanceMode"
        label={t("admin.settings.advanced.maintenanceMode")}
        helperText={t("admin.settings.advanced.maintenanceHelper")}
        checked={values.maintenanceMode}
        disabled={disabled}
        onChange={(event) => setField("maintenanceMode", event.target.checked)}
      />

      <AdminSectionDivider
        title={t("admin.settings.comingNext")}
        hint={t("admin.settings.advanced.comingNextHint")}
      />
    </div>
  );
}
