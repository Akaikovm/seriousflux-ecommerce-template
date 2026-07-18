import type { Timestamp } from "firebase/firestore";

import type { PersistedRole, UserStatus } from "@/features/auth/types";

/**
 * Customer role persisted on `customers/{uid}`.
 * Re-exported from Identity (`PersistedRole`) — Firestore is source of truth (RFC-017).
 */
export type CustomerRole = PersistedRole;

/**
 * Shipping / billing address owned by a customer.
 * Address book UI is out of scope for RFC-017.
 */
export interface CustomerAddress {
  /** Local address id (UUID or short id) for selecting a saved address. */
  id: string;

  /** Recipient full name. */
  fullName: string;

  /** Street line 1. */
  line1: string;

  /** Street line 2 (apartment, floor, etc.). */
  line2?: string;

  city: string;

  /** State / province / region. */
  state: string;

  postalCode: string;

  /** ISO 3166-1 alpha-2 country code. */
  country: string;

  phone?: string;

  /** Marks the default checkout address. */
  isDefault: boolean;
}

/**
 * Customer / identity document.
 *
 * Collection: `customers` (Firestore collection name is unchanged).
 *
 * Named `CustomerProfile` (not `Customer`) to distinguish the domain
 * profile document from a generic "customer" concept in UI copy.
 *
 * Document id should match the Firebase Authentication `uid` so auth and
 * profile data stay 1:1 without an extra lookup field.
 *
 * RFC-017 bootstraps identity fields (email, displayName, photoURL, role,
 * status). RFC-018 Account owns profile product reads/updates (displayName,
 * photoURL, phone) via AccountService — never from UI directly.
 */
export interface CustomerProfile {
  /** Firestore document id — same as Firebase Auth uid. */
  id: string;

  email: string;

  /** Public display name. */
  displayName: string;

  phone?: string;

  /** Optional avatar URL or Storage path (Firebase Auth naming). */
  photoURL?: string | null;

  role: CustomerRole;

  /** Account lifecycle — inactive admin/staff cannot access Admin. */
  status: UserStatus;

  /**
   * Saved addresses for checkout.
   * Always `[]` until Address book is implemented.
   */
  addresses: CustomerAddress[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
