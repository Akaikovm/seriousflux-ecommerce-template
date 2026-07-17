/**
 * Seed store settings into Firestore (`settings/general`).
 *
 * Idempotent: merges into the singleton general document.
 *
 * Usage:
 *   npm run seed:settings
 *
 * Requires `.env.local` with NEXT_PUBLIC_FIREBASE_* values.
 * Firestore security rules must allow these writes (open rules in early
 * development, or run while authenticated as an admin later).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { initializeApp } from "firebase/app";
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";

/** Minimal `.env.local` loader so the script needs no extra dependencies. */
function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  const content = readFileSync(envPath, "utf8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

/**
 * The Casacas Club — premium football / soccer retail theme.
 *
 * Palette: deep pitch green + championship gold.
 * Imagery: Unsplash stadium / kit photography (public URLs).
 */
const SEED_SETTINGS = {
  storeName: "The Casacas Club",
  tagline: "Casacas con alma de cancha",
  description:
    "Camisetas, shorts y kits de fútbol seleccionados para quienes viven el juego dentro y fuera de la cancha. Calidad de club, estilo de siempre.",
  // Official Casacas Club wordmark (do not replace with stock imagery)
  logo: "https://media.discordapp.net/attachments/278283383748952084/1527482861836435486/image.png?ex=6a5ad2c5&is=6a598145&hm=dfab3365e1a48cb629e2ddf919b9e874fadb130be8d0526b62b959377066b48e&=&format=webp&quality=lossless",
  favicon: "https://media.discordapp.net/attachments/278283383748952084/1527482861836435486/image.png?ex=6a5ad2c5&is=6a598145&hm=dfab3365e1a48cb629e2ddf919b9e874fadb130be8d0526b62b959377066b48e&=&format=webp&quality=lossless",
  // Deep pitch green (primary CTAs, navbar weight)
  primaryColor: "#0B1F17",
  // Championship gold (accents, link hovers)
  secondaryColor: "#C9A84C",
  currency: "ARS",
  locale: "es-AR",
  language: "es",
  country: "AR",
  email: "hola@thecasacas.club",
  phone: "+54 11 5555-1902",
  whatsapp: "+5491155551902",
  instagram: "https://instagram.com/thecasacasclub",
  facebook: "https://facebook.com/thecasacasclub",
  tiktok: "",
  youtube: "https://youtube.com/@thecasacasclub",
  address: "Buenos Aires, Argentina",
  shippingEnabled: true,
  maintenanceMode: false,
  hero: {
    title: "The Casacas Club",
    subtitle:
      "La camiseta que te representa. Kits premium inspirados en la pasión del fútbol.",
    // Full-bleed stadium / match night atmosphere
    image:
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1920&q=80",
    ctaText: "Ver colección",
    ctaHref: "/#featured",
  },
};

async function seed(): Promise<void> {
  loadEnvLocal();

  const app = initializeApp({
    apiKey: requireEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: requireEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: requireEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: requireEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: requireEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
  });

  const db = getFirestore(app);
  const projectId = requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");

  console.log(`Seeding settings/general into project: ${projectId}`);
  console.log(`  Store: ${SEED_SETTINGS.storeName}`);
  console.log(`  Colors: ${SEED_SETTINGS.primaryColor} / ${SEED_SETTINGS.secondaryColor}`);

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
  console.log("Seed complete. Reload the storefront to see The Casacas Club.");
}

seed().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
