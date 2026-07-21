# Firestore Data Model

This document defines the Firestore collections for the SeriousFlux ecommerce starter kit.

**RFC-001:** data model and TypeScript interfaces.  
**RFC-002:** store configuration service — read-only access to `settings/general`.

No authentication, product CRUD, admin UI, or checkout in RFC-002.

---

## Design principles

1. **Client-configurable, not hardcoded** — store name, logo, colors, locale, contact and feature flags live in `settings/general` (with room for `shipping` / `payments` / `seo` later).
2. **Simple product catalog first (RFC-007)** — products expose a single `image`, `price`, and `currency` with `featured` / `active` / `order`. Variants (sizes, colors, stock) are deferred.
3. **Denormalized order snapshots** — line items copy product name, price, and image at purchase time so history stays correct after catalog edits (size/color snapshots reserved for a later variants RFC).
4. **Flat top-level collections** — five root collections keep rules, indexes and mental model simple for a reusable starter kit.
5. **Auth-aligned customers** — `customers/{uid}` mirrors Firebase Authentication `uid` (1:1); TypeScript type is `CustomerProfile`.

---

## Collection overview

| Collection   | Purpose                                      | Typical doc id (v1)     |
|--------------|----------------------------------------------|-------------------------|
| `settings`   | Store configuration (multi-doc, scalable)    | `general`               |
| `categories` | Catalog groupings (shirts, hoodies, shorts)  | Auto-id or slug-based   |
| `products`   | Sellable apparel items                       | Auto-id                 |
| `customers`  | Buyer profiles linked to Auth                | Firebase Auth `uid`     |
| `orders`     | Purchases, payment and fulfillment           | Auto-id                 |

```
settings/general                ← v1 only; shipping / payments / seo later
categories/{categoryId}
products/{productId}
customers/{customerId}          ← same as Auth uid
orders/{orderId}
```

---

## Relationships

```
settings/general (v1)
    └── currency / locale / shippingEnabled used by storefront + checkout → orders

categories (1) ──────────────< products (N)
                                      │
                                      │ productId (reference + snapshot)
                                      ▼
customers (1) ───────────────< orders (N)
                                      │
                                      └── items[] snapshot (name, image, size, color, price)
```

| From        | Field          | To                         | Cardinality |
|-------------|----------------|----------------------------|-------------|
| `products`  | `categoryId`   | `categories/{id}`          | N : 1       |
| `orders`    | `customerId`   | `customers/{id}`           | N : 1       |
| `orders`    | `items[].productId` | `products/{id}`       | N : 1 (soft) |
| `orders`    | `currency`     | snapshot from `settings/general.currency` | copy at checkout |

There are **no** Firestore subcollections in v1. Nested data that belongs to a document (addresses, order items, theme) is stored as fields / arrays on the parent document.

---

## 1. `settings`

**Path:** `settings/{settingsId}`  
**TypeScript:** `src/features/settings/types/settings.ts` → `StoreSettings` (maps to `settings/general`)  
**Service (RFC-002):** `src/features/settings/services/store-settings.service.ts` → `StoreSettingsService`

### Why store configuration lives in Firestore

Serious Flux is a **reusable ecommerce starter**, not a one-off store. Every future client needs a different name, logo, colors, currency, contact channels and feature flags.

If that identity lived in source code (env files, constants, theme CSS), each client would require a fork or a redeploy of custom code. Putting identity in Firestore means:

- One codebase serves many stores.
- Rebranding is a data change (`settings/general`), not a code change.
- The storefront and future admin can both read the same source of truth.
- Ops can flip `maintenanceMode` or `shippingEnabled` without shipping a release.

### Why `settings/general` is a singleton document

There is exactly one general identity per Firebase project / store deployment. Using a **fixed document id** (`general`) gives:

- A stable path: `settings/general` — no query, no listing, one `getDoc`.
- Predictable security rules (read/write this known doc).
- No risk of duplicate “main settings” documents.

