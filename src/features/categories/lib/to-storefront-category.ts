import type { Category } from "@/features/categories/types";

/**
 * Serializable category fields for storefront UI (no Firestore Timestamp).
 * Safe to pass from Server Components to Client Components.
 */
export type StorefrontCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image: string;
};

/**
 * Strips Firestore Timestamps before crossing the RSC → client boundary.
 */
export function toStorefrontCategory(category: Category): StorefrontCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
  };
}
