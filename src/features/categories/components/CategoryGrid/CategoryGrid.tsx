"use client";

import { CategoryCard } from "@/features/categories/components/CategoryCard";
import type { StorefrontCategory } from "@/features/categories/lib/to-storefront-category";
import { useT } from "@/i18n";
import { EmptyState } from "@/shared/ui/EmptyState";

/**
 * Presentational grid of category cards.
 *
 * Receives already-fetched, serializable categories. Never imports Firebase (ADR-002).
 */

export type CategoryGridProps = {
  categories: StorefrontCategory[];
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  const t = useT();

  if (categories.length === 0) {
    return (
      <EmptyState
        title={t("categories.emptyTitle")}
        description={t("categories.emptyDescription")}
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5 lg:gap-6">
      {categories.map((category) => (
        <li key={category.id}>
          <CategoryCard
            title={category.name}
            image={category.image}
            slug={category.slug}
            href={`/categories/${category.slug}`}
          />
        </li>
      ))}
    </ul>
  );
}
