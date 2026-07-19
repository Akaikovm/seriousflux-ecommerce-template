/**
 * Full SeriousFlux demo kit — fills a blank Firestore project for demos/QA.
 *
 * Order: settings → catalog/inventory → sample orders.
 *
 * Usage:
 *   npm run seed:demo
 *
 * Does NOT create Firebase Auth users. Create an admin manually:
 *   1. Sign up / Google auth once in the app
 *   2. Set customers/{uid}.role = "admin" in Firestore
 */

import { seedOrders } from "./seed-orders";
import { seedProducts } from "./seed-products";
import { seedSettings } from "./seed-settings";

async function seedDemo(): Promise<void> {
  console.log("=== SeriousFlux demo seed ===\n");

  console.log("— Settings —");
  await seedSettings();
  console.log("");

  console.log("— Catalog + inventory —");
  await seedProducts();
  console.log("");

  console.log("— Sample orders —");
  await seedOrders();
  console.log("");

  console.log("=== Demo seed complete ===");
  console.log("Next:");
  console.log("  1. Reload storefront + admin");
  console.log("  2. Create an Auth user and set customers/{uid}.role = admin");
  console.log("  3. Explore inventory filters, shortfall order, and checkout");
}

seedDemo().catch((error: unknown) => {
  console.error("Demo seed failed:", error);
  process.exit(1);
});
