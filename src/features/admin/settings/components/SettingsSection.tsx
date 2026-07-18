"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { AdminSection } from "@/features/admin/ui/AdminSection";
import type { SettingsSectionId } from "@/features/admin/settings/types/settings-section";

type SettingsSectionProps = {
  id: SettingsSectionId;
  title: string;
  description: string;
  icon: LucideIcon;
  flashToken?: number;
  children: ReactNode;
};

/**
 * Settings section — thin wrapper over AdminSection with scroll anchors.
 */
export function SettingsSection({
  id,
  title,
  description,
  icon,
  flashToken = 0,
  children,
}: SettingsSectionProps) {
  return (
    <AdminSection
      id={id}
      title={title}
      description={description}
      icon={icon}
      flashToken={flashToken}
    >
      {children}
    </AdminSection>
  );
}
