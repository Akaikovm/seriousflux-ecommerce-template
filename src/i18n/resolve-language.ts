import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "@/i18n/config";
import type { AppLanguage } from "@/i18n/types";

/**
 * Maps StoreSettings.language (or any free-form code) onto a supported UI language.
 * Accepts `"es"`, `"es-AR"`, `"en-US"`, etc.
 */
export function resolveLanguage(value: string | null | undefined): AppLanguage {
  if (!value) {
    return DEFAULT_LANGUAGE;
  }

  const normalized = value.trim().toLowerCase();
  const primary = normalized.split("-")[0] ?? normalized;

  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(primary)) {
    return primary as AppLanguage;
  }

  return DEFAULT_LANGUAGE;
}
