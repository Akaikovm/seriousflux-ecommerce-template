import type { Metadata } from "next";

import { StoreSettingsForm } from "@/features/admin/settings/StoreSettingsForm";
import { toStoreSettingsFormData } from "@/features/admin/settings/store-settings-form-data";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

export const metadata: Metadata = {
  title: "Settings",
};

/**
 * Admin settings — `/admin/settings`.
 */
export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <StoreSettingsForm settings={toStoreSettingsFormData(settings)} />
  );
}
