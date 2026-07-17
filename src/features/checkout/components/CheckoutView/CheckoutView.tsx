"use client";

import {
  selectCartSubtotal,
  useCartStore,
} from "@/features/cart/store";
import { useCartHydrated } from "@/features/cart/hooks/use-cart-hydrated";
import { CheckoutEmpty } from "@/features/checkout/components/CheckoutEmpty";
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";
import { CheckoutSummary } from "@/features/checkout/components/CheckoutSummary";
import { STANDARD_SHIPPING_METHOD } from "@/features/checkout/lib/shipping-methods";
import type { CheckoutSettingsProps } from "@/features/checkout/types";
import { LoadingState } from "@/shared/ui/LoadingState";

/**
 * Client checkout composition — wires CartStore to form + summary.
 * Clears the cart only via the form's success callback after Order create.
 */

export type CheckoutViewProps = CheckoutSettingsProps;

export function CheckoutView({
  currency,
  locale,
  country,
  shippingEnabled,
}: CheckoutViewProps) {
  const hydrated = useCartHydrated();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore(selectCartSubtotal);
  const clearCart = useCartStore((state) => state.clearCart);

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <LoadingState height="6rem" />
        <LoadingState height="10rem" />
        <LoadingState height="8rem" />
      </div>
    );
  }

  if (!shippingEnabled) {
    return <CheckoutEmpty variant="shipping-disabled" />;
  }

  if (items.length === 0) {
    return <CheckoutEmpty variant="empty-cart" />;
  }

  const summaryCurrency = items[0]?.currency || currency;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">
          Checkout
        </h1>
        <CheckoutForm
          items={items}
          currency={summaryCurrency}
          defaultCountry={country}
          onOrderCreated={clearCart}
        />
      </div>

      <CheckoutSummary
        items={items}
        subtotal={subtotal}
        shippingCost={STANDARD_SHIPPING_METHOD.cost}
        currency={summaryCurrency}
        locale={locale}
        className="lg:sticky lg:top-6"
      />
    </div>
  );
}
