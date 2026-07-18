/**
 * Auth domain types (RFC-017).
 *
 * Roles and account status live in Firestore `customers/{uid}`.
 * Firebase Auth is identity only — never the source of truth for roles.
 */

/** Application roles. `guest` is session-only (never persisted). */
export type AppRole = "guest" | "customer" | "staff" | "admin";

/** Roles stored on `customers/{uid}`. */
export type PersistedRole = Exclude<AppRole, "guest">;

/** Account lifecycle status on `customers/{uid}`. */
export type UserStatus = "active" | "inactive";

/**
 * Domain user mapped from Firebase Auth (no Firebase types).
 * Role/status are resolved separately via RoleResolver.
 */
export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

/** @deprecated Use `PersistedRole` / `AppRole`. Kept for transitional imports. */
export type AuthUserRole = PersistedRole;

export type SignInCredentials = {
  email: string;
  password: string;
};

export type SignUpCredentials = {
  email: string;
  password: string;
  /** Display name stored on Auth + customer bootstrap. */
  displayName: string;
};

export type ResetPasswordInput = {
  email: string;
};

/** Best-effort Auth profile sync after Firestore profile update (RFC-018). */
export type AuthProfileUpdateInput = {
  displayName?: string;
  photoURL?: string | null;
};

/**
 * Resolved authenticated session after Auth + Firestore role resolution.
 */
export type AuthenticatedSession = {
  user: AuthUser;
  role: PersistedRole;
  status: UserStatus;
  /** Same as `user.uid` — `customers/{customerId}`. */
  customerId: string;
};
