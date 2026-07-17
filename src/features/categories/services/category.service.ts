import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
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
  Category,
  CategoryUpdateInput,
  CategoryWriteInput,
} from "@/features/categories/types";

/** Firestore collection that holds catalog category documents. */
export const CATEGORIES_COLLECTION = "categories";

/**
 * Domain error for category reads and writes.
 * Wraps Firebase failures so UI and callers never depend on Firebase error shapes.
 */
export class CategoryError extends Error {
  readonly code: "unavailable" | "permission-denied" | "not-found" | "unknown";

  constructor(
    message: string,
    code: CategoryError["code"] = "unknown",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "CategoryError";
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

function asTimestamp(value: unknown, fallback: Timestamp): Timestamp {
  if (value instanceof Timestamp) {
    return value;
  }

  return fallback;
}

/**
 * Maps a Firestore category document onto the typed `Category` domain model.
 * Tolerates partial documents so early seed data still loads safely.
 */
export function mapCategory(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): Category {
  const data = snapshot.data() ?? {};
  const now = Timestamp.now();

  return {
    id: snapshot.id,
    name: asString(data.name),
    slug: asString(data.slug),
    description:
      typeof data.description === "string" ? data.description : undefined,
    image: asString(data.image),
    featured: asBoolean(data.featured, false),
    order: asNumber(data.order, 0),
    active: asBoolean(data.active, false),
    createdAt: asTimestamp(data.createdAt, now),
    updatedAt: asTimestamp(data.updatedAt, now),
  };
}

function sortByOrder(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.order - b.order);
}

function toFirestorePayload(
  input: CategoryWriteInput,
  timestamps: { createdAt: Timestamp; updatedAt: Timestamp },
): Record<string, unknown> {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description ?? "",
    image: input.image,
    featured: input.featured,
    order: input.order,
    active: input.active,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  };
}

function toCategoryError(error: unknown): CategoryError {
  if (error instanceof CategoryError) {
    return error;
  }

  const firestoreError = error as FirestoreError | undefined;
  const firebaseCode = firestoreError?.code;

  if (firebaseCode === "permission-denied") {
    return new CategoryError(
      "You do not have permission to access categories.",
      "permission-denied",
      { cause: error },
    );
  }

  if (firebaseCode === "not-found") {
    return new CategoryError("Category not found.", "not-found", {
      cause: error,
    });
  }

  if (
    firebaseCode === "unavailable" ||
    firebaseCode === "deadline-exceeded" ||
    firebaseCode === "resource-exhausted"
  ) {
    return new CategoryError(
      "Categories are temporarily unavailable. Please try again.",
      "unavailable",
      { cause: error },
    );
  }

  return new CategoryError("Failed to access categories.", "unknown", {
    cause: error,
  });
}

/**
 * Access to the `categories` collection.
 *
 * Framework-agnostic: no React, hooks, context or UI.
 * Owns all Firestore queries and mutations for this domain (ADR-002 / RFC-011).
 */
export class CategoryService {
  constructor(private readonly db: Firestore = getFirestoreDb()) {}

  /**
   * Find a category by document id. Returns `null` when missing.
   * Uses a direct document read — no composite index required.
   *
   * @throws {CategoryError} on Firestore failures (never raw Firebase errors).
   */
  async getById(id: string): Promise<Category | null> {
    try {
      const snapshot = await getDoc(doc(this.db, CATEGORIES_COLLECTION, id));

      if (!snapshot.exists()) {
        return null;
      }

      return mapCategory(snapshot);
    } catch (error) {
      throw toCategoryError(error);
    }
  }

  /**
   * Find a category by slug. Returns `null` when no document matches.
   *
   * @throws {CategoryError} on Firestore failures (never raw Firebase errors).
   */
  async getBySlug(slug: string): Promise<Category | null> {
    try {
      const categoriesQuery = query(
        collection(this.db, CATEGORIES_COLLECTION),
        where("slug", "==", slug),
        limit(1),
      );
      const snapshot = await getDocs(categoriesQuery);

      if (snapshot.empty) {
        return null;
      }

      const docSnap = snapshot.docs[0];
      return docSnap ? mapCategory(docSnap) : null;
    } catch (error) {
      throw toCategoryError(error);
    }
  }

