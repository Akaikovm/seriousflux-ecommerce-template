import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import type { AppLanguage, Dictionary } from "./types";

const dictionaries: Record<AppLanguage, Dictionary> = {
  en,
  es,
};

/**
 * Sync dictionary lookup for server and client.
 * Prefer `resolveLanguage` before calling this.
 */
export function getDictionary(language: AppLanguage): Dictionary {
  return dictionaries[language] ?? dictionaries.es;
}
