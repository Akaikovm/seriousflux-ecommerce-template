# ADR-022 — Customer Management (Admin)

## Status

**Accepted** — implemented (RFC-022).

**RFC:** RFC-022  
**Depends on:** ADR-017 (Identity Foundation), ADR-018 (Customer Account), ADR-011 / ADR-014 (Orders), ADR-021 (Admin Design System), Firestore model (`docs/firestore.md`)  
**Enables:** Operational customer management without Firebase Console; admin role/status lifecycle; customer order history in Admin

### Locked constraints (from RFC-022)

1. **Do not change** Firestore structure, `customers` collection shape, IdentityBootstrap, RoleResolver, Authentication, Checkout, Orders domain behavior, or Storefront Account.
2. **Admin manages** status, role, profile info, order history — not passwords, uid, email, or Auth providers.
3. **Storefront Account** remains the place where customers edit their own profile (self-service).
4. **Use only** the Admin Design System (`features/admin/ui`).
5. **Reuse** `OrderService` — do not duplicate order queries.
6. **No Auth profile sync** when Admin edits a customer (Firestore only).

### Approved defaults (locked)

| Decision | Value |
|----------|-------|
| Page size | 25 |
| Total spent | Paid orders only (`payment.status === "paid"`) |
| Has Orders filter | Out of scope |
| Nav label | Customers |
| Self-demotion | Allowed only when another active admin remains |
| List metrics | Detail only (not on list) |
| Search | In-page only |
| Soft-delete | `status` only — never delete customers or orders |

### Explicitly out of scope

Customer tags, notes, impersonation, exports, and advanced CRM features.

---

## Context

Identity (RFC-017) and Account (RFC-018) shipped a complete **customer identity + self-service** path:

| Layer | State today |
|-------|-------------|
| `customers/{uid}` | Bootstrap + profile document (`CustomerProfile`) |
| Identity | `IdentityBootstrapService`, `RoleResolver`, `AuthProvider` |
| Storefront Account | `AccountService` edits `displayName` / `photoURL` / `phone` only |
| Roles / status | Typed (`customer` \| `staff` \| `admin`, `active` \| `inactive`); **no Admin UI to change them** |
| Admin customers | **Missing** — nav, routes, services, UI |
| First admin | Manual Firestore seed (README) |

ADR-018 explicitly listed **Admin customer management** as a non-goal. Ops still need Firebase Console to promote staff/admin, deactivate accounts, or inspect customer profiles.

RFC-022 closes that operational gap **without** turning Admin into a generic User CRUD or rewriting Identity.

---

## Goals

1. Admin can list, search, filter, and open customers at `/admin/customers` and `/admin/customers/[customerId]`.
2. Admin can edit: `displayName`, `phone`, `photoURL`, `role`, `status`.
3. Admin can view customer order history via existing `OrderService`.
4. Protect the last active admin (demote / deactivate / self-lockout).
5. Ship on Admin Design System from day one (ADR-021 Phase 7).
6. Keep boundaries clear: Identity ≠ Account ≠ Customer Admin ≠ Orders.

## Non-goals (hard stop)

- Changing Firestore schema / adding denormalized counters / `lastLogin` / `provider` fields
- Modifying `IdentityBootstrapService`, `RoleResolver`, Auth session pipeline
- Storefront Account redesign
- Enforcing storefront soft-block for inactive customers (Identity policy follow-up — Admin only **writes** `status`)
- Firebase Admin SDK / Auth user disable / password reset from Admin
- Changing email, uid, Auth provider, or passwords
- Guest order claiming / linking guest orders by email
- Staff permissions matrix (staff role assignable; no new privileges in this RFC)
- Firestore Security Rules delivery (document only)
- Full-text search engine (Algolia / Typesense)
- Deleting customers or purchase history

---

## 1. Architecture review (as-is)

### Mental model (keep)

