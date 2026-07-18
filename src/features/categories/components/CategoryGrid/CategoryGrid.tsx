import { CategoryCard } from "@/features/categories/components/CategoryCard";
import type { Category } from "@/features/categories/types";
import { EmptyState } from "@/shared/ui/EmptyState";

/**
 * Presentational grid of category cards.
 *
 * Receives already-fetched categories. Never imports Firebase (ADR-002).
 */

export type CategoryGridProps = {
  categories: Category[];
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <EmptyState
        title="No categories yet"
        description="Featured collections will appear here once categories are published."
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
