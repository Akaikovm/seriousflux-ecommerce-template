# ADR-025 — Admin server session cookie (GAP-002)

**Status:** Accepted  
**Date:** 2026-07-22  
**Related:** GAP-002, GAP-001, GAP-004, ADR-017, ADR-024

## Context

Admin dashboard protection was client-only (`RequireRole`). Server Components under `/admin/(dashboard)` load privileged data via the Admin SDK (GAP-004) with no caller check, so unauthenticated requests could still receive Admin HTML/data.

## Decision

1. After a successful Admin login (client Auth + Firestore `role=admin` / `status=active`), exchange the Firebase **ID token** for an httpOnly **`__session`** cookie via `auth.createSessionCookie` (Admin SDK).
2. Gate [`src/app/admin/(dashboard)/layout.tsx`](../../src/app/admin/(dashboard)/layout.tsx) with `requireAdminSession()` (`verifySessionCookie` + re-check active admin in `customers/{uid}`). Fail → `redirect("/admin/login")`.
3. Clear `__session` on `signOut` (`clearAdminSessionAction`).
4. Keep client `RequireRole` for UX only. Security = session cookie + Firestore/Storage rules.
5. **First admin is never auto-created** by signup / Google bootstrap (unchanged from ADR-017). Promote via Console or Admin Customers UI.
6. **Custom claims deferred** — rules and session checks continue to use Firestore `customers/{uid}` until a later pass.

## Cookie details

| Property | Value |
|----------|-------|
| Name | `__session` |
| httpOnly | true |
| secure | true in production |
| sameSite | `lax` |
| path | `/` |
| Max age | 5 days |

## Consequences

- Firebase `createSessionCookie` requires a **recent** sign-in (`auth_time` within ~5 minutes). Stale client Auth alone may fail cookie minting; user must sign in again on `/admin/login`.
- App Hosting / local Admin login requires Admin SDK credentials (same as GAP-004).
- Middleware on the Edge is not used in this MVP (layout gate is enough for App Router SSR).

## Implementation map

| Piece | Location |
|-------|----------|
| `getAdminAuth` | `src/firebase/admin.ts` |
| Cookie helpers | `src/features/auth/lib/admin-session.ts` |
| Server actions | `src/features/auth/lib/admin-session-actions.ts` |
| Login wire-up | `src/features/auth/components/AdminLoginForm.tsx` |
| Logout clears cookie | `src/features/auth/providers/AuthProvider.tsx` |
| Dashboard gate | `src/app/admin/(dashboard)/layout.tsx` |
