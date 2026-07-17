/**
 * Auth domain types (RFC-011).
 *
 * Role-based permissions are deferred. For now any authenticated Firebase
 * user may access admin; `role` is reserved for a future claims RFC.
 */

export type AuthUserRole = "customer" | "admin";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  /** Reserved for future role-based access. Not enforced in RFC-011. */
  role?: AuthUserRole;
};

export type SignInCredentials = {
  email: string;
  password: string;
};
