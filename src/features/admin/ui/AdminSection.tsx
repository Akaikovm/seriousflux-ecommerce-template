"use client";

import type { LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { AdminSurface } from "@/features/admin/ui/AdminSurface";
import { cn } from "@/lib/utils";

type AdminSectionProps = {
  id?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  flashToken?: number;
  children: ReactNode;
  className?: string;
  /** Tighter head/body padding for detail density. */
  compact?: boolean;
  /** No body padding — for nested AdminTable / AdminList. */
  flushBody?: boolean;
};

/**
 * Admin section — surface with optional icon header (ADR-021).
 */
export function AdminSection({
  id,
  title,
  description,
  icon: Icon,
  flashToken = 0,
  children,
  className,
  compact = false,
  flushBody = false,
}: AdminSectionProps) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!flashToken) {
      return;
    }

    const start = window.requestAnimationFrame(() => {
      setFlash(true);
    });
    const timer = window.setTimeout(() => setFlash(false), 700);

    return () => {
      window.cancelAnimationFrame(start);
      window.clearTimeout(timer);
    };
  }, [flashToken]);

  const titleId = id ? `admin-section-${id}-title` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn(
        "admin-section",
        compact && "admin-section--compact",
        flushBody && "admin-section--flush-body",
        className,
      )}
    >
      <AdminSurface flash={flash} padded={false}>
        <header className="admin-section__head">
          {Icon ? (
            <span className="admin-section__icon" aria-hidden>
              <Icon className="size-4" />
            </span>
          ) : null}
          <div className="admin-section__copy">
            <h3 id={titleId} className="admin-section__title">
              {title}
            </h3>
            {description ? (
              <p className="admin-section__description">{description}</p>
            ) : null}
          </div>
        </header>
        <div
          className={cn(
            "admin-surface__body",
            flushBody && "admin-surface__body--flush",
            compact && !flushBody && "admin-surface__body--compact",
          )}
        >
          {children}
        </div>
      </AdminSurface>
    </section>
  );
}

type AdminSectionDividerProps = {
  title: string;
  hint?: string;
};

export function AdminSectionDivider({ title, hint }: AdminSectionDividerProps) {
  return (
    <div className="admin-section__divider">
      <h4 className="admin-section__divider-title">{title}</h4>
      {hint ? <p className="admin-section__divider-hint">{hint}</p> : null}
    </div>
  );
}
