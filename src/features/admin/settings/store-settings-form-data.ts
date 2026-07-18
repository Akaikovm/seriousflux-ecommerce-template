/**
 * Serializable store settings fields for admin UI (no Firestore Timestamp).
 * Safe to pass from Server Components to Client Components.
 */

import type { NotificationsFormValues } from "@/features/admin/settings/NotificationsSettingsFields";
import { DEFAULT_NOTIFICATIONS_SETTINGS } from "@/features/notifications/lib/default-notifications-settings";
import { resolvePaymentProvidersConfig } from "@/features/payments/lib/resolve-enabled-payment-methods";
import type {
  EnabledPaymentMethods,
  NotificationsSettings,
  PaymentProvidersConfig,
} from "@/features/settings/types";

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
  paymentProviders: PaymentProvidersConfig;
  /** Business-facing notification fields only (RFC-019.1). */
  notifications: NotificationsFormValues;
  hero: StoreHeroFormData;
};

/**
 * Maps full domain notifications → admin form (hides provider / infra fields).
 */
export function toNotificationsFormValues(
  notifications?: NotificationsSettings | null,
): NotificationsFormValues {
  const merged = {
    ...DEFAULT_NOTIFICATIONS_SETTINGS,
    ...notifications,
  };
  return {
    senderName: merged.senderName,
    senderEmail: merged.senderEmail,
    enableCustomerEmails: merged.enableCustomerEmails,
    enableAdminEmails: merged.enableAdminEmails,
    enableWelcomeEmail: merged.enableWelcomeEmail,
  };
}

/**
 * Maps admin form → persisted NotificationsSettings (RFC-019.1).
 * Always stores Resend as the active provider — Admin never selects vendors.
 */
export function toNotificationsSettings(
  form: NotificationsFormValues,
): NotificationsSettings {
  return {
    provider: "resend",
    senderName: form.senderName,
    senderEmail: form.senderEmail,
    replyTo: "",
    adminEmail: "",
    enableCustomerEmails: form.enableCustomerEmails,
    enableAdminEmails: form.enableAdminEmails,
    enableWelcomeEmail: form.enableWelcomeEmail,
  };
}

/**
 * Maps store settings onto serializable form props.
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
  paymentProviders?: PaymentProvidersConfig;
  enabledPaymentMethods?: EnabledPaymentMethods;
  notifications?: NotificationsSettings;
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
    paymentProviders: resolvePaymentProvidersConfig(settings),
    notifications: toNotificationsFormValues(settings.notifications),
    hero: {
      title: settings.hero?.title ?? "",
      subtitle: settings.hero?.subtitle ?? "",
      image: settings.hero?.image ?? "",
      ctaText: settings.hero?.ctaText ?? "",
      ctaHref: settings.hero?.ctaHref ?? "",
    },
  };
}
