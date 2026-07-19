# GAP-004 — Firebase Admin SDK for privileged server paths

| Field | Value |
|-------|-------|
| Priority | **P1** |
| Status | `open` |
| Related | GAP-001, GAP-002, GAP-003 |

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

- [ ] Webhook path does not depend on open client rules for order/inventory updates
- [ ] Secrets never shipped to the browser
- [ ] ADR note on Admin vs client boundary

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md).
