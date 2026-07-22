import "server-only";

import { cookies } from "next/headers";

import { adminGetCustomerById } from "@/features/admin/lib/admin-server-data";
import {
  getAdminAuth,
  isFirebaseAdminConfigured,
} from "@/firebase/admin";

/** httpOnly session cookie for Admin SSR (GAP-002). */
export const ADMIN_SESSION_COOKIE = "__session";

/** Session cookie lifetime: 5 days. */
export const ADMIN_SESSION_EXPIRES_MS = 60 * 60 * 24 * 5 * 1000;

export type AdminSession = {
  uid: string;
  email: string | null;
};

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

async function isActiveAdminUid(uid: string): Promise<boolean> {
  try {
    const identity = await adminGetCustomerById(uid);
    return identity?.role === "admin" && identity.status === "active";
  } catch {
    return false;
  }
}

/**
 * Creates a Firebase session cookie for an active admin and sets `__session`.
 *
 * @throws when Admin SDK is missing, token is invalid, or caller is not admin.
 */
export async function createAdminSessionCookie(idToken: string): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    throw new Error(
      "Firebase Admin SDK is required to establish an Admin session.",
    );
  }

  const trimmed = idToken.trim();
  if (!trimmed) {
    throw new Error("Missing Firebase ID token.");
  }

  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(trimmed);

  if (!(await isActiveAdminUid(decoded.uid))) {
    throw new Error("Not an active admin.");
  }

  const sessionCookie = await auth.createSessionCookie(trimmed, {
    expiresIn: ADMIN_SESSION_EXPIRES_MS,
  });

  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: isProductionRuntime(),
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_EXPIRES_MS / 1000,
  });
}

/**
 * Clears the Admin session cookie (logout / failed auth).
 */
export async function clearAdminSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_SESSION_COOKIE);
}

/**
 * Verifies `__session` and confirms the user is still an active admin.
 * Returns null when missing, expired, or not admin.
 *
 * Does not mutate cookies (safe to call from Server Component layouts).
 */
export async function requireAdminSession(): Promise<AdminSession | null> {
  if (!isFirebaseAdminConfigured()) {
    console.error(
      "[auth] Admin session check skipped: Firebase Admin SDK not configured",
    );
    return null;
  }

  const jar = await cookies();
  const sessionCookie = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await getAdminAuth().verifySessionCookie(
      sessionCookie,
      true,
    );

    if (!(await isActiveAdminUid(decoded.uid))) {
      return null;
    }

    return {
      uid: decoded.uid,
      email: decoded.email?.trim().toLowerCase() || null,
    };
  } catch {
    return null;
  }
}
