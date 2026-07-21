"use client";

import { listAdminPaymentProviderEntries } from "@/features/payments/lib/admin-payment-providers";
import type {
  PaymentProviderConfig,
  PaymentProviderSettingsKey,
  PaymentProvidersConfig,
} from "@/features/settings/types";
import { useT } from "@/i18n";
import { Input } from "@/shared/ui/Input";
import { Switch } from "@/shared/ui/Switch";

export type PaymentProviderFieldErrors = Partial<
  Record<
    PaymentProviderSettingsKey,
    Partial<Record<keyof PaymentProviderConfig, string>>
  >
>;

type PaymentProvidersSettingsFieldsProps = {
  value: PaymentProvidersConfig;
  errors?: PaymentProviderFieldErrors;
  disabled?: boolean;
  onChange: (next: PaymentProvidersConfig) => void;
};

/**
 * Admin controls for registered payment providers (enable, labels, order).
 * Credentials stay in server env — never edited here.
 */
export function PaymentProvidersSettingsFields({
  value,
  errors,
  disabled = false,
  onChange,
}: PaymentProvidersSettingsFieldsProps) {
  const t = useT();
  const entries = listAdminPaymentProviderEntries(value);

  function patchProvider(
    key: PaymentProviderSettingsKey,
    patch: Partial<PaymentProviderConfig>,
  ) {
    onChange({
      ...value,
      [key]: {
        ...value[key],
        ...patch,
      },
    });
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("admin.settings.payments.empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      <p className="pb-4 text-sm text-muted-foreground">
        {t("admin.settings.payments.intro")}
      </p>

      {entries.map(({ key, config }) => {
        const fieldErrors = errors?.[key];
        const enabledId = `payment-${key}-enabled`;

        return (
          <div key={key} className="flex flex-col gap-3 py-4">
            <Switch
              id={enabledId}
              name={`paymentProviders.${key}.enabled`}
              label={config.displayName || key}
              helperText={
                config.enabled
                  ? t("admin.settings.payments.visibleAtCheckout")
                  : t("admin.settings.payments.hiddenFromCheckout")
              }
              checked={config.enabled}
              disabled={disabled}
              onChange={(event) =>
                patchProvider(key, { enabled: event.target.checked })
              }
            />

            <Input
              name={`paymentProviders.${key}.displayName`}
              label={t("admin.settings.payments.displayName")}
              value={config.displayName}
              error={fieldErrors?.displayName}
              disabled={disabled}
              onChange={(event) =>
                patchProvider(key, { displayName: event.target.value })
              }
            />

            <Input
              name={`paymentProviders.${key}.description`}
              label={t("admin.settings.payments.description")}
              value={config.description}
              error={fieldErrors?.description}
              helperText={t("admin.settings.payments.descriptionHelper")}
              disabled={disabled}
              onChange={(event) =>
                patchProvider(key, { description: event.target.value })
              }
            />

            <Input
              name={`paymentProviders.${key}.sortOrder`}
              label={t("admin.settings.payments.sortOrder")}
              type="number"
              value={String(config.sortOrder)}
              error={fieldErrors?.sortOrder}
              helperText={t("admin.settings.payments.sortOrderHelper")}
              disabled={disabled}
              onChange={(event) => {
                const next = Number(event.target.value);
                patchProvider(key, {
                  sortOrder: Number.isFinite(next) ? next : config.sortOrder,
                });
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
