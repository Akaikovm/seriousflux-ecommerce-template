import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

/**
 * Admin page header — eyebrow + title + description + actions (ADR-021).
 */
export function AdminPageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <header className={cn("admin-page-header", className)}>
      <div className="admin-page-header__copy">
        {eyebrow ? (
          <p className="admin-page-header__eyebrow">{eyebrow}</p>
        ) : null}
        <h2 className="admin-page-header__title">{title}</h2>
        {description ? (
          <p className="admin-page-header__description">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="admin-page-header__actions">{actions}</div>
      ) : null}
    </header>
  );
}
