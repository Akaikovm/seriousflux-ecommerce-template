# GAP-014 — First-admin bootstrap DX

| Field | Value |
|-------|-------|
| Priority | **P3** |
| Status | `open` |
| Related | GAP-002, seed:demo |

## Problem

After `seed:demo`, Admin still needs a manual Auth user + `customers/{uid}.role = admin`. Correct for security, painful for demos.

## Goal

Safer DX: documented script or Admin-only bootstrap that **cannot** be abused in production (e.g. one-time invite code, or script using Admin SDK locally).

## Scope

- `scripts/promote-admin.ts` (email → set role) using Admin SDK **or**
- Documented Console checklist only (if we reject scripts)
- Never: public signup → admin

## Out of scope

- Multi-tenant agency console

## Acceptance criteria

- [ ] Chosen approach documented in README next to seed:demo
- [ ] Production cannot self-elevate via signup
- [ ] Demo path under 2 minutes after seed

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md).
