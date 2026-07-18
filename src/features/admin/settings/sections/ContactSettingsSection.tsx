"use client";

import type { SettingsSectionProps } from "@/features/admin/settings/types/settings-section";
import { AdminSectionDivider } from "@/features/admin/ui/AdminSection";
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
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Input
        name="email"
        label="Email"
        type="email"
        value={values.email}
        error={fieldErrors.email}
        disabled={disabled}
        onChange={(event) => setField("email", event.target.value)}
      />

      <Input
        name="phone"
        label="Phone"
        value={values.phone}
        error={fieldErrors.phone}
        disabled={disabled}
        onChange={(event) => setField("phone", event.target.value)}
      />

      <Input
        name="whatsapp"
        label="WhatsApp"
        value={values.whatsapp}
        error={fieldErrors.whatsapp}
        disabled={disabled}
        onChange={(event) => setField("whatsapp", event.target.value)}
      />

      <Textarea
        name="address"
        label="Address"
        value={values.address}
        error={fieldErrors.address}
        disabled={disabled}
        onChange={(event) => setField("address", event.target.value)}
      />

      <AdminSectionDivider
        title="Social links"
        hint="Profile URLs shown on the storefront where configured."
      />

      <Input
        name="instagram"
        label="Instagram"
        value={values.instagram}
        error={fieldErrors.instagram}
        disabled={disabled}
        onChange={(event) => setField("instagram", event.target.value)}
      />

      <Input
        name="facebook"
        label="Facebook"
        value={values.facebook}
        error={fieldErrors.facebook}
        disabled={disabled}
        onChange={(event) => setField("facebook", event.target.value)}
      />

      <Input
        name="tiktok"
        label="TikTok"
        value={values.tiktok}
        error={fieldErrors.tiktok}
        disabled={disabled}
        onChange={(event) => setField("tiktok", event.target.value)}
      />

      <Input
        name="youtube"
        label="YouTube"
        value={values.youtube}
        error={fieldErrors.youtube}
        disabled={disabled}
        onChange={(event) => setField("youtube", event.target.value)}
      />
    </div>
  );
}
