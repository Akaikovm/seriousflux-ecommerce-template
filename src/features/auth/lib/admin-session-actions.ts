"use server";

import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
} from "@/features/auth/lib/admin-session";

export type EstablishAdminSessionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Browser → server: exchange Firebase ID token for httpOnly Admin session cookie.
 */
export async function establishAdminSessionAction(
  idToken: string,
): Promise<EstablishAdminSessionResult> {
  try {
    await createAdminSessionCookie(idToken);
    return { ok: true };
  } catch (error) {
    console.warn("[auth] establishAdminSession rejected", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return {
      ok: false,
      error: "Unable to establish Admin session.",
    };
  }
}

/**
 * Clears the Admin session cookie. Safe to call when no cookie exists.
 */
export async function clearAdminSessionAction(): Promise<void> {
  try {
    await clearAdminSessionCookie();
  } catch (error) {
    console.warn("[auth] clearAdminSession failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
