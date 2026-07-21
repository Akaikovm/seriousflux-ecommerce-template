import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/firebase/admin";
import {
  isPurchasable,
  resolveInventoryStatus,
} from "@/features/inventory/lib/stock-status";
import { InventoryError } from "@/features/inventory/services/inventory-error";
import type {
  AvailabilityInput,
  AvailabilityResult,
  CommitSaleItem,
  InventoryRecord,
} from "@/features/inventory/types";
import { AdminOrderService } from "@/features/orders/services/order.admin";
import {
  mapProduct,
  PRODUCTS_COLLECTION,
} from "@/features/products/services/product.service";
import { toClientTimestamp } from "@/lib/firestore-timestamp";

const INVENTORY_COLLECTION = "inventory";
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function mapInventoryRecord(
  id: string,
  data: Record<string, unknown>,
): InventoryRecord {
  const now = toClientTimestamp(undefined);
  const record: InventoryRecord = {
    productId: id,
    quantity: Math.max(0, asNumber(data.quantity, 0)),
    createdAt: toClientTimestamp(data.createdAt, now),
    updatedAt: toClientTimestamp(data.updatedAt, now),
  };
  if (typeof data.updatedBy === "string" && data.updatedBy) {
    record.updatedBy = data.updatedBy;
  }
  return record;
}

function evaluateAvailability(
  input: AvailabilityInput,
  availableQuantity: number,
): AvailabilityResult {
  const status = resolveInventoryStatus({
    trackInventory: input.trackInventory,
    quantity: availableQuantity,
    lowStockThreshold: input.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
  });

  if (!input.trackInventory) {
    return {
      productId: input.productId,
      ok: true,
      status: "not_tracked",
      availableQuantity: null,
    };
  }

  const purchasable = isPurchasable({
    trackInventory: true,
    quantity: availableQuantity,
    allowBackorders: input.allowBackorders,
  });

  if (!purchasable) {
    return {
      productId: input.productId,
      ok: false,
      status,
      availableQuantity,
      reason: "insufficient_stock",
    };
  }

  if (availableQuantity < input.quantity && !input.allowBackorders) {
    return {
      productId: input.productId,
      ok: false,
      status,
      availableQuantity,
      reason: "insufficient_stock",
    };
  }

  return {
    productId: input.productId,
    ok: true,
    status,
    availableQuantity,
  };
}

async function getInventory(
  productId: string,
): Promise<InventoryRecord | null> {
  const snap = await getAdminDb()
    .collection(INVENTORY_COLLECTION)
    .doc(productId)
    .get();
  if (!snap.exists) {
    return null;
  }
  return mapInventoryRecord(snap.id, (snap.data() ?? {}) as Record<string, unknown>);
}

async function setQuantity(productId: string, quantity: number): Promise<void> {
  const now = Timestamp.now();
  const ref = getAdminDb().collection(INVENTORY_COLLECTION).doc(productId);
  const existing = await ref.get();
  const qty = Math.floor(quantity);

  if (!existing.exists) {
    await ref.set({
      productId,
      quantity: qty,
      createdAt: now,
      updatedAt: now,
    });
    return;
  }

  await ref.update({
    quantity: qty,
    updatedAt: now,
  });
}

async function buildAvailabilityInputs(
  items: CommitSaleItem[],
): Promise<AvailabilityInput[]> {
  const inputs: AvailabilityInput[] = [];

  for (const item of items) {
    if (item.quantity < 1) {
      continue;
    }
    const productSnap = await getAdminDb()
      .collection(PRODUCTS_COLLECTION)
      .doc(item.productId)
      .get();

    let trackInventory = false;
    let allowBackorders = false;
    let lowStockThreshold: number | undefined;

    if (productSnap.exists) {
      const product = mapProduct({
        id: productSnap.id,
        data: () => productSnap.data() ?? {},
      } as Parameters<typeof mapProduct>[0]);
      trackInventory = product.trackInventory;
      allowBackorders = product.allowBackorders;
      lowStockThreshold = product.lowStockThreshold;
    }

    inputs.push({
      productId: item.productId,
      quantity: item.quantity,
      trackInventory,
      allowBackorders,
      lowStockThreshold,
    });
  }

  return inputs;
}

/**
 * Admin-SDK inventory commit after payment (GAP-004).
 * Mirrors InventoryService.commitSale semantics.
 */
