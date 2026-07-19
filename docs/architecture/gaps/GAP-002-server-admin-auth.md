# GAP-002 — Server-side Admin auth

| Field | Value |
|-------|-------|
| Priority | **P0** |
| Status | `open` |
| Related | GAP-001, GAP-004, ADR-017 |

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

## Acceptance criteria

- [ ] Unauthenticated users cannot render Admin dashboard HTML meaningfully (server redirect)
- [ ] Forged client state alone cannot access Admin data paths once rules (GAP-001) + this land
- [ ] ADR or update to ADR-017 documenting the chosen session model
- [ ] Local + App Hosting smoke: admin login still works

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md).
