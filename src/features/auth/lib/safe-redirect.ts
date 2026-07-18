/**
 * Sanitize post-auth redirect targets (RFC-018).
 * Only relative same-origin paths are allowed — blocks open redirects.
 */

const DEFAULT_REDIRECT = "/account";

/**
 * Returns a safe in-app path, or `fallback` when the value is missing/unsafe.
 */
export function sanitizeRedirectTo(
  value: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  if (!trimmed.startsWith("/")) {
    return fallback;
  }

  if (trimmed.startsWith("//") || trimmed.includes("://") || trimmed.includes("\\")) {
    return fallback;
  }

  return trimmed;
}

/** Build `/login?redirectTo=…` for protected routes. */
export function buildLoginHref(redirectTo?: string | null): string {
  const target = sanitizeRedirectTo(redirectTo, DEFAULT_REDIRECT);
  return `/login?redirectTo=${encodeURIComponent(target)}`;
}

/** Build `/signup?redirectTo=…`. */
export function buildSignupHref(redirectTo?: string | null): string {
  const target = sanitizeRedirectTo(redirectTo, DEFAULT_REDIRECT);
  return `/signup?redirectTo=${encodeURIComponent(target)}`;
}
