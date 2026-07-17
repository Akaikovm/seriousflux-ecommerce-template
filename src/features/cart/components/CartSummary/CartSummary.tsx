import Link from "next/link";

import { formatPrice } from "@/lib/format-price";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/Button";
import { radius, spacing, transition, typography } from "@/shared/design/tokens";

/**
 * Cart totals block — presentational.
 *
 * Checkout CTA links to `/checkout` when the cart has items.
 */

export type CartSummaryProps = {
  subtotal: number;
  currency: string;
  /** BCP 47 locale from StoreSettings. */
  locale: string;
  itemCount: number;
  className?: string;
};

export function CartSummary({
  subtotal,
  currency,
  locale,
  itemCount,
  className,
}: CartSummaryProps) {
  const formattedSubtotal = formatPrice(subtotal, currency, locale);
  const itemLabel = itemCount === 1 ? "1 item" : `${itemCount} items`;
  const canCheckout = itemCount > 0;

  return (
    <aside
      className={cn("border border-border bg-muted/20 p-6", className)}
      style={{ borderRadius: radius.lg, gap: spacing.lg }}
      aria-label="Order summary"
    >
      <div className="flex flex-col" style={{ gap: spacing.lg }}>
        <div className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Summary
          </h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal ({itemLabel})</span>
            <span className="font-medium text-foreground">
              {formattedSubtotal}
            </span>
          </div>
        </div>

        {canCheckout ? (
          <Link
            href="/checkout"
            className="inline-flex w-full items-center justify-center bg-primary text-primary-foreground hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            Checkout
          </Link>
        ) : (
          <Button type="button" fullWidth disabled>
            Checkout
          </Button>
        )}
      </div>
    </aside>
  );
}