export async function commitSaleWithAdmin(orderId: string): Promise<void> {
  try {
    const orderService = new AdminOrderService();
    const order = await orderService.getById(orderId);
    if (!order) {
      throw new InventoryError("Order not found.", "not-found");
    }

    const status = order.inventoryCommitStatus ?? "none";
    if (status === "committed" || status === "shortfall") {
      return;
    }
    if (status === "restored") {
      return;
    }

    const lineItems = order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const availabilityInputs = await buildAvailabilityInputs(lineItems);
    const evaluated: AvailabilityResult[] = [];

    for (const input of availabilityInputs) {
      if (!input.trackInventory) {
        evaluated.push(evaluateAvailability(input, 0));
        continue;
      }
      const record = await getInventory(input.productId);
      evaluated.push(evaluateAvailability(input, record?.quantity ?? 0));
    }

    const failures = evaluated.filter((result) => !result.ok);
    if (failures.length > 0) {
      await orderService.updateInventoryCommitStatus(orderId, "shortfall");
      const summary = failures
        .map(
          (failure) =>
            `${failure.productId} (${failure.reason ?? "unavailable"}; have ${failure.availableQuantity ?? 0})`,
        )
        .join("; ");
      const note = `[Inventory shortfall] Manual review required. ${summary}`;
      const existingNotes = order.notes?.trim() ?? "";
      if (!existingNotes.includes("[Inventory shortfall]")) {
        await orderService.updateNotes(
          orderId,
          existingNotes ? `${existingNotes}\n${note}` : note,
        );
      }
      return;
    }

    for (const item of availabilityInputs) {
      if (!item.trackInventory) {
        continue;
      }
      const record = await getInventory(item.productId);
      const currentQty = record?.quantity ?? 0;
      const nextQty = Math.max(0, currentQty - item.quantity);
      await setQuantity(item.productId, nextQty);
    }

    await orderService.updateInventoryCommitStatus(orderId, "committed");
  } catch (error) {
    if (error instanceof InventoryError) {
      throw error;
    }
    throw new InventoryError("Failed to commit sale.", "unknown", {
      cause: error,
    });
  }
}

/**
 * Admin-SDK inventory restore after refund (GAP-004).
 */
export async function restoreSaleWithAdmin(orderId: string): Promise<void> {
  try {
    const orderService = new AdminOrderService();
    const order = await orderService.getById(orderId);
    if (!order) {
      throw new InventoryError("Order not found.", "not-found");
    }

    const status = order.inventoryCommitStatus ?? "none";
    if (status !== "committed") {
      return;
    }

    const lineItems = order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    const availabilityInputs = await buildAvailabilityInputs(lineItems);

    for (const item of availabilityInputs) {
      if (!item.trackInventory) {
        continue;
      }
      const record = await getInventory(item.productId);
      const next = Math.max(0, (record?.quantity ?? 0) + item.quantity);
      await setQuantity(item.productId, next);
    }

    await orderService.updateInventoryCommitStatus(orderId, "restored");
  } catch (error) {
    if (error instanceof InventoryError) {
      throw error;
    }
    throw new InventoryError("Failed to restore sale.", "unknown", {
      cause: error,
    });
  }
}

export async function commitSaleSafelyWithAdmin(orderId: string): Promise<void> {
  try {
    await commitSaleWithAdmin(orderId);
  } catch (error) {
    const message =
      error instanceof InventoryError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown inventory commit error";
    console.error("[inventory] commitSale (admin) failed", {
      orderId,
      message,
      error,
    });
  }
}

export async function restoreSaleSafelyWithAdmin(
  orderId: string,
): Promise<void> {
  try {
    await restoreSaleWithAdmin(orderId);
  } catch (error) {
    const message =
      error instanceof InventoryError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown inventory restore error";
    console.error("[inventory] restoreSale (admin) failed", {
      orderId,
      message,
      error,
    });
  }
}

/** Admin SSR: batch inventory reads. */
export async function getInventoryByProductIdsWithAdmin(
  productIds: string[],
): Promise<Map<string, InventoryRecord>> {
  const unique = [...new Set(productIds.filter((id) => id.trim()))];
  const result = new Map<string, InventoryRecord>();
  if (unique.length === 0) {
    return result;
  }

  const chunkSize = 30;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const refs = chunk.map((id) =>
      getAdminDb().collection(INVENTORY_COLLECTION).doc(id),
    );
    const snaps = await getAdminDb().getAll(...refs);
    for (const snap of snaps) {
      if (snap.exists) {
        result.set(
          snap.id,
          mapInventoryRecord(
            snap.id,
            (snap.data() ?? {}) as Record<string, unknown>,
          ),
        );
      }
    }
  }

  return result;
}

export async function getInventoryWithAdmin(
  productId: string,
): Promise<InventoryRecord | null> {
  return getInventory(productId);
}
