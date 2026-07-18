import Link from "next/link";

import { formatPrice } from "@/lib/format-price";
import { cn } from "@/lib/utils";
import { radius, transition } from "@/shared/design/tokens";
import { Badge } from "@/shared/ui/Badge";

/**
 * Presentational product tile.
 *
 * Links to `/products/[slug]`. No Firebase. No data fetching.
 *
 * Extension points (not implemented): wishlist, quick view, discounts.
 */

export type ProductCardProps = {
  name: string;
  image: string;
  slug: string;
  price: number;
  currency: string;
  /** BCP 47 locale from StoreSettings. */
  locale: string;
  /** Optional status / promo label (e.g. "New", "Sale"). */
  badge?: string;
  className?: string;
};

export function ProductCard({
  name,
  image,
  slug,
  price,
  currency,
  locale,
  badge,
  className,
}: ProductCardProps) {
  const hasImage = image.trim().length > 0;
  const formattedPrice = formatPrice(price, currency, locale);

  return (
    <Link
      href={`/products/${slug}`}
      data-slug={slug}
      data-product-name={name}
      className={cn("group flex flex-col gap-4", className)}
      aria-label={`${name}, ${formattedPrice}`}
    >
      <div
        className="relative aspect-3/4 overflow-hidden bg-muted/50"
        style={{ borderRadius: radius.lg }}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote hosts vary per client; next/image domains are not fixed yet
          <img
            src={image}
            alt=""
            className="size-full object-cover transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            style={{ transitionDuration: transition.slower }}
          />
        ) : (
          <div className="size-full bg-muted/70" aria-hidden />
        )}

        {badge?.trim() ? (
          <div className="absolute left-3 top-3 z-1">
            <Badge variant="primary">{badge.trim()}</Badge>
          </div>
        ) : null}

        {/* Future: wishlist / quick-view affordances (top-right). */}
        <div
          className="pointer-events-none absolute right-3 top-3 z-1 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ transitionDuration: transition.normal }}
          aria-hidden
          data-product-card-actions
        />

        {/* Future: discount / compare-at price overlay (bottom). */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 opacity-0"
          aria-hidden
          data-product-card-promo
        />

        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          style={{ transitionDuration: transition.normal }}
          aria-hidden
        />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm font-medium tracking-tight text-foreground transition-colors group-hover:text-brand-accent sm:text-[0.95rem]">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground">{formattedPrice}</p>
      </div>
    </Link>
  );
}
