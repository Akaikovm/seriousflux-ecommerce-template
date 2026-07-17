/**
 * Human-friendly order reference helpers (RFC-013).
 *
 * Firestore document ids stay internal. Customers see `orderNumber` on
 * confirmation, receipts, and support — never the raw document id.
 *
 * Format: `SF-YYYYMMDD-XXXX` (e.g. `SF-20260717-A3K9`).
 * Uniqueness is probabilistic for v1; a uniqueness check can land with
 * OrderService reads in a later RFC if collision risk becomes real.
 */

const ORDER_NUMBER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSuffix(length = 4): string {
  let result = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i += 1) {
    result += ORDER_NUMBER_ALPHABET[bytes[i]! % ORDER_NUMBER_ALPHABET.length];
  }
  return result;
}

function formatDateStamp(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/** Builds a customer-facing order number. */
export function generateOrderNumber(now: Date = new Date()): string {
  return `SF-${formatDateStamp(now)}-${randomSuffix(4)}`;
}
