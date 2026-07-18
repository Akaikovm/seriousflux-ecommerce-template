/** Allowed fields when updating a customer profile (RFC-018). */
export type AccountProfileUpdateInput = {
  displayName: string;
  photoURL?: string | null;
  phone?: string;
};
