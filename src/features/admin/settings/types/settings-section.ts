import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

import type {
  InventoryFormValues,
} from "@/features/admin/settings/InventorySettingsFields";
import type {
  NotificationsFormValues,
} from "@/features/admin/settings/NotificationsSettingsFields";
import type {
  StoreHeroFormData,
} from "@/features/admin/settings/store-settings-form-data";
import type {
  StoreSettingsFieldErrors,
  StoreSettingsFormValues,
} from "@/features/admin/settings/store-settings-form-schema";
import type { PaymentProvidersConfig } from "@/features/settings/types";

/**
 * Stable section ids — also used as URL hash fragments (`#payments`).
 * Titles/descriptions resolve via `admin.settings.sections.{id}.*`.
 */
export type SettingsSectionId =
  | "general"
  | "branding"
  | "contact"
  | "shipping"
  | "payments"
  | "notifications"
  | "inventory"
  | "advanced";

/**
 * Extensible per-section status for sidebar indicators.
 * RFC-020 only drives `dirty` / `hasErrors`; other flags are reserved.
 */
export type SettingsSectionStatus = {
  dirty?: boolean;
  hasErrors?: boolean;
  warning?: boolean;
  incomplete?: boolean;
  complete?: boolean;
};

export type SettingsSectionProps = {
  values: StoreSettingsFormValues;
  fieldErrors: StoreSettingsFieldErrors;
  disabled: boolean;
  setField: <
    K extends Exclude<
      keyof StoreSettingsFormValues,
      "hero" | "paymentProviders" | "notifications" | "inventory"
    >,
  >(
    key: K,
    value: StoreSettingsFormValues[K],
  ) => void;
  setHeroField: <K extends keyof StoreHeroFormData>(
    key: K,
    value: StoreHeroFormData[K],
  ) => void;
  setPaymentProviders: (next: PaymentProvidersConfig) => void;
  setNotifications: (next: NotificationsFormValues) => void;
  setInventory: (next: InventoryFormValues) => void;
};

export type SettingsSectionDefinition = {
  id: SettingsSectionId;
  icon: LucideIcon;
  order: number;
  /** Top-level form keys owned by this section (error routing / future badges). */
  fieldRoots: readonly string[];
  component: ComponentType<SettingsSectionProps>;
};

export const LAST_SETTINGS_SECTION_KEY = "lastSettingsSection";