The collection remains open for **additional** singleton (or focused) documents later — still one doc per concern, not one mega-document:

```
settings/
    general     ← exists in v1 (RFC-002 reads this only)
    shipping    ← future
    payments    ← future
    seo         ← future
```

| Document id  | Status | Responsibility |
|--------------|--------|----------------|
| `general`    | **v1** | Branding, locale, currency, contact, social, `shippingEnabled`, `maintenanceMode` |
| `shipping`   | future | Rates, zones, methods |
| `payments`   | future | Provider credentials metadata, methods, webhooks config |
| `seo`        | future | Default titles, descriptions, social cards |

### Why this enables client reuse

For each new Serious Flux client, the agency changes Firestore `settings/general` (and later products/categories), not TypeScript. The same `StoreSettingsService` powers every deployment: read `settings/general`, fall back to defaults if unseeded, never leak Firebase errors to the UI layer.

### Fields (`settings/general` — v1)

| Field              | Type        | Required | Description |
|--------------------|-------------|----------|-------------|
| `storeName`        | `string`    | yes      | Public store name |
| `tagline`          | `string`    | yes      | Short marketing line |
| `description`      | `string`    | yes      | Longer about / store copy |
| `logo`             | `string`    | yes      | Logo URL or Storage path |
| `favicon`          | `string`    | yes      | Favicon URL or Storage path |
| `primaryColor`     | `string`    | yes      | CSS hex brand color |
| `secondaryColor`   | `string`    | yes      | CSS hex accent color |
| `currency`         | `string`    | yes      | ISO 4217 (e.g. `ARS`) |
| `locale`           | `string`    | yes      | BCP 47 (e.g. `es-AR`) |
| `language`         | `string`    | yes      | UI language (e.g. `es`) |
| `country`          | `string`    | yes      | ISO 3166-1 alpha-2 (e.g. `AR`) |
| `email`            | `string`    | yes      | Public support email |
| `phone`            | `string`    | yes      | Public contact phone |
| `whatsapp`         | `string`    | yes      | WhatsApp number or link |
| `instagram`        | `string`    | yes      | Instagram profile URL |
| `facebook`         | `string`    | yes      | Facebook page URL |
| `tiktok`           | `string`    | yes      | TikTok profile URL |
| `youtube`          | `string`    | yes      | YouTube channel URL |
| `address`          | `string`    | yes      | Public store address |
| `shippingEnabled`  | `boolean`   | yes      | Whether shipping is offered |
| `maintenanceMode`  | `boolean`   | yes      | Blocks commerce when true |
| `hero`             | `object`    | no       | Optional homepage hero overrides (RFC-010) |
| `notifications`    | `object`    | no       | Public transactional email config (RFC-019) |
| `createdAt`        | `Timestamp` | yes      | Created at |
| `updatedAt`        | `Timestamp` | yes      | Last update |

Optional nested `hero` fields: `title`, `subtitle`, `image`, `ctaText`, `ctaHref` (all strings). When omitted or partial, the storefront resolves from `storeName` / `tagline` / `description` via `resolveHeroContent`.

Optional nested `notifications` fields (RFC-019 / RFC-019.1):

| Field | Type | Description |
|-------|------|-------------|
| `provider` | `string` | Always `"resend"` from Admin UI; other slots reserved for developers |
| `senderEmail` / `senderName` | `string` | From header (verify in Resend) — **Admin-editable** |
| `replyTo` / `adminEmail` | `string` | Optional; empty falls back to store `email` — **not shown in Admin** |
| `enableCustomerEmails` | `boolean` | Customer transactional mail — **Admin-editable** |
| `enableAdminEmails` | `boolean` | Admin new-order / payment alerts — **Admin-editable** |
| `enableWelcomeEmail` | `boolean` | Welcome mail after signup — **Admin-editable** |

Secrets (`RESEND_API_KEY`) stay in server env — never on this document. Admin never configures infrastructure or picks vendors.

### Service contract (RFC-002)

`StoreSettingsService.getGeneralSettings()`:

