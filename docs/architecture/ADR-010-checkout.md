# ADR-010: Checkout Foundation

**Status:** Accepted  
**Date:** 2026-07-17  
**RFC:** RFC-013 (Checkout Foundation)  
**Depends on:** ADR-001 (Design System), ADR-003 (Storefront), ADR-009 (Shopping Cart), Firestore model (`docs/firestore.md`)  
**Enables:** RFC-014 (Orders Admin / lifecycle), RFC-015 (Mercado Pago)

---

## Decision

Checkout is a **feature-owned purchase flow** under `src/features/checkout`.

| Concern | Owner |
| ------- | ----- |
| Checkout UI + form state | `features/checkout` |
| Cart line items (pre-purchase) | `CartStore` (`features/cart`) — read-only from Checkout |
| Order persistence | `OrderService` (`features/orders`) |
| Payment provider calls | **Out of scope** — deferred to RFC-015 |
| Store identity (currency, locale, country, shipping flag) | Loaded at the route; passed as props — not imported as `StoreSettings` into form internals |

**Checkout creates the Order.** Payment capture does not.

After a successful `OrderService.create(...)`:

1. Orders become the **system of record** for the purchase.
2. Checkout calls **`clearCart()`**.
3. The buyer is redirected to a confirmation surface keyed by `orderId`.

Cart remains client state. Orders live in Firestore.

---

## RFC numbering clarification

ADR-009 previously labeled Shopping Cart as “RFC-013” and deferred Checkout to a later number. That numbering is **superseded**.

| RFC / ADR | Topic |
| --------- | ----- |
| ADR-009 | Shopping Cart (already delivered in code) |
| **RFC-013 / ADR-010** | **Checkout Foundation** (this document) |
| RFC-014 | Orders (admin / lifecycle / listing) |
| RFC-015 | Mercado Pago |

ADR-008’s stop-line that reserved “RFC-013” for Orders/Checkout/Payments is likewise superseded by this split.

---

## Context from the current codebase

Inspection before this ADR found:

### Already in place

- **Cart** — Zustand + localStorage (`useCartStore`, selectors, `/cart`, `CartSummary` with disabled Checkout CTA).
- **Catalog** — `Product` / `Category` services; PDP → `AddToCartButton` with price snapshots.
- **Order types** — `src/features/orders/types/order.ts` (`Order`, `OrderItem`, `OrderPayment`, `OrderTotals`, statuses). **No `OrderService` yet.**
- **Customers types** — `CustomerProfile` / `CustomerAddress` exist; **no storefront Auth / guest profile service.**
- **StoreSettings** — `currency`, `locale`, `country`, `storeName`, `email`, `phone`, `shippingEnabled`, `maintenanceMode`.
- **Forms pattern** — Zod + controlled React state (admin forms). **React Hook Form is not installed.** Zod is already a dependency (`zod@^4`).
- **Shared UI** — `Button`, `Input`, `Select`, `Textarea`, `EmptyState`, `LoadingState`, `Card`, `Toast` (Toast currently wired under Admin shell only).
- **Checkout folder** — `src/features/checkout/.gitkeep` only.
- **Routing** — storefront under `app/(storefront)/`; no `/checkout` route yet.
- **Maintenance** — `AppLayout` already blocks storefront children when `maintenanceMode` is true.

### Gaps the Order model must close for Checkout

| Gap | Current | Required for guest Checkout |
| --- | ------- | --------------------------- |
| Fulfillment status for unpaid orders | `OrderStatus` includes `pending`, not `pending_payment` | Add `pending_payment` as the post-checkout unpaid status |
| Guest buyers | `customerId: string` required (comment already foreshadows optional) | Make `customerId` optional |
| Variants on lines | `OrderItem.selectedSize` / `selectedColor` required | Make optional (or default placeholders) — catalog v1 has no variants; `CartItem` has none |
| Customer phone | Only optional on `shippingAddress` | Capture phone on checkout; persist `customerPhone` + `shippingAddress.phone` |
| Shipping method identity | Only `totals.shipping` | Add a small `shippingMethod` snapshot (`id`, `label`, `cost`) for multi-method later |
| Customer-facing reference | Only Firestore document id | Persist `orderNumber` (e.g. `SF-YYYYMMDD-XXXX`); never show raw `id` in customer UX |
| Payment without provider | `OrderPayment.provider` required | Persist `payment.status: "pending"`; use intended provider id (`mercadopago`) as **intent**, not as “payment completed” |

---

## Why Checkout owns order creation

1. **Purchase intent is a Checkout concern** — The buyer submits customer + shipping + method + cart contents. That submission *is* order placement.
2. **Single write boundary** — One place maps `CartItem[]` + form data → `Order` document. Orders Admin (RFC-014) should list/update orders, not invent a second create path from the storefront.
3. **Payment is not required to create an order** — Commerce systems create an unpaid order first, then attach a provider session. Mercado Pago (RFC-015) should update `payment` / `status`, not redefine how lines and addresses are captured.
4. **Clean Architecture** — UI (`CheckoutForm`) → domain service (`OrderService.create`) → Firestore. Checkout never imports `firebase/*`.

