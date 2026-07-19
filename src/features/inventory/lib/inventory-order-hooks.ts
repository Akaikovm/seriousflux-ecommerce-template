import { InventoryError, InventoryService } from "@/features/inventory/services";

/**
 * Safe commit after payment approval (RFC-023).
 * Logs and swallows failures so payment/webhook paths stay successful.
 * Shortfall is a normal domain outcome inside `commitSale` (no throw).
 */
export async function commitSaleSafely(
  orderId: string,
  service: InventoryService = new InventoryService(),
): Promise<void> {
  try {
    await service.commitSale(orderId);
  } catch (error) {
    const message =
      error instanceof InventoryError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown inventory commit error";
    console.error("[inventory] commitSale failed", { orderId, message, error });
  }
}

/**
 * Server/client-safe restore after cancel or refund.
 */
export async function restoreSaleSafely(
  orderId: string,
  service: InventoryService = new InventoryService(),
): Promise<void> {
  try {
    await service.restoreSale(orderId);
  } catch (error) {
    const message =
      error instanceof InventoryError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown inventory restore error";
    console.error("[inventory] restoreSale failed", {
      orderId,
      message,
      error,
    });
  }
}
