import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
  type FirestoreError,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { getFirestoreDb } from "@/firebase/firestore";
import {
  isPurchasable,
  resolveInventoryStatus,
} from "@/features/inventory/lib/stock-status";
import { InventoryError } from "@/features/inventory/services/inventory-error";
import type {
  AdjustStockInput,
  AvailabilityInput,
  AvailabilityResult,
  CommitSaleItem,
  InventoryRecord,
  InventoryStatus,
  SetQuantityInput,
} from "@/features/inventory/types";
import { OrderError, OrderService } from "@/features/orders/services";
import { ProductService } from "@/features/products/services";

/** Firestore collection for inventory documents (MVP: one doc per product). */
const INVENTORY_COLLECTION = "inventory";

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asTimestamp(value: unknown, fallback: Timestamp): Timestamp {
  if (
    value !== null &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as Timestamp).toMillis === "function"
  ) {
    return value as Timestamp;
  }
  return fallback;
}

/**
 * Maps a Firestore inventory document onto the typed domain model.
 */
function mapInventory(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): InventoryRecord {
  const data = snapshot.data() ?? {};
  const now = Timestamp.now();
  const record: InventoryRecord = {
    productId: snapshot.id,
    quantity: Math.max(0, asNumber(data.quantity, 0)),
    createdAt: asTimestamp(data.createdAt, now),
    updatedAt: asTimestamp(data.updatedAt, now),
  };
  if (typeof data.updatedBy === "string" && data.updatedBy) {
    record.updatedBy = data.updatedBy;
  }
  return record;
}

function toInventoryError(error: unknown): InventoryError {
  if (error instanceof InventoryError) {
    return error;
  }
  if (error instanceof OrderError) {
    return new InventoryError(error.message, "unavailable", { cause: error });
  }

  const firestoreError = error as FirestoreError | undefined;
  const firebaseCode = firestoreError?.code;

  if (firebaseCode === "permission-denied") {
    return new InventoryError(
      "You do not have permission to access inventory.",
      "permission-denied",
      { cause: error },
    );
  }

  if (firebaseCode === "not-found") {
    return new InventoryError("Inventory record not found.", "not-found", {
      cause: error,
    });
  }

  if (
    firebaseCode === "unavailable" ||
    firebaseCode === "deadline-exceeded" ||
    firebaseCode === "resource-exhausted"
  ) {
    return new InventoryError(
      "Inventory is temporarily unavailable. Please try again.",
      "unavailable",
      { cause: error },
    );
  }

  return new InventoryError("Failed to access inventory.", "unknown", {
    cause: error,
  });
}

