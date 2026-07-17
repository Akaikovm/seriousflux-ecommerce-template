import type { Metadata } from "next";

import type { StoreSettings } from "@/features/settings/types";

/**
 * Builds root Metadata from StoreSettings so each client deployment
 * gets correct title, description, and favicon without code changes.
 */
export function buildStoreMetadata(settings: StoreSettings): Metadata {
  const description =
    settings.description.trim() ||
    settings.tagline.trim() ||
    undefined;

  return {
    title: {
      default: settings.storeName,
      template: `%s | ${settings.storeName}`,
    },
    description,
    icons: settings.favicon.trim()
      ? { icon: settings.favicon.trim() }
      : undefined,
  };
}
