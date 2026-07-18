import type { CartItem } from "@/features/cart/types";
import { formatPrice } from "@/lib/format-price";
import { cn } from "@/lib/utils";
import { StorefrontSummaryPanel } from "@/features/storefront/components/StorefrontSummaryPanel";
import { radius } from "@/shared/design/tokens";

/**
 * Order summary sidebar — presentational.
 * Reads cart snapshots + shipping cost; no mutations.
 */

export type CheckoutSummaryProps = {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  currency: string;
  locale: string;
  className?: string;
};

export function CheckoutSummary({
  items,
  subtotal,
  shippingCost,
  currency,
  locale,
  className,
}: CheckoutSummaryProps) {
  const total = subtotal + shippingCost;

  return (
    <StorefrontSummaryPanel
      title="Order summary"
      className={cn(
        "lg:sticky lg:top-[calc(var(--storefront-navbar-height)+1.5rem)]",
        className,
      )}
    >
      <ul className="list-none space-y-4 p-0">
        {items.map((item) => {
          const lineTotal = formatPrice(
            item.price * item.quantity,
            item.currency || currency,
            locale,
          );
          const unitPrice = formatPrice(
            item.price,
            item.currency || currency,
            locale,
          );
          const hasImage = item.image.trim().length > 0;

          return (
            <li
              key={item.productId}
              className="flex items-start gap-3 text-sm"
            >
              <div
                className="relative size-12 shrink-0 overflow-hidden bg-muted/50"
                style={{ borderRadius: radius.md }}
              >
                {hasImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote hosts vary per client
                  <img
                    src={item.image}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-muted-foreground">
                  {item.quantity} × {unitPrice}
                </p>
              </div>
              <p className="shrink-0 font-medium text-foreground">{lineTotal}</p>
            </li>
          );
        })}
      </ul>

      <div className="space-y-2 border-t border-border/70 pt-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-foreground">
            {formatPrice(subtotal, currency, locale)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="font-medium text-foreground">
            {shippingCost === 0
              ? "Free"
              : formatPrice(shippingCost, currency, locale)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 text-base">
          <span className="font-semibold text-foreground">Total</span>
          <span className="font-semibold text-foreground">
            {formatPrice(total, currency, locale)}
          </span>
        </div>
      </div>
    </StorefrontSummaryPanel>
  );
}
