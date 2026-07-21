import {
  deleteObject,
  getDownloadURL,
  ref,
  type FirebaseStorage,
  type StorageError,
} from "firebase/storage";

import { getFirebaseAuth } from "@/firebase/auth";
import { getFirebaseStorage } from "@/firebase/storage";
import { uploadMediaAction } from "@/features/media/lib/upload-media-action";
import { extractStoragePath } from "@/features/media/lib/media-path";
import {
  MEDIA_ALLOWED_MIME_TYPES,
  MEDIA_MAX_FILE_SIZE_BYTES,
  MediaError,
} from "@/features/media/services/media-error";
import type {
  MediaUploadOptions,
  MediaUploadResult,
} from "@/features/media/types";

export {
  MEDIA_ALLOWED_MIME_TYPES,
  MEDIA_MAX_FILE_SIZE_BYTES,
  MediaError,
} from "@/features/media/services/media-error";

function toMediaError(error: unknown): MediaError {
  if (error instanceof MediaError) {
    return error;
  }

  const storageError = error as StorageError | undefined;
  const firebaseCode = storageError?.code;

  if (
    firebaseCode === "storage/unauthorized" ||
    firebaseCode === "storage/unauthenticated"
  ) {
    return new MediaError(
      "You do not have permission to manage media.",
      "permission-denied",
      { cause: error },
    );
  }

  if (firebaseCode === "storage/object-not-found") {
    return new MediaError("Media file not found.", "not-found", {
      cause: error,
    });
  }

  if (
    firebaseCode === "storage/retry-limit-exceeded" ||
    firebaseCode === "storage/server-file-wrong-size"
  ) {
    return new MediaError(
      "Media storage is temporarily unavailable. Please try again.",
      "unavailable",
      { cause: error },
    );
  }

  return new MediaError("Failed to manage media.", "unknown", {
    cause: error,
  });
}

/**
 * Owns media operations for the kit (RFC-012 / ADR-008 / ADR-024).
 *
 * Uploads go through a server action + Admin SDK (Storage rules deny client writes).
 * Delete / public URL still use the client SDK where rules allow (public read).
 * UI components never import Firebase Storage.
 */
export class MediaService {
  constructor(private readonly storage: FirebaseStorage = getFirebaseStorage()) {}

  /**
   * Upload an image file and return its public URL + storage path.
   *
   * @throws {MediaError} on validation or Storage failures.
   */
  async uploadImage(
    file: File,
    options: MediaUploadOptions = {},
  ): Promise<MediaUploadResult> {
    if (!file || !(file instanceof File)) {
      throw new MediaError("Please choose an image file.", "invalid-file");
    }

    if (
      !MEDIA_ALLOWED_MIME_TYPES.includes(
        file.type as (typeof MEDIA_ALLOWED_MIME_TYPES)[number],
      )
    ) {
      throw new MediaError(
        "Only JPEG, PNG, WebP, or GIF images are allowed.",
        "invalid-file",
      );
    }

    if (file.size > MEDIA_MAX_FILE_SIZE_BYTES) {
      throw new MediaError(
        "Image must be 5 MB or smaller.",
        "file-too-large",
      );
    }

    const user = getFirebaseAuth().currentUser;
    if (!user) {
      throw new MediaError(
        "You do not have permission to manage media.",
        "permission-denied",
      );
    }

    options.onProgress?.(15);

    let idToken: string;
    try {
      idToken = await user.getIdToken();
    } catch (error) {
      throw new MediaError(
        "You do not have permission to manage media.",
        "permission-denied",
        { cause: error },
      );
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("folder", options.folder ?? "general");
    formData.set("idToken", idToken);

    options.onProgress?.(45);

    const result = await uploadMediaAction(formData);
    if (!result.ok) {
      throw new MediaError(result.error, result.code);
    }

    options.onProgress?.(100);
    return result.data;
  }

  /**
   * Delete a Storage object by path or download URL.
   * No-ops gracefully when the path cannot be resolved.
   *
   * @throws {MediaError} on Storage failures (except not-found).
   */
  async deleteImage(pathOrUrl: string): Promise<void> {
    const path = extractStoragePath(pathOrUrl);
    if (!path) {
      return;
    }

    try {
      await deleteObject(ref(this.storage, path));
    } catch (error) {
      const mediaError = toMediaError(error);
      if (mediaError.code === "not-found") {
        return;
      }
      throw mediaError;
    }
  }

  /**
   * Resolve a public download URL for an existing Storage path.
   *
   * @throws {MediaError} on Storage failures.
   */
  async getPublicUrl(path: string): Promise<string> {
    const trimmed = path.trim();
    if (!trimmed) {
      throw new MediaError("Media path is required.", "invalid-file");
    }

    try {
      return await getDownloadURL(ref(this.storage, trimmed));
    } catch (error) {
      throw toMediaError(error);
    }
  }
}
