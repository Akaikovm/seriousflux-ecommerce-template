import type { AppLanguage } from "@/i18n/types";

export const DEFAULT_LANGUAGE: AppLanguage = "es";

export const SUPPORTED_LANGUAGES: readonly AppLanguage[] = ["es", "en"];

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  es: "Español",
  en: "English",
};
