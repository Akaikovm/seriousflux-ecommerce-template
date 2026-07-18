import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type Auth,
  type AuthError as FirebaseAuthError,
  type Unsubscribe,
} from "firebase/auth";

import { mapAuthUser } from "@/features/auth/lib/map-auth-user";
import { AuthError } from "@/features/auth/services/auth-error";
import { IdentityBootstrapService } from "@/features/auth/services/identity-bootstrap.service";
import type {
  AuthProfileUpdateInput,
  AuthUser,
  ResetPasswordInput,
  SignInCredentials,
  SignUpCredentials,
} from "@/features/auth/types";
import { getFirebaseAuth } from "@/firebase/auth";

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

  if (firebaseCode === "auth/email-already-in-use") {
    return new AuthError(
      "An account with this email already exists.",
      "email-already-in-use",
      { cause: error },
    );
  }

  if (firebaseCode === "auth/account-exists-with-different-credential") {
    return new AuthError(
      "An account already exists with this email using a different sign-in method.",
      "account-exists-with-different-credential",
      { cause: error },
    );
  }

  if (
    firebaseCode === "auth/popup-closed-by-user" ||
    firebaseCode === "auth/cancelled-popup-request"
  ) {
    return new AuthError(
      "Google sign-in was cancelled.",
      "popup-closed",
      { cause: error },
    );
  }

  if (firebaseCode === "auth/popup-blocked") {
    return new AuthError(
      "Google sign-in popup was blocked. Allow popups and try again.",
      "unavailable",
      { cause: error },
    );
  }

  if (firebaseCode === "auth/weak-password") {
    return new AuthError(
      "Password is too weak. Use at least 6 characters.",
      "weak-password",
      { cause: error },
    );
  }

  if (firebaseCode === "auth/user-disabled") {
    return new AuthError(
      "This account has been disabled.",
      "user-disabled",
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
 * Firebase Authentication access for the ecommerce kit (RFC-017 / RFC-018).
 *
 * Framework-agnostic: no React. Owns sign-up / sign-in / Google / sign-out / reset.
 * Role checks belong to RoleResolver — AuthService never grants admin.
 */
export class AuthService {
  constructor(
    private readonly auth: Auth = getFirebaseAuth(),
    private readonly identity: IdentityBootstrapService = new IdentityBootstrapService(),
  ) {}

  /**
   * Create an account with email/password and bootstrap `customers/{uid}`
   * with `role: "customer"`. Never creates admin users.
   *
   * @throws {AuthError} on Firebase Auth or bootstrap failures.
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthUser> {
    try {
      const displayName = credentials.displayName.trim();
      const result = await createUserWithEmailAndPassword(
        this.auth,
        credentials.email.trim(),
        credentials.password,
      );

      if (displayName) {
        await updateProfile(result.user, { displayName });
      }

      const user = mapAuthUser(result.user);
      await this.identity.ensureCustomer({
        ...user,
        displayName: displayName || user.displayName,
      });

      return {
        ...user,
        displayName: displayName || user.displayName,
      };
    } catch (error) {
      throw toAuthError(error);
    }
  }

  /**
   * Sign in with email and password.
   *
   * @throws {AuthError} on Firebase Auth failures.
   */
  async signIn(credentials: SignInCredentials): Promise<AuthUser> {
    try {
      const result = await signInWithEmailAndPassword(
        this.auth,
        credentials.email.trim(),
        credentials.password,
      );
      return mapAuthUser(result.user);
    } catch (error) {
      throw toAuthError(error);
    }
  }

  /**
   * Sign in (or sign up) with Google via popup.
   * Bootstraps `customers/{uid}` on first login — never creates admin.
   *
   * @throws {AuthError} on Firebase Auth or bootstrap failures.
   */
  async signInWithGoogle(): Promise<AuthUser> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(this.auth, provider);
      const user = mapAuthUser(result.user);
      await this.identity.ensureCustomer(user);
      return user;
    } catch (error) {
      throw toAuthError(error);
    }
  }

  /**
   * Best-effort sync of Auth profile fields after Firestore profile update.
   * Does not write Firestore. Callers must not roll back Firestore on failure.
   *
   * @throws {AuthError} when no user is signed in or Auth update fails.
   */
  async updateProfileFields(input: AuthProfileUpdateInput): Promise<AuthUser> {
    try {
      const current = this.auth.currentUser;
      if (!current) {
        throw new AuthError(
          "You must be signed in to update your profile.",
          "not-authenticated",
        );
      }

      const patch: { displayName?: string; photoURL?: string | null } = {};
      if (input.displayName !== undefined) {
        patch.displayName = input.displayName.trim();
      }
      if (input.photoURL !== undefined) {
        patch.photoURL = input.photoURL;
      }

      if (Object.keys(patch).length > 0) {
        await updateProfile(current, patch);
      }

      return mapAuthUser(current);
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
   * Send a password-reset email.
   *
   * @throws {AuthError} on Firebase Auth failures.
   */
  async resetPassword(input: ResetPasswordInput): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, input.email.trim());
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
  observeAuthState(callback: (user: AuthUser | null) => void): Unsubscribe {
    return onAuthStateChanged(this.auth, (user) => {
      callback(user ? mapAuthUser(user) : null);
    });
  }
}