```
CartStore (client)          StoreSettings (route props)
        │                            │
        ▼                            ▼
   CheckoutView / CheckoutForm
        │
        ▼
   OrderService.create(input)  →  orders/{orderId}
        │
        ├── clearCart()
        └── redirect /checkout/confirmation?orderId=…
```

**Why not Cart creating orders?** Cart has no network layer by design (ADR-009).  
**Why not a PaymentService creating orders?** Payments must not own catalog snapshots or shipping addresses.

---

## Why payment is intentionally separated

| Checkout (RFC-013) | Payments (RFC-015) |
| ------------------ | ------------------ |
| Collect buyer + shipping | Create provider preference / checkout |
| Snapshot line items | Attach `externalId` / redirect URL |
| Write `Order` with `payment.status: "pending"` | Move payment to `authorized` / `paid` / `failed` |
| Set `status: "pending_payment"` | Move order toward `paid` / `cancelled` |
| No Mercado Pago SDK | `MercadoPagoProvider` implements `PaymentProvider` |

Checkout leaves extension points only:

- `Order.payment.provider` = intended provider (`mercadopago` for this kit)
- `Order.payment.status` = `pending`
- Optional future hook after create: `startPayment(orderId)` — **not called in RFC-013**

This keeps Stripe/PayPal additions limited to a new provider implementation + status updates, without reshaping Checkout forms.

---

## Why Cart remains client state

Reaffirmed from ADR-009:

1. Guest-first — no storefront customer Auth yet.
2. Instant UX for add/update/remove.
3. Cart is **pre-purchase intent**, not a durable commercial record.
4. After Checkout succeeds, **Orders** replace the cart as the source of truth.

Checkout **reads** `useCartStore` / selectors. It must not duplicate items into a parallel Zustand checkout store. Form fields (name, email, address) are Checkout-local form state only.

### When `clearCart()` runs

| Moment | Clear? | Why |
| ------ | ------ | --- |
| User opens `/checkout` | No | Allow back-navigation to cart edits |
| Validation fails | No | Cart still needed |
| Firestore / network error | No | Buyer can retry without rebuilding the cart |
| **Order document created successfully** | **Yes** | Purchase is durable in Firestore; local cart would double-submit risk |
| After redirect to confirmation | Already cleared | Confirmation may show order id / summary from Order read or from create response held in memory for one render |

**Do not clear on “Pay” click before the write succeeds** — there is no pay step yet; the same rule applies when RFC-015 adds redirect: clear only after the unpaid order exists (or after an explicit durable reservation policy is designed).

---

## Why Orders become the system of record after Checkout

| Phase | Source of truth |
| ----- | --------------- |
| Browsing / cart | `CartStore` (localStorage) |
| After successful checkout submit | `orders/{orderId}` in Firestore |
| Fulfillment / admin / payments | Order document fields (`status`, `payment`, `totals`, snapshots) |

Cart snapshots (`CartItem.price`, name, image) are **display-time**. Order snapshots (`OrderItem`) are **purchase-time** and must remain immutable for history (already stated in `docs/firestore.md`).

Optional later hardening (out of scope for RFC-013): re-fetch products at submit to reject inactive/price-changed lines. Foundation may trust cart snapshots for v1 if documented as a known risk.

---

## Shipping method architecture (v1)

No shipping provider. No `settings/shipping` document yet.

Introduce a **Checkout-owned catalog of methods** (pure config / helper), not Firestore:

```ts
// Conceptual — not implementation
type ShippingMethod = {
  id: string;       // e.g. "standard"
  label: string;    // e.g. "Standard Shipping"
  cost: number;     // v1 constant (e.g. 0 or a fixed kit default)
};
```

v1 exposes a single method: **Standard Shipping**.

- If `shippingEnabled === false`, Checkout must not offer shipping methods (block or show clear empty/disabled state — open product decision).
- Method id/label/cost are copied onto the Order (`shippingMethod` + `totals.shipping`) so RFC-014/015 never re-derive them from live config.

Future methods (express, pickup) = extend the method list + Order snapshot; no Checkout rewrite.

---

## Validation strategy

**Keep Zod. Do not introduce React Hook Form in RFC-013.**

| Option | Verdict |
| ------ | ------- |
| **Zod + controlled form (chosen)** | Matches admin forms (ADR-008). Zod already installed. Field errors + form-level error + toast pattern already proven. |
| React Hook Form + Zod resolver | AGENTS.md lists RHF, but it is unused and not installed. Adding it only for Checkout creates two form architectures. Defer until a kit-wide forms RFC. |
| Manual `if` checks | Duplicates schemas; weaker typing. |

Recommend a dedicated `checkoutFormSchema` under `features/checkout` (customer + shipping + shippingMethodId). Parse with `safeParse` on submit; map issues to field errors.

---

## StoreSettings consumption (loose coupling)

Checkout route (Server Component) loads settings via `getStoreSettings()` — same pattern as `/cart`.

Pass **only what Checkout needs** as props:

