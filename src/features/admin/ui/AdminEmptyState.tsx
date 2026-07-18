import type { ReactNode } from "react";

import { EmptyState } from "@/shared/ui/EmptyState";
import { cn } from "@/lib/utils";

type AdminEmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Wrap in Admin surface shell. */
  bordered?: boolean;
};

/**
 * Admin empty state — composes shared EmptyState with Admin surface.
 */
export function AdminEmptyState({
  title,
  description,
  action,
  className,
  bordered = true,
}: AdminEmptyStateProps) {
  const content = (
    <EmptyState title={title} description={description} action={action} />
  );

  if (!bordered) {
    return content;
  }

  return (
    <div className={cn("admin-empty-state", className)}>{content}</div>
  );
}
