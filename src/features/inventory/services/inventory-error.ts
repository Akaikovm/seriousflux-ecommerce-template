/**
 * Domain error for inventory reads and mutations (RFC-023).
 */
export class InventoryError extends Error {
  readonly code:
    | "invalid-input"
    | "not-found"
    | "insufficient-stock"
    | "permission-denied"
    | "unavailable"
    | "unknown";

  constructor(
    message: string,
    code: InventoryError["code"] = "unknown",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "InventoryError";
    this.code = code;
  }
}
