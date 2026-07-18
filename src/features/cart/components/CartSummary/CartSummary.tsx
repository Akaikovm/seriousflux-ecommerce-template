import Link from "next/link";

import { formatPrice } from "@/lib/format-price";
import { cn } from "@/lib/utils";
import { StorefrontPrimaryLink } from "@/features/storefront/components/StorefrontPrimaryLink";
import { StorefrontSummaryPanel } from "@/features/storefront/components/StorefrontSummaryPanel";
import { Button } from "@/shared/ui/Button";
import { transition } from "@/shared/design/tokens";

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
    <StorefrontSummaryPanel
      title="Summary"
      className={cn("lg:sticky lg:top-[calc(var(--storefront-navbar-height)+1.5rem)]", className)}
      aria-label="Cart summary"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal ({itemLabel})</span>
        <span className="font-medium text-foreground">{formattedSubtotal}</span>
      </div>

      <p className="text-xs text-muted-foreground">
        Shipping and payment are calculated at checkout.
      </p>

      {canCheckout ? (
        <StorefrontPrimaryLink href="/checkout" fullWidth>
          Checkout
        </StorefrontPrimaryLink>
      ) : (
        <Button type="button" fullWidth disabled>
          Checkout
        </Button>
      )}

      <Link
        href="/#featured"
        className="text-center text-sm text-muted-foreground transition-colors hover:text-brand-accent"
        style={{ transitionDuration: transition.fast }}
      >
        Continue shopping
      </Link>
    </StorefrontSummaryPanel>
  );
}
