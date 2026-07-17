# ADR-011: Order Management (Admin)

**Status:** Accepted  
**Date:** 2026-07-17  
**RFC:** RFC-014 (Orders Management)  
**Depends on:** ADR-004 (Admin Dashboard), ADR-008 (Admin Management), ADR-010 (Checkout), Firestore model (`docs/firestore.md`)  
**Enables:** RFC-015 (Mercado Pago), future customer order history, inventory deduction

---

## Approved adjustments (implementation)

1. **Payment → order sync** — Whenever `payment.status` becomes `"paid"`, set order `status` to `"paid"` if still awaiting payment. Same rule for future webhooks.
2. **Cancel after paid** — `cancelled` allowed while `payment.status` remains `"paid"`. Refunds are separate (`payment.status`).
3. **No dashboard metrics** in RFC-014.
4. **Search** — order number, customer name, customer email.
5. **Editable admin notes** on detail (`Order.notes`, internal only).
6. **Terminal status** — write `completed` only; read legacy `delivered` as completed.
7. **Validated transitions** — `pending_payment → paid → processing → shipped → completed`; cancel from `pending_payment` and `paid` only.
8. **Order summary** section at top of detail.
9. **Payment information** section reserved (provider, status, transaction id, paid at) for Mercado Pago completion.

---

## Decision

Orders are a **domain-owned feature** under `src/features/orders`.

| Concern | Owner |
| ------- | ----- |
| Order persistence + lifecycle transitions | `OrderService` (`features/orders`) |
| Order types / status vocabulary | `features/orders/types` |
| Admin list + detail + status UI | `features/admin/orders` |
| Purchase creation (guest checkout) | `features/checkout` → `OrderService.create` only |
| Payment provider capture / refunds | **Out of scope** — deferred to RFC-015 |
| Emails / invoices | **Out of scope** |

Admin pages never import Firebase. Only `OrderService` talks to Firestore.

---

## Why Orders own their own service

1. **Single ownership of the commercial record** — An order is not a product, not a cart line, and not a payment session. Persistence rules, mapping, validation, and status transitions belong in one place (`OrderService`), matching ADR-008’s “every entity owns its own service” rule.
2. **Shared by Checkout and Admin** — Checkout already calls `OrderService.create`. Admin must call the same service for `list` / `getById` / status updates so storefront and back office never diverge on document shape.
3. **No Admin god-service** — An `AdminOrderService` that wraps Firestore would duplicate Checkout’s write path and break Clean Architecture. Admin UI → domain service → Firebase, same as Products / Categories / Settings.
4. **Domain errors stay stable** — `OrderError` already wraps Firebase failures for Checkout. Admin reuses the same error surface; UI never depends on Firestore error codes.

---

## Why Checkout creates Orders

Reaffirmed from ADR-010:

1. **Purchase intent is Checkout** — Customer + shipping + cart snapshots become an unpaid order.
2. **One create boundary** — Admin manages lifecycle; it does not invent a second storefront create path.
3. **Payment is not required to create** — RFC-013 already writes `status: "pending_payment"` and `payment.status: "pending"`. RFC-015 attaches provider ids and moves payment status; it does not redefine order creation.

Cart remains client state (ADR-009). After `create` succeeds, **Orders are the system of record**.

---

## Why Admin manages lifecycle

1. **Operational work lives in the dashboard** — Mark paid (manual until Mercado Pago), move to processing / shipped / completed, cancel. That is fulfillment ops, not checkout UX.
2. **Nav already anticipates this** — `ADMIN_NAV_ITEMS` includes Orders as a disabled placeholder (ADR-004 / RFC-011). RFC-014 enables it.
3. **Read + transition, not redesign** — Reuse Admin shell, `DataTable`, `Badge`, `Select`, `Input`, Toast, and the Page → Table / Detail → Service flow from ADR-008.

Admin must **not**:

- Call Mercado Pago APIs
- Send emails
- Generate invoices
- Mutate immutable snapshots (`items`, `shippingAddress`, `shippingMethod`, `totals` money fields) except via explicit future RFCs

---

## Why Payments remain independent