```
Firebase Auth ──► AuthService ──► AuthUser
                                      │
                                      ▼
                         RoleResolver + IdentityBootstrap
                                      │
                                      ▼
                         customers/{uid}  (role, status, profile)
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
        AccountService          (missing today)         OrderService
        self-service            Customer Admin          listByCustomerId
        displayName/phone/      role + status +         getForCustomer
        photoURL                ops profile             listAll / getById
```

### What already works (reuse)

| Asset | Location | Reuse for RFC-022 |
|-------|----------|-------------------|
| Domain type | `features/customers/types/customer.ts` → `CustomerProfile` | Canonical document shape |
| Collection constant | `CUSTOMERS_COLLECTION` in IdentityBootstrap | Shared path; do not fork |
| Roles / status types | `PersistedRole`, `UserStatus` in `features/auth/types` | Admin edit enums |
| Profile read mapper | `AccountService.getProfile` / map helpers | Pattern for reads; **not** for role/status writes |
| Order list by customer | `OrderService.listByCustomerId` | Customer detail history |
| Admin order detail link | `/admin/orders/[id]` | Deep-link from customer orders |
| Admin list pattern | `AdminOrdersTable` + RSC page | Search / filter / DataTable |
| Admin detail pattern | `AdminOrderDetail` + sections | Detail layout |
| Admin DS primitives | `features/admin/ui` | Page / header / surface / table / toolbar / section / save bar / empty / loading |
| Admin gate | `RequireRole(["admin"])` + `status === "active"` | Already protects Admin shell |
| Order badges / price format | Existing order UI helpers | Order history rows |

### Gaps

| Gap | Impact |
|-----|--------|
| No `CustomerService` / admin list | Cannot enumerate `customers` without Console |
| No admin write path for `role` / `status` | Ops stuck in Console |
| `AccountService` never writes role/status | Correct for Account; Admin needs a **separate** service |
| `AuthService.updateProfileFields` updates **current** Auth user only | Must **not** reuse for Admin editing another customer |
| No `lastLogin` / `orderCount` / `totalSpent` on document | List columns must derive or omit |
| No cursor pagination in Admin | Orders/Products download all docs today |
| `staff` unused in guards | Assignable now; privileges still Admin-only |
| Storefront inactive soft-block unimplemented | Status write still valuable for Admin hard-block |
| No Security Rules | Client-side last-admin checks are advisory until Rules RFC |

### Naming: Account vs Customers vs Auth

| Layer | Owner | Responsibility |
|-------|--------|----------------|
| Firestore + domain type | `customers` / `CustomerProfile` | Document shape |
| Self-service product | `features/account` | Customer edits own profile |
| Authentication + bootstrap | `features/auth` | Session, roles resolution, create identity |
| Admin operations | `features/customers` (service) + `features/admin/customers` (UI) | Ops list/edit role/status/profile |

**Do not** put Admin role/status writes into `AccountService`. That would break the Account contract (“never writes role, status, or email”).

---

## 2. Decision summary

### 2.1 Customer Admin is an Admin product surface, not User CRUD

Admin Customer Management is **operational CRM-lite** over the existing identity document:

- Same `customers/{uid}` document
- Same `CustomerProfile` type
- New **admin-facing service** for list + privileged updates
- New **Admin UI** under `/admin/customers`

Storefront Account continues to own self-service profile edits.

### 2.2 New service: `CustomerAdminService` (not Account, not Identity)

**Proposed:** `src/features/customers/services/customer-admin.service.ts`

| Method | Purpose |
|--------|---------|
| `list(options?)` | Paginated / ordered customer reads for Admin list |
| `getById(customerId)` | Detail load (or thin wrapper around shared mapper) |
| `update(customerId, input, actor)` | Admin-allowed fields + last-admin guards |
| `countActiveAdmins()` | Support last-admin protection |

**Why not extend `AccountService`:** Account is customer self-service and explicitly forbids role/status. Mixing Admin ops would create dual-purpose APIs and accidental privilege leaks.

