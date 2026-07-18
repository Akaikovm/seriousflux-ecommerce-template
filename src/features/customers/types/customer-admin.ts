import type { PersistedRole, UserStatus } from "@/features/auth/types";
import type { CustomerProfile } from "@/features/customers/types/customer";

/** Default Admin customers page size (ADR-022). */
export const CUSTOMER_ADMIN_PAGE_SIZE = 25;

/** Sort options for Admin customer list (server-side orderBy). */
export type CustomerAdminListSort =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc";

/** Signed-in Admin performing a privileged mutation (ADR-022). */
export type CustomerAdminActor = {
  uid: string;
  role: PersistedRole;
};

/** Allowed Admin update fields — never email, uid, password, or Auth provider. */
export type CustomerAdminUpdateInput = {
  displayName: string;
  phone?: string;
  photoURL?: string | null;
  role: PersistedRole;
  status: UserStatus;
};

export type CustomerAdminListQuery = {
  status?: UserStatus;
  role?: PersistedRole;
  sort?: CustomerAdminListSort;
  pageSize?: number;
  /** Opaque cursor from a previous `CustomerAdminListResult.nextCursor`. */
  cursor?: string | null;
};

export type CustomerAdminListResult = {
  items: CustomerProfile[];
  nextCursor: string | null;
  pageSize: number;
};
