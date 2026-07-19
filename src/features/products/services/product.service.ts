import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
  type FirestoreError,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { getFirestoreDb } from "@/firebase/firestore";
import type {
  Product,
  ProductUpdateInput,
  ProductWriteInput,
} from "@/features/products/types";

/** Firestore collection that holds catalog product documents. */
export const PRODUCTS_COLLECTION = "products";

/**
 * Domain error for product reads and writes.
 * Wraps Firebase failures so UI and callers never depend on Firebase error shapes.
 */
export class ProductError extends Error {
  readonly code: "unavailable" | "permission-denied" | "not-found" | "unknown";

  constructor(
    message: string,
    code: ProductError["code"] = "unknown",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "ProductError";
    this.code = code;
  }
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Maps a Firestore product document onto the typed `Product` domain model.
 * Tolerates partial documents so early seed data still loads safely.
 */
export function mapProduct(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): Product {
  const data = snapshot.data() ?? {};

  const visibility =
    data.visibilityWhenOutOfStock === "hidden" ? "hidden" : "visible";

  const product: Product = {
    id: snapshot.id,
    name: asString(data.name),
    slug: asString(data.slug),
    description: asString(data.description),
    image: asString(data.image),
    price: asNumber(data.price, 0),
    currency: asString(data.currency, "ARS"),
    categoryId: asString(data.categoryId),
    featured: asBoolean(data.featured, false),
    active: asBoolean(data.active, false),
    order: asNumber(data.order, 0),
    // Legacy docs without the field remain always-sellable (ADR-023).
    trackInventory: asBoolean(data.trackInventory, false),
    lowStockThreshold: asNumber(data.lowStockThreshold, 5),
    allowBackorders: asBoolean(data.allowBackorders, false),
    visibilityWhenOutOfStock: visibility,
  };

  if (typeof data.sku === "string" && data.sku.trim()) {
    product.sku = data.sku.trim();
  }

  return product;
}

function sortByOrder(products: Product[]): Product[] {
  return [...products].sort((a, b) => a.order - b.order);
}

function toFirestorePayload(input: ProductWriteInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: input.name,
    slug: input.slug,
    description: input.description,
    image: input.image,
    price: input.price,
    currency: input.currency,
    categoryId: input.categoryId,
    featured: input.featured,
    active: input.active,
    order: input.order,
    // New products default to tracking inventory (ADR-023).
    trackInventory: input.trackInventory ?? true,
    lowStockThreshold: input.lowStockThreshold ?? 5,
    allowBackorders: input.allowBackorders ?? false,
    visibilityWhenOutOfStock: input.visibilityWhenOutOfStock ?? "visible",
  };

  if (input.sku !== undefined) {
    const sku = input.sku.trim();
    payload.sku = sku.length > 0 ? sku : null;
  }

  return payload;
}

function mapCreatedProduct(id: string, input: ProductWriteInput): Product {
  const product: Product = {
    id,
    name: input.name,
    slug: input.slug,
    description: input.description,
    image: input.image,
    price: input.price,
    currency: input.currency,
    categoryId: input.categoryId,
    featured: input.featured,
    active: input.active,
    order: input.order,
    trackInventory: input.trackInventory ?? true,
    lowStockThreshold: input.lowStockThreshold ?? 5,
    allowBackorders: input.allowBackorders ?? false,
    visibilityWhenOutOfStock: input.visibilityWhenOutOfStock ?? "visible",
  };
  if (input.sku?.trim()) {
    product.sku = input.sku.trim();
  }
  return product;
}

function toProductError(error: unknown): ProductError {
  if (error instanceof ProductError) {
    return error;
  }

  const firestoreError = error as FirestoreError | undefined;
  const firebaseCode = firestoreError?.code;

  if (firebaseCode === "permission-denied") {
    return new ProductError(
      "You do not have permission to access products.",
      "permission-denied",
      { cause: error },
    );
  }

  if (firebaseCode === "not-found") {
    return new ProductError("Product not found.", "not-found", {
      cause: error,
    });
  }

  if (
    firebaseCode === "unavailable" ||
    firebaseCode === "deadline-exceeded" ||
    firebaseCode === "resource-exhausted"
  ) {
    return new ProductError(
      "Products are temporarily unavailable. Please try again.",
      "unavailable",
      { cause: error },
    );
  }

  return new ProductError("Failed to access products.", "unknown", {
    cause: error,
  });
}

/**
 * Access to the `products` collection.
 *
 * Framework-agnostic: no React, hooks, context or UI.
 * Owns all Firestore queries and mutations for this domain (RFC-007 / RFC-011).
 *
 * Storefront reads use a single equality filter + in-memory sort/filter so
 * the kit boots without waiting on composite indexes. Reintroduce
 * `orderBy` (+ composite indexes) when catalog size warrants it.
 */
export class ProductService {
  constructor(private readonly db: Firestore = getFirestoreDb()) {}

  /**
   * Active products ordered by `order` ascending.
   *
   * @throws {ProductError} on Firestore failures (never raw Firebase errors).
   */
  async getAll(): Promise<Product[]> {
    try {
      const productsQuery = query(
        collection(this.db, PRODUCTS_COLLECTION),
        where("active", "==", true),
      );
      const snapshot = await getDocs(productsQuery);

      return sortByOrder(snapshot.docs.map(mapProduct));
    } catch (error) {
      throw toProductError(error);
    }
  }