**Why not extend `IdentityBootstrapService`:** Bootstrap is create/read for auth flows. Privileged mutations must not live next to signup paths.

**Why under `features/customers`:** Domain collection ownership. Admin UI stays in `features/admin/customers` (same pattern as products/orders).

### 2.3 Auth sync policy for Admin edits (critical)

`AccountService.updateProfile` syncs Firebase Auth `displayName` / `photoURL` via `AuthService.updateProfileFields`, which mutates **`auth.currentUser`** (the signed-in Admin).

**Decision:** `CustomerAdminService` updates **Firestore only** for `displayName` / `photoURL` / `phone`.

| Path | Firestore | Firebase Auth profile |
|------|-----------|------------------------|
| Storefront Account (self) | Canonical write | Best-effort sync (existing) |
| Admin Customer edit | Canonical write | **No sync** in RFC-022 |

**Why:** Syncing Auth for another uid requires Firebase Admin SDK (out of scope / must not change Auth architecture). Firestore remains the app source of truth for profile display in Account/Admin; temporary Auth drift for the target user is acceptable until a later Admin SDK sync RFC.

### 2.4 Immutable fields (never editable in Admin)

| Field | Reason |
|-------|--------|
| `id` / uid | Auth ↔ Firestore 1:1 invariant |
| `email` | Auth identity; changing it needs Auth APIs + verification |
| Auth provider | Not on `CustomerProfile`; never expose Firebase `providerData` |
| Password | Auth-only; Admin must not handle credentials |
| `addresses` | Still deferred (Address book RFC) |
| `createdAt` | Audit field |

### 2.5 Role management

Supported values: `customer` | `staff` | `admin` (`PersistedRole`).

**Last active admin protection (client-side, service-enforced):**

Before any mutation that would remove an **active admin** (role change away from `admin`, or status → `inactive` while role is `admin`):

1. Load target customer.
2. If target is currently `role === "admin"` AND `status === "active"`, and the mutation would end that state:
3. Query active admins: `where("role","==","admin")` + `where("status","==","active")`.
4. If count ≤ 1 → reject with domain error `last-admin`.
5. Additionally: if `actor.uid === target.id` and this would leave zero active admins → reject (covers “downgrade yourself”).

**Notes:**

- Inactive admins do **not** count toward the active-admin quorum.
- Promoting staff → admin is always allowed.
- Assigning `staff` grants no new Admin privileges in this RFC (`RequireRole` remains `["admin"]` only).

### 2.6 Status management

Supported: `active` | `inactive`.

| Surface | Inactive behavior (existing / unchanged) |
|---------|------------------------------------------|
| Admin login / `RequireRole` | Hard block (`status === "active"` required) — already shipped |
| Storefront soft-block | Documented in ADR-017; **not implemented**; **out of scope** to implement here (must not change Auth) |

**Decision:** RFC-022 writes `status` only. Purchase history is never deleted. Deactivating a customer does not cancel orders.

### 2.7 Order integration

| Need | Method | Notes |
|------|--------|-------|
| Customer order history | `OrderService.listByCustomerId(customerId)` | Reuse as-is |
| Open single order | Link to `/admin/orders/[id]` + `OrderService.getById` | Admin already has detail |
| Customer-owned storefront read | `getForCustomer` | **Do not use in Admin** — ownership gate is for Account |

**Do not** add admin-only order methods unless a real gap appears. Admin is already privileged; `listByCustomerId` is sufficient.

**Metrics (total orders / total spent):**

- **Detail page:** derive in the Admin mapper from `listByCustomerId` results (`orders.length`, sum of `totals.total` for paid/completed policy — see Open Questions).
- **List page:** do **not** N+1 `listByCustomerId` per row. Prefer either (a) omit columns on list MVP, or (b) one optional in-memory aggregate from a single `OrderService.listAll()` pass when building the list view model (same cost class as Admin Orders today). Recommend **(a) for MVP**, show metrics on detail; optional list enrichment as Phase 2.

