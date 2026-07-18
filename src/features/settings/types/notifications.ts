/**
 * Public notification configuration stored on `settings/general` (RFC-019 / RFC-019.1).
 *
 * SECURITY: Store ONLY public fields. Never store API keys — those stay in
 * server env vars (e.g. `RESEND_API_KEY`).
 *
 * Admin UI (RFC-019.1) edits only business fields: sender + enable toggles.
 * `provider` is always Resend for the supported product experience; other
 * slots remain in the type for future developer-led integrations.
 */

/** Known email transport slots. Officially supported: Resend only. */
export type NotificationProviderSettingsId =
  | "resend"
  | "sendgrid"
  | "mailgun"
  | "ses"
  | "postmark"
  | "none";

/**
 * Nested public config for transactional email.
 *
 * Product UX: Admin configures sender + toggles only.
 * Infrastructure (API keys, provider choice) is developer-owned.
 */
export interface NotificationsSettings {
  /**
   * Active transport. Product default is always `"resend"`.
   * Other values are reserved for future providers — not exposed in Admin UI.
   */
  provider: NotificationProviderSettingsId;

  /** Verified sender address (Resend). */
  senderEmail: string;

  /** Display name for the From header. */
  senderName: string;

  /**
   * Reply-To address. When empty, falls back to StoreSettings.email.
   * Not shown in Admin UI (RFC-019.1) — resolved automatically.
   */
  replyTo: string;

  /**
   * Ops inbox for admin alerts. When empty, falls back to StoreSettings.email.
   * Not shown in Admin UI (RFC-019.1) — resolved automatically.
   */
  adminEmail: string;

  /** Customer-facing transactional emails (order / payment / shipped / …). */
  enableCustomerEmails: boolean;

  /** Admin / ops alerts (new order, payment received). */
  enableAdminEmails: boolean;

  /**
   * Welcome email after signup / first identity bootstrap.
   * Independent of other customer emails so welcome can be toggled alone.
   */
  enableWelcomeEmail: boolean;
}
