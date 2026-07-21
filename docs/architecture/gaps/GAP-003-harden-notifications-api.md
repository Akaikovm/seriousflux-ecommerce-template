# GAP-003 — Harden notifications dispatch API

| Field | Value |
|-------|-------|
| Priority | **P0** |
| Status | `done` |
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

- [x] Unauthenticated public requests cannot send email
- [x] Existing order lifecycle emails still fire from trusted paths
- [x] Documented env var / setup in README or ADR-019

## Implementation notes (shipped)

- HTTP route requires `NOTIFICATIONS_DISPATCH_SECRET` (`x-notifications-dispatch-secret` or `Authorization: Bearer …`); fail closed if unset.
- Browser callers use `requestNotification` → `dispatchNotificationAction` with Firebase ID token authorization (welcome self-match, admin role for admin events, buyer/recent guest for `order.created`).
- Mercado Pago webhook continues to call `dispatchNotificationSafely` directly.
- ID token verification uses Identity Toolkit until GAP-004 (Admin SDK).

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md).
