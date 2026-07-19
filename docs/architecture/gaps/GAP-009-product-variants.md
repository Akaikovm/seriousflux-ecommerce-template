# GAP-009 — Product variants

| Field | Value |
|-------|-------|
| Priority | **P2** |
| Status | `open` |
| Related | ADR-023 warehouse/variant-ready API notes |

## Problem

Catalog is single SKU per product. Order items reserve size/color fields but PDP has no selectors; stock is product-level only.

## Goal

Optional variants (size/color) with stockable ids behind InventoryService (`inventory/{stockableId}` or equivalent).

## Scope

- Product model evolution + Admin UX
- Storefront selectors
- Checkout line snapshots with selected options
- Inventory keyed by stockable id

## Out of scope

- Infinite options matrices / configurators

## Acceptance criteria

- [ ] Architecture ADR approved before implementation
- [ ] Non-variant products keep working
- [ ] InventoryService remains the only stock mutator

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md).
