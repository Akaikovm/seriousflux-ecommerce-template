import { cookies } from "next/headers";
import "server-only";

import {
  LANGUAGE_COOKIE_NAME,
  parseLanguageCookie,
} from "@/i18n/language-cookie";
import { resolveLanguage } from "@/i18n/resolve-language";
import type { AppLanguage } from "@/i18n/types";

/**
 * Resolves UI language for the current request:
 * cookie override (when valid) → StoreSettings.language → default.
 *
 * Server Components / layouts only — import from this path, not `@/i18n`.
 */
export async function getRequestLanguage(
  settingsLanguage: string | null | undefined,
): Promise<AppLanguage> {
  const jar = await cookies();
  const override = parseLanguageCookie(jar.get(LANGUAGE_COOKIE_NAME)?.value);
  return resolveLanguage(override ?? settingsLanguage);
}
