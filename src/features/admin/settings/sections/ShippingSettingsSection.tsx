"use client";

import type { SettingsSectionProps } from "@/features/admin/settings/types/settings-section";
import { AdminSectionDivider } from "@/features/admin/ui/AdminSection";
import { useT } from "@/i18n";
import { Switch } from "@/shared/ui/Switch";

/**
 * Shipping feature flags. Future shipping options land here.
 */
export function ShippingSettingsSection({
  values,
  disabled,
  setField,
}: SettingsSectionProps) {
  const t = useT();

  return (
    <div className="flex flex-col gap-5">
      <Switch
        name="shippingEnabled"
        label={t("admin.settings.shipping.enabled")}
        helperText={t("admin.settings.shipping.enabledHelper")}
        checked={values.shippingEnabled}
        disabled={disabled}
        onChange={(event) => setField("shippingEnabled", event.target.checked)}
      />

      <AdminSectionDivider
        title={t("admin.settings.comingNext")}
        hint={t("admin.settings.shipping.comingNextHint")}
      />
    </div>
  );
}
