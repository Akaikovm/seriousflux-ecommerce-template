# GAP-008 — Inventory reservations

| Field | Value |
|-------|-------|
| Priority | **P2** |
| Status | `open` |
| Related | ADR-023 (accepted oversell window for MVP) |

## Problem

ADR-023 accepts no reservation between checkout validate and paid `commitSale`. Concurrent buyers can oversell → `shortfall`.

## Goal

Optional reservation / soft-hold for `pending_payment` with TTL and release on cancel/expire — without breaking InventoryService public API where possible.

## Scope

- Design ADR amendment or ADR-024 inventory reservations
- Hold quantity or separate `reserved` field
- Expiry job or lazy release on read/commit
- Keep shortfall as fallback for edge cases

## Out of scope

- Multi-warehouse (separate evolution)

## Acceptance criteria

- [ ] ADR updated / new ADR accepted before code
- [ ] Concurrent checkout for last unit cannot both succeed unpaid forever
- [ ] Expired holds restore sellable quantity
- [ ] Existing commit/restore/shortfall semantics remain coherent

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md).
