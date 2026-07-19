/**
 * Seed catalog + inventory — SeriousFlux Demo (blank-project demos).
 *
 * Idempotent: stable document ids via setDoc merge.
 *
 * Usage:
 *   npm run seed:products
 *   npm run seed:demo
 *
 * Stock states covered for QA:
 * - in stock, low stock, out of stock, not tracked, backorders allowed
 */

import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { initSeedFirestore } from "./lib/firebase-seed";

type SeedCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  featured: boolean;
  active: boolean;
  order: number;
};

type SeedProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  categoryId: string;
  featured: boolean;
  active: boolean;
  order: number;
  sku: string;
  trackInventory: boolean;
  lowStockThreshold: number;
  allowBackorders: boolean;
  visibilityWhenOutOfStock: "visible" | "hidden";
  /** Seeded into inventory/{id} — not stored on the product document. */
  stockQuantity: number;
};

const SEED_CATEGORIES: SeedCategory[] = [
  {
    id: "apparel",
    name: "Apparel",
    slug: "apparel",
    description: "SeriousFlux demo tees, hoodies, and everyday wear.",
    image:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80",
    featured: true,
    active: true,
    order: 1,
  },
  {
    id: "accessories",
    name: "Accessories",
    slug: "accessories",
    description: "Bags, caps, and small goods for the demo storefront.",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    featured: true,
    active: true,
    order: 2,
  },
  {
    id: "digital",
    name: "Digital",
    slug: "digital",
    description: "Digital / untracked demo SKUs (no physical stock).",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
    featured: false,
    active: true,
    order: 3,
  },
];

const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: "sf-logo-tee-black",
    name: "SeriousFlux Logo Tee — Black",
    slug: "sf-logo-tee-black",
    description:
      "Demo cotton tee with SeriousFlux mark. In-stock sample for catalog and cart flows.",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    price: 18900,
    currency: "ARS",
    categoryId: "apparel",
    featured: true,
    active: true,
    order: 1,
    sku: "SF-TEE-BLK",
    trackInventory: true,
    lowStockThreshold: 5,
    allowBackorders: false,
    visibilityWhenOutOfStock: "visible",
    stockQuantity: 42,
  },
  {
    id: "sf-logo-tee-white",
    name: "SeriousFlux Logo Tee — White",
    slug: "sf-logo-tee-white",
    description:
      "Light tee for PDP / featured grid demos. Comfortable everyday cut.",
    image:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
    price: 18900,
    currency: "ARS",
    categoryId: "apparel",
    featured: true,
    active: true,
    order: 2,
    sku: "SF-TEE-WHT",
    trackInventory: true,
    lowStockThreshold: 5,
    allowBackorders: false,
    visibilityWhenOutOfStock: "visible",
    stockQuantity: 28,
  },
  {
    id: "sf-hoodie-black",
    name: "SeriousFlux Hoodie — Black",
    slug: "sf-hoodie-black",
    description:
      "Heavyweight hoodie demo SKU. Featured product for hero → PDP journeys.",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
    price: 45900,
    currency: "ARS",
    categoryId: "apparel",
    featured: true,
    active: true,
    order: 3,
    sku: "SF-HOOD-BLK",
    trackInventory: true,
    lowStockThreshold: 5,
    allowBackorders: false,
    visibilityWhenOutOfStock: "visible",
    stockQuantity: 15,
  },
  {
    id: "sf-cap-red",
    name: "SeriousFlux Cap — Accent Red",
    slug: "sf-cap-red",
    description:
      "Low-stock demo accessory. Triggers “Only X left” when settings allow.",
    image:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80",
    price: 12900,
    currency: "ARS",
    categoryId: "accessories",
    featured: true,
    active: true,
    order: 4,
    sku: "SF-CAP-RED",
    trackInventory: true,
    lowStockThreshold: 5,
    allowBackorders: false,
    visibilityWhenOutOfStock: "visible",
    stockQuantity: 3,
  },
  {
    id: "sf-tote-canvas",
    name: "SeriousFlux Canvas Tote",
    slug: "sf-tote-canvas",
    description:
      "Out-of-stock demo. Stays visible so you can test unavailable ATC UX.",
    image:
      "https://images.unsplash.com/photo-1590874103328-eac38a67437f?w=800&q=80",
    price: 15900,
    currency: "ARS",
    categoryId: "accessories",
    featured: false,
    active: true,
    order: 5,
    sku: "SF-TOTE-CVS",
    trackInventory: true,
    lowStockThreshold: 5,
    allowBackorders: false,
    visibilityWhenOutOfStock: "visible",
    stockQuantity: 0,
  },
  {
    id: "sf-socks-pack",
    name: "SeriousFlux Socks Pack",
    slug: "sf-socks-pack",
    description:
      "Backorder demo — purchasable at qty 0 with allowBackorders enabled.",
    image:
      "https://images.unsplash.com/photo-1586350977771-b3b0abd50c40?w=800&q=80",
    price: 8900,
    currency: "ARS",
    categoryId: "accessories",
    featured: false,
    active: true,
    order: 6,
    sku: "SF-SOCK-3PK",
    trackInventory: true,
    lowStockThreshold: 5,
    allowBackorders: true,
    visibilityWhenOutOfStock: "visible",
    stockQuantity: 0,
  },
  {
    id: "sf-gift-card-digital",
    name: "SeriousFlux Digital Gift Card",
    slug: "sf-gift-card-digital",
    description:
      "Not-tracked digital SKU. Inventory quantity is ignored for purchase rules.",
    image:
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80",
    price: 25000,
    currency: "ARS",
    categoryId: "digital",
    featured: false,
    active: true,
    order: 7,
    sku: "SF-GIFT-DIG",
    trackInventory: false,
    lowStockThreshold: 5,
    allowBackorders: false,
    visibilityWhenOutOfStock: "visible",
    stockQuantity: 0,
  },
  {
    id: "sf-sticker-pack",
    name: "SeriousFlux Sticker Pack",
    slug: "sf-sticker-pack",
    description: "Small accessory with healthy stock for multi-item carts.",
    image:
      "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80",
    price: 4900,
    currency: "ARS",
    categoryId: "accessories",
    featured: false,
    active: true,
    order: 8,
    sku: "SF-STK-PK",
    trackInventory: true,
    lowStockThreshold: 5,
    allowBackorders: false,
    visibilityWhenOutOfStock: "visible",
    stockQuantity: 100,
  },
];

export async function seedProducts(): Promise<void> {
  const { db, projectId } = initSeedFirestore();

  console.log(`Seeding catalog into project: ${projectId}`);

  for (const category of SEED_CATEGORIES) {
    const { id, ...data } = category;
    await setDoc(doc(db, "categories", id), data, { merge: true });
    console.log(`  ✓ categories/${id}`);
  }

  for (const product of SEED_PRODUCTS) {
    const { id, stockQuantity, ...data } = product;
    await setDoc(doc(db, "products", id), data, { merge: true });
    console.log(`  ✓ products/${id}`);

    await setDoc(
      doc(db, "inventory", id),
      {
        productId: id,
        quantity: stockQuantity,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
    console.log(`  ✓ inventory/${id} (qty ${stockQuantity})`);
  }

  console.log("Catalog seed complete.");
}

const invokedDirectly = /seed-products(\.ts)?$/i.test(
  (process.argv[1] ?? "").replace(/\\/g, "/"),
);

if (invokedDirectly) {
  seedProducts().catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}
