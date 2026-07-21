import type { BrandValueItem } from "@/features/storefront/types/storefront";
import type { TranslateFn } from "@/i18n";

/**
 * Default value props derived from store capability flags — not brand identity.
 * Server-safe (no "use client") so HomePage can call it during RSC render.
 */
export function buildDefaultBrandValues(
  shippingEnabled: boolean,
  t: TranslateFn,
): BrandValueItem[] {
  const items: BrandValueItem[] = [
    {
      icon: "sparkles",
      title: t("brandValues.curatedTitle"),
      description: t("brandValues.curatedDescription"),
    },
    {
      icon: "shield",
      title: t("brandValues.secureTitle"),
      description: t("brandValues.secureDescription"),
    },
  ];

  if (shippingEnabled) {
    items.unshift({
      icon: "truck",
      title: t("brandValues.deliveryTitle"),
      description: t("brandValues.deliveryDescription"),
    });
  } else {
    items.unshift({
      icon: "package",
      title: t("brandValues.fulfillmentTitle"),
      description: t("brandValues.fulfillmentDescription"),
    });
  }

  return items.slice(0, 3);
}
