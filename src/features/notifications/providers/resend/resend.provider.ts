import { Resend } from "resend";

import { NotificationError } from "@/features/notifications/services/notification-error";
import type {
  NotificationMessage,
  NotificationProvider,
  NotificationSendResult,
} from "@/features/notifications/types";

import { getResendConfig } from "./resend.config";

/**
 * Resend transport — default and only officially supported NotificationProvider
 * (RFC-019 / RFC-019.1). Additional providers may implement the same interface later.
 */
export const resendProvider: NotificationProvider = {
  id: "resend",

  async send(message: NotificationMessage): Promise<NotificationSendResult> {
    try {
      const { apiKey } = getResendConfig();
      const client = new Resend(apiKey);

      const from = message.from.name
        ? `${message.from.name} <${message.from.email}>`
        : message.from.email;

      const { data, error } = await client.emails.send({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { replyTo: message.replyTo } : {}),
      });

      if (error) {
        throw new NotificationError(
          error.message || "Resend rejected the email.",
          "provider-error",
          { cause: error },
        );
      }

      return { id: data?.id };
    } catch (error) {
      if (error instanceof NotificationError) {
        throw error;
      }
      throw new NotificationError(
        "Failed to send email via Resend.",
        "provider-error",
        { cause: error },
      );
    }
  },
};
