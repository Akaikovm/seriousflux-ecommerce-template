import "server-only";

import { getAdminDb, isFirebaseAdminConfigured } from "@/firebase/admin";
import { CUSTOMERS_COLLECTION } from "@/features/auth/services/identity-bootstrap.service";
import {
  decodeCustomerListCursor,
  encodeCustomerListCursor,
} from "@/features/customers/lib/list-cursor";
import { mapCustomerProfile } from "@/features/customers/lib/map-customer-profile";
import type { CustomerProfile } from "@/features/customers/types";
import type {
  CustomerAdminListQuery,
  CustomerAdminListResult,
  CustomerAdminListSort,
} from "@/features/customers/types/customer-admin";
import { CUSTOMER_ADMIN_PAGE_SIZE } from "@/features/customers/types/customer-admin";
import {
  mapCategory,
  CategoryError,
  CATEGORIES_COLLECTION,
} from "@/features/categories/services/category.service";
import type { Category } from "@/features/categories/types";
import {
  getInventoryByProductIdsWithAdmin,
  getInventoryWithAdmin,
} from "@/features/inventory/services/inventory.admin";
import type { InventoryRecord } from "@/features/inventory/types";
import { AdminOrderService } from "@/features/orders/services/order.admin";
import type { Order } from "@/features/orders/types";
import {
  mapProduct,
  ProductError,
  PRODUCTS_COLLECTION,
} from "@/features/products/services/product.service";
import type { Product } from "@/features/products/types";
import {
  getDefaultStoreSettings,
  mapStoreSettings,
  SETTINGS_COLLECTION,
  SETTINGS_GENERAL_DOC_ID,
} from "@/features/settings/services/store-settings.service";
import type { StoreSettings } from "@/features/settings/types";

function asProductSnap(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: () => data,
  } as Parameters<typeof mapProduct>[0];
}

function asCategorySnap(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: () => data,
  } as Parameters<typeof mapCategory>[0];
}

/**
 * Assert Admin SDK is available for Admin SSR / privileged server reads.
 */
export function requireFirebaseAdmin(): void {
  if (!isFirebaseAdminConfigured()) {
    throw new Error(
      "Firebase Admin SDK is required for this server path. Set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS.",
    );
  }
}

export async function adminListOrders(): Promise<Order[]> {
  requireFirebaseAdmin();
  return new AdminOrderService().listAll();
}

export async function adminGetOrderById(id: string): Promise<Order | null> {
  requireFirebaseAdmin();
  return new AdminOrderService().getById(id);
}

export async function adminListOrdersByCustomerId(
  customerId: string,
): Promise<Order[]> {
  requireFirebaseAdmin();
  return new AdminOrderService().listByCustomerId(customerId);
}

export async function adminListProducts(): Promise<Product[]> {
  requireFirebaseAdmin();
  try {
    const snap = await getAdminDb().collection(PRODUCTS_COLLECTION).get();
    return snap.docs
      .map((doc) =>
        mapProduct(
          asProductSnap(doc.id, (doc.data() ?? {}) as Record<string, unknown>),
        ),
      )
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    throw new ProductError("Failed to list products.", "unknown", {
      cause: error,
    });
  }
}

export async function adminCountProducts(): Promise<number> {
  requireFirebaseAdmin();
  const snap = await getAdminDb().collection(PRODUCTS_COLLECTION).count().get();
  return snap.data().count;
}

export async function adminGetProductById(id: string): Promise<Product | null> {
  requireFirebaseAdmin();
  const snap = await getAdminDb().collection(PRODUCTS_COLLECTION).doc(id).get();
  if (!snap.exists) {
    return null;
  }
  return mapProduct(
    asProductSnap(snap.id, (snap.data() ?? {}) as Record<string, unknown>),
  );
}

export async function adminListCategories(): Promise<Category[]> {
  requireFirebaseAdmin();
  try {
    const snap = await getAdminDb().collection(CATEGORIES_COLLECTION).get();
    return snap.docs
      .map((doc) =>
        mapCategory(
          asCategorySnap(doc.id, (doc.data() ?? {}) as Record<string, unknown>),
        ),
      )
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    throw new CategoryError("Failed to list categories.", "unknown", {
      cause: error,
    });
  }
}

export async function adminCountCategories(): Promise<number> {
  requireFirebaseAdmin();
  const snap = await getAdminDb()
    .collection(CATEGORIES_COLLECTION)
    .count()
    .get();
  return snap.data().count;
}

