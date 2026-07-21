import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminTableToolbarProps = {
  children: ReactNode;
  className?: string;
  /**
   * @deprecated Fluid flex layout handles 2–4 fields; kept for call-site compat.
   */
  triple?: boolean;
};

/**
 * List filter / search toolbar slot (ADR-021).
 * Fluid flex: search grows, filters stay compact.
 */
export function AdminTableToolbar({
  children,
  className,
  triple = false,
}: AdminTableToolbarProps) {
  return (
    <div
      className={cn(
        "admin-table-toolbar",
        triple && "admin-table-toolbar--triple",
        className,
      )}
    >
      {children}
    </div>
  );
}