- Reads **only** `settings/general`.
- Returns a typed `StoreSettings`.
- If the document is missing, returns **sensible defaults** (store still boots).
- On Firestore failure, throws `StoreSettingsError` — never raw Firebase errors.
- Contains **no** React, hooks, context, providers, or UI.

### Example (`settings/general`)

```json
{
  "storeName": "Serious Flux",
  "tagline": "Football kits built to last",
  "description": "Premium football shirts, hoodies and shorts.",
  "logo": "https://cdn.example.com/logo.svg",
  "favicon": "https://cdn.example.com/favicon.ico",
  "primaryColor": "#0A0A0A",
  "secondaryColor": "#E10600",
  "currency": "ARS",
  "locale": "es-AR",
  "language": "es",
  "country": "AR",
  "email": "hola@example.com",
  "phone": "+54 11 5555-0000",
  "whatsapp": "+5491155550000",
  "instagram": "https://instagram.com/example",
  "facebook": "",
  "tiktok": "",
  "youtube": "",
  "address": "Buenos Aires, Argentina",
  "shippingEnabled": true,
  "maintenanceMode": false,
  "hero": {
    "title": "",
    "subtitle": "",
    "image": "https://cdn.example.com/hero.jpg",
    "ctaText": "Shop now",
    "ctaHref": "/#featured"
  }
}
```

---

## 2. `categories`

**Path:** `categories/{categoryId}`  
**TypeScript:** `src/features/categories/types/category.ts` → `Category`  
**Service (RFC-006):** `src/features/categories/services/category.service.ts` → `CategoryService`

### Why this structure

The store sells football shirts, hoodies and shorts. Those product lines are modeled as categories rather than hard-coded product types, so other clients can rename or replace them freely. Flat categories (no parent tree) are enough for v1 and avoid recursive queries.

### Fields

| Field         | Type        | Required | Description |
|---------------|-------------|----------|-------------|
| `id`          | `string`    | yes      | Document id |
| `name`        | `string`    | yes      | Display name |
| `slug`        | `string`    | yes      | Unique URL slug |
| `description` | `string`    | no       | Category copy |
| `image`       | `string`    | yes      | Category image URL |
| `featured`    | `boolean`   | yes      | Homepage / highlight eligibility |
| `order`       | `number`    | yes      | Ascending nav / grid order |
| `active`      | `boolean`   | yes      | Storefront visibility |
| `createdAt`   | `Timestamp` | yes      | Created at |
| `updatedAt`   | `Timestamp` | yes      | Last update |

### Service contract (RFC-006)

`CategoryService`:

- `getAll()` — `active == true`, ordered by `order` ascending
- `getFeatured()` — `active == true` and `featured == true`, ordered by `order` ascending
- Returns typed `Category[]`
- On Firestore failure, throws `CategoryError` — never raw Firebase errors
- Contains **no** React, hooks, context, providers, or UI

### Initial seed (example)

SeriousFlux demo kit (`npm run seed:products` / `seed:demo`):

| name         | slug           | featured | order |
|--------------|----------------|----------|-------|
| Apparel      | `apparel`      | true     | 1     |
| Accessories  | `accessories`  | true     | 2     |
| Digital      | `digital`      | false    | 3     |

### Suggested indexes

- `active` ASC + `order` ASC (storefront nav / `getAll`)
- `active` ASC + `featured` ASC + `order` ASC (`getFeatured`)

---

## 3. `products`

**Path:** `products/{productId}`  
**TypeScript:** `src/features/products/types/product.ts` → `Product`  
**Service (RFC-007):** `src/features/products/services/product.service.ts` → `ProductService`

### Why this structure

The first catalog version is intentionally **simple**: one image, one price, one currency, and visibility/sort flags (`active`, `featured`, `order`). Variants (sizes, colors, per-variant stock) are deferred so the storefront can ship featured products without inventing inventory complexity every client may not need.

`categoryId` links to `categories/{id}` (e.g. `apparel`, `accessories`).

### Fields

