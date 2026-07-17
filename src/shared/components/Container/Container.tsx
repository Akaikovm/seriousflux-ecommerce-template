import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Horizontal page constraint used across storefront sections.
 *
 * Owns responsive max-width and horizontal padding so feature sections
 * stay aligned without duplicating layout math.
 */

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>
      {children}
    </div>
  );
}
