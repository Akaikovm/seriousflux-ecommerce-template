# GAP-005 — Minimal automated tests

| Field | Value |
|-------|-------|
| Priority | **P1** |
| Status | `open` |
| Related | RFC-023 inventory, payments, orders |

## Problem

Zero automated tests. Inventory commit/restore, payment status mapping, and order ownership are easy to regress.

## Goal

Add a thin, high-value suite (Vitest or Jest) + `npm test` script. Prefer pure unit tests first; optional integration later.

## Scope (MVP suite)

1. `resolveInventoryStatus` / `isPurchasable` / `maxPurchasableQuantity`
2. `commitSale` / `restoreSale` idempotency + shortfall behavior (mocked Firestore)
3. Order ownership helper / map-order payment status
4. Optional: payment provider registry selection

## Out of scope

- Full E2E Playwright of checkout (later)
- Snapshot-testing entire Admin UI

## Acceptance criteria

- [ ] `npm test` exists and runs in CI-friendly mode
- [ ] At least the inventory pure helpers + one service critical path covered
- [ ] Documented in README Scripts table

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md).
