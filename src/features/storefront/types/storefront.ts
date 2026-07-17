/**
 * Presentational types for the storefront shell (RFC-010).
 * No Firebase. No domain services.
 */

export type StorefrontNavLink = {
  label: string;
  href: string;
};

export type BrandValueItem = {
  title: string;
  description: string;
  /** Lucide icon name key resolved by BrandValues — keep serializable. */
  icon: "truck" | "shield" | "sparkles" | "heart" | "package";
};

export type NewsletterCopy = {
  title: string;
  subtitle: string;
  placeholder: string;
  ctaText: string;
  successMessage: string;
};
