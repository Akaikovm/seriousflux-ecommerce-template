"use client";

import type { ReactNode } from "react";

import { SettingsSidebar } from "@/features/admin/settings/components/SettingsSidebar";
import type {
  SettingsSectionId,
  SettingsSectionStatus,
} from "@/features/admin/settings/types/settings-section";

type SettingsLayoutProps = {
  activeId: SettingsSectionId;
  onNavigate: (id: SettingsSectionId) => void;
  sectionStatuses?: Partial<Record<SettingsSectionId, SettingsSectionStatus>>;
  children: ReactNode;
  saveBar: ReactNode;
};

/**
 * Desktop sticky rail + scrollable content; mobile chip rail.
 */
export function SettingsLayout({
  activeId,
  onNavigate,
  sectionStatuses,
  children,
  saveBar,
}: SettingsLayoutProps) {
  return (
    <div className="admin-settings__shell">
      <div className="admin-settings__body">
        <SettingsSidebar
          activeId={activeId}
          onNavigate={onNavigate}
          sectionStatuses={sectionStatuses}
        />
        {children}
      </div>
      {saveBar}
    </div>
  );
}
