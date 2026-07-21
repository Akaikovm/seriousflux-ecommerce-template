/**
 * Supported UI languages for the starter kit.
 * Default from StoreSettings.language; optional shopper override via cookie.
 */
export type AppLanguage = "en" | "es";

/**
 * Nested message catalog. Leaf values are strings; supports `{name}` interpolation.
 */
export type MessageTree = {
  readonly [key: string]: string | MessageTree;
};

/**
 * UI message catalog.
 * English (`dictionaries/en.ts`) is the key source of truth; Spanish mirrors it.
 */
export type Dictionary = MessageTree;
