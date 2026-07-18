import { OrderService } from "@/features/orders/services";
import type { Order } from "@/features/orders/types";
import { getNotificationProvider } from "@/features/notifications/providers";
import { resolveNotificationsSettings } from "@/features/notifications/lib/default-notifications-settings";
import { NotificationError } from "@/features/notifications/services/notification-error";
import {
  renderAccountWelcome,
  renderAdminOrderCreated,
  renderAdminPaymentReceived,
  renderOrderCancelled,
  renderOrderCreated,
  renderOrderShipped,
  renderPaymentApproved,
  renderPaymentFailed,
} from "@/features/notifications/templates";
import type { EmailBrandContext } from "@/features/notifications/templates/layout";
import type {
  NotificationEvent,
  NotificationMessage,
  NotificationTrigger,
} from "@/features/notifications/types";
import { StoreSettingsService } from "@/features/settings/services";
import type { StoreSettings } from "@/features/settings/types";

export type NotificationDispatchResult = {
  event: NotificationEvent | NotificationTrigger["type"];
  sent: number;
  skipped: string[];
};

/**
 * Facade for transactional email (RFC-019).
 *
 * - Never persists orders / customers
 * - Only invoked from server API routes (or webhook routes)
 * - Provider failures become NotificationError — callers must not roll back business ops
 */
export class NotificationService {
  constructor(
    private readonly settingsService: StoreSettingsService = new StoreSettingsService(),
    private readonly orderService: OrderService = new OrderService(),
  ) {}

  /**
   * Handles a high-level trigger (may fan out to customer + admin emails).
   * Swallows nothing — route handlers catch and log.
   */
  async dispatch(
    trigger: NotificationTrigger,
  ): Promise<NotificationDispatchResult> {
    const settings = await this.settingsService.getGeneralSettings();
    const notifications = resolveNotificationsSettings({
      notifications: settings.notifications,
      storeEmail: settings.email,
      storeName: settings.storeName,
    });

    if (notifications.provider === "none") {
      return {
        event: trigger.type,
        sent: 0,
        skipped: ["provider-none"],
      };
    }

    if (!notifications.senderEmail.trim()) {
      throw new NotificationError(
        "Notification sender email is not configured.",
        "misconfigured",
      );
    }

    let provider;
    try {
      provider = getNotificationProvider(notifications.provider);
    } catch (error) {
      throw new NotificationError(
        "Notification provider is not available.",
        "unavailable",
        { cause: error },
      );
    }

    const brand = this.toBrand(settings);
    const locale = settings.locale || "es-AR";
    const skipped: string[] = [];
    let sent = 0;

    const send = async (
      event: NotificationEvent,
      to: string,
      rendered: { subject: string; html: string; text: string },
      orderId?: string,
    ) => {
      if (!to.trim()) {
        skipped.push(`${event}:missing-recipient`);
        return;
      }

      const message: NotificationMessage = {
        to: to.trim(),
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        from: {
          email: notifications.senderEmail.trim(),
          name: notifications.senderName.trim() || settings.storeName,
        },
        replyTo: notifications.replyTo.trim() || undefined,
        tags: { event, orderId },
      };

      try {
        await provider.send(message);
      } catch (error) {
        if (error instanceof NotificationError) {
          throw error;
        }
        throw new NotificationError(
          "Failed to send notification.",
          "provider-error",
          { cause: error },
        );
      }
      sent += 1;
    };

    switch (trigger.type) {
      case "order.created": {
        const order = await this.requireOrder(trigger.orderId);
        if (notifications.enableCustomerEmails) {
          await send(
            "order.created",
            order.customerEmail,
            renderOrderCreated(order, brand, locale),
            order.id,
          );
        } else {
          skipped.push("order.created:customer-disabled");
        }
        if (notifications.enableAdminEmails && notifications.adminEmail) {
          await send(
            "admin.order.created",
            notifications.adminEmail,
            renderAdminOrderCreated(order, brand, locale),
            order.id,
          );
        } else {
          skipped.push("admin.order.created:disabled");
        }
        break;
      }
      case "payment.approved": {
        const order = await this.requireOrder(trigger.orderId);
        if (notifications.enableCustomerEmails) {
          await send(
            "payment.approved",
            order.customerEmail,
            renderPaymentApproved(order, brand, locale),
            order.id,
          );
        } else {
          skipped.push("payment.approved:customer-disabled");
        }
        if (notifications.enableAdminEmails && notifications.adminEmail) {
          await send(
            "admin.payment.received",
            notifications.adminEmail,
            renderAdminPaymentReceived(order, brand, locale),
            order.id,
          );
        } else {
          skipped.push("admin.payment.received:disabled");
        }
        break;
      }
      case "payment.failed": {
        const order = await this.requireOrder(trigger.orderId);
        if (notifications.enableCustomerEmails) {
          await send(
            "payment.failed",
            order.customerEmail,
            renderPaymentFailed(order, brand),
            order.id,
          );
        } else {
          skipped.push("payment.failed:customer-disabled");
        }
        break;
      }
      case "order.cancelled": {
        const order = await this.requireOrder(trigger.orderId);
        if (notifications.enableCustomerEmails) {
          await send(
            "order.cancelled",
            order.customerEmail,
            renderOrderCancelled(order, brand),
            order.id,
          );
        } else {
          skipped.push("order.cancelled:customer-disabled");
        }
        break;
      }
      case "order.shipped": {
        const order = await this.requireOrder(trigger.orderId);
        if (notifications.enableCustomerEmails) {
          await send(
            "order.shipped",
            order.customerEmail,
            renderOrderShipped(order, brand),
            order.id,
          );
        } else {
          skipped.push("order.shipped:customer-disabled");
        }
        break;
      }
      case "account.welcome": {
        if (!notifications.enableWelcomeEmail) {
          return {
            event: trigger.type,
            sent: 0,
            skipped: ["account.welcome:disabled"],
          };
        }
        if (!notifications.enableCustomerEmails) {
          return {
            event: trigger.type,
            sent: 0,
            skipped: ["account.welcome:customer-disabled"],
          };
        }
        const displayName =
          trigger.displayName?.trim() ||
          trigger.email.split("@")[0] ||
          "there";
        await send(
          "account.welcome",
          trigger.email,
          renderAccountWelcome({
            displayName,
            brand,
          }),
        );
        break;
      }
      default: {
        const _exhaustive: never = trigger;
        throw new NotificationError(
          `Unsupported notification trigger: ${JSON.stringify(_exhaustive)}`,
          "invalid-input",
        );
      }
    }

    return { event: trigger.type, sent, skipped };
  }

  private async requireOrder(orderId: string): Promise<Order> {
    const id = orderId.trim();
    if (!id) {
      throw new NotificationError("Order id is required.", "invalid-input");
    }
    const order = await this.orderService.getById(id);
    if (!order) {
      throw new NotificationError("Order not found.", "not-found");
    }
    return order;
  }

  private toBrand(settings: StoreSettings): EmailBrandContext {
    return {
      storeName: settings.storeName || "Store",
      supportEmail: settings.email || "",
      logoUrl: settings.logo || undefined,
    };
  }
}
