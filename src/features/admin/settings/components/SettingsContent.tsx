"use client";

import { getSettingsSections } from "@/features/admin/settings/config/settings-sections";
import { SettingsSection } from "@/features/admin/settings/components/SettingsSection";
import type {
  SettingsSectionId,
  SettingsSectionProps,
} from "@/features/admin/settings/types/settings-section";
import { useT } from "@/i18n";

type SettingsContentProps = SettingsSectionProps & {
  flashSectionId?: SettingsSectionId | null;
  flashToken?: number;
};

/**
 * Renders every registered settings section (scroll targets for hash nav).
 */
export function SettingsContent({
  flashSectionId,
  flashToken = 0,
  ...props
}: SettingsContentProps) {
  const t = useT();
  const sections = getSettingsSections();

  return (
    <div className="admin-settings-content">
      {sections.map((section) => {
        const SectionFields = section.component;

        return (
          <SettingsSection
            key={section.id}
            id={section.id}
            title={t(`admin.settings.sections.${section.id}.title`)}
            description={t(
              `admin.settings.sections.${section.id}.description`,
            )}
            icon={section.icon}
            flashToken={flashSectionId === section.id ? flashToken : 0}
          >
            <SectionFields {...props} />
          </SettingsSection>
        );
      })}
    </div>
  );
}
