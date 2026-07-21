"use client";

import type { SettingsSectionProps } from "@/features/admin/settings/types/settings-section";
import { AdminSectionDivider } from "@/features/admin/ui/AdminSection";
import { ImageUpload } from "@/features/media/components/ImageUpload";
import { useT } from "@/i18n";
import { Input } from "@/shared/ui/Input";
import { Textarea } from "@/shared/ui/Textarea";

/**
 * Brand assets, theme colors, and homepage hero.
 */
export function BrandingSettingsSection({
  values,
  fieldErrors,
  disabled,
  setField,
  setHeroField,
}: SettingsSectionProps) {
  const t = useT();

  return (
    <div className="flex flex-col gap-4">
      <ImageUpload
        label={t("admin.settings.branding.logo")}
        folder="branding"
        value={values.logo}
        error={fieldErrors.logo}
        disabled={disabled}
        onChange={(url) => setField("logo", url)}
      />

      <ImageUpload
        label={t("admin.settings.branding.favicon")}
        folder="branding"
        value={values.favicon}
        error={fieldErrors.favicon}
        disabled={disabled}
        onChange={(url) => setField("favicon", url)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="primaryColor"
          label={t("admin.settings.branding.primaryColor")}
          type="text"
          value={values.primaryColor}
          error={fieldErrors.primaryColor}
          helperText={t("admin.settings.branding.hexHelper")}
          disabled={disabled}
          onChange={(event) => setField("primaryColor", event.target.value)}
        />
        <Input
          name="secondaryColor"
          label={t("admin.settings.branding.secondaryColor")}
          type="text"
          value={values.secondaryColor}
          error={fieldErrors.secondaryColor}
          helperText={t("admin.settings.branding.secondaryHexHelper")}
          disabled={disabled}
          onChange={(event) => setField("secondaryColor", event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-end gap-2">
          <span
            className="mb-2 size-8 shrink-0 rounded-md border border-border"
            style={{ background: values.primaryColor }}
            aria-hidden
          />
          <Input
            name="primaryColorPicker"
            label={t("admin.settings.branding.primaryPreview")}
            type="color"
            value={
              /^#([0-9A-Fa-f]{6})$/.test(values.primaryColor)
                ? values.primaryColor
                : "#0A0A0A"
            }
            disabled={disabled}
            onChange={(event) =>
              setField("primaryColor", event.target.value.toUpperCase())
            }
          />
        </div>
        <div className="flex items-end gap-2">
          <span
            className="mb-2 size-8 shrink-0 rounded-md border border-border"
            style={{ background: values.secondaryColor }}
            aria-hidden
          />
          <Input
            name="secondaryColorPicker"
            label={t("admin.settings.branding.secondaryPreview")}
            type="color"
            value={
              /^#([0-9A-Fa-f]{6})$/.test(values.secondaryColor)
                ? values.secondaryColor
                : "#E10600"
            }
            disabled={disabled}
            onChange={(event) =>
              setField("secondaryColor", event.target.value.toUpperCase())
            }
          />
        </div>
      </div>

      <AdminSectionDivider
        title={t("admin.settings.branding.homepageHero")}
        hint={t("admin.settings.branding.homepageHeroHint")}
      />

      <Input
        name="heroTitle"
        label={t("admin.settings.branding.heroTitle")}
        value={values.hero.title}
        error={fieldErrors.hero?.title}
        disabled={disabled}
        onChange={(event) => setHeroField("title", event.target.value)}
      />

      <Textarea
        name="heroSubtitle"
        label={t("admin.settings.branding.heroSubtitle")}
        value={values.hero.subtitle}
        error={fieldErrors.hero?.subtitle}
        disabled={disabled}
        onChange={(event) => setHeroField("subtitle", event.target.value)}
      />

      <ImageUpload
        label={t("admin.settings.branding.heroImage")}
        folder="branding"
        value={values.hero.image}
        error={fieldErrors.hero?.image}
        disabled={disabled}
        onChange={(url) => setHeroField("image", url)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="heroCtaText"
          label={t("admin.settings.branding.heroCtaLabel")}
          value={values.hero.ctaText}
          error={fieldErrors.hero?.ctaText}
          disabled={disabled}
          onChange={(event) => setHeroField("ctaText", event.target.value)}
        />
        <Input
          name="heroCtaHref"
          label={t("admin.settings.branding.heroCtaHref")}
          value={values.hero.ctaHref}
          error={fieldErrors.hero?.ctaHref}
          helperText={t("admin.settings.branding.ctaHrefHelper")}
          disabled={disabled}
          onChange={(event) => setHeroField("ctaHref", event.target.value)}
        />
      </div>
    </div>
  );
}