| Orders (RFC-014) | Payments (RFC-015) |
| ---------------- | ------------------ |
| List / detail / filter | Create provider checkout session |
| Manual `payment.status` updates (ops) | Automated status via provider + webhooks |
| Fulfillment `status` transitions | Attach `externalId` / `transactionId` / `paidAt` |
| No payment SDK | `MercadoPagoProvider` implements `PaymentProvider` |

`Order.payment` is a **metadata slot** on the order document, not a payment module.

- Checkout sets intent (`provider`, `status: "pending"`, `amount`, `currency`).
- Admin may set payment status manually for ops before provider integration.
- RFC-015 owns provider calls and should prefer updating payment fields through `OrderService` (or a thin Payment orchestration that still persists via Orders), never by writing Firestore from UI.

Keeping payments independent preserves Stripe / PayPal later without reshaping Admin order screens.

---

## Order lifecycle (recommended)

### Fulfillment / order `status`

Keep a **single order-level status** (already on `Order.status`) that gates fulfillment after payment:

```
pending_payment → paid → processing → shipped → completed
                 ↘ cancelled
```

| Status | Meaning |
| ------ | ------- |
| `pending_payment` | Created at Checkout; unpaid (RFC-013) |
| `paid` | Payment confirmed (manual in RFC-014; provider in RFC-015) |
| `processing` | Being prepared / packed |
| `shipped` | Handed to carrier / left warehouse |
| `completed` | Delivered / closed successfully |
| `cancelled` | Terminal cancel (from unpaid or paid states under rules) |

**Compatibility with the current type union**

| Existing | Decision |
| -------- | -------- |
| `pending_payment` | Keep — Checkout create status |
| `pending` | Keep as **legacy alias** only; do not write from Admin; treat like `pending_payment` in filters/UI |
| `paid` / `processing` / `shipped` / `cancelled` | Keep |
| `delivered` | **Prefer `completed`** as the canonical terminal success status. Map `delivered` → display as Completed; stop writing `delivered` from Admin. Optionally remove from the write vocabulary in this RFC (read still accepts it). |
| `refunded` on `OrderStatus` | **Do not use as fulfillment status.** Refunds live on `payment.status: "refunded"`. Order `status` may stay `cancelled` or remain at prior fulfillment state; document the rule in service transitions. |

**Why not split into separate `fulfillmentStatus` field now?**  
The document already uses `status` + `payment.status`. Adding a third parallel enum without a migration plan increases Admin and Checkout surface area. Dual fields are enough for RFC-014 / RFC-015.

### Payment `payment.status`

| Status | Meaning |
| ------ | ------- |
| `pending` | Awaiting payment (Checkout default) |
| `paid` | Captured / confirmed |
| `failed` | Attempt failed (manual or future webhook) |
| `refunded` | Refunded (manual until provider refunds) |

Keep existing `authorized` in the type for RFC-015; Admin UI need not expose it in RFC-014.

### Transition rules (service-owned)

`OrderService` validates transitions. Invalid transitions throw `OrderError` with `invalid-input` (or a dedicated `invalid-transition` code if added).

Recommended allowed moves (v1):

- `pending_payment` → `paid` | `cancelled`
- `paid` → `processing` | `cancelled`
- `processing` → `shipped` | `cancelled`
- `shipped` → `completed`
- `completed` / `cancelled` → no further fulfillment changes
- When Admin sets order `status` to `paid`, also set `payment.status` to `paid` and `payment.paidAt` if still pending (keeps fields consistent before Mercado Pago)
- Payment-only updates (`pending` → `paid` | `failed` | `refunded`) allowed without forcing fulfillment jump, except `paid` payment should encourage / optionally auto-advance order from `pending_payment` → `paid`

Exact auto-sync behavior is an open product question; the service must not leave `status: pending_payment` with `payment.status: paid` without a documented rule.

---

## Timeline / history

**Recommendation for RFC-014: derived timeline UI, no event subcollection yet.**

| Approach | Verdict |
| -------- | ------- |
| Full `orders/{id}/events` audit trail | Deferred — already listed in `docs/firestore.md` as future scalability |
| Append-only `statusHistory[]` on the order doc | Optional later if ops need “who changed what”; not required for first Admin detail |
| **Derived timeline from known fields** | **Chosen for RFC-014** |

