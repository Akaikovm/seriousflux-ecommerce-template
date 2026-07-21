import {
  Bell,
  CreditCard,
  MapPin,
  Package,
  Palette,
  Settings2,
  Store,
  Truck,
} from "lucide-react";

import { AdvancedSettingsSection } from "@/features/admin/settings/sections/AdvancedSettingsSection";
import { BrandingSettingsSection } from "@/features/admin/settings/sections/BrandingSettingsSection";
import { ContactSettingsSection } from "@/features/admin/settings/sections/ContactSettingsSection";
import { GeneralSettingsSection } from "@/features/admin/settings/sections/GeneralSettingsSection";
import { InventorySettingsSection } from "@/features/admin/settings/sections/InventorySettingsSection";
import { NotificationsSettingsSection } from "@/features/admin/settings/sections/NotificationsSettingsSection";
import { PaymentsSettingsSection } from "@/features/admin/settings/sections/PaymentsSettingsSection";
import { ShippingSettingsSection } from "@/features/admin/settings/sections/ShippingSettingsSection";
import type {
  SettingsSectionDefinition,
  SettingsSectionId,
} from "@/features/admin/settings/types/settings-section";

/**
 * Single source of truth for Admin Settings navigation and content.
 * Titles/descriptions resolve via i18n at render time.
 * Add a future module by appending one definition (plus domain fields in a separate RFC).
 */
export const SETTINGS_SECTIONS: readonly SettingsSectionDefinition[] = [
  {
    id: "general",
    icon: Store,
    order: 1,
    fieldRoots: [
      "storeName",
      "tagline",
      "description",
      "currency",
      "country",
      "locale",
      "language",
    ],
    component: GeneralSettingsSection,
  },
  {
    id: "branding",
    icon: Palette,
    order: 2,
    fieldRoots: [
      "logo",
      "favicon",
      "primaryColor",
      "secondaryColor",
      "hero",
    ],
    component: BrandingSettingsSection,
  },
  {
    id: "contact",
    icon: MapPin,
    order: 3,
    fieldRoots: [
      "email",
      "phone",
      "whatsapp",
      "address",
      "instagram",
      "facebook",
      "tiktok",
      "youtube",
    ],
    component: ContactSettingsSection,
  },
  {
    id: "shipping",
    icon: Truck,
    order: 4,
    fieldRoots: ["shippingEnabled"],
    component: ShippingSettingsSection,
  },
  {
    id: "payments",
    icon: CreditCard,
    order: 5,
    fieldRoots: ["paymentProviders"],
    component: PaymentsSettingsSection,
  },
  {
    id: "notifications",
    icon: Bell,
    order: 6,
    fieldRoots: ["notifications"],
    component: NotificationsSettingsSection,
  },
  {
    id: "inventory",
    icon: Package,
    order: 7,
    fieldRoots: ["inventory"],
    component: InventorySettingsSection,
  },
  {
    id: "advanced",
    icon: Settings2,
    order: 8,
    fieldRoots: ["maintenanceMode"],
    component: AdvancedSettingsSection,
  },
];

export function getSettingsSections(): readonly SettingsSectionDefinition[] {
  return [...SETTINGS_SECTIONS].sort((a, b) => a.order - b.order);
}

export function isSettingsSectionId(value: string): value is SettingsSectionId {
  return SETTINGS_SECTIONS.some((section) => section.id === value);
}

export function getSettingsSection(
  id: SettingsSectionId,
): SettingsSectionDefinition | undefined {
  return SETTINGS_SECTIONS.find((section) => section.id === id);
}

/**
 * Maps a top-level form error key to the section that owns it.
 */
export function resolveSectionIdForField(
  fieldRoot: string,
): SettingsSectionId | undefined {
  const match = SETTINGS_SECTIONS.find((section) =>
    section.fieldRoots.includes(fieldRoot),
  );
  return match?.id;
}
