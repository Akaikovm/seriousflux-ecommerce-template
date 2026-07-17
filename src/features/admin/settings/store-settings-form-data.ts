/**
 * Serializable store settings fields for admin UI (no Firestore Timestamp).
 * Safe to pass from Server Components to Client Components.
 */

export type StoreHeroFormData = {
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaHref: string;
};

export type StoreSettingsFormData = {
  storeName: string;
  tagline: string;
  description: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  locale: string;
  language: string;
  country: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  address: string;
  maintenanceMode: boolean;
  shippingEnabled: boolean;
  hero: StoreHeroFormData;
};

/**
 * Maps store settings onto serializable form props (full StoreSettings shape).
 */
export function toStoreSettingsFormData(settings: {
  storeName: string;
  tagline: string;
  description: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  locale: string;
  language: string;
  country: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  address: string;
  maintenanceMode: boolean;
  shippingEnabled: boolean;
  hero?: Partial<StoreHeroFormData> | null;
}): StoreSettingsFormData {
  return {
    storeName: settings.storeName,
    tagline: settings.tagline,
    description: settings.description,
    logo: settings.logo,
    favicon: settings.favicon,
    primaryColor: settings.primaryColor || "#0A0A0A",
    secondaryColor: settings.secondaryColor || "#E10600",
    currency: settings.currency,
    locale: settings.locale,
    language: settings.language,
    country: settings.country,
    email: settings.email,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    instagram: settings.instagram,
    facebook: settings.facebook,
    tiktok: settings.tiktok,
    youtube: settings.youtube,
    address: settings.address,
    maintenanceMode: settings.maintenanceMode,
    shippingEnabled: settings.shippingEnabled,
    hero: {
      title: settings.hero?.title ?? "",
      subtitle: settings.hero?.subtitle ?? "",
      image: settings.hero?.image ?? "",
      ctaText: settings.hero?.ctaText ?? "",
      ctaHref: settings.hero?.ctaHref ?? "",
    },
  };
}
