/**
 * Firebase App singleton for the Next.js client.
 *
 * Uses getApps()/initializeApp() so Hot Module Replacement and multiple
 * imports do not create duplicate Firebase app instances.
 */

import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";

import { getFirebaseConfig } from "@/firebase/config";

let firebaseApp: FirebaseApp | undefined;

/**
 * Returns the shared Firebase App instance.
 * Initializes it on first call; reuses it afterwards.
 */
export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) {
    return firebaseApp;
  }

  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());

  return firebaseApp;
}
