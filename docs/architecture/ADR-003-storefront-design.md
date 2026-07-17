# ADR-003: Storefront Design System Expansion

**Status:** Accepted  
**Date:** 2026-07-17  
**RFC:** RFC-010  
**Context:** Serious Flux Ecommerce Starter Kit

---

## Decision

Introduce a dedicated storefront presentation layer under `src/features/storefront` and expand design tokens so the public store UI can be rebranded via `StoreSettings` without rewriting components.

This RFC is design/UX only. It does not add checkout, orders, payments, or new backend services.

---

## Why a storefront feature folder

ADR-001 placed business-agnostic primitives in `src/shared/ui`. Product and category cards stay in their domain features.

The **storefront shell** (navbar, hero, footer, newsletter, brand values) is ecommerce-presentation composition shared across client deployments. It belongs in `features/storefront` so:

1. Pages compose a stable public API (`Hero`, `Navbar`, `Footer`, …).
2. Domain cards are improved in place and re-exported — no duplication.
3. Layout chrome is no longer trapped in `components/layout` with ad-hoc MVP markup.

Dependency direction:

`StoreSettings` → design tokens / CSS variables → shared UI → storefront components → pages.

---

## Why hero lives on StoreSettings

Homepage hero content (`title`, `subtitle`, `image`, `ctaText`, `ctaHref`) is brand configuration, not catalog data.

- Optional nested `hero` on `settings/general` (mapper + defaults only).
- `resolveHeroContent` always returns safe values from identity fields when hero fields are missing.
- No admin UI or seed migration required for this RFC.

---

## Why ProductCard / CategoryCard are not copied

Duplicating cards under `storefront/components` would fork styling and break the catalog feature ownership model.

RFC-010 improves the existing cards and re-exports them from `features/storefront` for a single import surface.

---

## Scope

**In scope**

- Token expansion (breakpoints, display type, semantic color *names*, motion)
- Brand CSS bridge (`--primary-foreground` contrast derivation)
- Storefront Navbar, Hero, BrandValues, Newsletter, Footer
- Homepage composition + section anchors
- Product card / category card / PDP visual polish + extension points
- ADR-003

**Out of scope**

- Checkout, orders, payments, auth
- Wishlist / quick view / discounts (slots reserved only)
- Category/catalog routes
- Newsletter email backend
- ThemeProvider / dark-mode settings toggle
- Custom font families from StoreSettings (deferred)

---

## Consequences

- `AppLayout` wires storefront `Navbar` + `Footer`.
- Future client theming should prefer StoreSettings + tokens over component edits.
- Font family customization and richer homepage CMS blocks can land in a later RFC without restructuring the shell.
