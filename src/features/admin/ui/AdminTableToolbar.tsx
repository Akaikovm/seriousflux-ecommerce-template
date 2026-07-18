import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminTableToolbarProps = {
  children: ReactNode;
  className?: string;
  /** Three-column layout hint for search + filter + action. */
  triple?: boolean;
};

/**
 * List filter / search toolbar slot (ADR-021).
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
