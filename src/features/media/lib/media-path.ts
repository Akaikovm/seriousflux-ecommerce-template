/**
 * Shared Storage object path helpers (RFC-012).
 * Safe for client and server — no Firebase imports.
 */

function sanitizeFileName(name: string): string {
  const base = name.replace(/^.*[\\/]/, "");
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "image";
}

/**
 * Builds `media/{folder}/{stamp}-{fileName}` under the kit media prefix.
 */
export function buildMediaObjectPath(folder: string, fileName: string): string {
  const safeFolder =
    folder.replace(/[^a-z0-9/_-]+/gi, "").replace(/^\/+|\/+$/g, "") ||
    "general";
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
