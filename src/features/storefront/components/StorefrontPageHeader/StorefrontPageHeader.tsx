import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StorefrontPageHeaderProps = {
  title: string;
  /** Optional supporting line under the title. */
  subtitle?: string;
  /** Optional meta row (counts, links). */
  meta?: ReactNode;
  /** Optional actions aligned to the right on larger screens. */
  actions?: ReactNode;
  /** Heading element id for aria-labelledby. */
  titleId?: string;
  className?: string;
};

/**
 * Shared page title block for cart, checkout, and catalog landings.
 * Uses storefront heading type — brand colors stay on CSS variables.
 */
export function StorefrontPageHeader({
  title,
  subtitle,
  meta,
  actions,
  titleId,
  className,
}: StorefrontPageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        <h1
          id={titleId}
          className="storefront-heading text-[clamp(1.75rem,4vw,2.75rem)] text-foreground text-balance"
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
        ) : null}
        {meta ? <div className="pt-1 text-sm text-muted-foreground">{meta}</div> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
