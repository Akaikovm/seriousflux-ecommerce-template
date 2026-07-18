"use client";

import { useEffect, useRef } from "react";

import { getSettingsSections } from "@/features/admin/settings/config/settings-sections";
import type {
  SettingsSectionId,
  SettingsSectionStatus,
} from "@/features/admin/settings/types/settings-section";

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
  const kind = statusKind(status);
  if (!kind) {
    return null;
  }

  const label =
    kind === "error"
      ? "Has validation errors"
      : kind === "dirty"
        ? "Unsaved changes"
        : "Warning";

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
          aria-label="Settings sections"
        >
          {sections.map((section) => {
            const Icon = section.icon;
            const active = section.id === activeId;
            const status = sectionStatuses?.[section.id];

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
                {section.title}
                <StatusDot status={status} />
              </button>
            );
          })}
        </div>
      </div>

      <aside className="admin-settings-rail hidden lg:block" aria-label="Settings sections">
        <div className="admin-settings-rail__panel">
          <p className="admin-settings-rail__label">Sections</p>
          <nav className="admin-settings-rail__nav">
            {sections.map((section) => {
              const Icon = section.icon;
              const active = section.id === activeId;
              const status = sectionStatuses?.[section.id];

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
                  <span className="admin-settings-rail__title">
                    {section.title}
                  </span>
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
