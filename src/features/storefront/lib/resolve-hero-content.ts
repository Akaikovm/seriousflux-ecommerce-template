import type { StoreHeroSettings, StoreSettings } from "@/features/settings/types";
import type { TranslateFn } from "@/i18n";

/**
 * Resolved hero content always safe for presentational components.
 * Never throws; fills gaps from store identity fields.
 */
export type ResolvedHeroContent = StoreHeroSettings;

const DEFAULT_CTA_HREF = "/#featured";

/**
 * Builds complete hero props from StoreSettings.
 *
 * Priority: explicit `settings.hero.*` → identity fields → elegant defaults.
 */
export function resolveHeroContent(
  settings: StoreSettings,
  t: TranslateFn,
): ResolvedHeroContent {
  const hero = settings.hero;

  const title =
    hero?.title.trim() ||
    settings.storeName.trim() ||
    t("hero.defaultTitle");

  const subtitle =
    hero?.subtitle.trim() ||
    settings.tagline.trim() ||
    settings.description.trim() ||
    "";

  return {
    title,
    subtitle,
    image: hero?.image.trim() || "",
    ctaText: hero?.ctaText.trim() || t("hero.defaultCta"),
    ctaHref: hero?.ctaHref.trim() || DEFAULT_CTA_HREF,
  };
}