Guest orders without `customerId` never appear on a customer — expected.

### 2.8 List / search / filter / pagination strategy

**Problem:** RFC asks to avoid downloading all customers. Existing Admin lists download all docs.

**Decision (MVP — no schema change):**

| Concern | Strategy |
|---------|----------|
| **Pagination** | Cursor pagination on Firestore: `orderBy(sortField)` + `limit(pageSize)` + `startAfter(cursor)`. Default sort: `createdAt` DESC (“Newest”). |
| **Page size** | Fixed (e.g. 25) — constant in service config |
| **Equality filters** | Server: `status`, `role` via `where` + matching `orderBy` (composite indexes) |
| **Sort** | Server for `createdAt` ASC/DESC; `displayName` ASC/DESC via `orderBy("displayName")` |
| **Search** | Client filter **within the current page result** for name/email (Firestore has no full-text). Document limitation; Phase 2 can add prefix field or external search |
| **Has Orders** | **Defer** as server filter (needs denormalized flag or join). Optional Phase 2 client enrichment |
| **Alphabetical** | Map to `orderBy("displayName")` ASC/DESC |
| **Newest / Oldest** | `orderBy("createdAt")` DESC/ASC |

**Why not full collection download:** Customers grow with every signup; unlike early catalog size, this unbounded list is the wrong place to copy the Orders MVP shortcut.

**Indexes required (document for Console; do not ship rules):**

| Query | Fields |
|-------|--------|
| Default list | `createdAt` DESC |
| Role + createdAt | `role` ASC, `createdAt` DESC |
| Status + createdAt | `status` ASC, `createdAt` DESC |
| Role + status + createdAt | `role`, `status`, `createdAt` |
| displayName sorts (+ optional filters) | `displayName` (+ filter fields as needed) |
| Active admin count | `role` ASC, `status` ASC |

Exact composite set depends on final filter×sort combinations implemented; list them in `docs/firestore.md` on implementation.

### 2.9 List columns

| Column | Source | MVP |
|--------|--------|-----|
| Avatar | `photoURL` | Yes |
| Name | `displayName` | Yes |
| Email | `email` | Yes (read-only) |
| Role | `role` | Yes |
| Status | `status` | Yes |
| Orders count | Derived | Detail yes; list optional / Phase 2 |
| Total spent | Derived | Detail yes; list optional / Phase 2 |
| Created date | `createdAt` | Yes |
| Last login | — | **Omit** (not in schema; no Auth Admin SDK) |
| Actions | View / Edit link | Yes |

### 2.10 Detail page

Sections (Admin DS):

1. **Header** — name, email, role badge, status badge, customer since  
2. **Stats** — total orders, total spent (derived), optional recent activity  
3. **Profile** — editable `displayName`, `phone`, `photoURL`  
4. **Access** — editable `role`, `status` (with last-admin messaging)  
5. **Recent / order history** — table from `listByCustomerId`, link to Admin order detail  

Never show passwords, Auth UIDs as “secrets”, `providerData`, custom claims, or Firebase Console links as required UX. Showing the document id as “Customer ID” for support is acceptable (same as uid).

### 2.11 Admin Design System (mandatory)

Use only:

- `AdminPage`, `AdminPageHeader`, `AdminSurface`, `AdminTable` (`DataTable` alias), `AdminTableToolbar` (note: not `AdminToolbar`), `AdminSection`, `AdminSaveBar`, `AdminEmptyState`, `AdminLoadingState`
- Also allowed if needed: `AdminBreadcrumb`, `AdminBackLink`, `AdminRowActions`, `AdminStatCard`, `AdminFormLayout`

Avoid feature-specific CSS. Prefer existing admin tokens.

**Templates:**

