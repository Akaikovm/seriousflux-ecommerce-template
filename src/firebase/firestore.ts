/**
 * Cloud Firestore client access.
 *
 * Exposes a shared Firestore instance only.
 * Collection queries and business logic belong in services/, not here.
 */

import { type Firestore, getFirestore } from "firebase/firestore";

import { getFirebaseApp } from "@/firebase/client";

let firestore: Firestore | undefined;

/**
 * Returns the shared Firestore instance bound to the Firebase App.
 */
export function getFirestoreDb(): Firestore {
  if (firestore) {
    return firestore;
  }

  firestore = getFirestore(getFirebaseApp());

  return firestore;
}
