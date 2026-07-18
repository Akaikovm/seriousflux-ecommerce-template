import type { User } from "firebase/auth";

import type { AuthUser } from "@/features/auth/types";

/**
 * Maps a Firebase Auth user onto the domain `AuthUser` model.
 * Keeps Firebase types out of UI and business features.
 */
export function mapAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}
