import type { CartItem } from "@/features/cart/types";
import type { AvailabilityResult } from "@/features/inventory/types";
import { InventoryError, InventoryService } from "@/features/inventory/services";
import type { OrderItem } from "@/features/orders/types";
import { ProductError, ProductService } from "@/features/products/services";

/** Maps onto `checkout.inventory.*` dictionary keys. */
export type CheckoutRevalidationErrorCode =
  | "cartEmpty"
  | "productsUnavailable"
  | "insufficientStock"
  | "priceUpdated"
  | "verifyFailed";

export type CheckoutRevalidationResult = {
  ok: boolean;
  results: AvailabilityResult[];
  message: string | null;
  errorCode: CheckoutRevalidationErrorCode | null;
  inactiveProductIds: string[];
  priceChangedProductIds: string[];
  /**
   * Order lines with live catalog snapshots (only trustworthy when `ok`).
   * When `priceUpdated`, still populated with live prices for cart sync UX.
   */
  orderItems: OrderItem[];
  /** Live cart line snapshots for syncing Zustand after price/catalog drift. */
  cartSnapshots: CartItem[];
};

function pricesEqual(a: number, b: number): boolean {
  // Catalog prices are whole currency units (e.g. ARS); compare to the cent.
  return Math.round(a * 100) === Math.round(b * 100);
}

/**
 * Checkout revalidation (GAP-006 / ADR-010).
 *
 * Reloads products from Firestore, verifies active + stock (InventoryService),
 * and rejects cart lines whose unit price no longer matches the catalog.
 * Successful results use live catalog prices — never trusted cart snapshots.
 */
export async function revalidateCheckoutCart(
  items: CartItem[],
  deps: {
    productService?: ProductService;
    inventoryService?: InventoryService;
  } = {},
): Promise<CheckoutRevalidationResult> {
  const productService = deps.productService ?? new ProductService();
  const inventoryService = deps.inventoryService ?? new InventoryService();

  if (items.length === 0) {
    return {
      ok: false,
      results: [],
      message: "Your cart is empty.",
      errorCode: "cartEmpty",
      inactiveProductIds: [],
      priceChangedProductIds: [],
      orderItems: [],
      cartSnapshots: [],
    };
  }

  try {
    const inactiveProductIds: string[] = [];
    const priceChangedProductIds: string[] = [];
    const availabilityInputs = [];
    const orderItems: OrderItem[] = [];
    const cartSnapshots: CartItem[] = [];

    for (const line of items) {
      const product = await productService.getById(line.productId);
      if (!product || !product.active) {
        inactiveProductIds.push(line.productId);
        continue;
      }

      if (!pricesEqual(line.price, product.price)) {
        priceChangedProductIds.push(line.productId);
      }

      availabilityInputs.push({
        productId: line.productId,
        quantity: line.quantity,
        trackInventory: product.trackInventory,
        allowBackorders: product.allowBackorders,
        lowStockThreshold: product.lowStockThreshold,
      });

      orderItems.push({
        productId: product.id,
        productName: product.name,
        image: product.image || line.image,
        quantity: line.quantity,
        unitPrice: product.price,
      });

      cartSnapshots.push({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: product.image || line.image,
        price: product.price,
        currency: product.currency || line.currency,
        quantity: line.quantity,
      });
    }

    if (inactiveProductIds.length > 0) {
      return {
        ok: false,
        results: [],
        message:
          "One or more products in your cart are no longer available. Please update your cart.",
        errorCode: "productsUnavailable",
        inactiveProductIds,
        priceChangedProductIds: [],
        orderItems: [],
        cartSnapshots: [],
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
        errorCode: "insufficientStock",
        inactiveProductIds: [],
        priceChangedProductIds: [],
        orderItems: [],
        cartSnapshots,
      };
    }

    if (priceChangedProductIds.length > 0) {
      return {
        ok: false,
        results,
        message:
          "Prices in your cart have changed. Review your cart and try again.",
        errorCode: "priceUpdated",
        inactiveProductIds: [],
        priceChangedProductIds,
        orderItems,
        cartSnapshots,
      };
    }

    return {
      ok: true,
      results,
      message: null,
      errorCode: null,
      inactiveProductIds: [],
      priceChangedProductIds: [],
      orderItems,
      cartSnapshots,
    };
  } catch (error) {
    if (error instanceof InventoryError || error instanceof ProductError) {
      return {
        ok: false,
        results: [],
        message: error.message,
        errorCode: "verifyFailed",
        inactiveProductIds: [],
        priceChangedProductIds: [],
        orderItems: [],
        cartSnapshots: [],
      };
    }
    return {
      ok: false,
      results: [],
      message: "We could not verify your cart. Please try again.",
      errorCode: "verifyFailed",
      inactiveProductIds: [],
      priceChangedProductIds: [],
      orderItems: [],
      cartSnapshots: [],
    };
  }
}
