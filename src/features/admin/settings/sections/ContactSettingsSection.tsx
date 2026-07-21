"use client";

import type { SettingsSectionProps } from "@/features/admin/settings/types/settings-section";
import { AdminSectionDivider } from "@/features/admin/ui/AdminSection";
import { useT } from "@/i18n";
import { Input } from "@/shared/ui/Input";
import { Textarea } from "@/shared/ui/Textarea";

/**
 * Public contact details and social profile links.
 */
export function ContactSettingsSection({
  values,
  fieldErrors,
  disabled,
  setField,
}: SettingsSectionProps) {
  const t = useT();

  return (
    <div className="flex flex-col gap-4">
      <Input
        name="email"
        label={t("admin.settings.contact.email")}
        type="email"
        value={values.email}
        error={fieldErrors.email}
        disabled={disabled}
        onChange={(event) => setField("email", event.target.value)}
      />

      <Input
        name="phone"
        label={t("admin.settings.contact.phone")}
        value={values.phone}
        error={fieldErrors.phone}
        disabled={disabled}
        onChange={(event) => setField("phone", event.target.value)}
      />

      <Input
        name="whatsapp"
        label={t("admin.settings.contact.whatsapp")}
        value={values.whatsapp}
        error={fieldErrors.whatsapp}
        disabled={disabled}
        onChange={(event) => setField("whatsapp", event.target.value)}
      />

      <Textarea
        name="address"
        label={t("admin.settings.contact.address")}
        value={values.address}
        error={fieldErrors.address}
        disabled={disabled}
        onChange={(event) => setField("address", event.target.value)}
      />

      <AdminSectionDivider
        title={t("admin.settings.contact.socialLinks")}
        hint={t("admin.settings.contact.socialLinksHint")}
      />

      <Input
        name="instagram"
        label={t("admin.settings.contact.instagram")}
        value={values.instagram}
        error={fieldErrors.instagram}
        disabled={disabled}
        onChange={(event) => setField("instagram", event.target.value)}
      />

      <Input
        name="facebook"
        label={t("admin.settings.contact.facebook")}
        value={values.facebook}
        error={fieldErrors.facebook}
        disabled={disabled}
        onChange={(event) => setField("facebook", event.target.value)}
      />

      <Input
        name="tiktok"
        label={t("admin.settings.contact.tiktok")}
        value={values.tiktok}
        error={fieldErrors.tiktok}
        disabled={disabled}
        onChange={(event) => setField("tiktok", event.target.value)}
      />

      <Input
        name="youtube"
        label={t("admin.settings.contact.youtube")}
        value={values.youtube}
        error={fieldErrors.youtube}
        disabled={disabled}
        onChange={(event) => setField("youtube", event.target.value)}
      />
    </div>
  );
}
