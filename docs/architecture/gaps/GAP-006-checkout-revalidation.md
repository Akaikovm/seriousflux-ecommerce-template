# GAP-006 — Checkout price & availability revalidation

| Field | Value |
|-------|-------|
| Priority | **P1** |
| Status | `open` |
| Related | ADR-010, GAP inventory validate already exists |

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

- [ ] Tampered unit prices cannot create cheaper orders
- [ ] Inactive / OOS products blocked (aligned with inventory validation)
- [ ] Documented in checkout ADR or brief update

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md).
