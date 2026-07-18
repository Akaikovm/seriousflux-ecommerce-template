"use client";

import type { SettingsSectionProps } from "@/features/admin/settings/types/settings-section";
import { Input } from "@/shared/ui/Input";
import { Textarea } from "@/shared/ui/Textarea";

/**
 * Store identity and market locale fields.
 */
export function GeneralSettingsSection({
  values,
  fieldErrors,
  disabled,
  setField,
}: SettingsSectionProps) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Input
        name="storeName"
        label="Store name"
        value={values.storeName}
        error={fieldErrors.storeName}
        disabled={disabled}
        onChange={(event) => setField("storeName", event.target.value)}
      />

      <Input
        name="tagline"
        label="Tagline"
        value={values.tagline}
        error={fieldErrors.tagline}
        disabled={disabled}
        onChange={(event) => setField("tagline", event.target.value)}
      />

      <Textarea
        name="description"
        label="Description"
        value={values.description}
        error={fieldErrors.description}
        helperText="Used for storefront about copy and page metadata."
        disabled={disabled}
        onChange={(event) => setField("description", event.target.value)}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          name="currency"
          label="Currency"
          value={values.currency}
          error={fieldErrors.currency}
          helperText="ISO 4217, e.g. ARS"
          disabled={disabled}
          onChange={(event) =>
            setField("currency", event.target.value.toUpperCase())
          }
        />
        <Input
          name="country"
          label="Country"
          value={values.country}
          error={fieldErrors.country}
          helperText="ISO 3166-1, e.g. AR"
          disabled={disabled}
          onChange={(event) =>
            setField("country", event.target.value.toUpperCase())
          }
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          name="locale"
          label="Locale"
          value={values.locale}
          error={fieldErrors.locale}
          helperText="BCP 47, e.g. es-AR"
          disabled={disabled}
          onChange={(event) => setField("locale", event.target.value)}
        />
        <Input
          name="language"
          label="Language"
          value={values.language}
          error={fieldErrors.language}
          helperText="UI language, e.g. es"
          disabled={disabled}
          onChange={(event) => setField("language", event.target.value)}
        />
      </div>
    </div>
  );
}