| Field         | Type      | Required | Description |
|---------------|-----------|----------|-------------|
| `id`          | `string`  | yes      | Document id |
| `name`        | `string`  | yes      | Display name |
| `slug`        | `string`  | yes      | Unique URL slug |
| `description` | `string`  | yes      | Detail copy |
| `image`       | `string`  | yes      | Primary product image URL |
| `price`       | `number`  | yes      | Unit price |
| `currency`    | `string`  | yes      | ISO 4217 (e.g. `ARS`) |
| `categoryId`  | `string`  | yes      | FK → `categories/{id}` |
| `featured`    | `boolean` | yes      | Homepage / highlight eligibility |
| `active`      | `boolean` | yes      | Storefront visibility |
| `order`       | `number`  | yes      | Ascending catalog / grid order |
| `sku`           | `string`  | no       | Commercial SKU (RFC-023) |
| `trackInventory`| `boolean` | yes*     | Legacy missing → `false`; new creates default `true` |
| `lowStockThreshold` | `number` | yes* | Low-stock badge threshold (default 5) |
| `allowBackorders` | `boolean` | yes*   | Allow purchase when quantity ≤ 0 |
| `visibilityWhenOutOfStock` | `string` | yes* | `"visible"` | `"hidden"` |

* Selling policy only. **Quantity is not stored on products** — see `inventory` (RFC-023).
`ProductService` never writes inventory documents.

### Service contract (RFC-007)

`ProductService`:

- `getAll()` — `active == true`, ordered by `order` ascending
- `getFeatured()` — `active == true` and `featured == true`, ordered by `order` ascending
- `getByCategory(categoryId)` — `active == true` and matching `categoryId`, ordered by `order` ascending
- `getBySlug(slug)` — find by slug; returns `null` if not found
- Returns typed `Product` / `Product[]`
- On Firestore failure, throws `ProductError` — never raw Firebase errors
- Contains **no** React, hooks, context, providers, or UI

### Initial seed (example)

Bootstrap a blank project with the SeriousFlux demo kit:

```bash
npm run seed:demo
# or catalog only:
npm run seed:products
```

Demo products cover in-stock, low-stock, out-of-stock, backorder, and not-tracked SKUs (see `scripts/seed-products.ts`). Quantity is written to `inventory/{productId}`, not on the product document.

Example product document:

```json
{
  "name": "SeriousFlux Logo Tee — Black",
  "slug": "sf-logo-tee-black",
  "description": "Demo cotton tee with SeriousFlux mark.",
  "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
  "price": 18900,
  "currency": "ARS",
  "categoryId": "apparel",
  "featured": true,
  "active": true,
  "order": 1,
  "sku": "SF-TEE-BLK",
  "trackInventory": true,
  "lowStockThreshold": 5,
  "allowBackorders": false,
  "visibilityWhenOutOfStock": "visible"
}
```

### Query strategy (RFC-007)

`ProductService` uses a **single equality filter** per storefront read and applies `active` / `order` in memory. That keeps the starter kit bootable without waiting on composite indexes.

### Suggested indexes (when catalog grows)

- `active` ASC + `order` ASC (`getAll` with server-side sort)
- `active` ASC + `featured` ASC + `order` ASC (`getFeatured`)
- `active` ASC + `categoryId` ASC + `order` ASC (`getByCategory`)
- `slug` ASC (unique lookup / `getBySlug`)

---

## 3b. `inventory` (RFC-023)

**Path:** `inventory/{productId}` (MVP storage — document id = product id)  
**TypeScript:** `src/features/inventory/types/inventory.ts` → `InventoryRecord`  
**Service:** `src/features/inventory/services/inventory.service.ts` → `InventoryService`

Sole writer of quantity. Callers must use InventoryService (not ProductService, Checkout, or Orders).

