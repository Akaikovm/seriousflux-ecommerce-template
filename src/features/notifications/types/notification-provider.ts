import type { NotificationEvent } from "./notification-event";

/** Implemented / reserved provider ids (mirrors Store Settings). */
export type NotificationProviderId =
  | "resend"
  | "sendgrid"
  | "mailgun"
  | "ses"
  | "postmark"
  | "none";

/**
 * Provider-agnostic email message after templates are rendered.
 */
export interface NotificationMessage {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from: { email: string; name?: string };
  replyTo?: string;
  /** Correlation for logs — not required by provider SDKs. */
  tags?: {
    event: NotificationEvent;
    orderId?: string;
  };
}

export interface NotificationSendResult {
  /** Provider message id when available. */
  id?: string;
}

/**
 * Provider contract for the notification abstraction (RFC-019).
 *
 * Resend is the only officially supported implementation (RFC-019.1).
 * This interface exists so SendGrid / SES / etc. can be added later by
 * developers without changing Checkout, Orders, or Account — do not expose
 * provider selection in the Admin product UI.
 *
 * Checkout, Orders, and Account never import concrete providers —
 * only NotificationService (via server API routes) may resolve them.
 */
export interface NotificationProvider {
  readonly id: NotificationProviderId;

  send(message: NotificationMessage): Promise<NotificationSendResult>;
}
