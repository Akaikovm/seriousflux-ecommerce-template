import "server-only";

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Firebase Admin SDK (GAP-004).
 *
 * Server-only privileged access that bypasses Security Rules.
 * Used by Mercado Pago webhook/preference, Admin SSR loaders, and
 * notification authorize reads — never import from Client Components.
 *
 * Credential resolution (first match wins):
 * 1. `FIREBASE_SERVICE_ACCOUNT_KEY` — JSON string of a service account
 * 2. `GOOGLE_APPLICATION_CREDENTIALS` — ADC via file path (set by environment)
 * 3. Application Default Credentials + `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
 *    (Firebase App Hosting / GCP)
 */

const SERVICE_ACCOUNT_ENV = "FIREBASE_SERVICE_ACCOUNT_KEY";

let adminApp: App | undefined;
let initAttempted = false;
let initError: Error | undefined;

function parseServiceAccountKey(raw: string): ServiceAccount {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const projectId =
    typeof parsed.project_id === "string"
      ? parsed.project_id
      : typeof parsed.projectId === "string"
        ? parsed.projectId
        : undefined;
  const clientEmail =
    typeof parsed.client_email === "string"
      ? parsed.client_email
      : typeof parsed.clientEmail === "string"
        ? parsed.clientEmail
        : undefined;
  const privateKeyRaw =
    typeof parsed.private_key === "string"
      ? parsed.private_key
      : typeof parsed.privateKey === "string"
        ? parsed.privateKey
        : undefined;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY must include project_id, client_email, and private_key.",
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
  };
}

function tryInitializeAdminApp(): App | undefined {
  if (adminApp) {
    return adminApp;
  }

  const existing = getApps()[0];
  if (existing) {
    adminApp = existing;
    return adminApp;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const storageBucket =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || undefined;
  const keyJson = process.env[SERVICE_ACCOUNT_ENV]?.trim();

  try {
    if (keyJson) {
      const serviceAccount = parseServiceAccountKey(keyJson);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.projectId ?? projectId ?? undefined,
        ...(storageBucket ? { storageBucket } : {}),
      });
      return adminApp;
    }

    // GOOGLE_APPLICATION_CREDENTIALS or GCP metadata / App Hosting ADC
    adminApp = initializeApp({
      credential: applicationDefault(),
      ...(projectId ? { projectId } : {}),
      ...(storageBucket ? { storageBucket } : {}),
    });
    return adminApp;
  } catch (error) {
    initError =
      error instanceof Error
        ? error
        : new Error("Failed to initialize Firebase Admin SDK.");
    return undefined;
  }
}

/**
 * Returns true when Admin SDK initialized successfully in this process.
 */
export function isFirebaseAdminConfigured(): boolean {
  if (!initAttempted) {
    initAttempted = true;
    tryInitializeAdminApp();
  }
  return adminApp !== undefined;
}

/**
 * Returns the Firebase Admin app. Throws if credentials are missing/invalid.
 */
export function getAdminApp(): App {
  if (!initAttempted) {
    initAttempted = true;
    tryInitializeAdminApp();
  }

  if (!adminApp) {
    throw new Error(
      initError?.message ??
        "Firebase Admin SDK is not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY (JSON) or GOOGLE_APPLICATION_CREDENTIALS, or run on App Hosting with ADC.",
    );
  }

  return adminApp;
}

/**
 * Privileged Firestore (bypasses Security Rules). Server-only.
 */
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

/**
 * Privileged Auth (verify ID tokens / session cookies). Server-only.
 */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/**
 * Privileged Storage (bypasses Security Rules). Server-only.
 * Requires `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` on Admin app init.
 */
export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}