| Field       | Type        | Required | Description |
|-------------|-------------|----------|-------------|
| `productId` | `string`    | yes      | Same as document id |
| `quantity`  | `number`    | yes      | Available sellable units (≥ 0) |
| `createdAt` | `Timestamp` | yes      | Created |
| `updatedAt` | `Timestamp` | yes      | Last mutation |
| `updatedBy` | `string`    | no       | Optional Admin uid |

Orders gain `inventoryCommitStatus`: `"none"` \| `"committed"` \| `"restored"` \| `"shortfall"`.

---

## 4. `customers`

**Path:** `customers/{customerId}`
**TypeScript:** `src/features/customers/types/customer.ts` → `CustomerProfile`
**Identity services (RFC-017):** `IdentityBootstrapService`, `RoleResolver` in `src/features/auth/services/`
**Account profile (RFC-018):** `AccountService` in `src/features/account/services/` — updates `displayName`, `photoURL`, `phone` only
**Admin customer ops (RFC-022):** `CustomerAdminService` in `src/features/customers/services/` — list/update `displayName`, `photoURL`, `phone`, `role`, `status` (Firestore only; no Auth sync; never deletes)

### Why this structure

Named `customers` (not `users`) to match the commercial domain. The TypeScript interface is `CustomerProfile` so the profile document is distinct from generic “customer” UI language; the Firestore collection name remains `customers`. Document id equals Firebase Auth `uid` so profile load is a direct `getDoc` after login.

**RFC-017** treats this document as the **identity source of truth** for `role` and `status`. Signup (email/password or Google) always bootstraps `role: "customer"` / `status: "active"`. Admin users are **never** created by the application — seed them manually in Firestore. Addresses remain an empty array until a future Address book RFC.

**RFC-018** Account owns customer-facing profile edits (`displayName`, `photoURL`, `phone`). Firestore is canonical; Firebase Auth `displayName` / `photoURL` sync is best-effort after a successful Firestore write.

**RFC-022** Admin Customer Management owns privileged list + updates for `role` / `status` and the same profile fields. Soft-deactivation uses `status: "inactive"` only — customer documents and order history are never deleted. Admin edits do **not** sync Firebase Auth (would require Admin SDK for another uid).

### Fields

| Field         | Type                 | Required | Description |
|---------------|----------------------|----------|-------------|
| `id`          | `string`             | yes      | Same as Auth `uid` (document id; may be omitted in stored payload) |
| `email`       | `string`             | yes      | Account email (read-only in Account UI) |
| `displayName` | `string`             | yes      | Public name (editable in Account) |
| `phone`       | `string`             | no       | Contact phone (Firestore only; editable in Account) |
| `photoURL`    | `string` \| `null`   | no       | Avatar URL (editable as URL in Account; no upload in RFC-018) |
| `role`        | `PersistedRole`      | yes      | `customer` \| `staff` \| `admin` (Account: read-only; Admin: editable via RFC-022) |
| `status`      | `UserStatus`         | yes      | `active` \| `inactive` (Account: read-only; Admin: editable via RFC-022; never hard-delete) |
| `addresses`   | `CustomerAddress[]`  | yes      | Saved addresses (always `[]` until Address book) |
| `createdAt`   | `Timestamp`          | yes      | Created at |
| `updatedAt`   | `Timestamp`          | yes      | Last update |

### Identity bootstrap (RFC-017 / RFC-018)

On first authentication (email/password signup, Google sign-in, or first resolve when the document is missing), Identity writes:

```
role: "customer"
status: "active"
email / displayName / photoURL from Auth (Google or email)
addresses: []
createdAt / updatedAt
```

Missing document resolution:

- **Storefront / default** — bootstrap as `customer` automatically.
- **Admin privileges** — fail closed: bootstrapped customers cannot pass `RequireRole(["admin"])`.
- **Never** auto-create `admin` or `staff`.

### Admin customer management (RFC-022)