| Prop | Source field | Use |
| ---- | ------------ | --- |
| `storeName` | `storeName` | Confirmation copy / page title context |
| `currency` | `currency` | Totals formatting + Order.currency snapshot |
| `locale` | `locale` | `formatPrice` |
| `country` | `country` | Default country field (editable) |
| `shippingEnabled` | `shippingEnabled` | Gate shipping method UI |
| Contact (optional) | `email` / `phone` | Help text / “questions?” — not required for order create |

Checkout components must **not** import `StoreSettingsService` or the full `StoreSettings` type into form internals if a narrow props bag suffices. That keeps Checkout testable and avoids treating settings as a global god-object.

---

## Error handling

| Failure | Surface |
| ------- | ------- |
| Zod validation | Inline field errors on `Input` (`error` prop). Focus first invalid field when practical. |
| Empty cart on `/checkout` | Empty state + CTA to shop / cart (no submit). |
| `OrderError` from service | User-facing form banner or toast: generic “We could not place your order. Please try again.” Map codes (`unavailable`, `permission-denied`, …) without leaking Firebase messages. |
| Network / unknown | Same friendly message; log `cause` internally in the service. |
| Maintenance mode | Already handled by `AppLayout` — Checkout is unreachable when maintenance is on. |

Never show raw Firestore / Firebase error strings in the UI.

Toast: either mount `ToastProvider` for the checkout route/layout island, or use an inline alert region consistent with admin `formError`. Prefer one pattern for the feature.

---

## Order model recommendations (sufficient with small extensions)

The existing Order shape is **mostly sufficient**. Checkout should **extend types + add `OrderService`**, not invent a parallel document model.

### Recommended type adjustments (RFC-013) — implemented

1. **`OrderStatus`**: add `"pending_payment"` (keep `"pending"` for compatibility).
2. **`customerId`**: optional — guest checkout omits.
3. **`OrderItem.selectedSize` / `selectedColor`**: optional until variants RFC.
4. **`shippingMethod`**: `{ id: string; label: string; cost: number }` on `Order`.
5. **`customerPhone`**: required string snapshot at order root (+ phone on shipping address).
6. **`orderNumber`**: human-friendly reference (`SF-YYYYMMDD-XXXX`); customer UX must not show Firestore `id`.
7. **`OrderPayment`**: on create — `{ provider: "mercadopago", status: "pending", amount: total, currency }` with no `externalId`.

### `OrderService` (new)

Mirror other domain services:

- `create(input: OrderCreateInput): Promise<Order>`
- Domain `OrderError` (never raw Firebase)
- Collection `orders`
- No React

Checkout maps cart + form → `OrderCreateInput`. RFC-014 adds `list`, `getById`, status transitions. RFC-015 updates `payment` fields.

---

## Future compatibility

| Future RFC | Checkout change expected |
| ---------- | ------------------------ |
| RFC-014 Orders | Minimal — Admin reads same `orders` docs; may add status transitions unrelated to Checkout form |
| RFC-015 Mercado Pago | After `create`, call `PaymentProvider.createCheckout(order)`; redirect; webhooks update Order. Form fields unchanged |
| Customer Auth | Prefill form from `CustomerProfile`; set `customerId` |
| Variants | Map selected size/color from enriched `CartItem` → `OrderItem` |
| `settings/shipping` | Replace static method list with settings-driven methods; snapshot still on Order |

Dependency rule:

- `features/checkout` → may import `features/cart` (selectors), `features/orders` (service/types), shared UI, `formatPrice`
- `features/cart` → must **not** import checkout or orders
- `features/orders` → must **not** import checkout UI or CartStore

---

## Scope of RFC-013

**In scope**

- `/checkout` route + confirmation surface
- Customer + shipping forms + Standard Shipping method
- Order summary from CartStore
- Zod validation
- `OrderService.create` + necessary Order type extensions
- Enable Cart → Checkout CTA
- `clearCart()` after successful create
- ADR-010

**Out of scope**

- Mercado Pago / any `PaymentProvider` implementation
- Admin Orders UI
- Inventory reservation / stock deduction
- Coupons, tax engines, real carrier rates
- Storefront customer Auth
- Firestore Security Rules hardening (must be tracked as a deploy risk)

---

## Consequences

### Positive

- End-to-end purchase foundation without blocking on payments.
- Clear handoff: Cart → Checkout → Order → (future) Payment.
- Reuses Design System and admin form validation patterns.
- Guest checkout works without `customers` documents.

### Risks

- Client-side order creates need Security Rules before production.
- Stale cart prices may be written into Order snapshots.
- Toast provider not yet on storefront shell.
- RFC numbering docs (ADR-008 / ADR-009) need a one-line cross-link update when this ADR is accepted.

---

## Success criteria

1. Guest with a non-empty cart can open `/checkout` from Cart Summary.
2. Guest can submit valid customer + shipping + Standard Shipping and receive a Firestore `orders` document with `status: "pending_payment"` and `payment.status: "pending"`.
3. Cart clears only after successful create; confirmation is reachable by `orderId`.
4. Empty cart cannot place an order.
5. Validation errors are inline; Firebase errors never appear raw.
6. No payment SDK or provider API calls.
7. Checkout code lives under `features/checkout`; persistence under `features/orders` service.
`)