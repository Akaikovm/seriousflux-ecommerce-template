/**
 * Seed sample orders — SeriousFlux Demo (admin / lifecycle demos).
 *
 * Guest orders only (no Auth / customers docs). Stable ids via setDoc merge.
 *
 * Usage:
 *   npm run seed:orders
 *   npm run seed:demo
 *
 * Covers: pending_payment, paid+committed, shipped, shortfall banner case.
 * Does not deduct live inventory (snapshots only) — run after seed:products.
 */

import { Timestamp, doc, setDoc } from "firebase/firestore";

import { initSeedFirestore } from "./lib/firebase-seed";

type SeedOrder = {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  status: string;
  items: Array<{
    productId: string;
    productName: string;
    image: string;
    quantity: number;
    unitPrice: number;
    sku?: string;
  }>;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  shippingMethod: { id: string; label: string; cost: number };
  payment: {
    provider: string;
    status: string;
    amount: number;
    currency: string;
  };
  totals: {
    subtotal: number;
    shipping: number;
    discount: number;
    tax: number;
    total: number;
  };
  currency: string;
  notes?: string;
  inventoryCommitStatus: string;
  /** Days ago for createdAt (stable relative timestamps). */
  daysAgo: number;
};

const DEMO_IMAGE_TEE =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80";
const DEMO_IMAGE_CAP =
  "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80";
const DEMO_IMAGE_HOOD =
  "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80";

