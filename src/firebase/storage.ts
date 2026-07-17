/**
 * Firebase Storage client access.
 *
 * Exposes a shared Storage instance only.
 * Upload/download helpers and business rules belong in services/, not here.
 */

import { type FirebaseStorage, getStorage } from "firebase/storage";

import { getFirebaseApp } from "@/firebase/client";

let storage: FirebaseStorage | undefined;

/**
 * Returns the shared Firebase Storage instance bound to the Firebase App.
 */
export function getFirebaseStorage(): FirebaseStorage {
  if (storage) {
    return storage;
  }

  storage = getStorage(getFirebaseApp());

  return storage;
}
