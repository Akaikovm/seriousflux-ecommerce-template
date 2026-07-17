# ADR-008 — Admin Management (CRUD + Media)

**Status:** Accepted  
**Date:** 2026-07-17  
**RFC:** RFC-012  
**Depends on:** ADR-001 (Design System), ADR-002 (Categories), ADR-004 (Admin Dashboard Foundation)

### Approved adjustments

- Dedicated create/edit routes (not modals).
- Zod only for validation — no React Hook Form; controlled forms match `AdminLoginForm`.
- Category delete uses `ConfirmDialog` only — no referential integrity checks in this RFC.
- Store Settings editable fields exactly as listed in RFC-012.
- `MediaService` is the only upload layer; domain services persist URLs only.
- Reusable `ConfirmDialog` and Toast under `shared/ui` — no `window.confirm` / `alert`.
- Flow: Page → DataTable → Form → Service. DataTable stays independent of forms.

---

## Context

RFC-011 delivered an Admin Dashboard shell with read-only list views. Domain services already expose write methods (`create` / `update` / `delete` / `updateGeneralSettings`), but the store owner still cannot manage catalog or branding without Firebase Console.

RFC-012 turns the Admin into a real Back Office for:

- Products (full CRUD + enable/disable)
- Categories (full CRUD + enable/disable)
- Media (upload / delete / public URL)
- Store Settings (editable management screen)

Non-goals (unchanged): Orders, Checkout, Payments, Coupons, Reviews, Analytics, Authentication changes.

---

## Decision

### 1. Admin UI never talks to Firebase

```
Admin forms / tables (features/admin + domain form components)
    ↓
Domain services (ProductService, CategoryService, StoreSettingsService, MediaService)
    ↓
Firebase client SDK (Firestore / Storage)
```

UI components may call services. UI components must never import:

- `firebase/firestore`
- `firebase/storage`
- `@/firebase/*`

**Why**

- Keeps Firebase as an infrastructure detail. Future clients can swap persistence without rewriting forms.
- Matches ADR-002 / ADR-004. Admin and storefront already share this boundary; CRUD must not break it.
- Domain errors (`ProductError`, `CategoryError`, `MediaError`, …) stay the only failure surface the UI understands.
- Testability: forms can be exercised against service mocks without a Firebase emulator.

### 2. Every entity owns its own service

| Entity | Service | Owns |
|--------|---------|------|
| Product | `ProductService` | `products` collection |
| Category | `CategoryService` | `categories` collection |
| Store settings | `StoreSettingsService` | `settings/general` |
| Media | `MediaService` | Firebase Storage objects |

**Why**

- Single ownership of persistence rules, mapping, and validation at the write boundary.
- No god-service (`AdminService`) that knows every collection and becomes unmaintainable across clients.
- Storefront and Admin reuse the same service. A product created in Admin is the same document the storefront reads.
- Cross-entity orchestration (e.g. “upload image, then attach URL to product”) lives in the UI flow or a thin form handler — not by letting ProductService import Storage.

Existing services from RFC-011 are **extended only if needed** (e.g. enable/disable helpers that wrap `update`). Types and collection contracts remain unchanged.

### 3. Forms are presentation; services own persistence

Forms own:

- Field state and controlled inputs
- Client-side validation messages
- Loading / success / duplicate-submit prevention
- Calling service methods and mapping domain errors to UI copy

Services own:

- Firestore / Storage I/O
- Document mapping (`mapProduct`, `mapCategory`, …)
- Write timestamps where the domain already defines them
- Domain error wrapping (never raw Firebase errors)

**Why**

- Presentation changes per client (labels, layout) without touching persistence.
- Persistence rules stay in one place; forms cannot invent alternate write shapes.
- Matches the existing `AdminLoginForm` pattern (controlled form → service → domain error) so we do not introduce a second architecture for the same problem.
- Zod (when added) validates **input shape** for the form; the service remains the authority for what is persisted.

### 4. Firebase Storage is abstracted behind MediaService

Create `features/media/` with `MediaService` as the only module that imports Storage:

```
uploadImage(file, options) → MediaUploadResult
deleteImage(pathOrUrl) → void
getPublicUrl(path) → string
```

**Why**

- Product, Category, and Settings only store **string URLs** (or paths resolved to public URLs). They must not know Storage paths, content types, or upload progress APIs.
- One place for validation (image MIME, max size), progress callbacks, and typed results.
- `src/firebase/storage.ts` stays a singleton accessor only — as already documented. Business rules belong in the service layer.
- Deleting or replacing a logo/product image can call `MediaService` without coupling catalog services to Storage.

Upload UI (`ImageUpload` / drag-and-drop) lives under `features/media/components/` and talks only to `MediaService`.

### 5. Design System reuse (no redesign)

Admin management UI composes existing ADR-001 primitives:

- `Button`, `Input`, `Card`, `Badge`, `EmptyState`, `LoadingState`

Minimal net-new shared primitives only when required for forms (e.g. `Textarea`, `Select`, `Switch` / checkbox) — same visual language, no new theme.

Admin shell, sidebar, `DataTable`, and page routes from RFC-011 remain. Create/Edit become real actions; we do not redesign the dashboard.

### 6. Types remain stable

Do not change:

- `Product`, `ProductWriteInput`, `ProductUpdateInput`
- `Category`, `CategoryWriteInput`, `CategoryUpdateInput`
- `StoreSettings`, `StoreSettingsUpdateInput`

Image fields stay a single `string` URL. Multi-image galleries are out of scope.

---

## Consequences

### Positive

- Store owners manage catalog and branding entirely from Admin.
- Architecture stays aligned with Clean Architecture and prior ADRs.
- Media becomes a reusable vertical for logo, category image, and product image.
- Future Security Rules / session cookies can harden writes without rewriting forms.

### Risks / follow-ups (explicitly out of RFC-012)

- **Firestore Security Rules** — client SDK writes still require rules that allow authenticated admins. Hardening remains deferred (ADR-004).
- **Category delete orphans** — products may still reference a deleted `categoryId`. Referential integrity is deferred by RFC-012 approval; delete uses `ConfirmDialog` only.
- **Orphan Storage objects** — deleting a product does not automatically delete its Storage file unless the form/handler calls `MediaService.deleteImage`. Prefer best-effort cleanup on replace/delete when a Storage path is known.
- **Zod / React Hook Form** — listed in AGENTS.md but not installed. RFC-012 may introduce them for admin forms, or continue the controlled-form pattern used by `AdminLoginForm`. Decision belongs in the implementation plan; either way, services stay the persistence boundary.

---

## Success criteria

Without opening Firebase Console, the store owner can:

1. Create / edit / delete a category  
2. Enable / disable a category  
3. Create / edit / delete a product  
4. Enable / disable a product  
5. Upload product (and category) images  
6. Upload store logo  
7. Edit Store Settings (name, tagline, logo, colors, contact, social, address, maintenance, shipping)

---

## Stop line

RFC-012 ends when the criteria above are met.

Do not start RFC-013 (Orders / Checkout / Payments / Auth hardening) until this ADR is accepted and RFC-012 is approved complete.
