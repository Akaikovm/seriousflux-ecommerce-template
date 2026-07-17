# ADR-002: Categories Vertical Slice

**Status:** Accepted  
**Date:** 2026-07-17  
**RFC:** RFC-006  
**Context:** Serious Flux Ecommerce Starter Kit

---

## Decision

Introduce Categories as the first complete ecommerce vertical slice:

- `CategoryService` owns all Firestore access for `categories`
- Feature UI (`CategoryCard`, `CategoryGrid`) stays presentation-only
- Homepage consumes `CategoryService.getFeatured()` and passes typed data into UI

No authentication, admin, routing, or product logic in this RFC.

---

## Why Categories own their Firestore access through CategoryService

Serious Flux separates **UI**, **business/data access**, and **Firebase**.

Categories are a domain feature. Their collection path, query filters (`active`, `featured`), sort (`order`), and document mapping belong to that domain — not to pages, layouts, or shared UI.

`CategoryService` is the single owner of:

1. **Collection contract** — reads from `categories` only
2. **Query rules** — active-only; featured = `featured == true` ordered by `order` ascending
3. **Document → domain mapping** — raw Firestore fields become typed `Category` objects
4. **Error boundary** — Firebase failures become `CategoryError`, never leak SDK shapes upward

This mirrors `StoreSettingsService` (RFC-002): one service per domain collection concern, framework-agnostic, reusable from server components today and from API routes or admin later without rewriting queries.

Without a service, every screen that needs categories would re-implement filters, mapping, and error handling — breaking the starter-kit reuse goal.

---

## Why UI components never import Firebase

`CategoryCard` and `CategoryGrid` render props / arrays. They do not know where data came from.

That rule exists because:

1. **Testability** — UI can be developed and reviewed with plain objects; no Firebase emulator required for card/grid work.
2. **Swapability** — If a future client reads categories from a CMS or BFF, only the service (or a new provider behind the same interface) changes. Cards and grids stay stable.
3. **Dependency direction** — Features may depend on shared UI. UI must never depend on Firebase. Importing `firebase/firestore` inside a card would couple presentation to infrastructure and make Design System / storefront composition impossible to keep clean.
4. **Client safety** — Keeping the SDK behind the service layer makes it obvious which code runs as data access vs pure render. Homepage remains the composition root that calls the service on the server.

`CategoryGrid` receives `categories[]` and maps `CategoryCard`. Zero Firestore. That is intentional.

---

## Why Homepage consumes the service instead of querying Firestore directly

The homepage is a **composition root**, not a data-access layer.

```
HomePage (server)
  → CategoryService.getFeatured()
  → FeaturedCategories (section shell)
       → CategoryGrid
            → CategoryCard
```

Homepage calls the service because:

1. **Single responsibility** — The page assembles sections (Hero, Featured Categories, Featured Products). It should not own `collection()` / `query()` / `where()` details.
2. **Reuse** — The same `getFeatured()` / `getAll()` methods will serve nav, category landing pages, and admin later. Page-local Firestore queries would duplicate and drift.
3. **Graceful failure** — The page can catch `CategoryError` and still render Hero + Featured Products. Firestore outages must not take down the whole storefront shell.
4. **No Firebase in the home feature UI** — `FeaturedCategories` stays a presentational section: title + grid. It receives already-fetched categories.

Explicitly rejected: importing Firestore inside `page.tsx` or `FeaturedCategories.tsx`. That would short-circuit Clean Architecture and make the next feature (products) copy a bad pattern.

---

## Firestore field contract (RFC-006)

Collection: `categories`

| Field      | Type      | Role                                      |
|------------|-----------|-------------------------------------------|
| `name`     | `string`  | Display title                             |
| `slug`     | `string`  | Future URL key (no routing in this RFC)   |
| `image`    | `string`  | Category image URL                        |
| `featured` | `boolean` | Homepage / highlight eligibility          |
| `order`    | `number`  | Ascending manual sort                     |
| `active`   | `boolean` | Storefront visibility                     |

**Queries**

- `getAll()` — `active == true`, order by `order` ascending
- `getFeatured()` — `active == true` and `featured == true`, order by `order` ascending

Inactive documents never reach the UI.

> **Note vs RFC-001 naming:** The TypeScript `Category` model and Firestore docs are aligned to these field names in RFC-006 (`image` / `order` / `active` + `featured`). Earlier draft names (`imageUrl` / `sortOrder` / `isActive`) are superseded so domain types match the collection 1:1, same pattern as `StoreSettings`.

---

## Scope of RFC-006

**In scope**

- ADR-002
- `Category` type alignment + `CategoryService` (`getAll`, `getFeatured`)
- `CategoryCard`, `CategoryGrid`
- Homepage Featured Categories wired to real data

**Out of scope**

- Auth / admin CRUD
- Category routes or `Link` navigation (cards prepare for it only)
- Products, cart, checkout
- Composite index files (create in Firebase console when queries first run)
- Seed scripts

---

## Consequences

- Future catalog features must call `CategoryService` (or a later abstraction behind it), not Firestore directly from UI.
- Homepage remains the only consumer in this RFC; additional call sites should still go through the service.
- When category pages land, reuse `slug` on cards — do not add navigation in a drive-by change outside a routing RFC.

---

## Explicitly rejected

- Firestore imports inside `CategoryCard`, `CategoryGrid`, or `FeaturedCategories`
- Homepage querying `categories` with the Firebase SDK directly
- Mixing product queries into `CategoryService`
- Implementing category routes or admin writers in this RFC
