/**
 * Domain error for authentication flows.
 * Wraps Firebase Auth / identity failures so UI never depends on Firebase error shapes.
 */
export class AuthError extends Error {
  readonly code:
    | "invalid-credentials"
    | "email-already-in-use"
    | "weak-password"
    | "user-disabled"
    | "too-many-requests"
    | "unavailable"
    | "permission-denied"
    | "missing-profile"
    | "popup-closed"
    | "account-exists-with-different-credential"
    | "not-authenticated"
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