Derived events the detail page can show without new writes:

1. **Order created** — `createdAt` + `orderNumber`
2. **Payment status** — current `payment.status` (+ `paidAt` when present)
3. **Fulfillment status** — current `status` (+ `updatedAt` as last change hint)

**Why not persist history now**

- Checkout and Admin do not yet need audit for compliance.
- Writing events on every update doubles write cost and requires Admin attribution (Auth user id) we have not designed.
- Firestore already deferred nested order events; inventing a half-history array without actors/timestamps conventions creates tech debt before payments land.
- A derived timeline still satisfies “Order timeline” on the detail page for v1.

When payments + multi-admin ops need audit, add `orders/{id}/events` (or `statusHistory`) in a dedicated RFC.

---

## List / search / filter strategy

Admin catalog lists today use `listAll()` + client table (no cursor pagination). `DataTable` has a **footer slot only** — no pagination controls.

**RFC-014 recommendation**

1. `OrderService.listAll()` (or `list({ status? })`) ordered by `createdAt` DESC.
2. Client-side search by `orderNumber` and `customerName` (and optionally email) — matches product admin scale assumptions and avoids composite indexes for substring search.
3. Client-side or query filter by order `status` (and optionally `payment.status`).
4. Pagination: **defer real cursor pagination**. Use DataTable `footer` for count / “showing N” like products. If order volume grows, add `limit` + `startAfter` in a follow-up.

Suggested Firestore indexes when server-side status filter ships: `status` + `createdAt` DESC (already noted in `docs/firestore.md`).

---

## Architecture diagram

```
Admin /admin/orders (+ /[id])
        │
        ▼
features/admin/orders (tables, detail, status controls)
        │
        ▼
OrderService (list / getById / updateStatus / updatePaymentStatus)
        │
        ▼
Firestore orders/{orderId}

Checkout (unchanged create path)
        │
        ▼
OrderService.create  →  same collection
```

Dependency rules:

- `features/admin/orders` → may import `features/orders` (service/types), shared UI, `formatPrice`, admin shell primitives
- `features/orders` → must **not** import admin UI or checkout UI
- `features/checkout` → continues to call `create` only; no Admin imports

---

## Error handling

Continue `OrderError`. Never surface raw Firebase / Firestore messages in Admin UI.

Map codes to toast / inline copy (same pattern as `AdminProductsTable`).

---

## Scope of RFC-014

**In scope**

- Enable Admin Orders nav
- Orders list (columns + search + status filter)
- Order detail page `/admin/orders/[id]`
- Status + payment status updates via `OrderService`
- Extend Order types / lifecycle vocabulary as decided above
- ADR-011
- Docs touch: `docs/firestore.md` status wording if `completed` is adopted

**Out of scope**

- Mercado Pago / any `PaymentProvider`
- Emails, invoices, PDF receipts
- Inventory reservation / stock deduction
- Customer-facing order history
- Persisted audit event subcollection
- Security Rules hardening (tracked risk; unchanged from prior ADRs)

---

## Consequences

### Positive

- Complete ops loop: Checkout → Order document → Admin lifecycle
- Clear handoff into RFC-015 without Admin rewrite
- Reuses Admin management patterns (ADR-008) and Checkout order model (ADR-010)

### Risks

- Client-side list/search will not scale to very large order volumes (acceptable for starter kit v1)
- Manual payment status can diverge from future provider webhooks — document Admin as temporary source of truth until RFC-015
- Status vocabulary cleanup (`delivered` vs `completed`, `refunded` on order vs payment) must be applied carefully to avoid ambiguous filters

---

## Success criteria

1. Admin can open `/admin/orders` and see orders created at Checkout.
2. List shows order number, customer name, date, total, payment status, fulfillment status.
3. Search by order number and customer name works; status filter works.
4. `/admin/orders/[id]` shows customer, shipping, lines, totals, shipping method, payment, order number, and technical Firestore id.
5. Admin can update fulfillment and payment status through `OrderService` only.
6. No Firebase imports in Admin UI; no payment SDK; no email/invoice code.
7. Domain errors only in the UI failure path.
`)