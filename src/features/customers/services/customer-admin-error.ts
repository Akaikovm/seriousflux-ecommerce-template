/**
 * Domain error for Admin customer operations (RFC-022).
 */
export class CustomerAdminError extends Error {
  readonly code:
    | "invalid-input"
    | "not-found"
    | "last-admin"
    | "permission-denied"
    | "unavailable"
    | "unknown";

  constructor(
    message: string,
    code: CustomerAdminError["code"] = "unknown",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "CustomerAdminError";
    this.code = code;
  }
}
