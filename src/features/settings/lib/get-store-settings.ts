import { cache } from "react";

import { StoreSettingsService } from "@/features/settings/services";
import type { StoreSettings } from "@/features/settings/types";

/**
 * Request-scoped StoreSettings loader (RFC-004 decision).
 *
 * WHY `cache()` EXISTS — architectural workaround, not a premature optimization:
 *
 * 1. Root Layout needs StoreSettings for Header / Footer (via AppLayout props).
 * 2. Home needs StoreSettings for Hero (`storeName` / `tagline`).
 * 3. App Router layouts cannot pass props into page components (`children`).
 * 4. Without a shared entry point, Layout + Home would each call the service
 *    and produce two Firestore reads per request.
 *
 * `cache()` deduplicates identical calls within a single server request, so
 * both call sites share one `StoreSettingsService.getGeneralSettings()` read.
 *
 * Rejected alternatives for this kit (do not reintroduce without a new RFC):
 * - React Context — new client/server architecture layer
 * - Duplicate Firestore reads — unnecessary cost and inconsistency risk
 * - Redesigning the layout to own Hero — changes layout structure
 *
 * Callers: `src/app/layout.tsx`, `src/app/page.tsx` (and any future server
 * component that needs the same settings in the same request).
 */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  const service = new StoreSettingsService();
  return service.getGeneralSettings();
});
