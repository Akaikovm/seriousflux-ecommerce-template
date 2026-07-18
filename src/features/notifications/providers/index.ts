import { resendProvider } from "@/features/notifications/providers/resend";
import type {
  NotificationProvider,
  NotificationProviderId,
} from "@/features/notifications/types";

/**
 * Internal registry of implemented notification providers (RFC-019).
 *
 * Officially supported: Resend only (RFC-019.1). Do not add Admin UI for
 * switching vendors unless a client explicitly needs a second provider.
 *
 * To add a provider later (developer task):
 * 1. Implement `NotificationProvider`
 * 2. Register it in this Map
 * 3. Point StoreSettings.notifications.provider at it (code / seed — not Admin)
 * 4. Set server env secrets
 *
 * Checkout / Orders / Account do not need changes.
 */
export const notificationProviders: ReadonlyMap<
  NotificationProviderId,
  NotificationProvider
> = new Map<NotificationProviderId, NotificationProvider>([
  ["resend", resendProvider],
]);

export function getNotificationProvider(
  id: NotificationProviderId,
): NotificationProvider {
  if (id === "none") {
    throw new Error('Notification provider is set to "none".');
  }

  const provider = notificationProviders.get(id);
  if (!provider) {
    throw new Error(`No notification provider registered for "${id}".`);
  }
  return provider;
}
