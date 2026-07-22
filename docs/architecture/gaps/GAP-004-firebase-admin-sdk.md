# GAP-004 — Firebase Admin SDK for privileged server paths

| Field | Value |
|-------|-------|
| Priority | **P1** |
| Status | `done` |
| Related | GAP-001, GAP-002, GAP-003, ADR-024 |

## Problem

Server routes (webhooks, preference creation, notification dispatch, some SSR) use the **client** Firebase SDK. Privileged writes require open rules or weak rules.

## Goal

Introduce `firebase-admin` (or equivalent) for server-only modules: webhooks, inventory commit from webhook, order payment updates, claim/role sync, notification internals.

## Scope

- `src/firebase/admin.ts` (or similar) init from env / service account
- Migrate Mercado Pago webhook + other privileged writers
- Keep client SDK for browser Auth + appropriate public reads
- Document App Hosting secret setup

## Out of scope

- Rewriting all Client Components to stop using Firestore (Admin UI may stay client with rules, or move later)

## Acceptance criteria

- [x] Webhook path does not depend on open client rules for order/inventory updates
- [x] Secrets never shipped to the browser
- [x] ADR note on Admin vs client boundary

## Implementation notes (shipped)

- `firebase-admin` + `getAdminDb()` / `getAdminAuth()` / `getAdminStorage()` credential chain
- `AdminOrderService` + inventory admin helpers for webhook/preference
- Admin SSR loaders under `src/features/admin/lib/admin-server-data.ts` (gated by GAP-002 session)
- Admin image uploads via `uploadMediaAction` + Admin Storage
- See [ADR-024](../ADR-024-firestore-rules-admin-sdk.md) · [INSTALL-SECURITY](../INSTALL-SECURITY.md)

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md).
