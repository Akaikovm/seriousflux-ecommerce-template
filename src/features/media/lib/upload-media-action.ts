"use server";

import { MediaError } from "@/features/media/services/media-error";
import type { MediaUploadResult } from "@/features/media/types";
import {
  adminIsActiveAdmin,
  adminUploadImage,
} from "@/features/media/services/media.admin";
import { verifyFirebaseIdToken } from "@/features/notifications/lib/verify-firebase-id-token";

export type UploadMediaActionResult =
  | { ok: true; data: MediaUploadResult }
  | {
      ok: false;
      error: string;
      code: MediaError["code"];
    };

/**
 * Admin image upload entry (browser → server).
 *
 * Storage Security Rules deny client writes; uploads go through Admin SDK
 * after ID token + active-admin checks (same trust model as webhooks).
 */
export async function uploadMediaAction(
  formData: FormData,
): Promise<UploadMediaActionResult> {
  const idToken = formData.get("idToken");
  const folderRaw = formData.get("folder");
  const file = formData.get("file");

  if (typeof idToken !== "string" || !idToken.trim()) {
    return {
      ok: false,
      error: "You do not have permission to manage media.",
      code: "permission-denied",
    };
  }

  const user = await verifyFirebaseIdToken(idToken);
  if (!user) {
    return {
      ok: false,
      error: "You do not have permission to manage media.",
      code: "permission-denied",
    };
  }

  if (!(await adminIsActiveAdmin(user.uid))) {
    return {
      ok: false,
      error: "You do not have permission to manage media.",
      code: "permission-denied",
    };
  }

  if (!(file instanceof File)) {
    return {
      ok: false,
      error: "Please choose an image file.",
      code: "invalid-file",
    };
  }

  const folder =
    typeof folderRaw === "string" && folderRaw.trim()
      ? folderRaw.trim()
      : "general";

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const data = await adminUploadImage({
      bytes,
      fileName: file.name || "image",
      contentType: file.type,
      folder,
    });
    return { ok: true, data };
  } catch (error) {
    if (error instanceof MediaError) {
      return { ok: false, error: error.message, code: error.code };
    }

    console.error("[media] privileged upload failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return {
      ok: false,
      error: "Failed to manage media.",
      code: "unknown",
    };
  }
}
