import "server-only";

import {
  NotificationError,
  NotificationService,
  type NotificationDispatchResult,
} from "@/features/notifications/services";
import type { NotificationTrigger } from "@/features/notifications/types";

/**
 * Server-side safe dispatch used by API routes and webhooks.
 * Logs failures; never rethrows (business ops already succeeded).
 */
export async function dispatchNotificationSafely(
  trigger: NotificationTrigger,
  service: NotificationService = new NotificationService(),
): Promise<NotificationDispatchResult | null> {
  try {
    return await service.dispatch(trigger);
  } catch (error) {
    const code =
      error instanceof NotificationError ? error.code : "unknown";
    console.error("[notifications] dispatch failed", {
      type: trigger.type,
      code,
      message: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}