- List → `AdminOrdersTable` + orders RSC page  
- Detail + save → Settings / order detail section patterns + `AdminSaveBar`  
- View mapper → `admin-order-view.ts` pattern (`toAdminCustomerView`)

---

## 3. Existing code reused

| Module | How |
|--------|-----|
| `CustomerProfile`, `CustomerRole` | Unchanged types |
| `PersistedRole`, `UserStatus` | Edit enums |
| `CUSTOMERS_COLLECTION` | Shared constant import |
| `OrderService.listByCustomerId` | Detail order history |
| `OrderService.getById` / Admin order routes | Deep links |
| `RequireRole(["admin"])` | Existing Admin shell |
| `features/admin/ui/*` | All chrome |
| `formatPrice`, order status badges | Order rows |
| `AccountService` | **Not** used for Admin writes; optional reference for validation rules (displayName required, photoURL http(s)) |

**Explicitly untouched:**

- `IdentityBootstrapService` behavior  
- `RoleResolver`  
- `AuthProvider` / session model  
- `AccountService` public contract  
- Checkout / payment flows  
- Order write methods / status machine  

---

## 4. Files to create

| Path | Purpose |
|------|---------|
| `docs/architecture/ADR-022-customer-management.md` | This ADR |
| `src/features/customers/services/customer-admin.service.ts` | List / get / update + last-admin guards |
| `src/features/customers/services/index.ts` | Barrel |
| `src/features/customers/types/customer-admin.ts` (or similar) | `CustomerAdminUpdateInput`, list query options, errors |
| `src/features/admin/customers/admin-customer-view.ts` | Serializable Admin view models + mappers |
| `src/features/admin/customers/AdminCustomersTable.tsx` | List UI |
| `src/features/admin/customers/AdminCustomerDetail.tsx` | Detail + edit form |
| `src/features/admin/customers/AdminCustomerOrders.tsx` | Order history section (thin) |
| `src/app/admin/(dashboard)/customers/page.tsx` | List RSC |
| `src/app/admin/(dashboard)/customers/[customerId]/page.tsx` | Detail RSC |
| `src/app/admin/(dashboard)/customers/[customerId]/not-found.tsx` | Optional parity with orders |

---

## 5. Files to modify

| Path | Change |
|------|--------|
| `src/features/admin/config/nav.ts` | Add **Customers** nav item (before Settings recommended) |
| `src/features/customers/types/index.ts` | Export new admin types if added |
| `src/features/admin/index.ts` (if needed) | Export customer admin components |
| `docs/firestore.md` | Document Admin write ownership + indexes + last-admin query; **no schema field changes** |
| `README.md` | Note Admin Customers routes / seeding still required for first admin |

**Do not modify:** IdentityBootstrap, RoleResolver, AccountService contract, OrderService methods (unless a tiny shared helper extraction is proven necessary — prefer not).

---

## 6. Route structure

```
/admin/customers                    → list (search, filters, sort, pagination)
/admin/customers/[customerId]       → detail + edit + order history
```

- Guarded by existing `(dashboard)` layout → `RequireRole(["admin"])`.
- `customerId` === Firebase Auth uid === Firestore document id.
- Invalid / missing id → `notFound()`.

Nav:

```ts
{ label: "Customers", href: "/admin/customers" }
```

Insert between Orders and Settings.

---

## 7. Service design

### Types (sketch)

```ts
type CustomerAdminUpdateInput = {
  displayName: string;
  phone?: string;
  photoURL?: string | null;
  role: PersistedRole;
  status: UserStatus;
};

type CustomerAdminListSort =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc";

type CustomerAdminListQuery = {
  status?: UserStatus;
  role?: PersistedRole;
  sort?: CustomerAdminListSort;
  pageSize?: number;
  cursor?: unknown; // DocumentSnapshot or opaque token
};

type CustomerAdminListResult = {
  items: CustomerProfile[];
  nextCursor: unknown | null;
};
```

### Actor context

