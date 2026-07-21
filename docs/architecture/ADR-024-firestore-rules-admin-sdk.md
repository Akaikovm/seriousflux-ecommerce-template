# ADR-024 — Firestore / Storage rules + Firebase Admin boundary

**Status:** Accepted  
**Date:** 2026-07-21  
**Related:** GAP-001, GAP-004, ADR-017, ADR-019, ADR-023

## Context

The kit used the Firebase **client** SDK everywhere (browser, SSR, webhooks). Without committed Security Rules, production would rely on open rules. Locked rules break unauthenticated server writes (Mercado Pago webhook / preference) and Admin SSR list reads.

## Decision

1. **Commit** [`firestore.rules`](../../firestore.rules) and [`storage.rules`](../../storage.rules) (referenced from [`firebase.json`](../../firebase.json)).
2. **Admin role in rules** via `customers/{uid}.role == 'admin' && status == 'active'` until GAP-002 custom claims.
3. **Firebase Admin SDK** ([`src/firebase/admin.ts`](../../src/firebase/admin.ts)) for privileged server paths that must bypass rules:
   - Mercado Pago webhook + preference payment updates + inventory commit/restore
   - Admin dashboard SSR data loaders
   - Notification dispatch authorization reads (when configured)
4. **Client SDK** remains for:
   - Storefront public reads (active catalog, settings, inventory)
   - Checkout order create (constrained by rules)
   - Customer account self-service
   - Admin UI mutations while signed in as admin (rules enforce role)

## Credential setup

| Env | Use |
|-----|-----|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | JSON service account string (local / App Hosting secret) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to key file |
| ADC + `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | App Hosting / GCP default |

## Local vs production

| Posture | Rules | Admin SDK |
|---------|-------|-----------|
| Local open rules | Optional until first deploy of rules | Not required for storefront; required for Admin SSR once rules are locked |
| Production | Deploy rules | Required for webhooks + Admin SSR |

Seeds (`npm run seed:*`) write with the client SDK — use open rules locally or run seeds before locking rules / with a privileged path later.

## Consequences

- Deploying rules without Admin credentials will break Admin SSR and MP paid sync.
- GAP-002 should replace Firestore role lookups in rules with custom claims when ready.
- Order create remains client-side until a future checkout server route (GAP-006 adjacent).
- Notification order loads use Admin SDK when configured (server dispatch has no Auth user).

## Practical guide

Step-by-step for local + App Hosting + client vs template: [INSTALL-SECURITY.md](./INSTALL-SECURITY.md).
