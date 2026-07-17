import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type FirebaseStorage,
  type StorageError,
} from "firebase/storage";

import { getFirebaseStorage } from "@/firebase/storage";
import type {
  MediaUploadOptions,
  MediaUploadResult,
} from "@/features/media/types";

/** Default maximum upload size (5 MiB). */
export const MEDIA_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Allowed image MIME types for admin uploads. */
export const MEDIA_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/**
 * Domain error for media uploads and Storage operations.
 * Wraps Firebase failures so UI never depends on Firebase error shapes.
 */
export class MediaError extends Error {
  readonly code:
    | "invalid-file"
    | "file-too-large"
    | "unavailable"
    | "permission-denied"
    | "not-found"
    | "unknown";

  constructor(
    message: string,
    code: MediaError["code"] = "unknown",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "MediaError";
    this.code = code;
  }
}

function sanitizeFileName(name: string): string {
  const base = name.replace(/^.*[\\/]/, "");
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "image";
}

function buildObjectPath(folder: string, fileName: string): string {
  const safeFolder = folder.replace(/[^a-z0-9/_-]+/gi, "").replace(/^\/+|\/+$/g, "") || "general";
  const stamp = Date.now();
  return `media/${safeFolder}/${stamp}-${sanitizeFileName(fileName)}`;
}

/**
 * Extracts a Storage object path from a full download URL or returns the path as-is.
 */
export function extractStoragePath(pathOrUrl: string): string | null {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) {
    return null;
  }

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed.replace(/^\/+/, "");
  }

  try {
    const url = new URL(trimmed);
    // Firebase download URLs: /v0/b/{bucket}/o/{encodedPath}?...
    const match = url.pathname.match(/\/o\/(.+)$/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch {
    return null;
  }

  return null;
}

function toMediaError(error: unknown): MediaError {
  if (error instanceof MediaError) {
    return error;
  }

  const storageError = error as StorageError | undefined;
  const firebaseCode = storageError?.code;

  if (firebaseCode === "storage/unauthorized" || firebaseCode === "storage/unauthenticated") {
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
 * Owns all Firebase Storage access for the kit (RFC-012 / ADR-008).
 *
 * ProductService, CategoryService, and StoreSettingsService persist URL strings only.
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

    if (!MEDIA_ALLOWED_MIME_TYPES.includes(file.type as (typeof MEDIA_ALLOWED_MIME_TYPES)[number])) {
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

    const path = buildObjectPath(options.folder ?? "general", file.name);
    const objectRef = ref(this.storage, path);

    try {
      const task = uploadBytesResumable(objectRef, file, {
        contentType: file.type,
      });

      await new Promise<void>((resolve, reject) => {
        task.on(
          "state_changed",
          (snapshot) => {
            if (options.onProgress && snapshot.totalBytes > 0) {
              const progress = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              );
              options.onProgress(progress);
            }
          },
          (error) => reject(error),
          () => resolve(),
        );
      });

      const url = await getDownloadURL(task.snapshot.ref);

      return {
        url,
        path,
        contentType: file.type,
        size: file.size,
      };
    } catch (error) {
      throw toMediaError(error);
    }
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
