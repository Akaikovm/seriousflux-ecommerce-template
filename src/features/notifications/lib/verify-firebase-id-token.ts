export type VerifiedFirebaseUser = {
  uid: string;
  email: string | null;
};

type IdentityToolkitLookupResponse = {
  users?: Array<{
    localId?: string;
    email?: string;
  }>;
};

/**
 * Verifies a Firebase ID token via Identity Toolkit (no Admin SDK required).
 *
 * Used until GAP-004 lands `firebase-admin` session verification.
 * Returns null when the token is missing, expired, or invalid.
 */
export async function verifyFirebaseIdToken(
  idToken: string | null | undefined,
): Promise<VerifiedFirebaseUser | null> {
  const trimmed = idToken?.trim();
  if (!trimmed) {
    return null;
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "[notifications] NEXT_PUBLIC_FIREBASE_API_KEY missing; cannot verify ID token",
    );
    return null;
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: trimmed }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as IdentityToolkitLookupResponse;
    const user = data.users?.[0];
    if (!user) {
      return null;
    }

    const uid = user.localId?.trim();
    if (!uid) {
      return null;
    }

    return {
      uid,
      email: user.email?.trim().toLowerCase() || null,
    };
  } catch (error) {
    console.error("[notifications] ID token verification failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}
