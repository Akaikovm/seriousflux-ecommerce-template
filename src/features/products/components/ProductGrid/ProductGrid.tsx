import { ProductCard } from "@/features/products/components/ProductCard";
import type { Product } from "@/features/products/types";
import { EmptyState } from "@/shared/ui/EmptyState";

/**
 * Presentational grid of product cards.
 *
 * Receives already-fetched products. Never imports Firebase (RFC-007).
 */

export type ProductGridProps = {
  products: Product[];
  /** BCP 47 locale from StoreSettings for price formatting. */
  locale: string;
  /** ISO 4217 store currency from StoreSettings (product fallback). */
  currency: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function ProductGrid({
  products,
  locale,
  currency,
  emptyTitle = "No products yet",
  emptyDescription = "Featured products will appear here once the catalog is published.",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-5 sm:gap-7 lg:grid-cols-4 lg:gap-8">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard
            name={product.name}
            image={product.image}
            slug={product.slug}
            price={product.price}
            currency={product.currency || currency}
            locale={locale}
          />
        </li>
      ))}
    </ul>
  );
}
