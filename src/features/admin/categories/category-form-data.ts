import type { Category } from "@/features/categories/types";

/**
 * Serializable category fields for admin UI (no Firestore Timestamp).
 * Safe to pass from Server Components to Client Components.
 */
export type CategoryFormData = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image: string;
  featured: boolean;
  active: boolean;
  order: number;
};

/**
 * Maps a domain Category onto serializable form/list props (strips Timestamps).
 */
export function toCategoryFormData(category: Category): CategoryFormData {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    featured: category.featured,
    active: category.active,
    order: category.order,
  };
}
