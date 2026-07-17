import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type Auth,
  type AuthError as FirebaseAuthError,
  type Unsubscribe,
  type User,
} from "firebase/auth";

import { getFirebaseAuth } from "@/firebase/auth";
import type { AuthUser, SignInCredentials } from "@/features/auth/types";

/**
 * Domain error for authentication flows.
 * Wraps Firebase Auth failures so UI never depends on Firebase error shapes.
 */
export class AuthError extends Error {
  readonly code:
    | "invalid-credentials"
    | "too-many-requests"
    | "unavailable"
    | "unknown";

  constructor(
    message: string,
    code: AuthError["code"] = "unknown",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AuthError";
    this.code = code;
  }
}

/**
 * Maps a Firebase Auth user onto the domain `AuthUser` model.
 */
export function mapAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  };
}

function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) {
    return error;
  }

  const firebaseError = error as FirebaseAuthError | undefined;
  const firebaseCode = firebaseError?.code;

  if (
    firebaseCode === "auth/invalid-credential" ||
    firebaseCode === "auth/user-not-found" ||
    firebaseCode === "auth/wrong-password" ||
    firebaseCode === "auth/invalid-email"
  ) {
    return new AuthError(
      "Invalid email or password.",
      "invalid-credentials",
      { cause: error },
    );
  }

  if (firebaseCode === "auth/too-many-requests") {
    return new AuthError(
      "Too many attempts. Please try again later.",
      "too-many-requests",
      { cause: error },
    );
  }

  if (firebaseCode === "auth/network-request-failed") {
    return new AuthError(
      "Authentication is temporarily unavailable. Please try again.",
      "unavailable",
      { cause: error },
    );
  }

  return new AuthError("Authentication failed.", "unknown", { cause: error });
}

/**
 * Firebase Authentication access for the ecommerce kit (RFC-011).
 *
 * Framework-agnostic: no React. Owns sign-in / sign-out and user mapping.
 * Role checks are intentionally deferred — any signed-in user may access admin.
 */
export class AuthService {
  constructor(private readonly auth: Auth = getFirebaseAuth()) {}

  /**
   * Sign in with email and password.
   *
   * @throws {AuthError} on Firebase Auth failures.
   */
  async signInWithEmail(credentials: SignInCredentials): Promise<AuthUser> {
    try {
      const result = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password,
      );
      return mapAuthUser(result.user);
    } catch (error) {
      throw toAuthError(error);
    }
  }

  /**
   * Sign out the current user.
   *
   * @throws {AuthError} on Firebase Auth failures.
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
    } catch (error) {
      throw toAuthError(error);
    }
  }

  /**
   * Returns the currently signed-in user, or `null`.
   */
  getCurrentUser(): AuthUser | null {
    const user = this.auth.currentUser;
    return user ? mapAuthUser(user) : null;
  }

  /**
   * Subscribe to auth state changes. Returns an unsubscribe function.
   */
  onAuthStateChanged(
    callback: (user: AuthUser | null) => void,
  ): Unsubscribe {
    return onAuthStateChanged(this.auth, (user) => {
      callback(user ? mapAuthUser(user) : null);
    });
  }
}
