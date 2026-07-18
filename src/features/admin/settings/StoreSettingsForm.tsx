"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";

import {
  NotificationsSettingsFields,
  type NotificationsFieldErrors,
  type NotificationsFormValues,
} from "@/features/admin/settings/NotificationsSettingsFields";
import {
  PaymentProvidersSettingsFields,
  type PaymentProviderFieldErrors,
} from "@/features/admin/settings/PaymentProvidersSettingsFields";
import {
  toNotificationsSettings,
  type StoreHeroFormData,
  type StoreSettingsFormData,
} from "@/features/admin/settings/store-settings-form-data";
import { ImageUpload } from "@/features/media/components/ImageUpload";
import {
  StoreSettingsError,
  StoreSettingsService,
} from "@/features/settings/services";
import type {
  PaymentProviderConfig,
  PaymentProviderSettingsKey,
  PaymentProvidersConfig,
} from "@/features/settings/types";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { Switch } from "@/shared/ui/Switch";
import { Textarea } from "@/shared/ui/Textarea";
import { useToast } from "@/shared/ui/Toast";

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

const storeSettingsFormSchema = z.object({
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
  hero: heroFormSchema,
});

type StoreSettingsFormValues = z.infer<typeof storeSettingsFormSchema>;

type FieldErrors = Partial<
  Record<
    Exclude<
      keyof StoreSettingsFormValues,
      "hero" | "paymentProviders" | "notifications"
    >,
    string
  >
> & {
  hero?: Partial<Record<keyof StoreHeroFormData, string>>;
  paymentProviders?: PaymentProviderFieldErrors;
  notifications?: NotificationsFieldErrors;
};

type StoreSettingsFormProps = {
  settings: StoreSettingsFormData;
};

function toInitialValues(
  settings: StoreSettingsFormData,
): StoreSettingsFormValues {
  return {
    ...settings,
    hero: { ...settings.hero },
    paymentProviders: {
      mercadopago: { ...settings.paymentProviders.mercadopago },
      cashOnDelivery: { ...settings.paymentProviders.cashOnDelivery },
      stripe: { ...settings.paymentProviders.stripe },
      paypal: { ...settings.paymentProviders.paypal },
      bankTransfer: { ...settings.paymentProviders.bankTransfer },
    },
    notifications: { ...settings.notifications },
  };
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h3 className="border-t border-border pt-4 text-sm font-semibold text-foreground">
      {children}
    </h3>
  );
}

/**
 * Controlled store settings form.
 * Persists the full StoreSettings writable shape through StoreSettingsService.
 * Logo / favicon / hero image upload via MediaService; service stores URL strings.
 */
