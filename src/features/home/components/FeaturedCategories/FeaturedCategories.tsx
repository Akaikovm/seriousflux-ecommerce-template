"use client";

import { CategoryGrid } from "@/features/categories/components/CategoryGrid";
import type { StorefrontCategory } from "@/features/categories/lib/to-storefront-category";
import { Section } from "@/features/storefront/components/Section";
import { useT } from "@/i18n";
import { SectionTitle } from "@/shared/components/SectionTitle";

/**
 * Featured categories section shell.
 *
 * Presentational only — data is loaded by the homepage via CategoryService
 * and passed in as serializable props (ADR-002).
 */

export type FeaturedCategoriesProps = {
  categories: StorefrontCategory[];
};

export function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  const t = useT();

  return (
    <Section
      id="categories"
      className="scroll-mt-[var(--storefront-navbar-height)] !py-[var(--storefront-section-py)]"
      aria-labelledby="featured-categories-title"
    >
      <div className="storefront-container">
        <SectionTitle
          id="featured-categories-title"
          title={t("home.categoriesTitle")}
          subtitle={t("home.categoriesSubtitle")}
        />
        <CategoryGrid categories={categories} />
      </div>
    </Section>
  );
}
