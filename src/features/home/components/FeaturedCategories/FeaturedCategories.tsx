import { CategoryGrid } from "@/features/categories/components/CategoryGrid";
import type { Category } from "@/features/categories/types";
import { Section } from "@/features/storefront/components/Section";
import { SectionTitle } from "@/shared/components/SectionTitle";

/**
 * Featured categories section shell.
 *
 * Presentational only — data is loaded by the homepage via CategoryService
 * and passed in as props (ADR-002).
 */

export type FeaturedCategoriesProps = {
  categories: Category[];
};

export function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  return (
    <Section
      id="categories"
      className="scroll-mt-[var(--storefront-navbar-height)] !py-[var(--storefront-section-py)]"
      aria-labelledby="featured-categories-title"
    >
      <div className="storefront-container">
        <SectionTitle
          id="featured-categories-title"
          title="Collections"
          subtitle="Explore the categories that define this store."
        />
        <CategoryGrid categories={categories} />
      </div>
    </Section>
  );
}
