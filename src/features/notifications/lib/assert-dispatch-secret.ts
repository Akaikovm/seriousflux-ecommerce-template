import { timingSafeEqual } from "node:crypto";

/** Env var for trusted server-to-server callers of the HTTP dispatch route. */
export const NOTIFICATIONS_DISPATCH_SECRET_ENV =
  "NOTIFICATIONS_DISPATCH_SECRET";

/** Preferred header for the shared dispatch secret. */
export const DISPATCH_SECRET_HEADER = "x-notifications-dispatch-secret";

/**
 * Extracts a candidate dispatch secret from request headers.
 * Accepts `x-notifications-dispatch-secret` or `Authorization: Bearer …`.
 */
export function extractDispatchSecret(request: Request): string | null {
  const headerSecret = request.headers.get(DISPATCH_SECRET_HEADER)?.trim();
  if (headerSecret) {
    return headerSecret;
  }

  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  return match?.[1]?.trim() || null;
}

function secretsEqual(expected: string, provided: string): boolean {
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);

  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }

  return timingSafeEqual(expectedBuf, providedBuf);
}

export type DispatchSecretCheck =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

/**
 * Fail-closed shared-secret check for `POST /api/notifications/dispatch`.
 *
 * When the env secret is missing, the route refuses all callers (misconfigured
 * deploy must not stay open). Browser UI does not use this path — see the
 * server action + Firebase token authorization instead.
 */
export function assertDispatchSecret(request: Request): DispatchSecretCheck {
  const expected = process.env[NOTIFICATIONS_DISPATCH_SECRET_ENV]?.trim();

  if (!expected) {
    return {
      ok: false,
      status: 503,
      error:
        "Notification dispatch is not configured (missing NOTIFICATIONS_DISPATCH_SECRET).",
    };
  }

  const provided = extractDispatchSecret(request);
  if (!provided || !secretsEqual(expected, provided)) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized notification dispatch.",
    };
  }

  return { ok: true };
}
