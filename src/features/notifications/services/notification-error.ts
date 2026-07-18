/**
 * Domain error for notification sends (RFC-019).
 * Never thrown into OrderService / checkout success paths —
 * API routes catch and log.
 */
export class NotificationError extends Error {
  readonly code:
    | "unavailable"
    | "invalid-input"
    | "not-found"
    | "skipped"
    | "provider-error"
    | "misconfigured"
    | "unknown";

  constructor(
    message: string,
    code: NotificationError["code"] = "unknown",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "NotificationError";
    this.code = code;
  }
}
