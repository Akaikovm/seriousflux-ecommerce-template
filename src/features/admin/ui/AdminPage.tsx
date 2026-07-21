import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminPageProps = {
  children: ReactNode;
  /** Constrain to form width. */
  narrow?: boolean;
  /** No max-width (full main column). */
  flush?: boolean;
  /** Wide list layout for data tables (products, orders, …). */
  list?: boolean;
  /** Detail / overview layout — list width with list-like vertical rhythm. */
  detail?: boolean;
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
  list = false,
  detail = false,
  className,
  footer,
}: AdminPageProps) {
  return (
    <div
      className={cn(
        "admin-page",
        narrow && "admin-page--narrow",
        flush && "admin-page--flush",
        list && "admin-page--list",
        detail && "admin-page--detail",
        className,
      )}
    >
      {children}
      {footer}
    </div>
  );
}
