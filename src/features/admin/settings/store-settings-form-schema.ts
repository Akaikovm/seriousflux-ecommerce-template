import { z } from "zod";

import type { InventoryFieldErrors } from "@/features/admin/settings/InventorySettingsFields";
import type { NotificationsFieldErrors } from "@/features/admin/settings/NotificationsSettingsFields";
import type { PaymentProviderFieldErrors } from "@/features/admin/settings/PaymentProvidersSettingsFields";
import type { StoreHeroFormData } from "@/features/admin/settings/store-settings-form-data";

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9A-Fa-f]{6})$/, "Use a hex color like #0A0A0A.");

const heroFormSchema = z.object({
  title: z.string().trim(),
  subtitle: z.string().trim(),
  image: z.string(),
  ctaText: z.string().trim(),
  ctaHref: z.string().trim(),
});

const paymentProviderConfigSchema = z.object({
  enabled: z.boolean(),
  displayName: z.string().trim().min(1, "Display name is required."),
  description: z.string().trim(),
  sortOrder: z.number().int("Sort order must be a whole number."),
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
    .min(0, "Threshold must be 0 or greater."),
  defaultAllowBackorders: z.boolean(),
  hideOutOfStockProducts: z.boolean(),
  showRemainingStock: z.boolean(),
});

/**
 * Client validation for the admin store-settings form.
 * Rules match the prior inline schema — do not change without a product RFC.
 */
export const storeSettingsFormSchema = z.object({
  storeName: z.string().trim().min(1, "Store name is required."),
  tagline: z.string().trim(),
  description: z.string().trim(),
  logo: z.string(),
  favicon: z.string(),
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  currency: z
    .string()
    .trim()
    .min(1, "Currency is required.")
    .regex(/^[A-Z]{3}$/, "Use a 3-letter ISO code, e.g. ARS."),
  locale: z.string().trim().min(1, "Locale is required."),
  language: z.string().trim().min(1, "Language is required."),
  country: z
    .string()
    .trim()
    .min(1, "Country is required.")
    .regex(/^[A-Z]{2}$/, "Use a 2-letter ISO code, e.g. AR."),
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

export type StoreSettingsFormValues = z.infer<typeof storeSettingsFormSchema>;

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
