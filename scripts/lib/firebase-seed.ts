/**
 * Shared Firebase + env helpers for Firestore seed scripts.
 * Client SDK only — assumes open rules or admin-allowed writes in early dev.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

/** Minimal `.env.local` loader so scripts need no dotenv dependency. */
export function loadEnvLocal(): void {
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

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export type SeedFirestore = {
  app: FirebaseApp;
  db: Firestore;
  projectId: string;
};

/** Load env and return an initialized Firestore client. */
export function initSeedFirestore(): SeedFirestore {
  loadEnvLocal();

  const projectId = requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");

  const app = initializeApp({
    apiKey: requireEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: requireEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId,
    storageBucket: requireEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: requireEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: requireEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
  });

  return { app, db: getFirestore(app), projectId };
}
