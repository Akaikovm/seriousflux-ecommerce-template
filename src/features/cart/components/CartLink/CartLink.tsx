"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { useCartHydrated } from "@/features/cart/hooks/use-cart-hydrated";
import {
  selectCartItemCount,
  useCartStore,
} from "@/features/cart/store";
import { Badge } from "@/shared/ui/Badge";
import { transition } from "@/shared/design/tokens";

/**
 * Header cart affordance — client island over the Zustand store.
 *
 * Badge count waits for localStorage rehydration to avoid SSR mismatch.
 */

export function CartLink() {
  const hydrated = useCartHydrated();
  const itemCount = useCartStore(selectCartItemCount);
  const showBadge = hydrated && itemCount > 0;

  const label =
    showBadge
      ? `Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`
      : "Cart";

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center justify-center text-foreground hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ transitionDuration: transition.fast }}
      aria-label={label}
    >
      <ShoppingCart className="size-5" aria-hidden />
      {showBadge ? (
        <Badge
          variant="primary"
          className="absolute -right-2.5 -top-2.5 min-w-5 justify-center px-1"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </Badge>
      ) : null}
    </Link>
  );
}
