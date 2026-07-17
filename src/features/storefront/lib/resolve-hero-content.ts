import type { StoreHeroSettings, StoreSettings } from "@/features/settings/types";

/**
 * Resolved hero content always safe for presentational components.
 * Never throws; fills gaps from store identity fields.
 */
export type ResolvedHeroContent = StoreHeroSettings;

const DEFAULT_CTA_TEXT = "Shop now";
const DEFAULT_CTA_HREF = "/#featured";

/**
 * Builds complete hero props from StoreSettings.
 *
 * Priority: explicit `settings.hero.*` → identity fields → elegant defaults.
 */
export function resolveHeroContent(settings: StoreSettings): ResolvedHeroContent {
  const hero = settings.hero;

  const title =
    hero?.title.trim() ||
    settings.storeName.trim() ||
    "Welcome";

  const subtitle =
    hero?.subtitle.trim() ||
    settings.tagline.trim() ||
    settings.description.trim() ||
    "";

  return {
    title,
    subtitle,
    image: hero?.image.trim() || "",
    ctaText: hero?.ctaText.trim() || DEFAULT_CTA_TEXT,
    ctaHref: hero?.ctaHref.trim() || DEFAULT_CTA_HREF,
  };
}
