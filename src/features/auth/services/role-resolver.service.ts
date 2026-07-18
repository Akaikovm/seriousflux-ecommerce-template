import type {
  AuthenticatedSession,
  AuthUser,
  PersistedRole,
} from "@/features/auth/types";
import { AuthError } from "@/features/auth/services/auth-error";
import {
  IdentityBootstrapService,
  type IdentityDocument,
} from "@/features/auth/services/identity-bootstrap.service";

export type ResolveOptions = {
  /**
   * When true and the customer document is missing, do not bootstrap.
   * Used for privileged contexts that must fail closed (admin).
   * Default: false — missing docs bootstrap as `customer`.
   */
  failClosedIfMissing?: boolean;
};

/**
 * Resolves Firebase Auth identity into an application session
 * using Firestore `customers/{uid}` as the source of truth for role/status.
 */
export class RoleResolver {
  constructor(
    private readonly identity: IdentityBootstrapService = new IdentityBootstrapService(),
  ) {}

  /**
   * Load (or bootstrap) the customer document and return a resolved session.
   *
   * - Missing document + failClosedIfMissing → AuthError `missing-profile`
   * - Missing document otherwise → bootstrap as `customer` / `active`
   * - Never creates `admin` or `staff` roles
   */
  async resolve(
    user: AuthUser,
    options: ResolveOptions = {},
  ): Promise<AuthenticatedSession> {
    const existing = await this.identity.getById(user.uid);

    if (!existing) {
      if (options.failClosedIfMissing) {
        throw new AuthError(
          "This account is not authorized for admin access.",
          "missing-profile",
        );
      }

      const bootstrapped = await this.identity.ensureCustomer(user);
      return toSession(user, bootstrapped);
    }

    return toSession(user, existing);
  }
}

function toSession(
  user: AuthUser,
  document: IdentityDocument,
): AuthenticatedSession {
  const role: PersistedRole = document.role;

  return {
    user: {
      uid: user.uid,
      email: user.email ?? document.email,
      displayName: user.displayName ?? document.displayName,
      photoURL: user.photoURL ?? document.photoURL,
    },
    role,
    status: document.status,
    customerId: document.id,
  };
}
