import { Timestamp } from "firebase/firestore";

import type { PersistedRole, UserStatus } from "@/features/auth/types";
import type { CustomerProfile } from "@/features/customers/types";
import { toClientTimestamp } from "@/lib/firestore-timestamp";

/**
 * Maps a Firestore `customers/{id}` document onto `CustomerProfile`.
 * Shared by Account and Customer Admin — keep field rules identical.
 */
export function mapCustomerProfile(
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
    createdAt: toClientTimestamp(data.createdAt, Timestamp.now()),
    updatedAt: toClientTimestamp(data.updatedAt, Timestamp.now()),
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
