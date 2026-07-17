/**
 * Checkout domain types (RFC-013).
 */

export type CheckoutShippingMethod = {
  id: string;
  label: string;
  cost: number;
};

/** Narrow settings bag passed into Checkout — avoids StoreSettings coupling. */
export type CheckoutSettingsProps = {
  currency: string;
  locale: string;
  country: string;
  shippingEnabled: boolean;
};

export type CheckoutFormValues = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingMethodId: string;
};
