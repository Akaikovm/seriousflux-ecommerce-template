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
