"use client";

import Link from "next/link";

import {
  selectCartItemCount,
  selectCartSubtotal,
  useCartStore,
} from "@/features/cart/store";
import { useCartHydrated } from "@/features/cart/hooks/use-cart-hydrated";
import { CartEmpty } from "@/features/cart/components/CartEmpty";
import { CartItem } from "@/features/cart/components/CartItem";
import { CartSummary } from "@/features/cart/components/CartSummary";
import { StorefrontPageHeader } from "@/features/storefront/components/StorefrontPageHeader";
import { LoadingState } from "@/shared/ui/LoadingState";
import { useToast } from "@/shared/ui/Toast";
import { transition } from "@/shared/design/tokens";

/**
 * Client cart composition — wires Zustand store to presentational pieces.
 *
 * Waits for localStorage rehydration before rendering contents so SSR
 * markup does not flash an empty cart over persisted items.
 */

export type CartViewProps = {
  /** BCP 47 locale from StoreSettings. */
  locale: string;
  /** ISO 4217 store currency fallback when the cart has no items yet. */
  currency: string;
};

export function CartView({ locale, currency }: CartViewProps) {
  const hydrated = useCartHydrated();
  const toast = useToast();
  const items = useCartStore((state) => state.items);
  const itemCount = useCartStore(selectCartItemCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  function handleRemove(productId: string) {
    const item = items.find((entry) => entry.productId === productId);
    removeItem(productId);
    if (item) {
      toast.success(`${item.name} removed from cart.`);
    }
  }

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <LoadingState height="6rem" />
        <LoadingState height="6rem" />
        <LoadingState height="8rem" />
      </div>
    );
  }

  if (items.length === 0) {
    return <CartEmpty />;
  }

  const summaryCurrency = items[0]?.currency || currency;
  const itemLabel = itemCount === 1 ? "1 item" : `${itemCount} items`;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-14">
      <div>
        <StorefrontPageHeader
          title="Cart"
          meta={<span>{itemLabel}</span>}
          actions={
            <Link
              href="/#featured"
              className="text-sm text-muted-foreground transition-colors hover:text-brand-accent"
              style={{ transitionDuration: transition.fast }}
            >
              Continue shopping
            </Link>
          }
        />
        <ul className="list-none divide-y divide-border/70 border-y border-border/70 p-0">
          {items.map((item) => (
            <li key={item.productId}>
              <CartItem
                item={item}
                locale={locale}
                onIncrement={(productId) => {
                  const current = items.find((i) => i.productId === productId);
                  if (!current) return;
                  updateQuantity(productId, current.quantity + 1);
                }}
                onDecrement={(productId) => {
                  const current = items.find((i) => i.productId === productId);
                  if (!current) return;
                  if (current.quantity <= 1) {
                    handleRemove(productId);
                    return;
                  }
                  updateQuantity(productId, current.quantity - 1);
                }}
                onRemove={handleRemove}
              />
            </li>
          ))}
        </ul>
      </div>

      <CartSummary
        subtotal={subtotal}
        currency={summaryCurrency}
        locale={locale}
        itemCount={itemCount}
      />
    </div>
  );
}