const SEED_ORDERS: SeedOrder[] = [
  {
    id: "demo-order-pending",
    orderNumber: "SF-DEMO-PENDING",
    customerEmail: "guest.pending@seriousflux.dev",
    customerName: "Ana Demo",
    customerPhone: "+5491155550201",
    status: "pending_payment",
    items: [
      {
        productId: "sf-logo-tee-black",
        productName: "SeriousFlux Logo Tee — Black",
        image: DEMO_IMAGE_TEE,
        quantity: 1,
        unitPrice: 18900,
        sku: "SF-TEE-BLK",
      },
    ],
    shippingAddress: {
      fullName: "Ana Demo",
      line1: "Av. Demo 100",
      city: "Buenos Aires",
      state: "CABA",
      postalCode: "1000",
      country: "AR",
      phone: "+5491155550201",
    },
    shippingMethod: {
      id: "standard",
      label: "Standard shipping",
      cost: 2500,
    },
    payment: {
      provider: "mercadopago",
      status: "pending",
      amount: 21400,
      currency: "ARS",
    },
    totals: {
      subtotal: 18900,
      shipping: 2500,
      discount: 0,
      tax: 0,
      total: 21400,
    },
    currency: "ARS",
    notes: "[Demo] Awaiting payment — safe to mark paid in Admin.",
    inventoryCommitStatus: "none",
    daysAgo: 0,
  },
  {
    id: "demo-order-paid",
    orderNumber: "SF-DEMO-PAID",
    customerEmail: "guest.paid@seriousflux.dev",
    customerName: "Bruno Demo",
    customerPhone: "+5491155550202",
    status: "paid",
    items: [
      {
        productId: "sf-hoodie-black",
        productName: "SeriousFlux Hoodie — Black",
        image: DEMO_IMAGE_HOOD,
        quantity: 1,
        unitPrice: 45900,
        sku: "SF-HOOD-BLK",
      },
      {
        productId: "sf-sticker-pack",
        productName: "SeriousFlux Sticker Pack",
        image:
          "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80",
        quantity: 2,
        unitPrice: 4900,
        sku: "SF-STK-PK",
      },
    ],
    shippingAddress: {
      fullName: "Bruno Demo",
      line1: "Calle Prueba 250",
      city: "Córdoba",
      state: "Córdoba",
      postalCode: "5000",
      country: "AR",
      phone: "+5491155550202",
    },
    shippingMethod: {
      id: "standard",
      label: "Standard shipping",
      cost: 3500,
    },
    payment: {
      provider: "cash_on_delivery",
      status: "paid",
      amount: 59200,
      currency: "ARS",
    },
    totals: {
      subtotal: 55700,
      shipping: 3500,
      discount: 0,
      tax: 0,
      total: 59200,
    },
    currency: "ARS",
    notes: "[Demo] Paid COD order with inventoryCommitStatus=committed.",
    inventoryCommitStatus: "committed",
    daysAgo: 1,
  },
  {
    id: "demo-order-shipped",
    orderNumber: "SF-DEMO-SHIPPED",
    customerEmail: "guest.shipped@seriousflux.dev",
    customerName: "Carla Demo",
    customerPhone: "+5491155550203",
    status: "shipped",
    items: [
      {
        productId: "sf-logo-tee-white",
        productName: "SeriousFlux Logo Tee — White",
        image:
          "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
        quantity: 2,
        unitPrice: 18900,
        sku: "SF-TEE-WHT",
      },
    ],
    shippingAddress: {
      fullName: "Carla Demo",
      line1: "Ruta Demo km 12",
      city: "Rosario",
      state: "Santa Fe",
      postalCode: "2000",
      country: "AR",
      phone: "+5491155550203",
    },
    shippingMethod: {
      id: "standard",
      label: "Standard shipping",
      cost: 3000,
    },
    payment: {
      provider: "mercadopago",
      status: "paid",
      amount: 40800,
      currency: "ARS",
    },
    totals: {
      subtotal: 37800,
      shipping: 3000,
      discount: 0,
      tax: 0,
      total: 40800,
    },
    currency: "ARS",
    notes: "[Demo] Shipped fulfillment sample.",
    inventoryCommitStatus: "committed",
    daysAgo: 3,
  },
  {
    id: "demo-order-shortfall",
    orderNumber: "SF-DEMO-SHORTFALL",
    customerEmail: "guest.shortfall@seriousflux.dev",
    customerName: "Diego Demo",
    customerPhone: "+5491155550204",
    status: "paid",
    items: [
      {
        productId: "sf-cap-red",
        productName: "SeriousFlux Cap — Accent Red",
        image: DEMO_IMAGE_CAP,
        quantity: 5,
        unitPrice: 12900,
        sku: "SF-CAP-RED",
      },
    ],
    shippingAddress: {
      fullName: "Diego Demo",
      line1: "Pasaje Demo 9",
      city: "Mendoza",
      state: "Mendoza",
      postalCode: "5500",
      country: "AR",
      phone: "+5491155550204",
    },
    shippingMethod: {
      id: "standard",
      label: "Standard shipping",
      cost: 2800,
    },
    payment: {
      provider: "cash_on_delivery",
      status: "paid",
      amount: 67300,
      currency: "ARS",
    },
    totals: {
      subtotal: 64500,
      shipping: 2800,
      discount: 0,
      tax: 0,
      total: 67300,
    },
    currency: "ARS",
    notes:
      "[Inventory shortfall] Manual review required. Demo order — stock was insufficient at commit (qty requested 5).",
    inventoryCommitStatus: "shortfall",
    daysAgo: 2,
  },
];

export async function seedOrders(): Promise<void> {
  const { db, projectId } = initSeedFirestore();

  console.log(`Seeding demo orders into project: ${projectId}`);

  const nowMs = Date.now();

  for (const order of SEED_ORDERS) {
    const { id, daysAgo, ...data } = order;
    const created = Timestamp.fromMillis(nowMs - daysAgo * 24 * 60 * 60 * 1000);
    const updated = created;

    await setDoc(
      doc(db, "orders", id),
      {
        ...data,
        createdAt: created,
        updatedAt: updated,
        ...(data.payment.status === "paid"
          ? {
              payment: {
                ...data.payment,
                paidAt: created,
                approvedAt: created,
              },
            }
          : {}),
      },
      { merge: true },
    );
    console.log(`  ✓ orders/${id} (${data.orderNumber})`);
  }

  console.log("Orders seed complete.");
  console.log(
    "Note: demo orders do not mutate inventory quantities (snapshots only).",
  );
}

const invokedDirectly = /seed-orders(\.ts)?$/i.test(
  (process.argv[1] ?? "").replace(/\\/g, "/"),
);

if (invokedDirectly) {
  seedOrders().catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}
