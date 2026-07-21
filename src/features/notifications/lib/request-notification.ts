import { getFirebaseAuth } from "@/firebase/auth";
import { dispatchNotificationAction } from "@/features/notifications/lib/dispatch-notification-action";
import type { NotificationDispatchInput } from "@/features/notifications/types";

/**
 * Client-side fire-and-forget notification request (RFC-019 / GAP-003).
 *
 * Attaches the current Firebase ID token when available so the server action
 * can authorize the event. External send still happens only on the server.
 *
 * Never throws into checkout / admin / auth success paths.
 */
export function requestNotification(
  input: NotificationDispatchInput,
): void {
  void (async () => {
    let idToken: string | null = null;
    try {
      idToken =
        (await getFirebaseAuth().currentUser?.getIdToken()) ?? null;
    } catch {
      idToken = null;
    }

    const result = await dispatchNotificationAction({ input, idToken });
    if (!result.ok) {
      console.error("[notifications] dispatch request rejected", {
        event: input.event,
        error: result.error,
      });
    }
  })().catch((error: unknown) => {
    console.error("[notifications] dispatch request failed", {
      event: input.event,
      error: error instanceof Error ? error.message : "unknown",
    });
  });
}
