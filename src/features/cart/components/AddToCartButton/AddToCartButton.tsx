"use client";

import { useCartStore } from "@/features/cart/store";
import type { AddToCartInput } from "@/features/cart/types";
import { useT } from "@/i18n";
import { Button } from "@/shared/ui/Button";
import { useToast } from "@/shared/ui/Toast";

/**
 * Domain wrapper around Design System Button (ADR-001 / RFC-023).
 *
 * Snapshots product fields into the Zustand cart store on click.
 * Soft-enforces maxQuantity when inventory is tracked (checkout still validates).
 */

export type AddToCartButtonProps = Omit<AddToCartInput, "quantity"> & {
  quantity?: number;
  className?: string;
  fullWidth?: boolean;
  /** When false, button is disabled (out of stock, no backorders). */
  canPurchase?: boolean;
  /** Soft max for tracked inventory (null = unlimited). */
  maxQuantity?: number | null;
  /** When true, hide the button entirely. */
  hidden?: boolean;
  /** Disabled label override (e.g. Out of stock). */
  unavailableLabel?: string;
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
  canPurchase = true,
  maxQuantity = null,
  hidden = false,
  unavailableLabel,
}: AddToCartButtonProps) {
  const t = useT();
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const toast = useToast();

  if (hidden) {
    return null;
  }

  const inCart =
    items.find((item) => item.productId === productId)?.quantity ?? 0;

  const disabledLabel = unavailableLabel ?? t("products.outOfStock");

  return (
    <Button
      type="button"
      className={className}
      fullWidth={fullWidth}
      disabled={!canPurchase}
      onClick={() => {
        if (!canPurchase) {
          return;
        }

        if (maxQuantity !== null && inCart + quantity > maxQuantity) {
          toast.error(
            maxQuantity === 0
              ? t("cart.outOfStockNamed", { name })
              : t("cart.onlyAvailable", { max: maxQuantity, name }),
          );
          return;
        }

        addItem({
          productId,
          name,
          slug,
          image,
          price,
          currency,
          quantity,
        });
        toast.success(t("cart.addedToast", { name }));
      }}
    >
      {canPurchase ? t("products.addToCart") : disabledLabel}
    </Button>
  );
}