export async function adminGetCategoryById(
  id: string,
): Promise<Category | null> {
  requireFirebaseAdmin();
  const snap = await getAdminDb()
    .collection(CATEGORIES_COLLECTION)
    .doc(id)
    .get();
  if (!snap.exists) {
    return null;
  }
  return mapCategory(
    asCategorySnap(snap.id, (snap.data() ?? {}) as Record<string, unknown>),
  );
}

export async function adminGetCustomerById(
  customerId: string,
): Promise<CustomerProfile | null> {
  requireFirebaseAdmin();
  const trimmed = customerId.trim();
  if (!trimmed) {
    return null;
  }
  const snap = await getAdminDb()
    .collection(CUSTOMERS_COLLECTION)
    .doc(trimmed)
    .get();
  if (!snap.exists) {
    return null;
  }
  return mapCustomerProfile(
    snap.id,
    (snap.data() ?? {}) as Record<string, unknown>,
  );
}

export async function adminListAllCustomers(): Promise<CustomerProfile[]> {
  requireFirebaseAdmin();
  const snap = await getAdminDb().collection(CUSTOMERS_COLLECTION).get();
  return snap.docs.map((doc) =>
    mapCustomerProfile(doc.id, (doc.data() ?? {}) as Record<string, unknown>),
  );
}

function sortCustomers(
  items: CustomerProfile[],
  sort: CustomerAdminListSort,
): CustomerProfile[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    switch (sort) {
      case "oldest": {
        const byTime = a.createdAt.toMillis() - b.createdAt.toMillis();
        return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
      }
      case "name_asc": {
        const byName = a.displayName.localeCompare(b.displayName, undefined, {
          sensitivity: "base",
        });
        return byName !== 0 ? byName : a.id.localeCompare(b.id);
      }
      case "name_desc": {
        const byName = b.displayName.localeCompare(a.displayName, undefined, {
          sensitivity: "base",
        });
        return byName !== 0 ? byName : b.id.localeCompare(a.id);
      }
      case "newest":
      default: {
        const byTime = b.createdAt.toMillis() - a.createdAt.toMillis();
        return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
      }
    }
  });
  return sorted;
}

/**
 * Paginated customer list for Admin SSR (Admin SDK).
 */
export async function adminListCustomers(
  input: CustomerAdminListQuery = {},
): Promise<CustomerAdminListResult> {
  const sort: CustomerAdminListSort = input.sort ?? "newest";
  const pageSize = Math.min(
    Math.max(input.pageSize ?? CUSTOMER_ADMIN_PAGE_SIZE, 1),
    100,
  );

  let candidates = await adminListAllCustomers();
  if (input.status) {
    candidates = candidates.filter((c) => c.status === input.status);
  }
  if (input.role) {
    candidates = candidates.filter((c) => c.role === input.role);
  }

  const sorted = sortCustomers(candidates, sort);

  let startIndex = 0;
  if (input.cursor) {
    const decoded = decodeCustomerListCursor(input.cursor);
    if (!decoded || decoded.sort !== sort) {
      return { items: [], nextCursor: null, pageSize };
    }
    const cursorIndex = sorted.findIndex((item) => item.id === decoded.afterId);
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  const items = sorted.slice(startIndex, startIndex + pageSize);
  let nextCursor: string | null = null;
  if (startIndex + pageSize < sorted.length && items.length > 0) {
    const last = items[items.length - 1];
    if (last) {
      nextCursor = encodeCustomerListCursor({
        v: 2,
        sort,
        afterId: last.id,
      });
    }
  }

  return { items, nextCursor, pageSize };
}

export async function adminGetStoreSettings(): Promise<StoreSettings> {
  requireFirebaseAdmin();
  const snap = await getAdminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(SETTINGS_GENERAL_DOC_ID)
    .get();
  return mapStoreSettings(
    snap.exists ? snap.data() : undefined,
    getDefaultStoreSettings(),
  );
}

export async function adminGetInventory(
  productId: string,
): Promise<InventoryRecord | null> {
  requireFirebaseAdmin();
  return getInventoryWithAdmin(productId);
}

export async function adminGetInventoryByProductIds(
  productIds: string[],
): Promise<Map<string, InventoryRecord>> {
  requireFirebaseAdmin();
  return getInventoryByProductIdsWithAdmin(productIds);
}
