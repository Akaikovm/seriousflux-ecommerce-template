import Link from "next/link";

import { EmptyState } from "@/shared/ui/EmptyState";
import { radius, spacing, transition, typography } from "@/shared/design/tokens";

/**
 * Empty / blocked checkout surfaces.
 */

export type CheckoutEmptyProps = {
  variant?: "empty-cart" | "shipping-disabled";
  className?: string;
};

export function CheckoutEmpty({
  variant = "empty-cart",
  className,
}: CheckoutEmptyProps) {
  if (variant === "shipping-disabled") {
    return (
      <div className={className}>
        <EmptyState
          title="Shipping is currently unavailable"
          description="This store is not accepting shipments right now. Please check back later or contact the store for help."
          action={
            <Link
              href="/cart"
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
              Back to cart
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <EmptyState
        title="Your cart is empty"
        description="Add products to your cart before checking out."
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
