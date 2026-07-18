import type { NotificationsSettings } from "@/features/settings/types/notifications";

/**
 * Defaults when `settings/general.notifications` is missing.
 * Provider is always Resend (officially supported — RFC-019.1).
 * Sending stays off until an admin enables flags and configures a verified sender.
 */
export const DEFAULT_NOTIFICATIONS_SETTINGS: NotificationsSettings = {
  provider: "resend",
  senderEmail: "",
  senderName: "",
  replyTo: "",
  adminEmail: "",
  enableCustomerEmails: false,
  enableAdminEmails: false,
  enableWelcomeEmail: false,
};

export function mapNotificationsSettings(
  raw: unknown,
  defaults: NotificationsSettings = DEFAULT_NOTIFICATIONS_SETTINGS,
): NotificationsSettings {
  if (!raw || typeof raw !== "object") {
    return { ...defaults };
  }

  const data = raw as Record<string, unknown>;

  const providerRaw = data.provider;
  const provider =
    providerRaw === "resend" ||
    providerRaw === "sendgrid" ||
    providerRaw === "mailgun" ||
    providerRaw === "ses" ||
    providerRaw === "postmark" ||
    providerRaw === "none"
      ? providerRaw
      : defaults.provider;

  return {
    provider,
    senderEmail:
      typeof data.senderEmail === "string"
        ? data.senderEmail
        : defaults.senderEmail,
    senderName:
      typeof data.senderName === "string"
        ? data.senderName
        : defaults.senderName,
    replyTo: typeof data.replyTo === "string" ? data.replyTo : defaults.replyTo,
    adminEmail:
      typeof data.adminEmail === "string"
        ? data.adminEmail
        : defaults.adminEmail,
    enableCustomerEmails:
      typeof data.enableCustomerEmails === "boolean"
        ? data.enableCustomerEmails
        : defaults.enableCustomerEmails,
    enableAdminEmails:
      typeof data.enableAdminEmails === "boolean"
        ? data.enableAdminEmails
        : defaults.enableAdminEmails,
    enableWelcomeEmail:
      typeof data.enableWelcomeEmail === "boolean"
        ? data.enableWelcomeEmail
        : defaults.enableWelcomeEmail,
  };
}

/**
 * Resolves effective notification config using store contact as fallbacks.
 */
export function resolveNotificationsSettings(input: {
  notifications?: NotificationsSettings | null;
  storeEmail: string;
  storeName: string;
}): NotificationsSettings {
  const base = input.notifications
    ? { ...input.notifications }
    : { ...DEFAULT_NOTIFICATIONS_SETTINGS };

  if (!base.senderName.trim()) {
    base.senderName = input.storeName.trim() || "Store";
  }
  if (!base.replyTo.trim()) {
    base.replyTo = input.storeEmail.trim();
  }
  if (!base.adminEmail.trim()) {
    base.adminEmail = input.storeEmail.trim();
  }
  if (!base.senderEmail.trim() && input.storeEmail.trim()) {
    // Prefer an explicit sender; fall back to support email for local/dev.
    base.senderEmail = input.storeEmail.trim();
  }

  return base;
}
