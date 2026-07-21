import { z } from "zod";

import type { InventoryFieldErrors } from "@/features/admin/settings/InventorySettingsFields";
import type { NotificationsFieldErrors } from "@/features/admin/settings/NotificationsSettingsFields";
import type { PaymentProviderFieldErrors } from "@/features/admin/settings/PaymentProvidersSettingsFields";
import type { StoreHeroFormData } from "@/features/admin/settings/store-settings-form-data";
import type { TranslateFn } from "@/i18n";

/**
 * Builds a Zod schema with localized validation messages.
 * Call inside components with `t` from `useT()`.
 * Rules match the prior inline schema — do not change without a product RFC.
 */
export function createStoreSettingsFormSchema(t: TranslateFn) {
  const hexColorSchema = z
    .string()
    .trim()
    .regex(/^#([0-9A-Fa-f]{6})$/, t("admin.settings.validation.hexColor"));

  const heroFormSchema = z.object({
    title: z.string().trim(),
    subtitle: z.string().trim(),
    image: z.string(),
    ctaText: z.string().trim(),
    ctaHref: z.string().trim(),
  });

  const paymentProviderConfigSchema = z.object({
    enabled: z.boolean(),
    displayName: z
      .string()
      .trim()
      .min(1, t("admin.settings.validation.displayNameRequired")),
    description: z.string().trim(),
    sortOrder: z
      .number()
      .int(t("admin.settings.validation.sortOrderInteger")),
  });

  const paymentProvidersSchema = z.object({
    mercadopago: paymentProviderConfigSchema,
    cashOnDelivery: paymentProviderConfigSchema,
    stripe: paymentProviderConfigSchema,
    paypal: paymentProviderConfigSchema,
    bankTransfer: paymentProviderConfigSchema,
  });

  const notificationsSchema = z.object({
    senderEmail: z.string().trim(),
    senderName: z.string().trim(),
    enableCustomerEmails: z.boolean(),
    enableAdminEmails: z.boolean(),
    enableWelcomeEmail: z.boolean(),
  });

  const inventorySchema = z.object({
    defaultTrackInventory: z.boolean(),
    defaultLowStockThreshold: z.coerce
      .number()
      .int()
      .min(0, t("admin.settings.validation.thresholdMin")),
    defaultAllowBackorders: z.boolean(),
    hideOutOfStockProducts: z.boolean(),
    showRemainingStock: z.boolean(),
  });

  return z.object({
    storeName: z
      .string()
      .trim()
      .min(1, t("admin.settings.validation.storeNameRequired")),
    tagline: z.string().trim(),
    description: z.string().trim(),
    logo: z.string(),
    favicon: z.string(),
    primaryColor: hexColorSchema,
    secondaryColor: hexColorSchema,
    currency: z
      .string()
      .trim()
      .min(1, t("admin.settings.validation.currencyRequired"))
      .regex(/^[A-Z]{3}$/, t("admin.settings.validation.currencyFormat")),
    locale: z
      .string()
      .trim()
      .min(1, t("admin.settings.validation.localeRequired")),
    language: z
      .string()
      .trim()
      .min(1, t("admin.settings.validation.languageRequired")),
    allowLanguageSwitch: z.boolean(),
    country: z
      .string()
      .trim()
      .min(1, t("admin.settings.validation.countryRequired"))
      .regex(/^[A-Z]{2}$/, t("admin.settings.validation.countryFormat")),
    email: z.string().trim(),
    phone: z.string().trim(),
    whatsapp: z.string().trim(),
    instagram: z.string().trim(),
    facebook: z.string().trim(),
    tiktok: z.string().trim(),
    youtube: z.string().trim(),
    address: z.string().trim(),
    maintenanceMode: z.boolean(),
    shippingEnabled: z.boolean(),
    paymentProviders: paymentProvidersSchema,
    notifications: notificationsSchema,
    inventory: inventorySchema,
    hero: heroFormSchema,
  });
}

export type StoreSettingsFormValues = z.infer<
  ReturnType<typeof createStoreSettingsFormSchema>
>;

export type StoreSettingsFieldErrors = Partial<
  Record<
    Exclude<
      keyof StoreSettingsFormValues,
      "hero" | "paymentProviders" | "notifications" | "inventory"
    >,
    string
  >
> & {
  hero?: Partial<Record<keyof StoreHeroFormData, string>>;
  paymentProviders?: PaymentProviderFieldErrors;
  notifications?: NotificationsFieldErrors;
  inventory?: InventoryFieldErrors;
};
