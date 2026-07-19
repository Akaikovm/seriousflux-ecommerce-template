"use client";

import { InventorySettingsFields } from "@/features/admin/settings/InventorySettingsFields";
import type { SettingsSectionProps } from "@/features/admin/settings/types/settings-section";

/**
 * Global inventory defaults (RFC-023).
 */
export function InventorySettingsSection({
  values,
  fieldErrors,
  disabled,
  setInventory,
}: SettingsSectionProps) {
  return (
    <InventorySettingsFields
      value={values.inventory}
      errors={fieldErrors.inventory}
      disabled={disabled}
      onChange={setInventory}
    />
  );
}
