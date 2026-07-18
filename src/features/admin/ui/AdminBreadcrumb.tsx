import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AdminBreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

/**
 * Light Admin breadcrumb trail.
 */
export function AdminBreadcrumb({ items, className }: AdminBreadcrumbProps) {
  return (
    <nav className={cn("admin-breadcrumb", className)} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        let node: ReactNode;

        if (item.href && !isLast) {
          node = <Link href={item.href}>{item.label}</Link>;
        } else if (isLast) {
          node = (
            <span className="admin-breadcrumb__current">{item.label}</span>
          );
        } else {
          node = <span>{item.label}</span>;
        }

        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
            {index > 0 ? (
              <span className="admin-breadcrumb__sep" aria-hidden>
                /
              </span>
            ) : null}
            {node}
          </span>
        );
      })}
    </nav>
  );
}