function evaluateAvailability(
  input: AvailabilityInput,
  availableQuantity: number,
): AvailabilityResult {
  const status = resolveInventoryStatus({
    trackInventory: input.trackInventory,
    quantity: availableQuantity,
    lowStockThreshold:
      input.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
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
      status: "out_of_stock",
      availableQuantity,
      reason: availableQuantity <= 0 ? "out_of_stock" : "insufficient_stock",
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

/**
 * Inventory domain service (RFC-023 / ADR-023).
 *
 * Sole writer of `inventory/*` documents. Checkout / Orders / ProductService
 * must never mutate inventory directly.
 *
 * Limitations (MVP, accepted):
 * - No reservations while `pending_payment` — oversell window exists.
 * - No distributed locking — validation #2 runs immediately before commitSale.
 * - `inventory/{productId}` is MVP storage only; warehouse evolution stays behind this API.
 */
export class InventoryService {
  constructor(
    private readonly db: Firestore = getFirestoreDb(),
    private readonly productService: ProductService = new ProductService(),
    private readonly orderService: OrderService = new OrderService(),
  ) {}

  /**
   * Read inventory for a product. Returns `null` when no document exists.
   * Missing doc + trackInventory → treat quantity as 0 at validation time.
   */
  async getInventory(productId: string): Promise<InventoryRecord | null> {
    try {
      if (!productId.trim()) {
        throw new InventoryError("Product id is required.", "invalid-input");
      }
      const snapshot = await getDoc(
        doc(this.db, INVENTORY_COLLECTION, productId),
      );
      if (!snapshot.exists()) {
        return null;
      }
      return mapInventory(snapshot);
    } catch (error) {
      throw toInventoryError(error);
    }
  }

  /**
   * Batch read inventory documents by product id.
   */
  async getInventoryByProductIds(
    productIds: string[],
  ): Promise<Map<string, InventoryRecord>> {
    try {
      const unique = [...new Set(productIds.filter((id) => id.trim()))];
      const result = new Map<string, InventoryRecord>();
      if (unique.length === 0) {
        return result;
      }

      // Firestore `in` queries are capped at 30 values.
      const chunkSize = 30;
      for (let i = 0; i < unique.length; i += chunkSize) {
        const chunk = unique.slice(i, i + chunkSize);
        const inventoryQuery = query(
          collection(this.db, INVENTORY_COLLECTION),
          where(documentId(), "in", chunk),
        );
        const snapshot = await getDocs(inventoryQuery);
        for (const docSnap of snapshot.docs) {
          result.set(docSnap.id, mapInventory(docSnap));
        }
      }

      return result;
    } catch (error) {
      throw toInventoryError(error);
    }
  }

  /**
   * Derive inventory status from policy + quantity (pure helper wrapper).
   */
  getInventoryStatus(input: {
    trackInventory: boolean;
    quantity: number;
    lowStockThreshold: number;
  }): InventoryStatus {
    return resolveInventoryStatus(input);
  }

  /**
   * Validation used at checkout (pass #1) and immediately before commitSale (pass #2).
   */
  async validateAvailability(
    items: AvailabilityInput[],
  ): Promise<AvailabilityResult[]> {
    try {
      if (!Array.isArray(items) || items.length === 0) {
        throw new InventoryError(
          "At least one line item is required.",
          "invalid-input",
        );
      }

      const trackedIds = items
        .filter((item) => item.trackInventory)
        .map((item) => item.productId);
      const inventoryMap = await this.getInventoryByProductIds(trackedIds);

      return items.map((item) => {
        if (item.quantity < 1) {
          return {
            productId: item.productId,
            ok: false,
            status: "out_of_stock" as const,
            availableQuantity: item.trackInventory ? 0 : null,
            reason: "insufficient_stock" as const,
          };
        }

        const record = inventoryMap.get(item.productId);
        const available = item.trackInventory ? (record?.quantity ?? 0) : 0;
        return evaluateAvailability(item, available);
      });
    } catch (error) {
      throw toInventoryError(error);
    }
  }

  /**
   * Set absolute quantity (Admin product form). Creates the inventory doc if missing.
   */
  async setQuantity(input: SetQuantityInput): Promise<InventoryRecord> {
    try {
      const productId = input.productId.trim();
      if (!productId) {
        throw new InventoryError("Product id is required.", "invalid-input");
      }
      if (!Number.isFinite(input.quantity) || input.quantity < 0) {
        throw new InventoryError(
          "Quantity must be a non-negative number.",
          "invalid-input",
        );
      }

      const now = Timestamp.now();
      const ref = doc(this.db, INVENTORY_COLLECTION, productId);
      const existing = await getDoc(ref);
      const quantity = Math.floor(input.quantity);

      if (!existing.exists()) {
        const payload: DocumentData = {
          productId,
          quantity,
          createdAt: now,
          updatedAt: now,
        };
        if (input.updatedBy) {
          payload.updatedBy = input.updatedBy;
        }
        await setDoc(ref, payload);
        return mapInventory(await getDoc(ref));
      }

      const patch: DocumentData = {
        quantity,
        updatedAt: now,
      };
      if (input.updatedBy) {
        patch.updatedBy = input.updatedBy;
      }
      await updateDoc(ref, patch);
      return mapInventory(await getDoc(ref));
    } catch (error) {
      throw toInventoryError(error);
    }
  }

  /**
   * Relative adjustment (public contract — future-ready for restock / PO / corrections).
   * Clamps at 0 so quantity never goes negative.
   */
  async adjustStock(input: AdjustStockInput): Promise<InventoryRecord> {
    try {
      const productId = input.productId.trim();
      if (!productId) {
        throw new InventoryError("Product id is required.", "invalid-input");
      }
      if (!Number.isFinite(input.delta) || input.delta === 0) {
        throw new InventoryError(
          "Adjustment delta must be a non-zero number.",
          "invalid-input",
        );
      }

      const current = await this.getInventory(productId);
      const next = Math.max(0, (current?.quantity ?? 0) + Math.trunc(input.delta));
      return this.setQuantity({
        productId,
        quantity: next,
        updatedBy: input.updatedBy,
      });
    } catch (error) {
      throw toInventoryError(error);
    }
  }

  /**
   * Decrease stock after payment is paid.
   * Runs validation #2 immediately before mutating.
   * Idempotent via `order.inventoryCommitStatus`.
   *
   * On insufficient stock: sets `shortfall` — never auto-cancels or refunds.
   */
  async commitSale(orderId: string, items?: CommitSaleItem[]): Promise<void> {
    try {
      const order = await this.orderService.getById(orderId);
      if (!order) {
        throw new InventoryError("Order not found.", "not-found");
      }

      const status = order.inventoryCommitStatus ?? "none";
      if (status === "committed" || status === "shortfall") {
        return;
      }
      // After restore, a re-commit is not expected in MVP — no-op.
      if (status === "restored") {
        return;
      }

      const lineItems = items ?? order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const availabilityInputs = await this.buildAvailabilityInputs(lineItems);
      const results = await this.validateAvailability(availabilityInputs);
      const failures = results.filter((result) => !result.ok);

      if (failures.length > 0) {
        await this.orderService.updateInventoryCommitStatus(
          orderId,
          "shortfall",
        );
        const summary = failures
          .map(
            (failure) =>
              `${failure.productId} (${failure.reason ?? "unavailable"}; have ${failure.availableQuantity ?? 0})`,
          )
          .join("; ");
        const note = `[Inventory shortfall] Manual review required. ${summary}`;
        const existingNotes = order.notes?.trim() ?? "";
        if (!existingNotes.includes("[Inventory shortfall]")) {
          await this.orderService.updateNotes(
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
        const record = await this.getInventory(item.productId);
        const currentQty = record?.quantity ?? 0;
        const nextQty = Math.max(0, currentQty - item.quantity);
        await this.setQuantity({ productId: item.productId, quantity: nextQty });
      }

      await this.orderService.updateInventoryCommitStatus(orderId, "committed");
    } catch (error) {
      throw toInventoryError(error);
    }
  }

  /**
   * Restore stock after cancel or refund when a commit previously succeeded.
   * Idempotent. No-op for `none` / `shortfall` / already `restored`.
   */
  async restoreSale(orderId: string, items?: CommitSaleItem[]): Promise<void> {
    try {
      const order = await this.orderService.getById(orderId);
      if (!order) {
        throw new InventoryError("Order not found.", "not-found");
      }

      const status = order.inventoryCommitStatus ?? "none";
      if (status !== "committed") {
        return;
      }

      const lineItems = items ?? order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const availabilityInputs = await this.buildAvailabilityInputs(lineItems);

      for (const item of availabilityInputs) {
        if (!item.trackInventory) {
          continue;
        }
        await this.adjustStock({
          productId: item.productId,
          delta: item.quantity,
          reason: `restoreSale:${orderId}`,
        });
      }

      await this.orderService.updateInventoryCommitStatus(orderId, "restored");
    } catch (error) {
      throw toInventoryError(error);
    }
  }

  private async buildAvailabilityInputs(
    items: CommitSaleItem[],
  ): Promise<AvailabilityInput[]> {
    const inputs: AvailabilityInput[] = [];

    for (const item of items) {
      if (item.quantity < 1) {
        continue;
      }
      const product = await this.productService.getById(item.productId);
      inputs.push({
        productId: item.productId,
        quantity: item.quantity,
        trackInventory: product?.trackInventory ?? false,
        allowBackorders: product?.allowBackorders ?? false,
        lowStockThreshold: product?.lowStockThreshold,
      });
    }

    return inputs;
  }
}
