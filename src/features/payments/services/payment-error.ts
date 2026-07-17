/**
 * Domain error for payment orchestration (RFC-015 / RFC-016).
 */
export class PaymentError extends Error {
  readonly code:
    | "invalid-method"
    | "checkout-failed"
    | "provider-error"
    | "webhook-invalid"
    | "unknown";

  constructor(
    message: string,
    code: PaymentError["code"] = "unknown",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "PaymentError";
    this.code = code;
  }
}
