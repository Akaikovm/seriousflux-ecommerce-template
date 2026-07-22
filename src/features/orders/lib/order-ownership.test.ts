import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";

import { mapOrderFromData } from "@/features/orders/lib/map-order";
import { orderBelongsToCustomer } from "@/features/orders/lib/order-ownership";

describe("orderBelongsToCustomer", () => {
  it("fails closed for missing order or blank ids", () => {
    expect(orderBelongsToCustomer(null, "cust-1")).toBe(false);
    expect(orderBelongsToCustomer({ customerId: "cust-1" }, "  ")).toBe(false);
    expect(orderBelongsToCustomer({ customerId: undefined }, "cust-1")).toBe(
      false,
    );
  });

  it("matches only the owning customer id", () => {
    expect(orderBelongsToCustomer({ customerId: "cust-1" }, "cust-1")).toBe(
      true,
    );
    expect(orderBelongsToCustomer({ customerId: "cust-1" }, "cust-2")).toBe(
      false,
    );
  });
});

describe("mapOrderFromData payment mapping", () => {
  it("maps known payment statuses and normalizes unknown to pending", () => {
    const paid = mapOrderFromData("o1", {
      orderNumber: "SF-1",
      customerEmail: "a@b.com",
      customerName: "A",
      customerPhone: "1",
      status: "paid",
      items: [],
      shippingAddress: {},
      shippingMethod: {},
      payment: {
        provider: "mercadopago",
        status: "paid",
        amount: 10,
        currency: "ARS",
      },
      totals: {},
      currency: "ARS",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    expect(paid.payment.status).toBe("paid");

    const unknown = mapOrderFromData("o2", {
      orderNumber: "SF-2",
      customerEmail: "a@b.com",
      customerName: "A",
      customerPhone: "1",
      status: "pending_payment",
      items: [],
      shippingAddress: {},
      shippingMethod: {},
      payment: {
        provider: "mercadopago",
        status: "weird",
        amount: 10,
        currency: "ARS",
      },
      totals: {},
      currency: "ARS",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    expect(unknown.payment.status).toBe("pending");
  });

  it("prefers preferenceId / paymentId over legacy aliases", () => {
    const order = mapOrderFromData("o3", {
      orderNumber: "SF-3",
      customerEmail: "a@b.com",
      customerName: "A",
      customerPhone: "1",
      status: "pending_payment",
      items: [],
      shippingAddress: {},
      shippingMethod: {},
      payment: {
        provider: "mercadopago",
        status: "pending",
        amount: 10,
        currency: "ARS",
        preferenceId: "pref-1",
        paymentId: "pay-1",
        externalId: "legacy-pref",
        transactionId: "legacy-pay",
      },
      totals: {},
      currency: "ARS",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    expect(order.payment.preferenceId).toBe("pref-1");
    expect(order.payment.paymentId).toBe("pay-1");
  });
});
