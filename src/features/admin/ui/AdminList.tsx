import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminListProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Unified list panel — toolbar + table as one surface (ADR-021).
 * Matches 2026 admin density: filters sit on the table chrome, not as a separate card.
 */
export function AdminList({ children, className }: AdminListProps) {
  return <div className={cn("admin-list", className)}>{children}</div>;
}
