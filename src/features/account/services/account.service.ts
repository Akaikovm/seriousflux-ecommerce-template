import {
  doc,
  getDoc,
  Timestamp,
  updateDoc,
  type DocumentData,
  type Firestore,
  type FirestoreError,
} from "firebase/firestore";

import type { AccountProfileUpdateInput } from "@/features/account/types";
import { AuthError, AuthService } from "@/features/auth/services";
import { CUSTOMERS_COLLECTION } from "@/features/auth/services/identity-bootstrap.service";
import type { CustomerProfile } from "@/features/customers/types";
import type { PersistedRole, UserStatus } from "@/features/auth/types";
import { getFirestoreDb } from "@/firebase/firestore";

/**
 * Domain error for account profile operations.
 */
export class AccountError extends Error {
  readonly code:
    | "invalid-input"
    | "not-found"
    | "permission-denied"
    | "unavailable"
    | "unknown";

  constructor(
    message: string,
    code: AccountError["code"] = "unknown",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AccountError";
    this.code = code;
  }
}

function toAccountError(error: unknown): AccountError {
  if (error instanceof AccountError) {
    return error;
  }

  const firestoreError = error as FirestoreError | undefined;
  const code = firestoreError?.code;

  if (code === "permission-denied") {
    return new AccountError(
      "You do not have permission to update this profile.",
      "permission-denied",
      { cause: error },
    );
  }

  if (code === "not-found") {
    return new AccountError("Profile not found.", "not-found", {
      cause: error,
    });
  }

  if (code === "unavailable" || code === "deadline-exceeded") {
    return new AccountError(
      "Account is temporarily unavailable. Please try again.",
      "unavailable",
      { cause: error },
    );
  }

  return new AccountError("Unable to update your profile.", "unknown", {
    cause: error,
  });
}

function mapCustomerProfile(
  id: string,
  data: Record<string, unknown>,
): CustomerProfile {
  const role = data.role;
  const status = data.status;

  const persistedRole: PersistedRole =
    role === "admin" || role === "staff" || role === "customer"
      ? role
      : "customer";

  const userStatus: UserStatus = status === "inactive" ? "inactive" : "active";

  const profile: CustomerProfile = {
    id,
    email: typeof data.email === "string" ? data.email : "",
    displayName:
      typeof data.displayName === "string" ? data.displayName : "",
    role: persistedRole,
    status: userStatus,
    addresses: [],
    createdAt:
      data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
    updatedAt:
      data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now(),
  };

  if (typeof data.phone === "string" && data.phone.trim()) {
    profile.phone = data.phone.trim();
  }

  if (typeof data.photoURL === "string") {
    profile.photoURL = data.photoURL;
  } else if (typeof data.photoUrl === "string") {
    profile.photoURL = data.photoUrl;
  } else if (data.photoURL === null) {
    profile.photoURL = null;
  }

  return profile;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Customer profile reads/writes for Account (RFC-018).
 *
 * Owns allowed profile fields only. Never writes role, status, or email.
 * Auth sync of displayName/photoURL is best-effort and never rolls back Firestore.
 */
export class AccountService {
  constructor(
    private readonly db: Firestore = getFirestoreDb(),
    private readonly authService: AuthService = new AuthService(),
  ) {}

  /**
   * Load `customers/{customerId}`.
   *
   * @throws {AccountError} on Firestore failures.
   */
  async getProfile(customerId: string): Promise<CustomerProfile | null> {
    try {
      const trimmed = customerId.trim();
      if (!trimmed) {
        return null;
      }

      const snapshot = await getDoc(doc(this.db, CUSTOMERS_COLLECTION, trimmed));
      if (!snapshot.exists()) {
        return null;
      }

      return mapCustomerProfile(
        snapshot.id,
        snapshot.data() as Record<string, unknown>,
      );
    } catch (error) {
      throw toAccountError(error);
    }
  }

  /**
   * Update editable profile fields on Firestore, then best-effort Auth sync.
   *
   * @throws {AccountError} on validation or Firestore failures.
   */
  async updateProfile(
    customerId: string,
    input: AccountProfileUpdateInput,
  ): Promise<CustomerProfile> {
    try {
      const trimmedId = customerId.trim();
      if (!trimmedId) {
        throw new AccountError("Customer id is required.", "invalid-input");
      }

      const displayName = input.displayName.trim();
      if (!displayName) {
        throw new AccountError("Display name is required.", "invalid-input");
      }

      let photoURL: string | null | undefined = input.photoURL;
      if (typeof photoURL === "string") {
        const trimmedPhoto = photoURL.trim();
        if (!trimmedPhoto) {
          photoURL = null;
        } else if (!isHttpUrl(trimmedPhoto)) {
          throw new AccountError(
            "Photo URL must be a valid http(s) link.",
            "invalid-input",
          );
        } else {
          photoURL = trimmedPhoto;
        }
      }

      const phone =
        typeof input.phone === "string" ? input.phone.trim() : undefined;

      const current = await this.getProfile(trimmedId);
      if (!current) {
        throw new AccountError("Profile not found.", "not-found");
      }

      const now = Timestamp.now();
      const patch: DocumentData = {
        displayName,
        updatedAt: now,
      };

      if (photoURL !== undefined) {
        patch.photoURL = photoURL;
      }

      if (phone !== undefined) {
        patch.phone = phone.length > 0 ? phone : null;
      }

      await updateDoc(doc(this.db, CUSTOMERS_COLLECTION, trimmedId), patch);

      // Best-effort Auth sync — never roll back Firestore on failure.
      try {
        await this.authService.updateProfileFields({
          displayName,
          ...(photoURL !== undefined ? { photoURL } : {}),
        });
      } catch (error) {
        if (!(error instanceof AuthError)) {
          console.error("[AccountService] Auth profile sync failed", error);
        } else {
          console.error(
            `[AccountService] Auth profile sync failed: ${error.code}`,
          );
        }
      }

      const updated = await this.getProfile(trimmedId);
      if (!updated) {
        throw new AccountError("Profile not found.", "not-found");
      }
      return updated;
    } catch (error) {
      throw toAccountError(error);
    }
  }
}
