/**
 * Firebase Authentication client access.
 *
 * Exposes a shared Auth instance only.
 * Sign-in flows, session handling, and user logic belong in features/services.
 */

import { type Auth, getAuth } from "firebase/auth";

import { getFirebaseApp } from "@/firebase/client";

let auth: Auth | undefined;

/**
 * Returns the shared Firebase Auth instance bound to the Firebase App.
 */
export function getFirebaseAuth(): Auth {
  if (auth) {
    return auth;
  }

  auth = getAuth(getFirebaseApp());

  return auth;
}
