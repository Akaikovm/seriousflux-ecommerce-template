import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  type DocumentData,
  type Firestore,
  type FirestoreError,
} from "firebase/firestore";

import { getFirestoreDb } from "@/firebase/firestore";
import {
  DEFAULT_NOTIFICATIONS_SETTINGS,
  mapNotificationsSettings,
} from "@/features/notifications/lib/default-notifications-settings";
import {
  DEFAULT_PAYMENT_PROVIDERS,
  mapPaymentProvidersConfig,
  paymentProvidersFromLegacyFlags,
  resolvePaymentProvidersConfig,
  toLegacyEnabledPaymentMethods,
} from "@/features/payments/lib/resolve-enabled-payment-methods";
import type {
  EnabledPaymentMethods,
  NotificationsSettings,
  PaymentProvidersConfig,
  StoreSettings,
  StoreSettingsUpdateInput,
} from "@/features/settings/types";

/** Firestore collection that holds store configuration documents. */
export const SETTINGS_COLLECTION = "settings";

/** Singleton document id for general store identity / branding. */
export const SETTINGS_GENERAL_DOC_ID = "general";

/**
 * Domain error for store settings reads and writes.
 * Wraps Firebase failures so UI and callers never depend on Firebase error shapes.
 */
export class StoreSettingsError extends Error {
  readonly code: "unavailable" | "permission-denied" | "unknown";

  constructor(
    message: string,
    code: StoreSettingsError["code"] = "unknown",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "StoreSettingsError";
    this.code = code;
  }
}

/**
 * Sensible defaults when `settings/general` is missing or partially empty.
 * Keeps the storefront bootable before an admin seeds Firestore.
 */
export function getDefaultStoreSettings(
  now: Timestamp = Timestamp.now(),
): StoreSettings {
  const paymentProviders = mapPaymentProvidersConfig(
    undefined,
    DEFAULT_PAYMENT_PROVIDERS,
  );

  return {
    storeName: "Serious Flux",
    tagline: "",
    description: "",
    logo: "",
    favicon: "",
    primaryColor: "#0A0A0A",
    secondaryColor: "#E10600",
    currency: "ARS",
    locale: "es-AR",
    language: "es",
    country: "AR",
    email: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
    address: "",
    shippingEnabled: true,
    maintenanceMode: false,
    paymentProviders,
    enabledPaymentMethods: toLegacyEnabledPaymentMethods(paymentProviders),
    notifications: { ...DEFAULT_NOTIFICATIONS_SETTINGS },
    createdAt: now,
    updatedAt: now,
  };
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function mapLegacyEnabledPaymentMethods(
  raw: unknown,
): EnabledPaymentMethods | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const data = raw as Record<string, unknown>;
  return {
    mercadopago: asBoolean(data.mercadopago, true),
    cashOnDelivery: asBoolean(data.cashOnDelivery, true),
  };
}

/**
 * Resolves paymentProviders from Firestore, with RFC-015 backward compatibility.
 */
function resolveMappedPaymentProviders(data: DocumentData): {
  paymentProviders: PaymentProvidersConfig;
  enabledPaymentMethods: EnabledPaymentMethods;
} {
  if (data.paymentProviders && typeof data.paymentProviders === "object") {
    const paymentProviders = mapPaymentProvidersConfig(data.paymentProviders);
    return {
      paymentProviders,
      enabledPaymentMethods: toLegacyEnabledPaymentMethods(paymentProviders),
    };
  }

  const legacy = mapLegacyEnabledPaymentMethods(data.enabledPaymentMethods);
  if (legacy) {
    const paymentProviders = paymentProvidersFromLegacyFlags(legacy);
    return {
      paymentProviders,
      enabledPaymentMethods: legacy,
    };
  }

  const paymentProviders = mapPaymentProvidersConfig(
    undefined,
    DEFAULT_PAYMENT_PROVIDERS,
  );
  return {
    paymentProviders,
    enabledPaymentMethods: toLegacyEnabledPaymentMethods(paymentProviders),
  };
}

