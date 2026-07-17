"use client";

import { useSyncExternalStore } from "react";

import { useCartStore } from "@/features/cart/store/cart.store";

/**
 * True after Zustand `persist` has rehydrated from localStorage.
 *
 * Uses `useSyncExternalStore` so SSR snapshots stay `false` and the
 * client updates once persistence finishes — no hydration mismatch for
 * badge counts or cart page contents.
 */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => useCartStore.persist.onFinishHydration(onStoreChange),
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );
}
