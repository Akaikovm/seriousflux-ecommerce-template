"use client";

import type { SettingsSectionProps } from "@/features/admin/settings/types/settings-section";
import { AdminSectionDivider } from "@/features/admin/ui/AdminSection";
import { ImageUpload } from "@/features/media/components/ImageUpload";
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
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <ImageUpload
        label="Logo"
        folder="branding"
        value={values.logo}
        error={fieldErrors.logo}
        disabled={disabled}
        onChange={(url) => setField("logo", url)}
      />

      <ImageUpload
        label="Favicon"
        folder="branding"
        value={values.favicon}
        error={fieldErrors.favicon}
        disabled={disabled}
        onChange={(url) => setField("favicon", url)}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          name="primaryColor"
          label="Primary color"
          type="text"
          value={values.primaryColor}
          error={fieldErrors.primaryColor}
          helperText="Hex format, e.g. #0A0A0A"
          disabled={disabled}
          onChange={(event) => setField("primaryColor", event.target.value)}
        />
        <Input
          name="secondaryColor"
          label="Secondary color"
          type="text"
          value={values.secondaryColor}
          error={fieldErrors.secondaryColor}
          helperText="Hex format, e.g. #E10600"
          disabled={disabled}
          onChange={(event) => setField("secondaryColor", event.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex items-end gap-2">
          <span
            className="mb-2 size-8 shrink-0 rounded-md border border-border"
            style={{ background: values.primaryColor }}
            aria-hidden
          />
          <Input
            name="primaryColorPicker"
            label="Primary preview"
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
            label="Secondary preview"
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
        title="Homepage hero"
        hint="Full-bleed storefront hero content."
      />

      <Input
        name="heroTitle"
        label="Hero title"
        value={values.hero.title}
        error={fieldErrors.hero?.title}
        disabled={disabled}
        onChange={(event) => setHeroField("title", event.target.value)}
      />

      <Textarea
        name="heroSubtitle"
        label="Hero subtitle"
        value={values.hero.subtitle}
        error={fieldErrors.hero?.subtitle}
        disabled={disabled}
        onChange={(event) => setHeroField("subtitle", event.target.value)}
      />

      <ImageUpload
        label="Hero image"
        folder="branding"
        value={values.hero.image}
        error={fieldErrors.hero?.image}
        disabled={disabled}
        onChange={(url) => setHeroField("image", url)}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          name="heroCtaText"
          label="CTA text"
          value={values.hero.ctaText}
          error={fieldErrors.hero?.ctaText}
          disabled={disabled}
          onChange={(event) => setHeroField("ctaText", event.target.value)}
        />
        <Input
          name="heroCtaHref"
          label="CTA link"
          value={values.hero.ctaHref}
          error={fieldErrors.hero?.ctaHref}
          helperText="Internal path, e.g. /#featured"
          disabled={disabled}
          onChange={(event) => setHeroField("ctaHref", event.target.value)}
        />
      </div>
    </div>
  );
}
