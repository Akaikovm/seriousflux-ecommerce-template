"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { createT, type TranslateFn } from "@/i18n/create-t";
import type { AppLanguage, Dictionary } from "@/i18n/types";

type I18nContextValue = {
  language: AppLanguage;
  dictionary: Dictionary;
  t: TranslateFn;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  language: AppLanguage;
  dictionary: Dictionary;
  children: ReactNode;
};

/**
 * Provides UI language + `t()` to client components.
 * Language comes from StoreSettings (resolved in RootLayout).
 */
export function I18nProvider({
  language,
  dictionary,
  children,
}: I18nProviderProps) {
  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      dictionary,
      t: createT(dictionary),
    }),
    [language, dictionary],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

/** Shorthand for `useI18n().t`. */
export function useT(): TranslateFn {
  return useI18n().t;
}
