import type { AuthError } from "@/features/auth/services/auth-error";
import type { TranslateFn } from "@/i18n/create-t";

/**
 * Maps AuthError.code onto the localized auth.errors.* catalog.
 */
export function translateAuthError(
  error: Pick<AuthError, "code">,
  t: TranslateFn,
): string {
  const key = `auth.errors.${error.code}`;
  const translated = t(key);
  return translated === key ? t("auth.errors.unknown") : translated;
}