  /**
   * Active categories ordered by `order` ascending.
   *
   * @throws {CategoryError} on Firestore failures (never raw Firebase errors).
   */
  async getAll(): Promise<Category[]> {
    try {
      const categoriesQuery = query(
        collection(this.db, CATEGORIES_COLLECTION),
        where("active", "==", true),
        orderBy("order", "asc"),
      );
      const snapshot = await getDocs(categoriesQuery);

      return snapshot.docs.map(mapCategory);
    } catch (error) {
      throw toCategoryError(error);
    }
  }

  /**
   * All categories (active and inactive) ordered by `order` ascending.
   * Intended for admin catalog management (RFC-011).
   *
   * @throws {CategoryError} on Firestore failures (never raw Firebase errors).
   */
  async listAll(): Promise<Category[]> {
    try {
      const snapshot = await getDocs(
        collection(this.db, CATEGORIES_COLLECTION),
      );
      return sortByOrder(snapshot.docs.map(mapCategory));
    } catch (error) {
      throw toCategoryError(error);
    }
  }

  /**
   * Total category document count (admin dashboard). Aggregation only — no doc reads.
   *
   * @throws {CategoryError} on Firestore failures (never raw Firebase errors).
   */
  async countAll(): Promise<number> {
    try {
      const snapshot = await getCountFromServer(
        collection(this.db, CATEGORIES_COLLECTION),
      );
      return snapshot.data().count;
    } catch (error) {
      throw toCategoryError(error);
    }
  }

  /**
   * Featured active categories ordered by `order` ascending.
   *
   * @throws {CategoryError} on Firestore failures (never raw Firebase errors).
   */
  async getFeatured(): Promise<Category[]> {
    try {
      const categoriesQuery = query(
        collection(this.db, CATEGORIES_COLLECTION),
        where("active", "==", true),
        where("featured", "==", true),
        orderBy("order", "asc"),
      );
      const snapshot = await getDocs(categoriesQuery);

      return snapshot.docs.map(mapCategory);
    } catch (error) {
      throw toCategoryError(error);
    }
  }

  /**
   * Create a category document. Returns the created domain model.
   *
   * @throws {CategoryError} on Firestore failures (never raw Firebase errors).
   */
  async create(input: CategoryWriteInput, id?: string): Promise<Category> {
    try {
      const now = Timestamp.now();
      const payload = toFirestorePayload(input, {
        createdAt: now,
        updatedAt: now,
      });

      if (id) {
        await setDoc(doc(this.db, CATEGORIES_COLLECTION, id), payload);
        return {
          id,
          ...input,
          createdAt: now,
          updatedAt: now,
        };
      }

      const ref = await addDoc(
        collection(this.db, CATEGORIES_COLLECTION),
        payload,
      );

      return {
        id: ref.id,
        ...input,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      throw toCategoryError(error);
    }
  }

  /**
   * Update an existing category. Returns the merged domain model.
   *
   * @throws {CategoryError} when missing or on Firestore failures.
   */
  async update(id: string, input: CategoryUpdateInput): Promise<Category> {
    try {
      const ref = doc(this.db, CATEGORIES_COLLECTION, id);
      const existing = await getDoc(ref);

      if (!existing.exists()) {
        throw new CategoryError("Category not found.", "not-found");
      }

      const now = Timestamp.now();
      await updateDoc(ref, { ...input, updatedAt: now });

      const current = mapCategory(existing);
      return { ...current, ...input, id, updatedAt: now };
    } catch (error) {
      throw toCategoryError(error);
    }
  }

  /**
   * Delete a category document by id.
   *
   * @throws {CategoryError} on Firestore failures (never raw Firebase errors).
   */
  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, CATEGORIES_COLLECTION, id));
    } catch (error) {
      throw toCategoryError(error);
    }
  }
}
