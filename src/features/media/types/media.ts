/**
 * Media domain types (RFC-012).
 * Storage paths and public URLs — no Firebase SDK types.
 */

/** Result returned after a successful image upload. */
export type MediaUploadResult = {
  /** Public download URL suitable for `<img src>` / Firestore string fields. */
  url: string;
  /** Storage object path (used for delete / getPublicUrl). */
  path: string;
  /** MIME type of the uploaded file. */
  contentType: string;
  /** Byte size of the uploaded file. */
  size: number;
};

/** Options for `MediaService.uploadImage`. */
export type MediaUploadOptions = {
  /**
   * Storage folder prefix, e.g. `"products"` → `media/products/...`.
   * Defaults to `"general"`.
   */
  folder?: string;
  /** 0–100 progress callback while bytes are uploading. */
  onProgress?: (progress: number) => void;
};
