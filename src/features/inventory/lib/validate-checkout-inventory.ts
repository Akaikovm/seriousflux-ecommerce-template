import { InventoryError, InventoryService } from "@/features/inventory/services";
import type { AvailabilityResult } from "@/features/inventory/types";
import { ProductError, ProductService } from "@/features/products/services";

export type CartAvailabilityLine = {
  productId: string;
  quantity: number;
};

export type CheckoutInventoryValidationResult = {
  ok: boolean;
  results: AvailabilityResult[];
  /** Human-readable summary for form error / toast. */
  message: string | null;
  /** Inactive or missing product ids. */
  inactiveProductIds: string[];
};

/**
 * Checkout validation pass #1 (ADR-023).
 * Loads live product policy + inventory; does not mutate stock.
 */
export async function validateCheckoutInventory(
  lines: CartAvailabilityLine[],
  deps: {
    productService?: ProductService;
    inventoryService?: InventoryService;
  } = {},
): Promise<CheckoutInventoryValidationResult> {
  const productService = deps.productService ?? new ProductService();
  const inventoryService = deps.inventoryService ?? new InventoryService();

  if (lines.length === 0) {
    return {
      ok: false,
      results: [],
      message: "Your cart is empty.",
      inactiveProductIds: [],
    };
  }

  try {
    const inactiveProductIds: string[] = [];
    const availabilityInputs = [];

    for (const line of lines) {
      const product = await productService.getById(line.productId);
      if (!product || !product.active) {
        inactiveProductIds.push(line.productId);
        continue;
      }

      availabilityInputs.push({
        productId: line.productId,
        quantity: line.quantity,
        trackInventory: product.trackInventory,
        allowBackorders: product.allowBackorders,
        lowStockThreshold: product.lowStockThreshold,
      });
    }

    if (inactiveProductIds.length > 0) {
      return {
        ok: false,
        results: [],
        message:
          "One or more products in your cart are no longer available. Please update your cart.",
        inactiveProductIds,
      };
    }

    const results =
      await inventoryService.validateAvailability(availabilityInputs);
    const failures = results.filter((result) => !result.ok);

    if (failures.length > 0) {
      return {
        ok: false,
        results,
        message:
          "Some items are out of stock or have insufficient quantity. Please update your cart.",
        inactiveProductIds: [],
      };
    }

    return {
      ok: true,
      results,
      message: null,
      inactiveProductIds: [],
    };
  } catch (error) {
    if (error instanceof InventoryError || error instanceof ProductError) {
      return {
        ok: false,
        results: [],
        message: error.message,
        inactiveProductIds: [],
      };
    }
    return {
      ok: false,
      results: [],
      message: "We could not verify stock availability. Please try again.",
      inactiveProductIds: [],
    };
  }
}
