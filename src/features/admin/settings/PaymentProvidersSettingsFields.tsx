"use client";

import { listAdminPaymentProviderEntries } from "@/features/payments/lib/admin-payment-providers";
import type {
  PaymentProviderConfig,
  PaymentProviderSettingsKey,
  PaymentProvidersConfig,
} from "@/features/settings/types";
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
        No payment methods are registered for this store yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      <p className="pb-4 text-sm text-muted-foreground">
        Choose which methods appear at checkout. Labels are customer-facing.
        API keys stay in server environment variables.
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
                  ? "Visible at checkout"
                  : "Hidden from checkout"
              }
              checked={config.enabled}
              disabled={disabled}
              onChange={(event) =>
                patchProvider(key, { enabled: event.target.checked })
              }
            />

            <Input
              name={`paymentProviders.${key}.displayName`}
              label="Display name"
              value={config.displayName}
              error={fieldErrors?.displayName}
              disabled={disabled}
              onChange={(event) =>
                patchProvider(key, { displayName: event.target.value })
              }
            />

            <Input
              name={`paymentProviders.${key}.description`}
              label="Description"
              value={config.description}
              error={fieldErrors?.description}
              helperText="Short hint under the method name at checkout."
              disabled={disabled}
              onChange={(event) =>
                patchProvider(key, { description: event.target.value })
              }
            />

            <Input
              name={`paymentProviders.${key}.sortOrder`}
              label="Sort order"
              type="number"
              value={String(config.sortOrder)}
              error={fieldErrors?.sortOrder}
              helperText="Lower numbers appear first."
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
