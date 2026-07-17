# ADR-009: Shopping Cart

**Status:** Proposed  
**Date:** 2026-07-17  
**RFC:** RFC-013  
**Context:** Serious Flux Ecommerce Starter Kit

---

## Decision

The Shopping Cart is a **client-owned feature** under `src/features/cart`.

| Concern | Owner |
| ------- | ----- |
| Cart state + mutations | `CartStore` (Zustand) |
| Persistence | `localStorage` via Zustand `persist` |
| Cart UI | `features/cart/components/*` |
| Route composition | `app/(storefront)/cart/page.tsx` |
| Badge entry point | `CartLink` composed into storefront `Navbar` |

**Not used for cart in this RFC:**

- `CartService` (no remote cart collection)
- Firestore cart documents
- Cookies as the primary cart store
- React Context as the cart state container
- Checkout, Orders, Payments, or customer Authentication

Cart is the **single source of truth for pre-checkout line items**. Checkout (a later RFC) will read from the same store (or a thin selector/export API) and create Orders — it will not invent a parallel cart model.

---

## Context from the current codebase

Inspection before this ADR found that a cart vertical already exists in tree (previously labeled RFC-009 in code comments), including:

- Types (`CartItem`, `AddToCartInput`)
- Zustand store with add / remove / update quantity / clear + localStorage persist
- UI: `AddToCartButton`, `CartView`, `CartItem`, `CartSummary`, `CartEmpty`, `CartLink`
- Route `/cart`
- Navbar badge wiring
- PDP integration via `ProductInfo` → `AddToCartButton`

RFC-013 / ADR-009 **formalize and complete** that direction: lock architecture, close gaps (e.g. clear-cart UX, feature ownership polish, RFC numbering), and define how Checkout will consume the cart later.

**RFC numbering note:** ADR-008’s stop-line previously reserved “RFC-013” for Orders / Checkout / Payments. That label is superseded: **RFC-013 is Shopping Cart**. Orders / Checkout / Payments remain a later RFC and should receive a new number when started.

---

## Why this architecture was chosen

### Feature ownership (“every feature owns itself”)

Starting with RFC-013, domain code lives inside its feature:

```
features/cart/
  components/
  hooks/
  store/          # client state for this domain (not a shared global store folder)
  types/
  utils/          # optional pure helpers (line identity, totals) when extracted
```

Shared layers stay generic only:

- `shared/ui` — Button, Badge, EmptyState, …
- `shared/design` — tokens
- `shared/components` — Container, Section
- `shared/lib` / `lib` — truly cross-cutting helpers (e.g. `formatPrice`)

**Why:** Serious Flux is a multi-client starter kit. Feature folders keep cart, products, checkout, and orders independently evolvable. Cross-feature imports are allowed only at composition boundaries (PDP uses `AddToCartButton`; Navbar uses `CartLink`; Checkout will import cart selectors — not the reverse).

### CartStore, not CartService

Domain **services** in this project (`ProductService`, `CategoryService`, `StoreSettingsService`) own **Firestore** access, mapping, and error boundaries.

The cart in RFC-013 has:

- No Firestore collection
- No network round-trips
- Synchronous mutations
- Browser-local persistence

A `CartService` class would be an empty façade over in-memory rules, or would incorrectly imply a backend. **Zustand `CartStore` is the right abstraction**: it owns state, actions, selectors, and persist middleware in one place, matching the stack already declared in `AGENTS.md` (Zustand for client state).

Optional later refinement (not required to ship RFC-013): extract **pure** functions (`mergeCartItem`, `cartSubtotal`) into `features/cart/utils` so the store stays a thin adapter and unit tests do not need Zustand. That is still not a Firebase-style `CartService`.

### Why the cart lives on the client

1. **Guest-first commerce** — No authentication in this RFC. A server cart requires a user id or anonymous session id; that belongs with Checkout / Auth.
2. **Latency** — Add / update / remove must feel instant on PDP and cart page.
3. **SSR model** — Catalog pages are server-rendered via services. Cart is inherently browser-private; forcing it through RSC would add hydration complexity without product value.
4. **Checkout handoff** — When Checkout lands, it can still *read* client cart state, then write an Order to Firestore. Persistence of *purchases* is Orders — not Cart.

Server Components remain composition roots for `/cart` (load `StoreSettings` for locale/currency; render client `CartView`).

### Why localStorage (only)

| Option | Verdict for RFC-013 |
| ------ | ------------------- |
| **localStorage** | **Chosen.** Survives refresh; works offline for browsing; pairs with Zustand `persist`; no auth required; no Firestore cost/rules. |
| Cookies | Useful if middleware/SSR must read the cart. We do not need that for badge or cart page (client islands + hydration gate). Cookies add size limits and request payload on every navigation. |
| Firestore | Correct for **Orders** and optional future “synced cart for logged-in users”. Premature without Auth; adds security rules, cost, and offline conflict handling. |

**Recommendation:** localStorage only. A future “merge guest cart into customer cart after login” RFC can add Firestore *in addition*, not as a replacement of the guest store.

