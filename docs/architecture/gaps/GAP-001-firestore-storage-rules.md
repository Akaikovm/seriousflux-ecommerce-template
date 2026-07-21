# GAP-001 — Firestore + Storage security rules in-repo

| Field | Value |
|-------|-------|
| Priority | **P0** |
| Status | `done` |
| Related | GAP-002, GAP-004, ADR-024 |

## Problem

No committed `firestore.rules` / `storage.rules`. Local/dev often uses open rules. With the client Firebase SDK used from SSR, webhooks, and Admin UI, open rules mean anyone with the web API key can read/write collections.

## Goal

Ship production-grade rules in the repo (and document how to deploy them) so the starter kit is not insecure by default.

## Scope

- `firestore.rules` for `settings`, `categories`, `products`, `inventory`, `orders`, `customers`, `media` paths as applicable
- `storage.rules` for `media/` (admin write, public or authenticated read as designed)
- README / `docs/firestore.md` section: deploy rules, never leave open in production
- Align with identity: customers can read/update own profile; only `role == admin` for privileged writes **or** route privileged writes via Admin SDK (GAP-004)

## Out of scope

- Full custom-claims migration (GAP-002) — rules may start with token + Firestore role lookups if claims not ready; document tradeoffs
- Changing InventoryService public API

## Acceptance criteria

- [x] Rules files exist in repo and are referenced from README
- [x] Public can read active catalog/settings needed for storefront
- [x] Guests cannot invent admin role or mutate inventory/orders arbitrarily
- [x] Documented local-dev vs production rule posture
- [x] Smoke checklist for Auth admin CRUD still works with rules deployed

## When done

Mark status `done` in [GAP-REGISTER.md](../GAP-REGISTER.md). Prefer a short ADR (e.g. ADR-024) capturing the rules model.
