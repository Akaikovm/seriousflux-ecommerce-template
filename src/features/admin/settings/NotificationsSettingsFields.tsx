"use client";

import { Input } from "@/shared/ui/Input";
import { Switch } from "@/shared/ui/Switch";

/**
 * Business-facing notification fields only (RFC-019.1).
 * Provider / infrastructure are developer concerns (env + NotificationProvider).
 */
export type NotificationsFormValues = {
  senderName: string;
  senderEmail: string;
  enableCustomerEmails: boolean;
  enableAdminEmails: boolean;
  enableWelcomeEmail: boolean;
};

export type NotificationsFieldErrors = Partial<
  Record<keyof NotificationsFormValues, string>
>;

type NotificationsSettingsFieldsProps = {
  value: NotificationsFormValues;
  errors?: NotificationsFieldErrors;
  disabled?: boolean;
  onChange: (next: NotificationsFormValues) => void;
};

/**
 * Admin notification settings — business config only (RFC-019.1).
 *
 * The template officially supports Resend. Admins never choose a provider.
 * `NotificationProvider` remains for future extensibility (developers only).
 */
export function NotificationsSettingsFields({
  value,
  errors,
  disabled,
  onChange,
}: NotificationsSettingsFieldsProps) {
  function patch<K extends keyof NotificationsFormValues>(
    key: K,
    next: NotificationsFormValues[K],
  ) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Transactional email for orders, payments, and accounts. Delivery uses
        Resend (configured by developers via{" "}
        <code className="text-xs">RESEND_API_KEY</code>).
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="senderName"
          label="Sender name"
          value={value.senderName}
          error={errors?.senderName}
          disabled={disabled}
          onChange={(event) => patch("senderName", event.target.value)}
        />
        <Input
          name="senderEmail"
          label="Sender email"
          type="email"
          value={value.senderEmail}
          error={errors?.senderEmail}
          helperText="Must be verified in your Resend account."
          disabled={disabled}
          onChange={(event) => patch("senderEmail", event.target.value)}
        />
      </div>

      <Switch
        name="enableCustomerEmails"
        label="Enable customer emails"
        checked={value.enableCustomerEmails}
        disabled={disabled}
        onChange={(event) =>
          patch("enableCustomerEmails", event.target.checked)
        }
      />

      <Switch
        name="enableAdminEmails"
        label="Enable admin emails"
        checked={value.enableAdminEmails}
        disabled={disabled}
        onChange={(event) => patch("enableAdminEmails", event.target.checked)}
      />

      <Switch
        name="enableWelcomeEmail"
        label="Enable welcome email"
        checked={value.enableWelcomeEmail}
        disabled={disabled}
        onChange={(event) => patch("enableWelcomeEmail", event.target.checked)}
      />
    </div>
  );
}
