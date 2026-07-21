"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/features/auth/providers";
import { I18nProvider } from "@/i18n/I18nProvider";
import type { AppLanguage, Dictionary } from "@/i18n/types";

type AppProvidersProps = {
  language: AppLanguage;
  dictionary: Dictionary;
  children: ReactNode;
};

/**
 * Root client providers (RFC-017).
 *
 * Mounts I18nProvider + a single AuthProvider for storefront and admin.
 */
export function AppProviders({
  language,
  dictionary,
  children,
}: AppProvidersProps) {
  return (
    <I18nProvider language={language} dictionary={dictionary}>
      <AuthProvider>{children}</AuthProvider>
    </I18nProvider>
  );
}
