"use server";

import { authorizeNotificationDispatch } from "@/features/notifications/lib/authorize-notification-dispatch";
import { dispatchNotificationSafely } from "@/features/notifications/lib/dispatch-notification";
import {
  notificationDispatchSchema,
  toNotificationTrigger,
} from "@/features/notifications/lib/dispatch-schema";
import type { NotificationDispatchInput } from "@/features/notifications/types";

export type DispatchNotificationActionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Browser entry for transactional emails (GAP-003).
 *
 * Validates payload + authorizes the caller, then dispatches on the server.
 * Never throws into checkout / auth / admin success paths.
 */
export async function dispatchNotificationAction(args: {
  input: NotificationDispatchInput;
  idToken?: string | null;
}): Promise<DispatchNotificationActionResult> {
  const parsed = notificationDispatchSchema.safeParse(args.input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid notification payload." };
  }

  const allowed = await authorizeNotificationDispatch(
    parsed.data,
    args.idToken,
  );

  if (!allowed) {
    console.warn("[notifications] dispatch rejected (unauthorized)", {
      event: parsed.data.event,
    });
    return { ok: false, error: "Unauthorized notification dispatch." };
  }

  await dispatchNotificationSafely(toNotificationTrigger(parsed.data));
  return { ok: true };
}
