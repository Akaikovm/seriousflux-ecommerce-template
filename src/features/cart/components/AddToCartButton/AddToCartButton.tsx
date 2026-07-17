"use client";

import { useCartStore } from "@/features/cart/store";
import type { AddToCartInput } from "@/features/cart/types";
import { Button } from "@/shared/ui/Button";
import { useToast } from "@/shared/ui/Toast";

/**
 * Domain wrapper around Design System Button (ADR-001).
 *
 * Snapshots product fields into the Zustand cart store on click.
 * No Firebase. Checkout belongs to a later RFC.
 */

export type AddToCartButtonProps = Omit<AddToCartInput, "quantity"> & {
  quantity?: number;
  className?: string;
  fullWidth?: boolean;
};

export function AddToCartButton({
  productId,
  name,
  slug,
  image,
  price,
  currency,
  quantity = 1,
  className,
  fullWidth = false,
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const toast = useToast();

  return (
    <Button
      type="button"
      className={className}
      fullWidth={fullWidth}
      onClick={() => {
        addItem({
          productId,
          name,
          slug,
          image,
          price,
          currency,
          quantity,
        });
        toast.success(`${name} added to cart.`);
      }}
    >
      Add to cart
    </Button>
  );
}