| Method | Behavior |
|--------|----------|
| `CustomerAdminService.list` | Full `customers` read; filter/sort/page in memory (page size 25). No composite indexes. Matches mapped defaults when `status`/`role` are missing on the doc. |
| `CustomerAdminService.getById` | `getDoc(customers/{id})` |
| `CustomerAdminService.update` | Patch `displayName`, `phone`, `photoURL`, `role`, `status` only — **no Auth sync**; rejects removing the last active admin |
| `CustomerAdminService.countActiveAdmins` | `where role==admin` + in-memory `status==active` |

Routes: `/admin/customers`, `/admin/customers/[customerId]`. Order history reuses `OrderService.listByCustomerId`. Soft-delete = `status: inactive` only.

Same bootable pattern as `ProductService`: avoid composite indexes so Admin works before Console index setup.

### Nested: `CustomerAddress`

| Field        | Type      | Required | Description |
|--------------|-----------|----------|-------------|
| `id`         | `string`  | yes      | Local address id |
| `fullName`   | `string`  | yes      | Recipient |
| `line1`      | `string`  | yes      | Street line 1 |
| `line2`      | `string`  | no       | Street line 2 |
| `city`       | `string`  | yes      | City |
| `state`      | `string`  | yes      | State / province |
| `postalCode` | `string`  | yes      | Postal code |
| `country`    | `string`  | yes      | ISO country code |
| `phone`      | `string`  | no       | Delivery phone |
| `isDefault`  | `boolean` | yes      | Default checkout address |

---

## 5. `orders`

**Path:** `orders/{orderId}`  
**TypeScript:** `src/features/orders/types/order.ts` → `Order`

### Why this structure

Orders own payment + fulfillment state and keep **immutable line-item snapshots**. Size and color chosen at checkout are stored on each item; stock deduction targets `inventory/{productId}` via InventoryService (RFC-023).

Payment is abstracted via `OrderPayment.provider` so Mercado Pago can ship first and Stripe/PayPal can plug in later without reshaping the order document.

### Fields

| Field             | Type                   | Required | Description |
|-------------------|------------------------|----------|-------------|
| `id`              | `string`               | yes      | Document id (internal — prefer `orderNumber` for customer UX) |
| `orderNumber`     | `string`               | yes      | Human-friendly reference (e.g. `SF-20260717-A3K9`) |
| `customerId`      | `string`               | no       | FK → `customers/{id}` (omit for guest checkout) |
| `customerEmail`   | `string`               | yes      | Email snapshot |
| `customerName`    | `string`               | yes      | Name snapshot |
| `customerPhone`   | `string`               | yes      | Phone snapshot from checkout |
| `status`          | `OrderStatus`          | yes      | Fulfillment lifecycle |
| `items`           | `OrderItem[]`          | yes      | Purchased lines (snapshots) |
| `shippingAddress` | `OrderShippingAddress` | yes      | Delivery address snapshot |
| `shippingMethod`  | `OrderShippingMethod`  | yes      | Method snapshot (`id`, `label`, `cost`) |
| `payment`         | `OrderPayment`         | yes      | Provider payment metadata |
| `totals`          | `OrderTotals`          | yes      | Money breakdown |
| `currency`        | `string`               | yes      | ISO 4217 snapshot |
| `notes`           | `string`               | no       | Internal admin notes — **never** shown on customer Account (RFC-018) |
| `createdAt`       | `Timestamp`            | yes      | Created at |
| `updatedAt`       | `Timestamp`            | yes      | Last update |

### `OrderStatus`

Canonical write path (RFC-014):

`pending_payment` → `paid` → `processing` → `shipped` → `completed`

Also: `cancelled` (from `pending_payment` or `paid` only).

Legacy read-only aliases (never write again):

- `pending` — treat as `pending_payment`
- `delivered` — treat as `completed`
- `refunded` — legacy order-level refund; prefer `payment.status: "refunded"`

Checkout (RFC-013) creates orders as `pending_payment` with `payment.status: "pending"`.

When `payment.status` becomes `paid` (Admin or future webhooks), order `status` is set to `paid` if still awaiting payment.

### Nested: `OrderItem`

Each line item is a full purchase snapshot so order history stays correct after catalog edits. `productId` is kept for stock deduction and soft links; display fields must not rely on live product reads.

