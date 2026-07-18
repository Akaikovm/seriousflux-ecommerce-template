import type { Metadata } from "next";

import type { StoreSettings } from "@/features/settings/types";

/**
 * Builds root Metadata from StoreSettings so each client deployment
 * gets correct title, description, and favicon without code changes.
 *
 * Icon priority: `favicon` → `logo` → none.
 * Do not place a static `app/favicon.ico` — it overrides metadata icons
 * and forces the Next/Vercel default for every client.
 */
export function buildStoreMetadata(settings: StoreSettings): Metadata {
  const description =
    settings.description.trim() ||
    settings.tagline.trim() ||
    undefined;

  const iconUrl =
    settings.favicon.trim() || settings.logo.trim() || "";

  return {
    title: {
      default: settings.storeName,
      template: `%s | ${settings.storeName}`,
    },
    description,
    icons: iconUrl
      ? {
          icon: [{ url: iconUrl }],
          shortcut: [{ url: iconUrl }],
          apple: [{ url: iconUrl }],
        }
      : undefined,
  };
}
