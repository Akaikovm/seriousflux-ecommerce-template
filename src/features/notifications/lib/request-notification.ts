import type { NotificationDispatchInput } from "@/features/notifications/types";

/**
 * Client-side fire-and-forget request to the notifications API route (RFC-019).
 *
 * Never throws into checkout / admin / auth success paths.
 * External send happens only on the server (`/api/notifications/dispatch`).
 */
export function requestNotification(
  input: NotificationDispatchInput,
): void {
  void fetch("/api/notifications/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).catch((error: unknown) => {
    console.error("[notifications] dispatch request failed", {
      event: input.event,
      error: error instanceof Error ? error.message : "unknown",
    });
  });
}
