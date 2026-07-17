import type { CartItem } from "@/features/cart/types";
import { formatPrice } from "@/lib/format-price";
import { cn } from "@/lib/utils";
import { radius, spacing } from "@/shared/design/tokens";

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
    <aside
      className={cn("border border-border bg-muted/20 p-6", className)}
      style={{ borderRadius: radius.lg }}
      aria-label="Order summary"
    >
      <div className="flex flex-col" style={{ gap: spacing.lg }}>
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Order summary
        </h2>

        <ul className="list-none space-y-3 p-0">
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

            return (
              <li
                key={item.productId}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
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

        <div className="space-y-2 border-t border-border pt-4 text-sm">
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
      </div>
    </aside>
  );
}
