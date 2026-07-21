import { Timestamp } from "firebase/firestore";

/**
 * Converts client or Admin SDK timestamps into a client `Timestamp`
 * so domain mappers stay SDK-agnostic (GAP-004).
 */
export function toClientTimestamp(
  value: unknown,
  fallback: Timestamp = Timestamp.now(),
): Timestamp {
  if (value instanceof Timestamp) {
    return value;
  }

  if (
    value !== null &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as { toMillis: unknown }).toMillis === "function"
  ) {
    return Timestamp.fromMillis((value as { toMillis: () => number }).toMillis());
  }

  if (
    value !== null &&
    typeof value === "object" &&
    "seconds" in value &&
    typeof (value as { seconds: unknown }).seconds === "number"
  ) {
    const timed = value as { seconds: number; nanoseconds?: unknown };
    const seconds = timed.seconds;
    const nanos =
      typeof timed.nanoseconds === "number" ? timed.nanoseconds : 0;
    return Timestamp.fromMillis(seconds * 1000 + Math.floor(nanos / 1e6));
  }

  return fallback;
}

export function toOptionalClientTimestamp(value: unknown): Timestamp | undefined {
  if (value == null) {
    return undefined;
  }
  return toClientTimestamp(value);
}
