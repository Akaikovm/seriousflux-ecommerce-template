import "server-only";

import { randomUUID } from "node:crypto";

import { adminGetCustomerById } from "@/features/admin/lib/admin-server-data";
import { buildMediaObjectPath } from "@/features/media/lib/media-path";
import {
  MEDIA_ALLOWED_MIME_TYPES,
  MEDIA_MAX_FILE_SIZE_BYTES,
  MediaError,
} from "@/features/media/services/media-error";
import type { MediaUploadResult } from "@/features/media/types";
import {
  getAdminStorage,
  isFirebaseAdminConfigured,
} from "@/firebase/admin";

function isAllowedMime(
  type: string,
): type is (typeof MEDIA_ALLOWED_MIME_TYPES)[number] {
  return (MEDIA_ALLOWED_MIME_TYPES as readonly string[]).includes(type);
}

/**
 * Privileged image upload (bypasses Storage rules).
 * Caller must already verify the Firebase ID token belongs to an active admin.
 */
export async function adminUploadImage(args: {
  bytes: Buffer;
  fileName: string;
  contentType: string;
  folder?: string;
}): Promise<MediaUploadResult> {
  if (!isFirebaseAdminConfigured()) {
    throw new MediaError(
      "Media upload requires Firebase Admin SDK credentials.",
      "unavailable",
    );
  }

  if (!isAllowedMime(args.contentType)) {
    throw new MediaError(
      "Only JPEG, PNG, WebP, or GIF images are allowed.",
      "invalid-file",
    );
  }

  if (args.bytes.byteLength > MEDIA_MAX_FILE_SIZE_BYTES) {
    throw new MediaError(
      "Image must be 5 MB or smaller.",
      "file-too-large",
    );
  }

  const path = buildMediaObjectPath(args.folder ?? "general", args.fileName);
  const token = randomUUID();
  const bucket = getAdminStorage().bucket();
  const object = bucket.file(path);

  await object.save(args.bytes, {
    resumable: false,
    metadata: {
      contentType: args.contentType,
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  const encodedPath = encodeURIComponent(path);
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;

  return {
    url,
    path,
    contentType: args.contentType,
    size: args.bytes.byteLength,
  };
}

/**
 * Returns true when `uid` is an active admin (Admin SDK customer read).
 */
export async function adminIsActiveAdmin(uid: string): Promise<boolean> {
  if (!isFirebaseAdminConfigured()) {
    return false;
  }

  try {
    const identity = await adminGetCustomerById(uid);
    return identity?.role === "admin" && identity.status === "active";
  } catch {
    return false;
  }
}
