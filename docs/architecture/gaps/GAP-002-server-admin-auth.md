# GAP-002 — Server-side Admin auth

| Field | Value |
|-------|-------|
| Priority | **P0** |
| Status | `done` |
| Related | GAP-001, GAP-004, ADR-017, ADR-025 |

## Problem

Admin protection is primarily a **client** gate (`RequireRole` / redirect). There is no Next.js `middleware` session cookie or custom-claims check. UI gating is not security.

## Goal

Protect `/admin/**` (and privileged API routes) with a **server-verified** session: Firebase ID token cookie and/or custom claims (`admin`), consistent with ADR-017 evolution.

## Scope

- Session strategy (cookie + verify on server)
- Middleware or layout server check for `/admin`
- Document first-admin still never auto-created via signup
- Optional: sync `role` → custom claims (Admin SDK)

## Out of scope

- Full staff permission matrix (editor vs viewer)
- Customer Account hardening beyond ownership already in services
- Custom claims (deferred; Firestore role remains source of truth)

## Acceptance criteria

- [x] Unauthenticated users cannot render Admin dashboard HTML meaningfully (server redirect)
- [x] Forged client state alone cannot access Admin data paths once rules (GAP-001) + this land
- [x] ADR or update to ADR-017 documenting the chosen session model → [ADR-025](../ADR-025-admin-session-cookie.md)
- [x] Local + App Hosting smoke: admin login still works

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md).

## Shipped (2026-07-22)

- httpOnly `__session` via `createSessionCookie` after Admin login
- `requireAdminSession()` on `/admin/(dashboard)` layout
- Logout clears cookie; custom claims still deferred