  /**
   * All products (active and inactive) ordered by `order` ascending.
   * Intended for admin catalog management (RFC-011).
   *
   * @throws {ProductError} on Firestore failures (never raw Firebase errors).
   */
  async listAll(): Promise<Product[]> {
    try {
      const snapshot = await getDocs(collection(this.db, PRODUCTS_COLLECTION));
      return sortByOrder(snapshot.docs.map(mapProduct));
    } catch (error) {
      throw toProductError(error);
    }
  }

  /**
   * Total product document count (admin dashboard). Aggregation only — no doc reads.
   *
   * @throws {ProductError} on Firestore failures (never raw Firebase errors).
   */
  async countAll(): Promise<number> {
    try {
      const snapshot = await getCountFromServer(
        collection(this.db, PRODUCTS_COLLECTION),
      );
      return snapshot.data().count;
    } catch (error) {
      throw toProductError(error);
    }
  }

  /**
   * Featured active products ordered by `order` ascending.
   *
   * @throws {ProductError} on Firestore failures (never raw Firebase errors).
   */
  async getFeatured(): Promise<Product[]> {
    try {
      const productsQuery = query(
        collection(this.db, PRODUCTS_COLLECTION),
        where("featured", "==", true),
      );
      const snapshot = await getDocs(productsQuery);

      return sortByOrder(
        snapshot.docs.map(mapProduct).filter((product) => product.active),
      );
    } catch (error) {
      throw toProductError(error);
    }
  }

  /**
   * Active products in a category, ordered by `order` ascending.
   *
   * @throws {ProductError} on Firestore failures (never raw Firebase errors).
   */
  async getByCategory(categoryId: string): Promise<Product[]> {
    try {
      const productsQuery = query(
        collection(this.db, PRODUCTS_COLLECTION),
        where("categoryId", "==", categoryId),
      );
      const snapshot = await getDocs(productsQuery);

      return sortByOrder(
        snapshot.docs.map(mapProduct).filter((product) => product.active),
      );
    } catch (error) {
      throw toProductError(error);
    }
  }

  /**
   * Find a product by document id. Returns `null` when missing.
   *
   * @throws {ProductError} on Firestore failures (never raw Firebase errors).
   */
  async getById(id: string): Promise<Product | null> {
    try {
      const snapshot = await getDoc(doc(this.db, PRODUCTS_COLLECTION, id));

      if (!snapshot.exists()) {
        return null;
      }

      return mapProduct(snapshot);
    } catch (error) {
      throw toProductError(error);
    }
  }

  /**
   * Find a product by slug. Returns `null` when no document matches.
   *
   * @throws {ProductError} on Firestore failures (never raw Firebase errors).
   */
  async getBySlug(slug: string): Promise<Product | null> {
    try {
      const productsQuery = query(
        collection(this.db, PRODUCTS_COLLECTION),
        where("slug", "==", slug),
        limit(1),
      );
      const snapshot = await getDocs(productsQuery);

      if (snapshot.empty) {
        return null;
      }

      const docSnap = snapshot.docs[0];
      return docSnap ? mapProduct(docSnap) : null;
    } catch (error) {
      throw toProductError(error);
    }
  }

  /**
   * Create a product document. Returns the created domain model.
   *
   * @throws {ProductError} on Firestore failures (never raw Firebase errors).
   */
  async create(input: ProductWriteInput, id?: string): Promise<Product> {
    try {
      const payload = toFirestorePayload(input);
      const normalized: ProductWriteInput = {
        ...input,
        trackInventory: input.trackInventory ?? true,
        lowStockThreshold: input.lowStockThreshold ?? 5,
        allowBackorders: input.allowBackorders ?? false,
        visibilityWhenOutOfStock: input.visibilityWhenOutOfStock ?? "visible",
      };

      if (id) {
        await setDoc(doc(this.db, PRODUCTS_COLLECTION, id), payload);
        return mapCreatedProduct(id, normalized);
      }

      const ref = await addDoc(collection(this.db, PRODUCTS_COLLECTION), payload);
      return mapCreatedProduct(ref.id, normalized);
    } catch (error) {
      throw toProductError(error);
    }
  }

  /**
   * Update an existing product. Returns the merged domain model.
   *
   * @throws {ProductError} when missing or on Firestore failures.
   */
  async update(id: string, input: ProductUpdateInput): Promise<Product> {
    try {
      const ref = doc(this.db, PRODUCTS_COLLECTION, id);
      const existing = await getDoc(ref);

      if (!existing.exists()) {
        throw new ProductError("Product not found.", "not-found");
      }

      await updateDoc(ref, input);

      const current = mapProduct(existing);
      return { ...current, ...input, id };
    } catch (error) {
      throw toProductError(error);
    }
  }

  /**
   * Delete a product document by id.
   *
   * @throws {ProductError} on Firestore failures (never raw Firebase errors).
   */
  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, PRODUCTS_COLLECTION, id));
    } catch (error) {
      throw toProductError(error);
    }
  }
}
