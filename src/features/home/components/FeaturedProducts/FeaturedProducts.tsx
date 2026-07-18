import { ProductGrid } from "@/features/products/components/ProductGrid";
import type { Product } from "@/features/products/types";
import { Section } from "@/features/storefront/components/Section";
import { SectionTitle } from "@/shared/components/SectionTitle";

/**
 * Featured products section shell.
 *
 * Presentational only — receives already-fetched products from the page.
 */

export type FeaturedProductsProps = {
  products: Product[];
  /** BCP 47 locale from StoreSettings for price formatting. */
  locale: string;
  /** ISO 4217 store currency from StoreSettings (product fallback). */
  currency: string;
};

export function FeaturedProducts({
  products,
  locale,
  currency,
}: FeaturedProductsProps) {
  return (
    <Section
      id="featured"
      className="scroll-mt-[var(--storefront-navbar-height)] !py-[var(--storefront-section-py)]"
      aria-labelledby="featured-products-title"
    >
      <div className="storefront-container">
        <SectionTitle
          id="featured-products-title"
          title="Featured"
          subtitle="A selection of products worth starting with."
        />
        <ProductGrid
          products={products}
          locale={locale}
          currency={currency}
        />
      </div>
    </Section>
  );
}
