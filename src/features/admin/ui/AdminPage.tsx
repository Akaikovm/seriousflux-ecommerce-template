import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminPageProps = {
  children: ReactNode;
  /** Constrain to form width. */
  narrow?: boolean;
  /** No max-width (full main column). */
  flush?: boolean;
  className?: string;
  /** Sticky footer slot (e.g. AdminSaveBar). */
  footer?: ReactNode;
};

/**
 * Standard Admin page wrapper (ADR-021).
 */
export function AdminPage({
  children,
  narrow = false,
  flush = false,
  className,
  footer,
}: AdminPageProps) {
  return (
    <div
      className={cn(
        "admin-page",
        narrow && "admin-page--narrow",
        flush && "admin-page--flush",
        className,
      )}
    >
      {children}
      {footer}
    </div>
  );
}
