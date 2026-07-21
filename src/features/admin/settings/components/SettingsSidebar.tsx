"use client";

import { useEffect, useRef } from "react";

import { getSettingsSections } from "@/features/admin/settings/config/settings-sections";
import type {
  SettingsSectionId,
  SettingsSectionStatus,
} from "@/features/admin/settings/types/settings-section";
import { useT } from "@/i18n";

type SettingsSidebarProps = {
  activeId: SettingsSectionId;
  onNavigate: (id: SettingsSectionId) => void;
  sectionStatuses?: Partial<Record<SettingsSectionId, SettingsSectionStatus>>;
};

function statusKind(
  status: SettingsSectionStatus | undefined,
): "error" | "dirty" | "warning" | null {
  if (!status) {
    return null;
  }
  if (status.hasErrors) {
    return "error";
  }
  if (status.dirty) {
    return "dirty";
  }
  if (status.warning) {
    return "warning";
  }
  return null;
}

function StatusDot({
  status,
}: {
  status: SettingsSectionStatus | undefined;
}) {
  const t = useT();
  const kind = statusKind(status);
  if (!kind) {
    return null;
  }

  const label =
    kind === "error"
      ? t("admin.settings.statusHasErrors")
      : kind === "dirty"
        ? t("admin.settings.statusUnsaved")
        : t("admin.settings.statusWarning");

  return (
    <span
      className="admin-settings-rail__status"
      data-kind={kind}
      title={label}
      aria-label={label}
    />
  );
}

/**
 * Desktop rail + mobile horizontal chips (RFC-020).
 */
export function SettingsSidebar({
  activeId,
  onNavigate,
  sectionStatuses,
}: SettingsSidebarProps) {
  const t = useT();
  const sections = getSettingsSections();
  const chipsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = chipsRef.current;
    if (!scroller) {
      return;
    }
    const active = scroller.querySelector<HTMLElement>(
      `[data-section-id="${activeId}"]`,
    );
    active?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeId]);

  return (
    <>
      <div className="admin-settings-chips lg:hidden">
        <div
          ref={chipsRef}
          className="admin-settings-chips__scroller"
          role="navigation"
          aria-label={t("admin.settings.sectionsAria")}
        >
          {sections.map((section) => {
            const Icon = section.icon;
            const active = section.id === activeId;
            const status = sectionStatuses?.[section.id];
            const title = t(`admin.settings.sections.${section.id}.title`);

            return (
              <button
                key={section.id}
                type="button"
                data-section-id={section.id}
                data-active={active ? "true" : "false"}
                className="admin-settings-chip"
                onClick={() => onNavigate(section.id)}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                {title}
                <StatusDot status={status} />
              </button>
            );
          })}
        </div>
      </div>

      <aside
        className="admin-settings-rail hidden lg:block"
        aria-label={t("admin.settings.sectionsAria")}
      >
        <div className="admin-settings-rail__panel">
          <p className="admin-settings-rail__label">
            {t("admin.settings.sectionsNav")}
          </p>
          <nav className="admin-settings-rail__nav">
            {sections.map((section) => {
              const Icon = section.icon;
              const active = section.id === activeId;
              const status = sectionStatuses?.[section.id];
              const title = t(`admin.settings.sections.${section.id}.title`);

              return (
                <button
                  key={section.id}
                  type="button"
                  data-active={active ? "true" : "false"}
                  className="admin-settings-rail__item"
                  onClick={() => onNavigate(section.id)}
                >
                  <span className="admin-settings-rail__icon" aria-hidden>
                    <Icon className="size-3.5" />
                  </span>
                  <span className="admin-settings-rail__title">{title}</span>
                  <StatusDot status={status} />
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
