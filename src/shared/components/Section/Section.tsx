import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Semantic vertical section wrapper.
 *
 * Provides consistent rhythm between homepage (and future) blocks
 * without coupling feature components to spacing tokens.
 */

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Accessible name when the section has no visible heading. */
  "aria-label"?: string;
  /** Links the section to a visible heading via id. */
  "aria-labelledby"?: string;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

export function Section({
  children,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...rest
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn("py-12 sm:py-16", className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      {...rest}
    >
      {children}
    </section>
  );
}
