# ADR-001: Design System Foundation

**Status:** Accepted  
**Date:** 2026-07-17  
**RFC:** RFC-005  
**Context:** Serious Flux Ecommerce Starter Kit

---

## Decision

Introduce a reusable Design System under `src/shared/design` (tokens) and `src/shared/ui` (primitives).

This layer owns visual primitives only. It does not own storefront pages, product UI, admin UI, or business logic.

---

## Why a Design System now

Serious Flux is a multi-client starter kit, not a single store.

Without a shared UI foundation:

- Every client project reinvents buttons, inputs, empty states, and surfaces.
- Spacing, radius, and motion drift across features.
- Rebranding becomes a search-and-replace problem instead of a token/settings change.
- Feature teams start encoding ecommerce meaning into base components (`ProductCard`, `PriceBadge`), which blocks reuse.

We introduce the Design System **before** catalog, cart, and admin UI so those features compose shared primitives instead of inventing their own.

Colors are intentionally deferred. Brand colors will come from `StoreSettings` in a later RFC. Tokens in this ADR cover structure and rhythm only.

---

## Why shared UI lives outside feature folders

Feature folders (`features/products`, `features/orders`, …) own domain behavior.

Shared UI belongs in `src/shared/ui` because:

1. **Reuse across features** — Button, Input, and EmptyState appear in storefront, checkout, and admin. Feature-owned UI creates duplication or awkward cross-feature imports.
2. **Dependency direction** — Features may depend on shared UI. Shared UI must never depend on features. That keeps the kit composable.
3. **Client customization boundary** — Agency work should change tokens and settings first. Feature folders stay focused on commerce rules.
4. **Clear ownership** — Visual language has one home. Domain models have another.

`src/shared/components` may continue to hold layout-oriented building blocks (Container, Section). `src/shared/ui` is the Design System primitive layer introduced by this RFC. Existing components are not replaced in RFC-005.

---

## Why components stay business-agnostic

Every Design System component must answer: *“Could this be used outside ecommerce?”*

If the answer is no, it does not belong here.

| Belongs in Design System | Belongs in a feature |
| ------------------------ | -------------------- |
| Button                   | AddToCartButton      |
| Card                     | ProductCard          |
| Badge                    | OrderStatusBadge     |
| Input                    | CouponCodeField      |
| EmptyState               | EmptyCart            |
| LoadingState             | ProductGridSkeleton  |

Business-agnostic primitives keep the kit portable. Domain wrappers can compose them later without forking the foundation.

---

## Expected long-term benefits

1. **Faster client delivery** — New stores start with a consistent primitive set.
2. **Safer rebranding** — Structural tokens + future StoreSettings colors reduce one-off CSS.
3. **Lower UI debt** — One Button/Input contract instead of N local variants.
4. **Cleaner architecture** — Features stay domain-focused; shared UI stays presentation-focused.
5. **Predictable growth** — New primitives extend the system deliberately (new RFC), not ad hoc inside pages.

---

## Scope of RFC-005

**In scope**

- ADR-001
- Design tokens (no colors)
- Primitives: Button, Card, Badge, Input, EmptyState, LoadingState

**Out of scope**

- Firestore changes
- Pages or routes
- Business logic / services
- Product or admin components
- Application restyle or replacement of existing components
- Color tokens (deferred to StoreSettings-driven theming)

---

## Consequences

- Feature work after RFC-005 should prefer `src/shared/ui` primitives for new UI.
- Existing storefront components remain untouched until a dedicated migration RFC.
- Color theming must not hardcode brand values into these primitives; use semantic CSS variables until the color RFC lands.

---

## Explicitly rejected

- Putting Design System components under `features/*`
- Encoding product/order/checkout semantics into shared primitives
- Adding a full component library beyond the listed set in this RFC
- Introducing color tokens before StoreSettings-driven theming is designed
