import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { radius, shadow, spacing, transition } from "@/shared/design/tokens";

/**
 * Design System Card — reusable surface.
 *
 * No ecommerce semantics. Padding and optional hover elevation only.
 */

type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Internal padding from the spacing scale. */
  padding?: CardPadding;
  /** Elevates the surface on hover. */
  hover?: boolean;
};

const paddingMap: Record<CardPadding, string> = {
  none: spacing.none,
  sm: spacing.md,
  md: spacing.lg,
  lg: spacing.xl,
};

export function Card({
  children,
  className,
  padding = "md",
  hover = false,
  style,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "border border-border bg-card text-card-foreground",
        hover && "hover:shadow-[var(--ds-card-hover-shadow)]",
        className,
      )}
      style={
        {
          padding: paddingMap[padding],
          borderRadius: radius.lg,
          boxShadow: shadow.sm,
          ...(hover
            ? {
                "--ds-card-hover-shadow": shadow.md,
                transitionProperty: "box-shadow",
                transitionDuration: transition.fast,
              }
            : {}),
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
}
