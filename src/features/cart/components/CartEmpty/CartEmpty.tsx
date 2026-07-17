import Link from "next/link";

import { EmptyState } from "@/shared/ui/EmptyState";
import { radius, spacing, transition, typography } from "@/shared/design/tokens";

/**
 * Empty cart surface — composes Design System EmptyState (ADR-001).
 *
 * Presentational. CTA links back to the storefront home.
 */

export type CartEmptyProps = {
  className?: string;
};

export function CartEmpty({ className }: CartEmptyProps) {
  return (
    <div className={className}>
      <EmptyState
        title="Your cart is empty"
        description="Browse the store and add products to get started."
        action={
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{
              gap: spacing.sm,
              paddingBlock: spacing.sm,
              paddingInline: spacing.lg,
              borderRadius: radius.md,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              lineHeight: typography.lineHeight.tight,
              transitionProperty: "color, background-color, opacity",
              transitionDuration: transition.fast,
            }}
          >
            Continue shopping
          </Link>
        }
      />
    </div>
  );
}