| Field            | Type           | Required | Description |
|------------------|----------------|----------|-------------|
| `productId`      | `string`       | yes      | Soft FK → `products/{id}` (do not remove) |
| `productName`    | `string`       | yes      | Name snapshot |
| `image`          | `string`       | yes      | Image snapshot |
| `quantity`       | `number`       | yes      | Units purchased |
| `unitPrice`      | `number`       | yes      | Price snapshot |
| `selectedSize`   | `ProductSize`  | no       | Selected size (optional until variants) |
| `selectedColor`  | `ProductColor` | no       | Selected color (optional until variants) |
| `sku`            | `string`       | no       | SKU snapshot |

### Nested: `OrderShippingMethod`

| Field   | Type     | Required | Description |
|---------|----------|----------|-------------|
| `id`    | `string` | yes      | Stable method id (e.g. `standard`) |
| `label` | `string` | yes      | Customer-facing label snapshot |
| `cost`  | `number` | yes      | Shipping cost snapshot (also in `totals.shipping`) |

### Nested: `OrderPayment`

| Field           | Type                 | Required | Description |
|-----------------|----------------------|----------|-------------|
| `provider`      | `PaymentProviderId`  | yes      | Active provider |
| `status`        | `OrderPaymentStatus` | yes      | Payment lifecycle |
| `externalId`    | `string`             | no       | Checkout / preference id |
| `transactionId` | `string`             | no       | Captured payment id |
| `amount`        | `number`             | yes      | Charged amount |
| `currency`      | `string`             | yes      | ISO 4217 |
| `paidAt`        | `Timestamp`          | no       | Capture time |

### Nested: `OrderTotals`

| Field      | Type     | Required | Description |
|------------|----------|----------|-------------|
| `subtotal` | `number` | yes      | Sum of line items |
| `shipping` | `number` | yes      | Shipping cost |
| `discount` | `number` | yes      | Discount amount |
| `tax`      | `number` | yes      | Tax amount |
| `total`    | `number` | yes      | Grand total |

### Suggested indexes

- `customerId` ASC + `createdAt` DESC (optional optimization for customer order history; RFC-018 sorts client-side after equality query)
- `status` ASC + `createdAt` DESC (admin queues)
- `payment.status` ASC + `createdAt` DESC (payment ops)

### Customer order reads (RFC-018)

| Method | Behavior |
|--------|----------|
| `OrderService.listByCustomerId(customerId)` | `where customerId ==` + client sort newest first |
| `OrderService.getForCustomer(orderId, customerId)` | `getById` + ownership check; mismatch → not found |

Account UI never lists all orders and never shows admin notes.
---

## TypeScript feature layout

Interfaces and domain services live next to their feature (Clean Architecture / feature folders):

```
src/features/
  settings/
    types/
      settings.ts
      index.ts
    services/
      store-settings.service.ts
      index.ts
  categories/
    types/
    services/
    components/
  products/
    types/
    services/
    components/
  customers/types/
    customer.ts
    index.ts
  orders/types/
    order.ts
    index.ts
```

Import examples:

```ts
import type { Product } from "@/features/products/types";
import type { Order } from "@/features/orders/types";
import type { CustomerProfile } from "@/features/customers/types";
import type { StoreSettings } from "@/features/settings/types";
import type { Category } from "@/features/categories/types";
import { StoreSettingsService } from "@/features/settings/services";
import { CategoryService } from "@/features/categories/services";
import { ProductService } from "@/features/products/services";
```

---

## What was intentionally deferred

These appear in the long-term kit vision (`AGENTS.md`) but are **out of scope for RFC-001**:

| Concern              | Why deferred |
|----------------------|--------------|
| Coupons              | Needs its own validation + redemption rules |
| Reviews              | Needs moderation + product aggregation |
| Inventory / stock    | Done (RFC-023) — `inventory/{productId}` + InventoryService |
| Variants (size/color)| Explicitly deferred in RFC-007 |
| Cart persistence     | Cart remains client state (Zustand) until a later RFC |
| Nested order events  | Status history can be added as subcollection later |
| Reservations / warehouses | Deferred — InventoryService API leaves room (ADR-023) |

