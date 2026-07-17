/**
 * Seed catalog data into Firestore (RFC-007 products + required categories).
 *
 * Idempotent: uses stable document ids (slug / category id) via setDoc.
 *
 * Usage:
 *   npm run seed:products
 *
 * Requires `.env.local` with NEXT_PUBLIC_FIREBASE_* values.
 * Firestore security rules must allow these writes (open rules in early
 * development, or run while authenticated as an admin later).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { initializeApp } from "firebase/app";
import { doc, getFirestore, setDoc } from "firebase/firestore";

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
};

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

const SEED_CATEGORIES: SeedCategory[] = [
  {
    id: "camisas",
    name: "Camisas",
    slug: "camisas",
    description: "Camisetas y kits de fútbol.",
    image:
      "https://images.unsplash.com/photo-1671016233853-5db7def7ff76?w=800&q=80",
    featured: true,
    active: true,
    order: 1,
  },
  {
    id: "pantalones",
    name: "Pantalones",
    slug: "pantalones",
    description: "Shorts y pantalones de juego.",
    image:
      "https://images.unsplash.com/photo-1605400948609-6023886f4cc0?w=800&q=80",
    featured: true,
    active: true,
    order: 2,
  },
];

const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: "camisa-oxford-blanca",
    name: "Camisa Oxford Blanca",
    slug: "camisa-oxford-blanca",
    description:
      "Camiseta de fútbol blanca, corte clásico. Ideal para local o entrenamiento.",
    // Argentina-style white football jersey (Unsplash)
    image:
      "https://images.unsplash.com/photo-1671016233853-5db7def7ff76?w=800&q=80",
    price: 45900,
    currency: "ARS",
    categoryId: "camisas",
    featured: true,
    active: true,
    order: 1,
  },
  {
    id: "camisa-negra-premium",
    name: "Camisa Negra Premium",
    slug: "camisa-negra-premium",
    description:
      "Camiseta de fútbol premium. Tela liviana y acabado de competencia.",
    // Hanging Nike football jersey — product-style shot (Unsplash)
    image:
      "https://images.unsplash.com/photo-1552066379-e7bfd22155c5?w=800&q=80",
    price: 52900,
    currency: "ARS",
    categoryId: "camisas",
    featured: true,
    active: true,
    order: 2,
  },
  {
    id: "pantalon-chino-beige",
    name: "Pantalón Chino Beige",
    slug: "pantalon-chino-beige",
    description:
      "Short de juego / entrenamiento. Corte cómodo para el partido completo.",
    // Players in kit shorts on the pitch (Unsplash)
    image:
      "https://images.unsplash.com/photo-1605400948609-6023886f4cc0?w=800&q=80",
    price: 48900,
    currency: "ARS",
    categoryId: "pantalones",
    featured: true,
    active: true,
    order: 3,
  },
];

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

  console.log(`Seeding catalog into project: ${requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID")}`);

  for (const category of SEED_CATEGORIES) {
    const { id, ...data } = category;
    await setDoc(doc(db, "categories", id), data, { merge: true });
    console.log(`  ✓ categories/${id}`);
  }

  for (const product of SEED_PRODUCTS) {
    const { id, ...data } = product;
    await setDoc(doc(db, "products", id), data, { merge: true });
    console.log(`  ✓ products/${id}`);
  }

  console.log("Seed complete.");
}

seed().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
