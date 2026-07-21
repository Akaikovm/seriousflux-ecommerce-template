"use client";

import type { SettingsSectionProps } from "@/features/admin/settings/types/settings-section";
import { useT } from "@/i18n";
import { Input } from "@/shared/ui/Input";
import { Switch } from "@/shared/ui/Switch";
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
  const t = useT();

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Input
        name="storeName"
        label={t("admin.settings.general.storeName")}
        value={values.storeName}
        error={fieldErrors.storeName}
        disabled={disabled}
        onChange={(event) => setField("storeName", event.target.value)}
      />

      <Input
        name="tagline"
        label={t("admin.settings.general.tagline")}
        value={values.tagline}
        error={fieldErrors.tagline}
        disabled={disabled}
        onChange={(event) => setField("tagline", event.target.value)}
      />

      <Textarea
        name="description"
        label={t("admin.settings.general.description")}
        value={values.description}
        error={fieldErrors.description}
        helperText={t("admin.settings.general.descriptionHelper")}
        disabled={disabled}
        onChange={(event) => setField("description", event.target.value)}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          name="currency"
          label={t("admin.settings.general.currency")}
          value={values.currency}
          error={fieldErrors.currency}
          helperText={t("admin.settings.general.currencyHelper")}
          disabled={disabled}
          onChange={(event) =>
            setField("currency", event.target.value.toUpperCase())
          }
        />
        <Input
          name="country"
          label={t("admin.settings.general.country")}
          value={values.country}
          error={fieldErrors.country}
          helperText={t("admin.settings.general.countryHelper")}
          disabled={disabled}
          onChange={(event) =>
            setField("country", event.target.value.toUpperCase())
          }
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          name="locale"
          label={t("admin.settings.general.locale")}
          value={values.locale}
          error={fieldErrors.locale}
          helperText={t("admin.settings.general.localeHelper")}
          disabled={disabled}
          onChange={(event) => setField("locale", event.target.value)}
        />
        <Input
          name="language"
          label={t("admin.settings.general.language")}
          value={values.language}
          error={fieldErrors.language}
          helperText={t("admin.settings.general.languageHelper")}
          disabled={disabled}
          onChange={(event) => setField("language", event.target.value)}
        />
      </div>

      <Switch
        name="allowLanguageSwitch"
        label={t("admin.settings.general.allowLanguageSwitch")}
        helperText={t("admin.settings.general.allowLanguageSwitchHelper")}
        checked={values.allowLanguageSwitch}
        disabled={disabled}
        onChange={(event) =>
          setField("allowLanguageSwitch", event.target.checked)
        }
      />
    </div>
  );
}
