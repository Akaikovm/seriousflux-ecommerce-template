import type { CustomerAdminListSort } from "@/features/customers/types/customer-admin";

/** Offset cursor after a sorted in-memory page (no Firestore startAfter). */
export type CustomerListCursorPayload = {
  v: 2;
  sort: CustomerAdminListSort;
  afterId: string;
};

function toBase64Url(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }

  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLength);

  if (typeof Buffer !== "undefined") {
    return Buffer.from(base64, "base64").toString("utf8");
  }

  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeCustomerListCursor(
  payload: CustomerListCursorPayload,
): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodeCustomerListCursor(
  cursor: string,
): CustomerListCursorPayload | null {
  try {
    const parsed = JSON.parse(fromBase64Url(cursor)) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const data = parsed as Record<string, unknown>;
    if (data.v !== 2 || typeof data.afterId !== "string" || !data.afterId) {
      return null;
    }

    const sort = data.sort;
    if (
      sort !== "newest" &&
      sort !== "oldest" &&
      sort !== "name_asc" &&
      sort !== "name_desc"
    ) {
      return null;
    }

    return {
      v: 2,
      sort,
      afterId: data.afterId,
    };
  } catch {
    return null;
  }
}
