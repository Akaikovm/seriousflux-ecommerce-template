# GAP-012 — Account depth (claim, addresses, wishlist)

| Field | Value |
|-------|-------|
| Priority | **P3** |
| Status | `open` |
| Related | ADR-018 |

## Problem

Guest orders stay unlinked; no address book; no wishlist. Account MVP is profile + own orders only.

## Goal

Incremental Account depth: claim guest order by email+orderNumber, addresses CRUD, optional wishlist.

## Scope

- Claim flow with ownership proof
- `customers.addresses` usage
- Wishlist collection or field (ADR first)

## Out of scope

- Full CRM / loyalty

## Acceptance criteria

- [ ] Each sub-feature has ADR or brief approval
- [ ] No breakage of guest checkout
- [ ] Admin customers still consistent

## When done

Mark `done` (or split statuses per sub-item) in [GAP-REGISTER.md](../GAP-REGISTER.md).
