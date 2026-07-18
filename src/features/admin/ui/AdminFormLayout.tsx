import type { ReactNode } from "react";

import { AdminSurface } from "@/features/admin/ui/AdminSurface";
import { cn } from "@/lib/utils";

type AdminFormLayoutProps = {
  children: ReactNode;
  className?: string;
  /** Sticky / floating footer (typically AdminSaveBar). */
  footer?: ReactNode;
};

/**
 * Form page scaffold — surface + field stack + optional save bar.
 */
export function AdminFormLayout({
  children,
  className,
  footer,
}: AdminFormLayoutProps) {
  return (
    <div className={cn("admin-form", className)}>
      <AdminSurface>
        <div className="admin-form__fields">{children}</div>
      </AdminSurface>
      {footer}
    </div>
  );
}

type AdminFormFooterProps = {
  children: ReactNode;
  className?: string;
};

export function AdminFormFooter({ children, className }: AdminFormFooterProps) {
  return <div className={cn("admin-form-footer", className)}>{children}</div>;
}
