# GAP-003 — Harden notifications dispatch API

| Field | Value |
|-------|-------|
| Priority | **P0** |
| Status | `open` |
| Related | ADR-019, GAP-004 |

## Problem

`POST /api/notifications/dispatch` is reachable without strong auth (Zod validation only). Abuse can spam Resend / customers.

## Goal

Ensure only trusted server callers (webhooks, checkout server actions/routes, authenticated admin ops) can dispatch.

## Scope

- Auth model: shared secret header, App Check, verified Firebase session, or internal-only invocation pattern
- Rate limiting / idempotency notes where cheap
- Update ADR-019 with the hardening decision

## Out of scope

- New email providers
- Redesigning templates

## Acceptance criteria

- [ ] Unauthenticated public requests cannot send email
- [ ] Existing order lifecycle emails still fire from trusted paths
- [ ] Documented env var / setup in README or ADR-019

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md).
