import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
  type FirestoreError,
} from "firebase/firestore";

import type { PersistedRole, UserStatus } from "@/features/auth/types";
import { CUSTOMERS_COLLECTION } from "@/features/auth/services/identity-bootstrap.service";
import {
  decodeCustomerListCursor,
  encodeCustomerListCursor,
} from "@/features/customers/lib/list-cursor";
import { mapCustomerProfile } from "@/features/customers/lib/map-customer-profile";
import { CustomerAdminError } from "@/features/customers/services/customer-admin-error";
import type { CustomerProfile } from "@/features/customers/types";
import type {
  CustomerAdminActor,
  CustomerAdminListQuery,
  CustomerAdminListResult,
  CustomerAdminListSort,
  CustomerAdminUpdateInput,
} from "@/features/customers/types/customer-admin";
import { CUSTOMER_ADMIN_PAGE_SIZE } from "@/features/customers/types/customer-admin";
import { getFirestoreDb } from "@/firebase/firestore";

function toCustomerAdminError(error: unknown): CustomerAdminError {
  if (error instanceof CustomerAdminError) {
    return error;
  }

  const firestoreError = error as FirestoreError | undefined;
  const code = firestoreError?.code;

  if (code === "permission-denied") {
    return new CustomerAdminError(
      "You do not have permission to manage customers.",
      "permission-denied",
      { cause: error },
    );
  }

  if (code === "not-found") {
    return new CustomerAdminError("Customer not found.", "not-found", {
      cause: error,
    });
  }

  if (
    code === "unavailable" ||
    code === "deadline-exceeded" ||
    code === "resource-exhausted"
  ) {
    return new CustomerAdminError(
      "Customers are temporarily unavailable. Please try again.",
      "unavailable",
      { cause: error },
    );
  }

  return new CustomerAdminError("Unable to manage customers.", "unknown", {
    cause: error,
  });
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isPersistedRole(value: unknown): value is PersistedRole {
  return value === "customer" || value === "staff" || value === "admin";
}

function isUserStatus(value: unknown): value is UserStatus {
  return value === "active" || value === "inactive";
}

function isActiveAdmin(role: PersistedRole, status: UserStatus): boolean {
  return role === "admin" && status === "active";
}

function sortCustomers(
  items: CustomerProfile[],
  sort: CustomerAdminListSort,
): CustomerProfile[] {
  const sorted = [...items];

  sorted.sort((a, b) => {
    switch (sort) {
      case "oldest": {
        const byTime = a.createdAt.toMillis() - b.createdAt.toMillis();
        return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
      }
      case "name_asc": {
        const byName = a.displayName.localeCompare(b.displayName, undefined, {
          sensitivity: "base",
        });
        return byName !== 0 ? byName : a.id.localeCompare(b.id);
      }
      case "name_desc": {
        const byName = b.displayName.localeCompare(a.displayName, undefined, {
          sensitivity: "base",
        });
        return byName !== 0 ? byName : b.id.localeCompare(a.id);
      }
      case "newest":
      default: {
        const byTime = b.createdAt.toMillis() - a.createdAt.toMillis();
        return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
      }
    }
  });

  return sorted;
}

/**
 * Admin operations over `customers/{uid}` (RFC-022).
 *
 * List loads the `customers` collection, then filters/sorts/paginates in
 * memory — same bootable pattern as Admin Orders / ProductService (no
 * composite indexes; matches mapped defaults for missing status/role).
 * Never syncs Firebase Auth profiles. Never deletes customer documents.
 */
export class CustomerAdminService {
  constructor(private readonly db: Firestore = getFirestoreDb()) {}

  /**
   * Paginated customer list for Admin.
   * Search is applied in the UI within the current page (no full-text index).
   */
  async list(
    input: CustomerAdminListQuery = {},
  ): Promise<CustomerAdminListResult> {
    try {
      const sort: CustomerAdminListSort = input.sort ?? "newest";
      const pageSize = Math.min(
        Math.max(input.pageSize ?? CUSTOMER_ADMIN_PAGE_SIZE, 1),
        100,
      );

      if (input.status && !isUserStatus(input.status)) {
        throw new CustomerAdminError("Invalid status filter.", "invalid-input");
      }
      if (input.role && !isPersistedRole(input.role)) {
        throw new CustomerAdminError("Invalid role filter.", "invalid-input");
      }

      const candidates = await this.fetchCandidates(input.status, input.role);
      const sorted = sortCustomers(candidates, sort);

      let startIndex = 0;
      if (input.cursor) {
        const decoded = decodeCustomerListCursor(input.cursor);
        if (!decoded || decoded.sort !== sort) {
          throw new CustomerAdminError(
            "Invalid or expired list cursor.",
            "invalid-input",
          );
        }
        const cursorIndex = sorted.findIndex(
          (item) => item.id === decoded.afterId,
        );
        startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
      }

      const items = sorted.slice(startIndex, startIndex + pageSize);

      let nextCursor: string | null = null;
      if (startIndex + pageSize < sorted.length && items.length > 0) {
        const last = items[items.length - 1];
        if (last) {
          nextCursor = encodeCustomerListCursor({
            v: 2,
            sort,
            afterId: last.id,
          });
        }
      }

      return { items, nextCursor, pageSize };
    } catch (error) {
      throw toCustomerAdminError(error);
    }
  }

  /**
   * Load a single customer profile by id.
   */
  async getById(customerId: string): Promise<CustomerProfile | null> {
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
      throw toCustomerAdminError(error);
    }
  }

  /**
   * Count active admins (role=admin, status=active).
   * Uses a single equality query + in-memory status filter (no composite index).
   */
  async countActiveAdmins(): Promise<number> {
    try {
      const snapshot = await getDocs(
        query(
          collection(this.db, CUSTOMERS_COLLECTION),
          where("role", "==", "admin"),
        ),
      );

      let count = 0;
      for (const document of snapshot.docs) {
        const profile = mapCustomerProfile(
          document.id,
          document.data() as Record<string, unknown>,
        );
        if (profile.status === "active") {
          count += 1;
        }
      }
      return count;
    } catch (error) {
      throw toCustomerAdminError(error);
    }
  }

  /**
   * Update Admin-allowed fields on Firestore only.
   * Does not sync Firebase Auth. Does not delete documents.
   *
   * @throws {CustomerAdminError} `last-admin` when removing the last active admin.
   */
  async update(
    customerId: string,
    input: CustomerAdminUpdateInput,
    actor: CustomerAdminActor,
  ): Promise<CustomerProfile> {
    try {
      if (actor.role !== "admin") {
        throw new CustomerAdminError(
          "Only admins can manage customers.",
          "permission-denied",
        );
      }

      const trimmedId = customerId.trim();
      if (!trimmedId) {
        throw new CustomerAdminError("Customer id is required.", "invalid-input");
      }

      const displayName = input.displayName.trim();
      if (!displayName) {
        throw new CustomerAdminError("Display name is required.", "invalid-input");
      }

      if (!isPersistedRole(input.role)) {
        throw new CustomerAdminError("Invalid role.", "invalid-input");
      }

      if (!isUserStatus(input.status)) {
        throw new CustomerAdminError("Invalid status.", "invalid-input");
      }

      let photoURL: string | null | undefined = input.photoURL;
      if (typeof photoURL === "string") {
        const trimmedPhoto = photoURL.trim();
        if (!trimmedPhoto) {
          photoURL = null;
        } else if (!isHttpUrl(trimmedPhoto)) {
          throw new CustomerAdminError(
            "Photo URL must be a valid http(s) link.",
            "invalid-input",
          );
        } else {
          photoURL = trimmedPhoto;
        }
      }

      const phone =
        typeof input.phone === "string" ? input.phone.trim() : undefined;

      const current = await this.getById(trimmedId);
      if (!current) {
        throw new CustomerAdminError("Customer not found.", "not-found");
      }

      await this.assertNotRemovingLastActiveAdmin(
        current,
        input.role,
        input.status,
      );

      const now = Timestamp.now();
      const patch: DocumentData = {
        displayName,
        role: input.role,
        status: input.status,
        updatedAt: now,
      };

      if (photoURL !== undefined) {
        patch.photoURL = photoURL;
      }

      if (phone !== undefined) {
        patch.phone = phone.length > 0 ? phone : null;
      }

      await updateDoc(doc(this.db, CUSTOMERS_COLLECTION, trimmedId), patch);

      const updated = await this.getById(trimmedId);
      if (!updated) {
        throw new CustomerAdminError("Customer not found.", "not-found");
      }

      return updated;
    } catch (error) {
      throw toCustomerAdminError(error);
    }
  }

  /**
   * Load candidates then apply filters in memory after mapping.
   *
   * Why not `where("status"==…)` alone: docs missing `status` still display as
   * `active` via `mapCustomerProfile`, but would be excluded by a Firestore
   * equality filter — empty Admin results despite visible data.
   */
  private async fetchCandidates(
    status: UserStatus | undefined,
    role: PersistedRole | undefined,
  ): Promise<CustomerProfile[]> {
    const snapshot = await getDocs(collection(this.db, CUSTOMERS_COLLECTION));

    let items = snapshot.docs.map((document) =>
      mapCustomerProfile(
        document.id,
        document.data() as Record<string, unknown>,
      ),
    );

    if (status) {
      items = items.filter((item) => item.status === status);
    }
    if (role) {
      items = items.filter((item) => item.role === role);
    }

    return items;
  }

  private async assertNotRemovingLastActiveAdmin(
    current: CustomerProfile,
    nextRole: PersistedRole,
    nextStatus: UserStatus,
  ): Promise<void> {
    const wasActiveAdmin = isActiveAdmin(current.role, current.status);
    const willBeActiveAdmin = isActiveAdmin(nextRole, nextStatus);

    if (!wasActiveAdmin || willBeActiveAdmin) {
      return;
    }

    const activeAdmins = await this.countActiveAdmins();
    if (activeAdmins <= 1) {
      throw new CustomerAdminError(
        "Cannot remove or deactivate the last active admin.",
        "last-admin",
      );
    }
  }
}