function asTimestamp(value: unknown, fallback: Timestamp): Timestamp {
  if (value instanceof Timestamp) {
    return value;
  }

  return fallback;
}

/**
 * Maps raw Firestore data onto `StoreSettings`, filling gaps with defaults.
 * Tolerates partial documents so early seed data still loads safely.
 */
export function mapStoreSettings(
  data: DocumentData | undefined,
  defaults: StoreSettings = getDefaultStoreSettings(),
): StoreSettings {
  if (!data) {
    return defaults;
  }

  const heroRaw =
    data.hero && typeof data.hero === "object"
      ? (data.hero as DocumentData)
      : undefined;

  const hero = heroRaw
    ? {
        title: asString(heroRaw.title, ""),
        subtitle: asString(heroRaw.subtitle, ""),
        image: asString(heroRaw.image, ""),
        ctaText: asString(heroRaw.ctaText, ""),
        ctaHref: asString(heroRaw.ctaHref, ""),
      }
    : defaults.hero;

  const { paymentProviders, enabledPaymentMethods } =
    resolveMappedPaymentProviders(data);

  const notifications: NotificationsSettings = mapNotificationsSettings(
    data.notifications,
    defaults.notifications ?? DEFAULT_NOTIFICATIONS_SETTINGS,
  );

  return {
    storeName: asString(data.storeName, defaults.storeName),
    tagline: asString(data.tagline, defaults.tagline),
    description: asString(data.description, defaults.description),
    logo: asString(data.logo, defaults.logo),
    favicon: asString(data.favicon, defaults.favicon),
    primaryColor: asString(data.primaryColor, defaults.primaryColor),
    secondaryColor: asString(data.secondaryColor, defaults.secondaryColor),
    currency: asString(data.currency, defaults.currency),
    locale: asString(data.locale, defaults.locale),
    language: asString(data.language, defaults.language),
    country: asString(data.country, defaults.country),
    email: asString(data.email, defaults.email),
    phone: asString(data.phone, defaults.phone),
    whatsapp: asString(data.whatsapp, defaults.whatsapp),
    instagram: asString(data.instagram, defaults.instagram),
    facebook: asString(data.facebook, defaults.facebook),
    tiktok: asString(data.tiktok, defaults.tiktok),
    youtube: asString(data.youtube, defaults.youtube),
    address: asString(data.address, defaults.address),
    shippingEnabled: asBoolean(data.shippingEnabled, defaults.shippingEnabled),
    maintenanceMode: asBoolean(data.maintenanceMode, defaults.maintenanceMode),
    paymentProviders,
    enabledPaymentMethods,
    notifications,
    hero,
    createdAt: asTimestamp(data.createdAt, defaults.createdAt),
    updatedAt: asTimestamp(data.updatedAt, defaults.updatedAt),
  };
}

function toStoreSettingsError(error: unknown): StoreSettingsError {
  if (error instanceof StoreSettingsError) {
    return error;
  }

  const firestoreError = error as FirestoreError | undefined;
  const firebaseCode = firestoreError?.code;

  if (firebaseCode === "permission-denied") {
    return new StoreSettingsError(
      "You do not have permission to access store settings.",
      "permission-denied",
      { cause: error },
    );
  }

  if (
    firebaseCode === "unavailable" ||
    firebaseCode === "deadline-exceeded" ||
    firebaseCode === "resource-exhausted"
  ) {
    return new StoreSettingsError(
      "Store settings are temporarily unavailable. Please try again.",
      "unavailable",
      { cause: error },
    );
  }

  return new StoreSettingsError(
    "Failed to access store settings.",
    "unknown",
    { cause: error },
  );
}

