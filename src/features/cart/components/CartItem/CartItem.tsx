"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";

import type { CartItem as CartItemType } from "@/features/cart/types";
import { formatPrice } from "@/lib/format-price";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { radius, spacing, transition } from "@/shared/design/tokens";

/**
 * Single cart line — presentational.
 *
 * Quantity and remove actions are provided by the parent (CartView),
 * which owns the Zustand wiring. No Firebase.
 */

export type CartItemProps = {
  item: CartItemType;
  /** BCP 47 locale from StoreSettings. */
  locale: string;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
  className?: string;
};

export function CartItem({
  item,
  locale,
  onIncrement,
  onDecrement,
  onRemove,
  className,
}: CartItemProps) {
  const t = useT();
  const hasImage = item.image.trim().length > 0;
  const lineTotal = formatPrice(
    item.price * item.quantity,
    item.currency,
    locale,
  );
  const unitPrice = formatPrice(item.price, item.currency, locale);

  return (
    <article
      className={cn("flex gap-4 py-5", className)}
      data-product-id={item.productId}
      style={{ gap: spacing.lg }}
    >
      <Link
        href={`/products/${item.slug}`}
        className="relative aspect-square w-20 shrink-0 overflow-hidden bg-muted/50 sm:w-24"
        style={{ borderRadius: radius.md }}
        aria-label={item.name}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote hosts vary per client
          <img
            src={item.image}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full bg-muted/60" aria-hidden />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Link
              href={`/products/${item.slug}`}
              className="text-sm font-medium tracking-tight text-foreground hover:underline"
            >
              {item.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {t("cart.each", { price: unitPrice })}
            </p>
          </div>

          <p className="shrink-0 text-sm font-medium text-foreground">
            {lineTotal}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div
            className="inline-flex items-center border border-border"
            style={{ borderRadius: radius.md }}
            role="group"
            aria-label={t("cart.quantityFor", { name: item.name })}
          >
            <button
              type="button"
              onClick={() => onDecrement(item.productId)}
              className="inline-flex size-8 items-center justify-center text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ transitionDuration: transition.fast }}
              aria-label={t("cart.decreaseOf", { name: item.name })}
            >
              <Minus className="size-3.5" aria-hidden />
            </button>
            <span
              className="min-w-8 text-center text-sm font-medium text-foreground"
              aria-live="polite"
            >
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onIncrement(item.productId)}
              className="inline-flex size-8 items-center justify-center text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ transitionDuration: transition.fast }}
              aria-label={t("cart.increaseOf", { name: item.name })}
            >
              <Plus className="size-3.5" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.productId)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ transitionDuration: transition.fast }}
            aria-label={t("cart.removeNamed", { name: item.name })}
          >
            <Trash2 className="size-3.5" aria-hidden />
            <span>{t("common.remove")}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
