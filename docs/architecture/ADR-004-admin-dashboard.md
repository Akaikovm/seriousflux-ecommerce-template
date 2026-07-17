# ADR-004 — Admin Dashboard Foundation (RFC-011)

## Status

Accepted

## Context

Serious Flux clients need to manage catalog and store settings without editing Firebase manually. The storefront already exposes read services for products, categories, and settings. Admin must reuse those services, stay configuration-driven, and never mix Firebase access into UI components.

## Decision

### Route isolation

- Storefront pages live under `src/app/(storefront)/` with Navbar / Footer / brand CSS.
- Admin pages live under `src/app/admin/` with a neutral shell.
- Root layout only provides `html` / `body` / fonts / global CSS.

### Feature boundaries

```
Admin UI (features/admin)
    ↓
Domain services (products / categories / settings / auth)
    ↓
Firebase client SDK
```

Admin components never import Firebase.

### Authentication (foundation)

- `AuthService` owns email/password sign-in and sign-out.
- `AuthProvider` + `RequireAuth` protect `/admin/*` (except `/admin/login`).
- Any authenticated Firebase user may access admin in RFC-011.
- Role-based access (custom claims / `CustomerRole`) is deferred.

### Service mutations

Added write methods without changing existing Firestore contracts:

- `ProductService`: `listAll`, `getById`, `create`, `update`, `delete`
- `CategoryService`: `listAll`, `create`, `update`, `delete`
- `StoreSettingsService`: `updateGeneralSettings`

Storefront read methods (`getAll`, `getFeatured`, …) remain unchanged.

### Admin UI scope

Delivered:

- Dashboard shell (sidebar, header, responsive nav)
- Dashboard overview (counts + store status)
- Products / categories list foundations
- Settings read view
- Typed `DataTable` with loading / empty / footer slots

Deferred:

- Create/edit forms
- Image upload
- Orders, checkout, payments, analytics
- Server-side session cookies / middleware enforcement
- Firestore Security Rules hardening

## Consequences

- Admin and storefront share domain services and design-system primitives.
- Client-side auth guard is sufficient for foundation; production must add Security Rules and preferably session cookies before public deploy.
- CRUD service methods exist so future form RFCs do not require another service rewrite.
