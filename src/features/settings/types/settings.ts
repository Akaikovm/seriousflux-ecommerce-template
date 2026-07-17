import type { Timestamp } from "firebase/firestore";

import type {
  EnabledPaymentMethods,
  PaymentProvidersConfig,
} from "./payment-providers";

export type {
  EnabledPaymentMethods,
  PaymentProviderConfig,
  PaymentProviderSettingsKey,
  PaymentProvidersConfig,
} from "./payment-providers";

/**
 * Homepage hero configuration.
 *
 * Optional on Firestore; always resolved to concrete values for the UI
 * via `resolveHeroContent` (title falls back to storeName, etc.).
 */
export interface StoreHeroSettings {
  /** Primary hero headline. */
  title: string;

  /** Supporting line under the title. */
  subtitle: string;

  /** Absolute URL or Storage path for full-bleed hero imagery. Empty = text-led hero. */
  image: string;

  /** Call-to-action label. */
  ctaText: string;

  /** Call-to-action href (internal path or hash). */
  ctaHref: string;
}

/**
 * General store configuration document.
 *
 * Collection: `settings`
 * Document id: `general`
 *
 * This is the singleton identity document for a store deployment.
 * Branding, locale, contact and feature flags live here so each Serious Flux
 * client can rebrand by changing Firestore data — never application source.
 */
export interface StoreSettings {
  /** Public-facing store name. */
  storeName: string;

  /** Short marketing line shown near the brand. */
  tagline: string;

  /** Longer store / about description. */
  description: string;

  /** Absolute URL or Firebase Storage path to the store logo. */
  logo: string;

  /** Absolute URL or Firebase Storage path to the favicon. */
  favicon: string;

  /** Primary brand color (CSS hex, e.g. `"#0A0A0A"`). */
  primaryColor: string;

  /** Secondary / accent color (CSS hex). */
  secondaryColor: string;

  /** ISO 4217 currency code (e.g. `"ARS"`). */
  currency: string;

  /** BCP 47 locale used for formatting (e.g. `"es-AR"`). */
  locale: string;

  /** Primary UI language code (e.g. `"es"`). */
  language: string;

  /** ISO 3166-1 alpha-2 country code (e.g. `"AR"`). */
  country: string;

  /** Public contact email. */
  email: string;

  /** Public contact phone. */
  phone: string;

  /** WhatsApp number or wa.me link for storefront contact. */
  whatsapp: string;

  /** Instagram profile URL. */
  instagram: string;

  /** Facebook page / profile URL. */
  facebook: string;

  /** TikTok profile URL. */
  tiktok: string;

  /** YouTube channel URL. */
  youtube: string;

  /** Public store address (single-line or free-form text). */
  address: string;

  /** When false, checkout must not offer shipping. */
  shippingEnabled: boolean;

  /** When true, storefront should show maintenance and block commerce. */
  maintenanceMode: boolean;

  /**
   * Public payment-provider configuration (RFC-016.5).
   *
   * Controls which providers appear at checkout and their labels.
   * Never stores credentials — secrets remain in server env vars.
   * Admin UI for editing these values ships in a later RFC.
   */
  paymentProviders?: PaymentProvidersConfig;

  /**
   * @deprecated Prefer `paymentProviders`. Still accepted when reading older documents.
   */
  enabledPaymentMethods?: EnabledPaymentMethods;

  /**
   * Optional homepage hero overrides.
   * When omitted or partial, UI falls back via `resolveHeroContent`.
   */
  hero?: StoreHeroSettings;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Writable subset of store settings for admin updates (RFC-011).
 * Timestamps are owned by StoreSettingsService on write.
 */
export type StoreSettingsUpdateInput = Partial<
  Omit<StoreSettings, "createdAt" | "updatedAt">
>;
