import type { AppLanguage } from "@/i18n/types";
import { SUPPORTED_LANGUAGES } from "@/i18n/config";

/** Cookie name for optional shopper language override. */
export const LANGUAGE_COOKIE_NAME = "sf_lang";

/** Persist preference for one year. */
export const LANGUAGE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Parses a raw cookie value into a supported language, or `null` if invalid.
 */
export function parseLanguageCookie(
  value: string | null | undefined,
): AppLanguage | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(normalized)) {
    return normalized as AppLanguage;
  }

  return null;
}

/**
 * Writes the language preference cookie (client-side).
 * Call `router.refresh()` afterward so the server re-resolves dictionaries.
 */
export function writeLanguageCookie(language: AppLanguage): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = [
    `${LANGUAGE_COOKIE_NAME}=${language}`,
    "path=/",
    `max-age=${LANGUAGE_COOKIE_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ].join("; ");
}
