# GAP-006 — Checkout price & availability revalidation

| Field | Value |
|-------|-------|
| Priority | **P1** |
| Status | `done` |
| Related | ADR-010, GAP inventory validate already exists, ADR-023 |

## Problem

Cart can trust client-side prices; inventory is validated at checkout but price revalidation may still be weak. Buyers could manipulate cart state.

## Goal

Before creating an order / starting payment: re-load products from Firestore, recompute line totals, reject if price or availability changed.

## Scope

- Server or service-layer revalidation in checkout path
- Clear UX error: “price updated, review cart”
- Keep InventoryService as stock authority

## Out of scope

- Coupons / tax engines
- Multi-currency conversion

## Acceptance criteria

- [x] Tampered unit prices cannot create cheaper orders
- [x] Inactive / OOS products blocked (aligned with inventory validation)
- [x] Documented in checkout ADR or brief update

## Shipped (2026-07-22)

- [`revalidateCheckoutCart`](../../../src/features/checkout/lib/revalidate-checkout-cart.ts) loads live products, checks stock via `InventoryService`, compares unit prices, builds `OrderItem[]` from catalog
- [`CheckoutForm`](../../../src/features/checkout/components/CheckoutForm/CheckoutForm.tsx) uses revalidated lines only; on `priceUpdated` syncs cart snapshots + shows i18n error
- Stock-only helper [`validateCheckoutInventory`](../../../src/features/inventory/lib/validate-checkout-inventory.ts) remains for inventory-focused callers

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md).
