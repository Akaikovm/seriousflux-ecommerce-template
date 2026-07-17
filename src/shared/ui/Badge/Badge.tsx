import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { radius, spacing, typography } from "@/shared/design/tokens";

/**
 * Design System Badge — status / label chip.
 *
 * Variants: primary | secondary only.
 */

type BadgeVariant = "primary" | "secondary";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
};

export function Badge({
  children,
  className,
  variant = "primary",
  style,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap",
        variantClasses[variant],
        className,
      )}
      style={{
        gap: spacing.xs,
        paddingBlock: spacing.xs,
        paddingInline: spacing.sm,
        borderRadius: radius.full,
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.tight,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
