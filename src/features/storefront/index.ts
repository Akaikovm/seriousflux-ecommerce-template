/**
 * Serious Flux storefront public surface (RFC-010).
 */

export { BrandValues, buildDefaultBrandValues } from "./components/BrandValues";
export { Footer } from "./components/Footer";
export { Hero } from "./components/Hero";
export { Navbar } from "./components/Navbar";
export { Newsletter } from "./components/Newsletter";
export { Container, Section } from "./components/Section";
export { resolveHeroContent } from "./lib/resolve-hero-content";
export type {
  BrandValueItem,
  NewsletterCopy,
  StorefrontNavLink,
} from "./types/storefront";
