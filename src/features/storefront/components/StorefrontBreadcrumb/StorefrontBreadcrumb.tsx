"use client";

import Link from "next/link";

import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { transition } from "@/shared/design/tokens";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type StorefrontBreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

/**
 * Lightweight trail for catalog / commerce pages.
 * Presentational — labels and hrefs come from the page.
 */
export function StorefrontBreadcrumb({
  items,
  className,
}: StorefrontBreadcrumbProps) {
  const t = useT();

  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label={t("breadcrumb.ariaLabel")} className={cn("mb-6 sm:mb-8", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? (
                <span className="text-border" aria-hidden>
                  /
                </span>
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-brand-accent"
                  style={{ transitionDuration: transition.fast }}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(isLast && "font-medium text-foreground")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