Storage key: `seriousflux-cart` (already used). Persist **items only** (`partialize`), not action functions.

---

## Cart page vs drawer

**Recommendation: dedicated `/cart` page (already in place).**

| | Page | Drawer |
| - | ---- | ------ |
| Review UX | Full width for lines + summary | Cramped on mobile for quantity edits |
| Checkout path | Natural full-page step before checkout | Still needs a destination page for checkout |
| Deep link / refresh | Stable URL | State often lost or awkward |
| Accessibility | Standard document flow | Focus trap / overlay complexity |
| Navbar | Icon → `/cart` | Icon toggles panel |

A **mini-cart drawer** may be added later as an optional UX enhancement; it must read the same `CartStore`. It is out of scope for RFC-013.

---

## Product page integration (no tight coupling)

### Current catalog reality (RFC-007)

`Product` has **no** size, color, or stock fields. `ProductSize` / `ProductColor` exist only as reserved types for future variants and for `OrderItem` snapshots.

PDP has a hidden `data-product-variants` zone and no quantity stepper before add (default quantity `1`).

### Integration contract

1. **Products own selection UI** (future: size, color, quantity steppers) inside `features/products`.
2. **Cart owns the mutation API** via `AddToCartInput` / `addItem`.
3. **Bridge:** `AddToCartButton` (cart feature) accepts a **snapshot payload**, not a `Product` entity. `ProductInfo` maps product fields → payload.

```
ProductDetail (products)
  └── ProductInfo (products)  — owns local selection state when variants exist
        └── AddToCartButton (cart)  — calls CartStore.addItem(snapshot)
```

Cart must not import `ProductService` or Firestore. Products must not import `CartStore` internals — only the public button (or a thin `addToCart` hook exported from cart).

### Line identity (important for variants later)

Today lines merge by `productId` only. When variants ship, line identity must become something like:

`productId + selectedSize + selectedColor.hex` (or a future `variantId` / SKU).

RFC-013 should **document** that extension point; implementing variant fields on `CartItem` is optional if Product still has no selectors. Prefer adding optional `selectedSize` / `selectedColor` on `CartItem` only when PDP can set them — otherwise leave a clear TODO in types/ADR so Checkout/`OrderItem` mapping stays coherent.

---

## State management choice

| Approach | Trade-off |
| -------- | --------- |
| **Zustand + persist (chosen)** | Already a project dependency; selectors avoid broad re-renders; persist middleware solves localStorage; no Provider tree required; fits “client commerce state”. |
| React Context | Easy to over-render; persistence and SSR hydration are custom; duplicates what Zustand already provides. |
| Local component state | Cannot share badge + PDP + cart page. |
| Redux / other | Unnecessary weight for one aggregate. |

Hydration: `useCartHydrated` (`useSyncExternalStore` + `persist.onFinishHydration`) keeps SSR and first client paint free of badge/count mismatches.

---

## How Checkout will consume the cart later

Out of scope for RFC-013, but the contract is:

1. Checkout UI lives in `features/checkout`.
2. It **reads** `useCartStore` / selectors (`items`, `selectCartSubtotal`, currency from snapshots or StoreSettings).
3. On successful order creation, Checkout calls **`clearCart()`**.
4. Order line items are **new snapshots** written to Firestore (`OrderItem`), mapped from `CartItem` (+ customer, shipping, payment). Cart snapshots are not Order documents.
5. Price/stock validation at checkout time may re-fetch `ProductService` — cart prices are display snapshots, not a trust boundary for charging.

Disabled “Checkout” CTA on `CartSummary` remains a placeholder until that RFC.

---

## Scope of RFC-013

**In scope**

- Add / remove / update quantity / clear cart
- Persist cart (localStorage)
- Cart badge (`CartLink`)
- Cart summary + empty state
- Cart page (`/cart`)
- PDP add-to-cart without coupling Product ↔ CartStore internals
- Feature-owned folder structure under `features/cart`
- This ADR

**Out of scope**

- Checkout, Orders, Payments
- Authentication / synced server carts
- Coupons, tax, shipping calculation
- Inventory reservation
- Product variants (size/color) implementation
- Cart drawer / mini-cart

---

## Consequences

- Cart is client-only; admins cannot inspect guest carts in Firestore.
- Stale prices/images possible until checkout revalidation — acceptable for v1.
- `features/storefront` may depend on `features/cart` for `CartLink` (composition).
- `features/products` may depend on `features/cart` for `AddToCartButton` (composition).
- `features/cart` must not depend on checkout, orders, or admin.
- ADR-008 stop-line wording should be updated when RFC-013 is accepted so “RFC-013” no longer means Orders/Checkout.

---

## Success criteria

1. Guest can add a product from PDP and see badge count update after hydration.
2. Guest can open `/cart`, change quantities, remove lines, and clear the cart.
3. Refresh keeps cart contents (same browser profile).
4. Empty cart shows empty state with continue-shopping path.
5. Summary shows subtotal; Checkout remains disabled / deferred.
6. No Firebase reads/writes for cart state.
7. Cart code lives under `features/cart` (feature owns itself).
`)