export function StoreSettingsForm({ settings }: StoreSettingsFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<StoreSettingsFormValues>(() =>
    toInitialValues(settings),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function setField<
    K extends Exclude<
      keyof StoreSettingsFormValues,
      "hero" | "paymentProviders" | "notifications"
    >,
  >(key: K, value: StoreSettingsFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setSaved(false);
  }

  function setHeroField<K extends keyof StoreHeroFormData>(
    key: K,
    value: StoreHeroFormData[K],
  ) {
    setValues((current) => ({
      ...current,
      hero: { ...current.hero, [key]: value },
    }));
    setFieldErrors((current) => ({
      ...current,
      hero: { ...current.hero, [key]: undefined },
    }));
    setSaved(false);
  }

  function setPaymentProviders(next: PaymentProvidersConfig) {
    setValues((current) => ({ ...current, paymentProviders: next }));
    setFieldErrors((current) => ({ ...current, paymentProviders: undefined }));
    setSaved(false);
  }

  function setNotifications(next: NotificationsFormValues) {
    setValues((current) => ({ ...current, notifications: next }));
    setFieldErrors((current) => ({ ...current, notifications: undefined }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) {
      return;
    }

    setFormError(null);
    const parsed = storeSettingsFormSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const root = issue.path[0];
        if (root === "hero" && typeof issue.path[1] === "string") {
          const heroKey = issue.path[1] as keyof StoreHeroFormData;
          if (!nextErrors.hero?.[heroKey]) {
            nextErrors.hero = { ...nextErrors.hero, [heroKey]: issue.message };
          }
          continue;
        }
        if (
          root === "paymentProviders" &&
          typeof issue.path[1] === "string" &&
          typeof issue.path[2] === "string"
        ) {
          const providerKey = issue.path[1] as PaymentProviderSettingsKey;
          const fieldKey = issue.path[2] as keyof PaymentProviderConfig;
          if (!nextErrors.paymentProviders?.[providerKey]?.[fieldKey]) {
            nextErrors.paymentProviders = {
              ...nextErrors.paymentProviders,
              [providerKey]: {
                ...nextErrors.paymentProviders?.[providerKey],
                [fieldKey]: issue.message,
              },
            };
          }
          continue;
        }
        if (
          root === "notifications" &&
          typeof issue.path[1] === "string"
        ) {
          const fieldKey = issue.path[1] as keyof NotificationsFormValues;
          if (!nextErrors.notifications?.[fieldKey]) {
            nextErrors.notifications = {
              ...nextErrors.notifications,
              [fieldKey]: issue.message,
            };
          }
          continue;
        }
        if (
          typeof root === "string" &&
          root !== "hero" &&
          root !== "paymentProviders" &&
          root !== "notifications" &&
          !nextErrors[
            root as Exclude<
              keyof StoreSettingsFormValues,
              "hero" | "paymentProviders" | "notifications"
            >
          ]
        ) {
          nextErrors[
            root as Exclude<
              keyof StoreSettingsFormValues,
              "hero" | "paymentProviders" | "notifications"
            >
          ] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const { notifications, ...rest } = parsed.data;
      await new StoreSettingsService().updateGeneralSettings({
        ...rest,
        notifications: toNotificationsSettings(notifications),
      });
      toast.success("Store settings saved.");
      setSaved(true);
      router.refresh();
    } catch (err) {
      if (err instanceof StoreSettingsError) {
        setFormError(err.message);
        toast.error(err.message);
      } else {
        const message = "Unable to save settings. Please try again.";
        setFormError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Brand identity, locale, contact, social, hero, payments,
          notifications, and feature flags.
        </p>
      </div>

      <Card padding="lg" className="w-full max-w-2xl">
        <form
          className="flex flex-col gap-4 sm:gap-5"
          onSubmit={handleSubmit}
          noValidate
        >
          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          {saved ? (
            <p role="status" className="text-sm text-foreground">
              Settings saved successfully.
            </p>
          ) : null}

          <SectionHeading>Brand</SectionHeading>

          <Input
            name="storeName"
            label="Store name"
            value={values.storeName}
            error={fieldErrors.storeName}
            disabled={loading}
            onChange={(event) => setField("storeName", event.target.value)}
          />

          <Input
            name="tagline"
            label="Tagline"
            value={values.tagline}
            error={fieldErrors.tagline}
            disabled={loading}
            onChange={(event) => setField("tagline", event.target.value)}
          />

          <Textarea
            name="description"
            label="Description"
            value={values.description}
            error={fieldErrors.description}
            helperText="Used for storefront about copy and page metadata."
            disabled={loading}
            onChange={(event) => setField("description", event.target.value)}
          />

          <ImageUpload
            label="Logo"
            folder="branding"
            value={values.logo}
            error={fieldErrors.logo}
            disabled={loading}
            onChange={(url) => setField("logo", url)}
          />

          <ImageUpload
            label="Favicon"
            folder="branding"
            value={values.favicon}
            error={fieldErrors.favicon}
            disabled={loading}
            onChange={(url) => setField("favicon", url)}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              name="primaryColor"
              label="Primary color"
              type="text"
              value={values.primaryColor}
              error={fieldErrors.primaryColor}
              helperText="Hex format, e.g. #0A0A0A"
              disabled={loading}
              onChange={(event) => setField("primaryColor", event.target.value)}
            />
            <Input
              name="secondaryColor"
              label="Secondary color"
              type="text"
              value={values.secondaryColor}
              error={fieldErrors.secondaryColor}
              helperText="Hex format, e.g. #E10600"
              disabled={loading}
              onChange={(event) =>
                setField("secondaryColor", event.target.value)
              }
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex items-end gap-2">
              <span
                className="mb-2 size-8 shrink-0 rounded-md border border-border"
                style={{ background: values.primaryColor }}
                aria-hidden
              />
              <Input
                name="primaryColorPicker"
                label="Primary preview"
                type="color"
                value={
                  /^#([0-9A-Fa-f]{6})$/.test(values.primaryColor)
                    ? values.primaryColor
                    : "#0A0A0A"
                }
                disabled={loading}
                onChange={(event) =>
                  setField("primaryColor", event.target.value.toUpperCase())
                }
              />
            </div>
            <div className="flex items-end gap-2">
              <span
                className="mb-2 size-8 shrink-0 rounded-md border border-border"
                style={{ background: values.secondaryColor }}
                aria-hidden
              />
              <Input
                name="secondaryColorPicker"
                label="Secondary preview"
                type="color"
                value={
                  /^#([0-9A-Fa-f]{6})$/.test(values.secondaryColor)
                    ? values.secondaryColor
                    : "#E10600"
                }
                disabled={loading}
                onChange={(event) =>
                  setField("secondaryColor", event.target.value.toUpperCase())
                }
              />
            </div>
          </div>

          <SectionHeading>Locale &amp; commerce</SectionHeading>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              name="currency"
              label="Currency"
              value={values.currency}
              error={fieldErrors.currency}
              helperText="ISO 4217, e.g. ARS"
              disabled={loading}
              onChange={(event) =>
                setField("currency", event.target.value.toUpperCase())
              }
            />
            <Input
              name="country"
              label="Country"
              value={values.country}
              error={fieldErrors.country}
              helperText="ISO 3166-1, e.g. AR"
              disabled={loading}
              onChange={(event) =>
                setField("country", event.target.value.toUpperCase())
              }
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              name="locale"
              label="Locale"
              value={values.locale}
              error={fieldErrors.locale}
              helperText="BCP 47, e.g. es-AR"
              disabled={loading}
              onChange={(event) => setField("locale", event.target.value)}
            />
            <Input
              name="language"
              label="Language"
              value={values.language}
              error={fieldErrors.language}
              helperText="UI language, e.g. es"
              disabled={loading}
              onChange={(event) => setField("language", event.target.value)}
            />
          </div>

          <SectionHeading>Contact</SectionHeading>

          <Input
            name="email"
            label="Email"
            type="email"
            value={values.email}
            error={fieldErrors.email}
            disabled={loading}
            onChange={(event) => setField("email", event.target.value)}
          />

          <Input
            name="phone"
            label="Phone"
            value={values.phone}
            error={fieldErrors.phone}
            disabled={loading}
            onChange={(event) => setField("phone", event.target.value)}
          />

          <Input
            name="whatsapp"
            label="WhatsApp"
            value={values.whatsapp}
            error={fieldErrors.whatsapp}
            disabled={loading}
            onChange={(event) => setField("whatsapp", event.target.value)}
          />

          <Textarea
            name="address"
            label="Address"
            value={values.address}
            error={fieldErrors.address}
            disabled={loading}
            onChange={(event) => setField("address", event.target.value)}
          />

          <SectionHeading>Social</SectionHeading>

          <Input
            name="instagram"
            label="Instagram"
            value={values.instagram}
            error={fieldErrors.instagram}
            disabled={loading}
            onChange={(event) => setField("instagram", event.target.value)}
          />

          <Input
            name="facebook"
            label="Facebook"
            value={values.facebook}
            error={fieldErrors.facebook}
            disabled={loading}
            onChange={(event) => setField("facebook", event.target.value)}
          />

          <Input
            name="tiktok"
            label="TikTok"
            value={values.tiktok}
            error={fieldErrors.tiktok}
            disabled={loading}
            onChange={(event) => setField("tiktok", event.target.value)}
          />

          <Input
            name="youtube"
            label="YouTube"
            value={values.youtube}
            error={fieldErrors.youtube}
            disabled={loading}
            onChange={(event) => setField("youtube", event.target.value)}
          />

          <SectionHeading>Homepage hero</SectionHeading>

          <Input
            name="heroTitle"
            label="Hero title"
            value={values.hero.title}
            error={fieldErrors.hero?.title}
            disabled={loading}
            onChange={(event) => setHeroField("title", event.target.value)}
          />

          <Textarea
            name="heroSubtitle"
            label="Hero subtitle"
            value={values.hero.subtitle}
            error={fieldErrors.hero?.subtitle}
            disabled={loading}
            onChange={(event) => setHeroField("subtitle", event.target.value)}
          />

          <ImageUpload
            label="Hero image"
            folder="branding"
            value={values.hero.image}
            error={fieldErrors.hero?.image}
            disabled={loading}
            onChange={(url) => setHeroField("image", url)}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              name="heroCtaText"
              label="CTA text"
              value={values.hero.ctaText}
              error={fieldErrors.hero?.ctaText}
              disabled={loading}
              onChange={(event) => setHeroField("ctaText", event.target.value)}
            />
            <Input
              name="heroCtaHref"
              label="CTA link"
              value={values.hero.ctaHref}
              error={fieldErrors.hero?.ctaHref}
              helperText="Internal path, e.g. /#featured"
              disabled={loading}
              onChange={(event) => setHeroField("ctaHref", event.target.value)}
            />
          </div>

          <SectionHeading>Payment methods</SectionHeading>

          <PaymentProvidersSettingsFields
            value={values.paymentProviders}
            errors={fieldErrors.paymentProviders}
            disabled={loading}
            onChange={setPaymentProviders}
          />

          <SectionHeading>Notifications</SectionHeading>

          <NotificationsSettingsFields
            value={values.notifications}
            errors={fieldErrors.notifications}
            disabled={loading}
            onChange={setNotifications}
          />

          <SectionHeading>Feature flags</SectionHeading>

          <Switch
            name="maintenanceMode"
            label="Maintenance mode"
            checked={values.maintenanceMode}
            disabled={loading}
            onChange={(event) =>
              setField("maintenanceMode", event.target.checked)
            }
          />

          <Switch
            name="shippingEnabled"
            label="Shipping enabled"
            checked={values.shippingEnabled}
            disabled={loading}
            onChange={(event) =>
              setField("shippingEnabled", event.target.checked)
            }
          />

          <div className="pt-2">
            <Button type="submit" loading={loading}>
              Save settings
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
