import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  type Firestore,
  type FirestoreError,
} from "firebase/firestore";

import type { AuthUser, PersistedRole, UserStatus } from "@/features/auth/types";
import { AuthError } from "@/features/auth/services/auth-error";
import { getFirestoreDb } from "@/firebase/firestore";

/** Firestore collection for identity / customer documents. */
export const CUSTOMERS_COLLECTION = "customers";

export type IdentityDocument = {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: PersistedRole;
  status: UserStatus;
  /** Forward-compatible empty addresses; profile product is out of RFC-017 scope. */
  addresses: [];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

function toIdentityError(error: unknown): AuthError {
  if (error instanceof AuthError) {
    return error;
  }

  const firestoreError = error as FirestoreError | undefined;
  const code = firestoreError?.code;

  if (code === "permission-denied") {
    return new AuthError(
      "You do not have permission to access this account.",
      "permission-denied",
      { cause: error },
    );
  }

  if (code === "unavailable" || code === "deadline-exceeded") {
    return new AuthError(
      "Account service is temporarily unavailable. Please try again.",
      "unavailable",
      { cause: error },
    );
  }

  return new AuthError("Unable to load account profile.", "unknown", {
    cause: error,
  });
}

function mapIdentityDocument(
  id: string,
  data: Record<string, unknown>,
): IdentityDocument {
  const role = data.role;
  const status = data.status;

  const persistedRole: PersistedRole =
    role === "admin" || role === "staff" || role === "customer"
      ? role
      : "customer";

  const userStatus: UserStatus = status === "inactive" ? "inactive" : "active";

  return {
    id,
    email: typeof data.email === "string" ? data.email : "",
    displayName:
      typeof data.displayName === "string" ? data.displayName : "",
    photoURL:
      typeof data.photoURL === "string"
        ? data.photoURL
        : typeof data.photoUrl === "string"
          ? data.photoUrl
          : null,
    role: persistedRole,
    status: userStatus,
    addresses: [],
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt
        : Timestamp.now(),
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt
        : Timestamp.now(),
  };
}

/**
 * Creates or reads the minimal identity document at `customers/{uid}`.
 *
 * Signup always bootstraps `role: "customer"`. Admin users are never
 * created by the application — they must be seeded manually.
 */
export class IdentityBootstrapService {
  constructor(private readonly db: Firestore = getFirestoreDb()) {}

  /**
   * Returns the existing identity document, or `null` if missing.
   */
  async getById(uid: string): Promise<IdentityDocument | null> {
    try {
      const snapshot = await getDoc(doc(this.db, CUSTOMERS_COLLECTION, uid));
      if (!snapshot.exists()) {
        return null;
      }
      return mapIdentityDocument(
        snapshot.id,
        snapshot.data() as Record<string, unknown>,
      );
    } catch (error) {
      throw toIdentityError(error);
    }
  }

  /**
   * Ensures `customers/{uid}` exists with `role: "customer"`.
   * Does not upgrade or overwrite an existing role (idempotent create).
   */
  async ensureCustomer(
    user: AuthUser,
  ): Promise<{ identity: IdentityDocument; created: boolean }> {
    try {
      const ref = doc(this.db, CUSTOMERS_COLLECTION, user.uid);
      const snapshot = await getDoc(ref);

      if (snapshot.exists()) {
        return {
          identity: mapIdentityDocument(
            snapshot.id,
            snapshot.data() as Record<string, unknown>,
          ),
          created: false,
        };
      }

      const now = Timestamp.now();
      const payload = {
        email: user.email ?? "",
        displayName: user.displayName?.trim() || user.email || "Customer",
        photoURL: user.photoURL,
        role: "customer" as const,
        status: "active" as const,
        addresses: [] as [],
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(ref, payload);

      return {
        identity: {
          id: user.uid,
          ...payload,
        },
        created: true,
      };
    } catch (error) {
      throw toIdentityError(error);
    }
  }
}
