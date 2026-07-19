/**
 * Seed store settings — SeriousFlux Demo (blank-project demos).
 *
 * Idempotent: merges into `settings/general`.
 *
 * Usage:
 *   npm run seed:settings
 *   npm run seed:demo
 *
 * Does NOT write Auth users or payment/email secrets (those stay in env).
 */

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { initSeedFirestore } from "./lib/firebase-seed";

/**
 * Serious Flux demo store — matches template identity defaults
 * (black + accent red) with enough contact/hero copy for a full UI demo.
 */
const SEED_SETTINGS = {
  storeName: "Serious Flux",
  tagline: "Ecommerce starter for serious brands",
  description:
    "Demo store for the SeriousFlux ecommerce template. Replace this catalog, branding, and settings when onboarding a real client — everything here is sample data for demos and QA.",
  logo: "",
  favicon: "",
  primaryColor: "#0A0A0A",
  secondaryColor: "#E10600",
  currency: "ARS",
  locale: "es-AR",
  language: "es",
  country: "AR",
  email: "demo@seriousflux.dev",
  phone: "+54 11 5555-0100",
  whatsapp: "+5491155550100",
  instagram: "https://instagram.com/seriousflux",
  facebook: "https://facebook.com/seriousflux",
  tiktok: "",
  youtube: "",
  address: "Buenos Aires, Argentina",
  shippingEnabled: true,
  maintenanceMode: false,
  enabledPaymentMethods: {
    mercadopago: true,
    cashOnDelivery: true,
  },
  paymentProviders: {
    mercadopago: {
      enabled: true,
      displayName: "Mercado Pago",
      description: "Pay with cards or Mercado Pago",
      sortOrder: 1,
    },
    cashOnDelivery: {
      enabled: true,
      displayName: "Cash on Delivery",
      description: "Pay when receiving the order",
      sortOrder: 2,
    },
    stripe: {
      enabled: false,
      displayName: "Stripe",
      description: "",
      sortOrder: 3,
    },
    paypal: {
      enabled: false,
      displayName: "PayPal",
      description: "",
      sortOrder: 4,
    },
    bankTransfer: {
      enabled: false,
      displayName: "Bank Transfer",
      description: "",
      sortOrder: 5,
    },
  },
  notifications: {
    provider: "none",
    senderEmail: "",
    senderName: "Serious Flux",
    replyTo: "",
    adminEmail: "demo@seriousflux.dev",
    enableCustomerEmails: false,
    enableAdminEmails: false,
    enableWelcomeEmail: false,
  },
  inventory: {
    defaultTrackInventory: true,
    defaultLowStockThreshold: 5,
    defaultAllowBackorders: false,
    hideOutOfStockProducts: false,
    showRemainingStock: true,
  },
  hero: {
    title: "Serious Flux",
    subtitle:
      "Demo catalog for the reusable ecommerce starter. Explore products, cart, checkout, and admin — then swap this data for your client.",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80",
    ctaText: "Shop the demo",
    ctaHref: "/#featured",
  },
};

export async function seedSettings(): Promise<void> {
  const { db, projectId } = initSeedFirestore();

  console.log(`Seeding settings/general into project: ${projectId}`);
  console.log(`  Store: ${SEED_SETTINGS.storeName}`);
  console.log(
    `  Colors: ${SEED_SETTINGS.primaryColor} / ${SEED_SETTINGS.secondaryColor}`,
  );

  const ref = doc(db, "settings", "general");
  const existing = await getDoc(ref);

  await setDoc(
    ref,
    {
      ...SEED_SETTINGS,
      updatedAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );

  console.log("  ✓ settings/general");
  console.log("Settings seed complete.");
}

const invokedDirectly = /seed-settings(\.ts)?$/i.test(
  (process.argv[1] ?? "").replace(/\\/g, "/"),
);

if (invokedDirectly) {
  seedSettings().catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}
