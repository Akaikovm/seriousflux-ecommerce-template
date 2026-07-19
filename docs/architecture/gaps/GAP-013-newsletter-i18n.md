# GAP-013 — Newsletter + i18n

| Field | Value |
|-------|-------|
| Priority | **P3** |
| Status | `open` |

## Problem

Newsletter UI fakes success locally. `locale` formats money but UI copy is hardcoded (mostly English).

## Goal

- Persist newsletter emails (collection or provider) with consent notes
- Lightweight copy strategy (dictionaries or later CMS) — not full i18n framework unless needed

## Scope

- Newsletter service + Admin export or list
- Decide ES/EN strategy for starter kit

## Out of scope

- Full CMS / translation vendor

## Acceptance criteria

- [ ] Newsletter submissions stored or sent to provider
- [ ] Documented language approach for client rebrands

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md).
