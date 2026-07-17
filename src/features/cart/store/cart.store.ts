"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AddToCartInput, CartItem } from "@/features/cart/types";

/**
 * Zustand cart store (RFC-009).
 *
 * Owns all cart state. Components read/write via selectors and actions —
 * cart state never lives in React component state.
 *
 * Persistence: localStorage via Zustand `persist`. No Firebase.
 */

export type CartStore = {
  items: CartItem[];

  /** Adds a product (or increments quantity when already present). */
  addItem: (input: AddToCartInput) => void;

  /** Removes a line by product id. */
  removeItem: (productId: string) => void;

  /**
   * Sets absolute quantity for a line.
   * Quantity <= 0 removes the item.
   */
  updateQuantity: (productId: string, quantity: number) => void;

  /** Clears the entire cart. */
  clearCart: () => void;
};

const STORAGE_KEY = "seriousflux-cart";

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (input) => {
        const quantityToAdd = input.quantity ?? 1;
        if (quantityToAdd <= 0) return;

        const existing = get().items.find(
          (item) => item.productId === input.productId,
        );

        if (existing) {
          set({
            items: get().items.map((item) =>
              item.productId === input.productId
                ? { ...item, quantity: item.quantity + quantityToAdd }
                : item,
            ),
          });
          return;
        }

        const next: CartItem = {
          productId: input.productId,
          name: input.name,
          slug: input.slug,
          image: input.image,
          price: input.price,
          currency: input.currency,
          quantity: quantityToAdd,
        };

        set({ items: [...get().items, next] });
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter((item) => item.productId !== productId),
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item,
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/** Total units across all lines. */
export function selectCartItemCount(state: CartStore): number {
  return state.items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Subtotal of all lines (price × quantity).
 * Assumes a single store currency in v1.
 */
export function selectCartSubtotal(state: CartStore): number {
  return state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
}
