import type { Dictionary, MessageTree } from "@/i18n/types";

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

function lookup(tree: MessageTree, key: string): string | undefined {
  const parts = key.split(".");
  let current: string | MessageTree | undefined = tree;

  for (const part of parts) {
    if (current === undefined || typeof current === "string") {
      return undefined;
    }
    current = current[part];
  }

  return typeof current === "string" ? current : undefined;
}

function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/**
 * Builds a `t(key, params?)` function bound to a dictionary.
 * Missing keys return the key itself so UI never crashes mid-migration.
 */
export function createT(dictionary: Dictionary): TranslateFn {
  return function t(key, params) {
    const message = lookup(dictionary as MessageTree, key);
    if (message === undefined) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[i18n] Missing key: ${key}`);
      }
      return key;
    }
    return interpolate(message, params);
  };
}
