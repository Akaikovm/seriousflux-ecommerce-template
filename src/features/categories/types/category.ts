import type { Timestamp } from "firebase/firestore";

/**
 * Product category document.
 *
 * Collection: `categories`
 *
 * Field names match Firestore 1:1 (RFC-006). For this storefront the initial
 * categories map to product lines (e.g. Football Shirts, Hoodies, Shorts).
 * The model stays generic so other clients can redefine categories without
 * schema changes.
 */
export interface Category {
  /** Firestore document id. */
  id: string;

  /** Display name (e.g. `"Football Shirts"`). */
  name: string;

  /** URL-safe unique slug (e.g. `"football-shirts"`). */
  slug: string;

  /** Optional short description for category landing pages. */
  description?: string;

  /** Category image URL (Firestore field: `image`). */
  image: string;

  /**
   * When true, eligible for homepage / highlight surfaces.
   * Firestore field: `featured`.
   */
  featured: boolean;

  /**
   * Manual sort order for navigation and catalog listing.
   * Lower values appear first. Firestore field: `order`.
   */
  order: number;

  /** When false, the category is hidden from the storefront. Firestore field: `active`. */
  active: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Fields required to create a category document (RFC-011).
 * Timestamps are owned by CategoryService on write.
 */
export type CategoryWriteInput = {
  name: string;
  slug: string;
  description?: string;
  image: string;
  featured: boolean;
  order: number;
  active: boolean;
};

/** Partial update payload for admin category edits. */
export type CategoryUpdateInput = Partial<CategoryWriteInput>;
