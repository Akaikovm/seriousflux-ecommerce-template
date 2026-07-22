import { describe, expect, it } from "vitest";

import {
  isPurchasable,
  maxPurchasableQuantity,
  resolveInventoryStatus,
} from "@/features/inventory/lib/stock-status";

describe("resolveInventoryStatus", () => {
  it("returns not_tracked when tracking is off", () => {
    expect(
      resolveInventoryStatus({
        trackInventory: false,
        quantity: 0,
        lowStockThreshold: 5,
      }),
    ).toBe("not_tracked");
  });

  it("returns out_of_stock at zero quantity", () => {
    expect(
      resolveInventoryStatus({
        trackInventory: true,
        quantity: 0,
        lowStockThreshold: 5,
      }),
    ).toBe("out_of_stock");
  });

  it("returns low_stock at or below threshold", () => {
    expect(
      resolveInventoryStatus({
        trackInventory: true,
        quantity: 5,
        lowStockThreshold: 5,
      }),
    ).toBe("low_stock");
  });

  it("returns in_stock above threshold", () => {
    expect(
      resolveInventoryStatus({
        trackInventory: true,
        quantity: 6,
        lowStockThreshold: 5,
      }),
    ).toBe("in_stock");
  });
});

describe("isPurchasable", () => {
  it("allows purchase when inventory is not tracked", () => {
    expect(
      isPurchasable({
        trackInventory: false,
        quantity: 0,
        allowBackorders: false,
      }),
    ).toBe(true);
  });

  it("blocks zero stock without backorders", () => {
    expect(
      isPurchasable({
        trackInventory: true,
        quantity: 0,
        allowBackorders: false,
      }),
    ).toBe(false);
  });

  it("allows zero stock with backorders", () => {
    expect(
      isPurchasable({
        trackInventory: true,
        quantity: 0,
        allowBackorders: true,
      }),
    ).toBe(true);
  });
});

describe("maxPurchasableQuantity", () => {
  it("is unlimited when not tracked or backorders allowed", () => {
    expect(
      maxPurchasableQuantity({
        trackInventory: false,
        quantity: 3,
        allowBackorders: false,
      }),
    ).toBeNull();
    expect(
      maxPurchasableQuantity({
        trackInventory: true,
        quantity: 0,
        allowBackorders: true,
      }),
    ).toBeNull();
  });

  it("caps at available quantity when tracked without backorders", () => {
    expect(
      maxPurchasableQuantity({
        trackInventory: true,
        quantity: 4,
        allowBackorders: false,
      }),
    ).toBe(4);
  });
});
