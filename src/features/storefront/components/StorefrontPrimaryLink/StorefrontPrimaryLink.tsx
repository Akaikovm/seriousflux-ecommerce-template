import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { radius, spacing, transition, typography } from "@/shared/design/tokens";

type StorefrontPrimaryLinkProps = ComponentProps<typeof Link> & {
  fullWidth?: boolean;
};

/**
 * Primary CTA styled as a link — same visual language as Design System Button.
 * Keeps empty states and summary CTAs consistent without duplicating token styles.
 */
export function StorefrontPrimaryLink({
  className,
  fullWidth = false,
  style,
  children,
  ...props
}: StorefrontPrimaryLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center bg-primary text-primary-foreground",
        "hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      style={{
        width: fullWidth ? "100%" : undefined,
        gap: spacing.sm,
        paddingBlock: spacing.sm,
        paddingInline: spacing.lg,
        borderRadius: radius.md,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.tight,
        letterSpacing: typography.letterSpacing.wide,
        transitionProperty: "color, background-color, opacity",
        transitionDuration: transition.fast,
        ...style,
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