---

## Future scalability

| Evolution                         | How this model extends |
|-----------------------------------|------------------------|
| Stripe / PayPal                   | New `PaymentProviderId` + provider fields on `OrderPayment` |
| Settings split                    | Add `settings/shipping`, `settings/payments`, `settings/seo` docs |
| Per-variant stock                 | Add variant stockable ids behind InventoryService (same public API) |
| Multi-warehouse inventory         | Evolve storage behind InventoryService; keep method contracts |
| Nested categories                 | Add optional `parentId` on `Category` |
| Guest checkout                    | Done (RFC-013) — `customerId` optional; email snapshots |
| Authenticated checkout            | Done (RFC-017 / RFC-018) — optional Google/email at checkout; sets `customerId` |
| Customer Account / My Orders      | Done (RFC-018) — `features/account` + ownership-checked reads |
| Google Authentication             | Done (RFC-018) — same bootstrap as email/password |
| Multi-currency                    | Prices map or `prices: Record<currency, number>`; `settings/general` gains `supportedCurrencies` |
| Coupons / discounts               | New `coupons` collection; reference from `orders.totals.discount` |
| Order audit trail                 | `orders/{id}/events` subcollection |
| Custom claims for admin           | Deferred (GAP-002) — Firestore `role` is source of truth in rules today (ADR-024) |
| Payment provider in settings      | Add on `settings/payments` (or `general`) when checkout RFC lands |

---

## Security rules (GAP-001)

Committed files:

| File | Purpose |
|------|---------|
| [`firestore.rules`](../firestore.rules) | Collection access model |
| [`storage.rules`](../storage.rules) | `media/**` public read, admin write |
| [`firebase.json`](../firebase.json) | Points the Firebase CLI at those files |

Deploy:

```bash
firebase deploy --only firestore:rules,storage
```

**Posture:** public read for storefront needs (`settings`, active catalog, `inventory`); customers own their profile (no role escalation); order create limited to `pending_payment` / pending payment; admin writes via `customers/{uid}.role == admin`. Privileged server paths use the **Admin SDK** (GAP-004 / ADR-024) and bypass rules.

**Local seeds** use the client SDK — keep open rules while seeding, or seed before locking production rules.

Architecture: [`docs/architecture/ADR-024-firestore-rules-admin-sdk.md`](architecture/ADR-024-firestore-rules-admin-sdk.md).

---

## Demo seeds (Serious Flux showcase)

For a blank Firebase project after clone, prefer:

```bash
npm run seed:demo
```

| Script | Writes |
|--------|--------|
| `scripts/seed-demo.ts` | Orchestrates settings → catalog/inventory → orders |
| `scripts/seed-settings.ts` | `settings/general` (Serious Flux branding + inventory defaults) |
| `scripts/seed-products.ts` | `categories`, `products`, `inventory/{productId}` |
| `scripts/seed-orders.ts` | Sample guest `orders` (incl. shortfall demo) |

Shared helper: `scripts/lib/firebase-seed.ts`. Seeds do not create Auth admins or payment secrets. See README “Seed SeriousFlux demo data”.

Architecture: [`docs/architecture/ADR-023-inventory-stock-management.md`](architecture/ADR-023-inventory-stock-management.md).

---

## Non-goals of RFC-001 / RFC-002

- Seed scripts for local bootstrap (documented above; not part of RFC-001 scope)
- No Firestore Security Rules in early RFCs — **now shipped** (GAP-001 / ADR-024)
- No composite index JSON commit (create when queries exist)
- No settings write / admin CRUD (RFC-002 is read-only)
- No React hooks, context, providers, or UI
- No authentication, products CRUD, or checkout

---

## Approval gate

RFC-002 (store configuration service) ends here. **Do not start RFC-003 until this is approved.**
