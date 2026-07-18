import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminRowActionsProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Compact row action cluster for Admin tables.
 */
export function AdminRowActions({ children, className }: AdminRowActionsProps) {
  return <div className={cn("admin-row-actions", className)}>{children}</div>;
}