`update(customerId, input, actor: { uid: string; role: PersistedRole })` receives the signed-in Admin from the client session so self-demotion checks are possible. Treat as **advisory** until Security Rules / Admin SDK exist.

### Errors

Domain error class (e.g. `CustomerAdminError`) with codes:

- `invalid-input`
- `not-found`
- `last-admin`
- `permission-denied`
- `unavailable`
- `unknown`

### Mapping

Share mapping rules with Account (role/status normalization, photoURL aliases) via a small shared mapper under `features/customers/lib/map-customer-profile.ts` **if** duplication would otherwise appear — extraction only when implementing, without changing Account behavior.

---

## 8. Component hierarchy

```
customers/page.tsx (RSC)
  └─ load: CustomerAdminService.list(...)
  └─ AdminCustomersTable (client)
       ├─ AdminPage
       ├─ AdminPageHeader
       ├─ AdminTableToolbar (search, status, role, sort)
       ├─ AdminTable / DataTable
       └─ AdminEmptyState

customers/[customerId]/page.tsx (RSC)
  └─ load: CustomerAdminService.getById + OrderService.listByCustomerId
  └─ AdminCustomerDetail (client)
       ├─ AdminPage (+ AdminSaveBar footer)
       ├─ AdminPageHeader / AdminBreadcrumb / AdminBackLink
       ├─ AdminStatCard row (orders, spent, since)
       ├─ AdminSection “Profile” (fields)
       ├─ AdminSection “Access” (role, status)
       └─ AdminCustomerOrders
            └─ AdminTable → links to /admin/orders/[id]
```

Dirty tracking: profile + access fields share one `AdminSaveBar` (single save), matching Settings quality bar.

---

## 9. Firestore queries

### Customers

```
# List newest
customers orderBy createdAt desc limit N

# Filtered
customers where status == X orderBy createdAt desc limit N
customers where role == Y orderBy createdAt desc limit N

# Active admin quorum
customers where role == "admin" where status == "active"

# Detail
customers/{customerId} getDoc
```

### Orders (unchanged)

```
orders where customerId == {customerId}
# client sort by createdAt desc (existing)
```

### Explicit non-queries

- No collection group queries  
- No Auth Admin SDK user listing  
- No password / provider reads  
- No deletes  

---

## 10. Security considerations

### Currently enforced client-side

| Control | Where |
|---------|-------|
| Admin route access | `RequireRole(["admin"])` + `status === "active"` |
| Account cannot change role/status | `AccountService` write allowlist |
| Order ownership for customers | `getForCustomer` |
| Last-admin protection (proposed) | `CustomerAdminService` only |

### Not enforced (must move to Security Rules later)

| Rule needed | Why |
|-------------|-----|
| Only `role == admin` && `status == active` can `list` / `update` `customers` | Client gates are bypassable |
| Customers can update only own `displayName` / `photoURL` / `phone` | Account already assumes this |
| Customers cannot change own `role` / `status` / `email` | Critical |
| Prevent last active admin demotion/inactivation | Needs Rules +/or Cloud Function; client check insufficient |
| Orders readable by owner or admin | Admin listAll already relies on open rules |

### RFC-022 stance

Document dependencies; **do not implement** `firestore.rules` in this RFC. Treat last-admin guard as necessary but not sufficient.

---

## 11. Performance

| Topic | Decision |
|-------|----------|
| Avoid full customer download | Cursor pagination + limit |
| Search | In-page only (MVP); document scale limit |
| Order metrics on list | Omit or Phase 2 single aggregate — never N+1 |
| Detail orders | One `listByCustomerId` per detail view |
| Indexes | Required for filter×sort combinations |
| Page size | Small fixed page (≈25) |

---

## 12. Risks

