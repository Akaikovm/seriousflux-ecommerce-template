import { Timestamp } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InventoryService } from "@/features/inventory/services/inventory.service";
import type { Order } from "@/features/orders/types";

function baseOrder(
  overrides: Partial<Order> & { inventoryCommitStatus?: Order["inventoryCommitStatus"] },
): Order {
  const now = Timestamp.now();
  return {
    id: "order-1",
    orderNumber: "SF-1",
    customerEmail: "buyer@example.com",
    customerName: "Buyer",
    customerPhone: "+10000000000",
    status: "paid",
    items: [
      {
        productId: "prod-1",
        productName: "Jacket",
        image: "",
        quantity: 2,
        unitPrice: 100,
      },
    ],
    shippingAddress: {
      fullName: "Buyer",
      line1: "Street 1",
      city: "City",
      state: "ST",
      postalCode: "1000",
      country: "AR",
      phone: "+10000000000",
    },
    shippingMethod: { id: "standard", label: "Standard", cost: 0 },
    payment: {
      provider: "mercadopago",
      status: "paid",
      amount: 200,
      currency: "ARS",
    },
    totals: {
      subtotal: 200,
      shipping: 0,
      discount: 0,
      tax: 0,
      total: 200,
    },
    currency: "ARS",
    createdAt: now,
    updatedAt: now,
    inventoryCommitStatus: "none",
    ...overrides,
  };
}

describe("InventoryService.commitSale / restoreSale", () => {
  const orderService = {
    getById: vi.fn(),
    updateInventoryCommitStatus: vi.fn(),
    updateNotes: vi.fn(),
  };

  const productService = {
    getById: vi.fn(),
  };

  let service: InventoryService;

  beforeEach(() => {
    vi.restoreAllMocks();
    orderService.getById.mockReset();
    orderService.updateInventoryCommitStatus.mockReset();
    orderService.updateNotes.mockReset();
    productService.getById.mockReset();

    service = new InventoryService(
      {} as never,
      productService as never,
      orderService as never,
    );

    productService.getById.mockResolvedValue({
      id: "prod-1",
      trackInventory: true,
      allowBackorders: false,
      lowStockThreshold: 5,
    });
  });

  it("is idempotent when already committed", async () => {
    orderService.getById.mockResolvedValue(
      baseOrder({ inventoryCommitStatus: "committed" }),
    );
    const setQuantity = vi.spyOn(service, "setQuantity");

    await service.commitSale("order-1");

    expect(setQuantity).not.toHaveBeenCalled();
    expect(orderService.updateInventoryCommitStatus).not.toHaveBeenCalled();
  });

  it("marks shortfall without decrementing stock when availability fails", async () => {
    orderService.getById.mockResolvedValue(baseOrder({ inventoryCommitStatus: "none" }));
    vi.spyOn(service, "validateAvailability").mockResolvedValue([
      {
        productId: "prod-1",
        ok: false,
        status: "out_of_stock",
        availableQuantity: 0,
        reason: "insufficient_stock",
      },
    ]);
    const setQuantity = vi.spyOn(service, "setQuantity");

    await service.commitSale("order-1");

    expect(setQuantity).not.toHaveBeenCalled();
    expect(orderService.updateInventoryCommitStatus).toHaveBeenCalledWith(
      "order-1",
      "shortfall",
    );
    expect(orderService.updateNotes).toHaveBeenCalled();
  });

  it("decrements stock and marks committed when available", async () => {
    orderService.getById.mockResolvedValue(baseOrder({ inventoryCommitStatus: "none" }));
    vi.spyOn(service, "validateAvailability").mockResolvedValue([
      {
        productId: "prod-1",
        ok: true,
        status: "in_stock",
        availableQuantity: 10,
      },
    ]);
    vi.spyOn(service, "getInventory").mockResolvedValue({
      productId: "prod-1",
      quantity: 10,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    const setQuantity = vi
      .spyOn(service, "setQuantity")
      .mockResolvedValue({
        productId: "prod-1",
        quantity: 8,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

    await service.commitSale("order-1");

    expect(setQuantity).toHaveBeenCalledWith({
      productId: "prod-1",
      quantity: 8,
    });
    expect(orderService.updateInventoryCommitStatus).toHaveBeenCalledWith(
      "order-1",
      "committed",
    );
  });

  it("restoreSale is a no-op unless status is committed", async () => {
    orderService.getById.mockResolvedValue(
      baseOrder({ inventoryCommitStatus: "shortfall" }),
    );
    const adjustStock = vi.spyOn(service, "adjustStock");

    await service.restoreSale("order-1");

    expect(adjustStock).not.toHaveBeenCalled();
    expect(orderService.updateInventoryCommitStatus).not.toHaveBeenCalled();
  });

  it("restoreSale returns stock and marks restored", async () => {
    orderService.getById.mockResolvedValue(
      baseOrder({ inventoryCommitStatus: "committed" }),
    );
    const adjustStock = vi.spyOn(service, "adjustStock").mockResolvedValue({
      productId: "prod-1",
      quantity: 12,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await service.restoreSale("order-1");

    expect(adjustStock).toHaveBeenCalledWith({
      productId: "prod-1",
      delta: 2,
      reason: "restoreSale:order-1",
    });
    expect(orderService.updateInventoryCommitStatus).toHaveBeenCalledWith(
      "order-1",
      "restored",
    );
  });
});
