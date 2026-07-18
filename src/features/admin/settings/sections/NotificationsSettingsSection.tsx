"use client";

import { NotificationsSettingsFields } from "@/features/admin/settings/NotificationsSettingsFields";
import type { SettingsSectionProps } from "@/features/admin/settings/types/settings-section";

/**
 * Transactional email business configuration (RFC-019.1).
 */
export function NotificationsSettingsSection({
  values,
  fieldErrors,
  disabled,
  setNotifications,
}: SettingsSectionProps) {
  return (
    <NotificationsSettingsFields
      value={values.notifications}
      errors={fieldErrors.notifications}
      disabled={disabled}
      onChange={setNotifications}
    />
  );
}
