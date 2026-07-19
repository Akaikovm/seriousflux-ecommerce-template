# GAP-007 — Real shipping methods from Settings

| Field | Value |
|-------|-------|
| Priority | **P2** |
| Status | `open` |
| Related | settings shipping stub today |

## Problem

Checkout uses a single free “Standard” stub. Settings only toggle `shippingEnabled`.

## Goal

Configurable shipping methods (id, label, cost, optional countries) from Settings / `settings/shipping` or nested general config — Admin editable.

## Scope

- Data model + Admin Settings section
- Checkout method picker when >1 method
- Order snapshot already supports `shippingMethod`

## Out of scope

- Carrier APIs / live rates
- Complex zone matrices (v1 can be flat methods)

## Acceptance criteria

- [ ] Admin can define ≥1 method with cost
- [ ] Checkout uses selected method cost in totals
- [ ] Storefront respects `shippingEnabled`

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md); write ADR if model splits `settings/shipping`.
