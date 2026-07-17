import type { Timestamp } from "firebase/firestore";

/**
 * Customer role within the storefront.
 * Admin access is modeled here for v1; can move to custom claims later.
 */
export type CustomerRole = "customer" | "admin";

/**
 * Shipping / billing address owned by a customer.
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
 * Customer profile document.
 *
 * Collection: `customers` (Firestore collection name is unchanged).
 *
 * Named `CustomerProfile` (not `Customer`) to distinguish the domain
 * profile document from a generic "customer" concept in UI copy.
 *
 * Document id should match the Firebase Authentication `uid` so auth and
 * profile data stay 1:1 without an extra lookup field.
 */
export interface CustomerProfile {
  /** Firestore document id — same as Firebase Auth uid. */
  id: string;

  email: string;

  /** Public display name. */
  displayName: string;

  phone?: string;

  /** Optional avatar URL or Storage path. */
  photoUrl?: string;

  role: CustomerRole;

  /** Saved addresses for checkout. */
  addresses: CustomerAddress[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
