import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { radius, spacing } from "@/shared/design/tokens";

type StorefrontSummaryPanelProps = {
  title: string;
  children: ReactNode;
  className?: string;
  /** Accessible name for the aside. */
  "aria-label"?: string;
};

/**
 * Shared order / cart summary surface.
 * Brand accent bar uses CSS variables — rebrands per client automatically.
 */
export function StorefrontSummaryPanel({
  title,
  children,
  className,
  "aria-label": ariaLabel = "Order summary",
}: StorefrontSummaryPanelProps) {
  return (
    <aside
      className={cn(
        "relative overflow-hidden border border-border/70 bg-background/80 p-6 backdrop-blur-sm",
        className,
      )}
      style={{ borderRadius: radius.xl }}
      aria-label={ariaLabel}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(
            90deg,
            var(--brand-accent) 0%,
            color-mix(in oklab, var(--primary) 70%, var(--brand-accent)) 100%
          )`,
        }}
        aria-hidden
      />
      <div className="flex flex-col" style={{ gap: spacing.lg }}>
        <h2 className="storefront-heading text-lg tracking-tight text-foreground">
          {title}
        </h2>
        {children}
      </div>
    </aside>
  );
}
