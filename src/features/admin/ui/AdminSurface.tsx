import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminSurfaceProps = {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  compact?: boolean;
  flash?: boolean;
  interactive?: boolean;
  /** When false, children are not wrapped in padded body. */
  padded?: boolean;
};

/**
 * Default Admin elevated panel (ADR-021).
 */
export function AdminSurface({
  children,
  className,
  bodyClassName,
  compact = false,
  flash = false,
  interactive = false,
  padded = true,
}: AdminSurfaceProps) {
  return (
    <div
      className={cn(
        "admin-surface",
        interactive && "admin-surface--interactive",
        className,
      )}
      data-flash={flash ? "true" : "false"}
    >
      {padded ? (
        <div
          className={cn(
            "admin-surface__body",
            compact && "admin-surface__body--compact",
            bodyClassName,
          )}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