| Risk | Mitigation |
|------|------------|
| Admin edits Auth profile of **self** if AccountService reused | Dedicated `CustomerAdminService`; Firestore-only writes |
| Last admin locked out | Service guard + clear UI error; Rules follow-up |
| Search feels “broken” (only current page) | Copy in toolbar; Open Question on Phase 2 search |
| Auth ↔ Firestore displayName drift after Admin edit | Document; customer self-edit or later Admin SDK sync |
| `staff` confusion (no new powers) | UI helper text: staff is reserved for future ops |
| Has Orders / last login missing | Omit; do not invent schema fields |
| Client-only security | Explicit Rules RFC dependency |
| Large order history on detail | Accept for MVP; later paginate orders list |
| Concurrent last-admin race | Two admins demote each other; Rules/transaction follow-up |

---

## 13. Open questions (need approval)

1. **List metrics (orders count / total spent):** Omit on list MVP (recommended) **or** enrich via one `listAll()` orders aggregate?
2. **Total spent definition:** Sum all orders’ `totals.total`, or only `payment.status === "paid"` / completed fulfillment?
3. **Search MVP:** In-page only (recommended) **or** temporary full `getDocs` + client search like Orders (rejects “avoid downloading all”)?
4. **Page size:** 25 default OK?
5. **Has Orders filter:** Defer entirely (recommended) **or** Phase 2 client enrichment?
6. **Show Customer ID (uid) on detail** for support? Recommended: yes, read-only, not labeled as a secret.
7. **Self-demotion when other admins exist:** Allow (recommended) **or** always forbid demoting yourself?
8. **Inactive customer messaging in Admin:** Soft note that storefront soft-block is not yet enforced?
9. **photoURL in Admin:** Same URL text field as Account (recommended) **or** defer photo edits to Account-only?
10. **Nav label:** “Customers” (recommended) vs “Users”?

### Recommended defaults (approve as a block)

| # | Recommendation |
|---|----------------|
| 1 | Omit list metrics; compute on detail |
| 2 | Sum orders where `payment.status === "paid"` (exclude pending/failed) |
| 3 | Cursor pagination + in-page search |
| 4 | 25 |
| 5 | Defer Has Orders |
| 6 | Show read-only Customer ID |
| 7 | Allow self-demotion if ≥1 other active admin remains |
| 8 | Yes — short helper text under Status |
| 9 | Allow photo URL edit in Admin (Firestore-only) |
| 10 | “Customers” |

---

## Consequences

### Positive

- Ops manage customers without Firebase Console.
- Clear ownership: Account = self-service; Customer Admin = privileged ops.
- Identity/bootstrap/resolver remain stable.
- Admin DS consistency from day one.
- Order history reuses battle-tested `OrderService`.

### Negative / follow-ups

- Auth profile may drift until Admin SDK sync RFC.
- Search is not global.
- Security Rules still required for real enforcement.
- Storefront inactive soft-block still open (ADR-017).
- Staff role remains privilege-less.

---

## Approval checklist

- [x] ADR-022 approved
- [x] Open questions locked (recommended defaults)
- [x] No Firestore schema changes
- [x] No IdentityBootstrap / RoleResolver / Auth / Account / Checkout / Orders behavior changes beyond additive Admin UI + `CustomerAdminService`
- [x] Implementation delivered under Admin Design System

---

## Appendix — key paths

```
src/features/customers/types/customer.ts
src/features/customers/services/customer-admin.service.ts   ← create
src/features/account/services/account.service.ts            ← do not reuse for Admin writes
src/features/auth/services/identity-bootstrap.service.ts    ← untouched
src/features/auth/services/role-resolver.service.ts         ← untouched
src/features/orders/services/order.service.ts               ← listByCustomerId reuse
src/features/admin/ui/*                                     ← mandatory DS
src/features/admin/config/nav.ts                            ← add Customers
src/app/admin/(dashboard)/customers/**
docs/firestore.md
docs/architecture/ADR-017-identity-foundation.md
docs/architecture/ADR-018-customer-account.md
docs/architecture/ADR-021-admin-design-system.md
```