function normalizePaymentFields(
  input: StoreSettingsUpdateInput,
  current: StoreSettings,
): {
  paymentProviders: PaymentProvidersConfig;
  enabledPaymentMethods: EnabledPaymentMethods;
} {
  if (input.paymentProviders !== undefined) {
    const paymentProviders = mapPaymentProvidersConfig(input.paymentProviders);
    return {
      paymentProviders,
      enabledPaymentMethods: toLegacyEnabledPaymentMethods(paymentProviders),
    };
  }

  if (input.enabledPaymentMethods !== undefined) {
    const paymentProviders = paymentProvidersFromLegacyFlags(
      input.enabledPaymentMethods,
      resolvePaymentProvidersConfig(current),
    );
    return {
      paymentProviders,
      enabledPaymentMethods: input.enabledPaymentMethods,
    };
  }

  const paymentProviders = resolvePaymentProvidersConfig(current);
  return {
    paymentProviders,
    enabledPaymentMethods:
      current.enabledPaymentMethods ??
      toLegacyEnabledPaymentMethods(paymentProviders),
  };
}

/**
 * Access to `settings/general`.
 *
 * Framework-agnostic: no React, hooks, context or UI.
 * Callers (server components, API routes, future hooks) all share this service.
 */
export class StoreSettingsService {
  constructor(private readonly db: Firestore = getFirestoreDb()) {}

  /**
   * Loads store configuration from Firestore.
   * Returns defaults when the document does not exist.
   *
   * @throws {StoreSettingsError} on Firestore failures (never raw Firebase errors).
   */
  async getGeneralSettings(): Promise<StoreSettings> {
    try {
      const ref = doc(this.db, SETTINGS_COLLECTION, SETTINGS_GENERAL_DOC_ID);
      const snapshot = await getDoc(ref);

      if (!snapshot.exists()) {
        return getDefaultStoreSettings();
      }

      return mapStoreSettings(snapshot.data());
    } catch (error) {
      throw toStoreSettingsError(error);
    }
  }

  /**
   * Merge-update `settings/general` and return the resolved settings (RFC-011).
   * Creates the document with defaults when it does not exist yet.
   *
   * @throws {StoreSettingsError} on Firestore failures (never raw Firebase errors).
   */
  async updateGeneralSettings(
    input: StoreSettingsUpdateInput,
  ): Promise<StoreSettings> {
    try {
      const ref = doc(this.db, SETTINGS_COLLECTION, SETTINGS_GENERAL_DOC_ID);
      const snapshot = await getDoc(ref);
      const now = Timestamp.now();

      const current = snapshot.exists()
        ? mapStoreSettings(snapshot.data())
        : getDefaultStoreSettings(now);

      const { paymentProviders, enabledPaymentMethods } = normalizePaymentFields(
        input,
        current,
      );

      const notifications: NotificationsSettings =
        input.notifications !== undefined
          ? mapNotificationsSettings(input.notifications)
          : (current.notifications ?? { ...DEFAULT_NOTIFICATIONS_SETTINGS });

      const next: StoreSettings = {
        ...current,
        ...input,
        hero: input.hero !== undefined ? input.hero : current.hero,
        paymentProviders,
        enabledPaymentMethods,
        notifications,
        createdAt: current.createdAt,
        updatedAt: now,
      };

      const {
        createdAt,
        updatedAt,
        hero,
        paymentProviders: nextProviders,
        enabledPaymentMethods: nextLegacy,
        notifications: nextNotifications,
        ...rest
      } = next;

      await setDoc(ref, {
        ...rest,
        ...(hero ? { hero } : {}),
        ...(nextProviders ? { paymentProviders: nextProviders } : {}),
        ...(nextLegacy ? { enabledPaymentMethods: nextLegacy } : {}),
        ...(nextNotifications ? { notifications: nextNotifications } : {}),
        createdAt,
        updatedAt,
      });

      return next;
    } catch (error) {
      throw toStoreSettingsError(error);
    }
  }
}
