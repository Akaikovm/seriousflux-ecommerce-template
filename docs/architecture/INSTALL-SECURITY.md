# Agency install: Security rules + Firebase Admin (GAP-001 / GAP-004)

Practical handoff for humans and agents. Complements [ADR-024](./ADR-024-firestore-rules-admin-sdk.md).

> **Language:** repo docs and code stay in **English**. Chat with the agency can be any language.

---

## Problem we solved

With open rules, anyone holding the web API key could read/write Firestore.  
With locked rules, server paths (webhooks, Admin SSR, order emails) broke because they used the **client SDK with no Auth user**.

**Solution:**

1. **Rules** in-repo (`firestore.rules`, `storage.rules`) — browser access model.
2. **Firebase Admin SDK** on the server — trusted bypass of rules.

---

## Template vs client store

| Layer | Where it lives | Sold with the kit? |
|-------|----------------|--------------------|
| Next.js / features code | This repo | Yes — reusable engine |
| Demo brand “Serious Flux” | Seeds + code defaults | Demo only (`npm run seed:demo`) |
| Real client brand | Firestore `settings/general` + Admin Settings | Per Firebase project |
| Catalog / orders | That project’s Firestore | Per client |
| Secrets (Admin key, MP, Resend) | `.env.local` / App Hosting secrets | **Never** in Git |
| Firebase project | e.g. first client project id | One project (or fork) per install |

**Agency name (Serious Flux)** = kit / company.  
**First client store** = data in their Firebase project (settings, products), not hardcoded in TypeScript.

**Next client:** new Firebase project + new env + seed/import + Admin Settings. Same repo.

---

## Important files

| File | Role |
|------|------|
| `firestore.rules` / `storage.rules` | Security model |
| `firebase.json` | CLI points at those rules |
| `.firebaserc` | Active Firebase project alias |
| `src/firebase/admin.ts` | Admin SDK init (`server-only`) |
| `src/features/orders/services/order.admin.ts` | Privileged order writes/reads |
| `src/features/inventory/services/inventory.admin.ts` | Webhook stock commit/restore |
| `src/features/admin/lib/admin-server-data.ts` | Admin SSR loaders |
| `apphosting.yaml` | Maps `FIREBASE_SERVICE_ACCOUNT_KEY` secret |

**Never commit:** `.env.local`, `.secrets/`, `*firebase-adminsdk*.json`

---

## Local

1. Service account JSON at `.secrets/firebase-admin.json`
2. In `.env.local`:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=.secrets/firebase-admin.json
   ```
   (or `FIREBASE_SERVICE_ACCOUNT_KEY=` + one-line JSON)
3. `npm run dev`

With Admin configured, Admin SSR + webhooks + order emails work **even when rules are locked**.

### Storefront queries and rules

Public list/get queries must include `active == true` (Firestore rule constraint).  
`ProductService.getFeatured` / `getByCategory` / `getBySlug` and `CategoryService.getBySlug` do this. Filtering `active` only in memory is **not** enough and causes `permission-denied`.

---

## App Hosting

Typical setup:

- Secret: `FIREBASE_SERVICE_ACCOUNT_KEY`
- Backend id from `firebase apphosting:backends:list`
- Reference in `apphosting.yaml` (`RUNTIME`)

After pushing `apphosting.yaml`, create a **new rollout**.

Optional secrets:

```bash
firebase use <project-id>
firebase apphosting:secrets:set NOTIFICATIONS_DISPATCH_SECRET
firebase apphosting:secrets:set MERCADOPAGO_ACCESS_TOKEN
firebase apphosting:secrets:set MERCADOPAGO_WEBHOOK_SECRET
firebase apphosting:secrets:set RESEND_API_KEY
```

Then uncomment matching blocks in `apphosting.yaml`.

`NEXT_PUBLIC_*` and `NEXT_PUBLIC_APP_URL` (public HTTPS origin) → Console → App Hosting → Environment.

---

## Deploy security rules

```bash
firebase use <project-id>
firebase deploy --only firestore:rules,storage
```

| Target | Notes |
|--------|--------|
| Firestore rules | Deploy when Admin SDK is ready |
| Storage rules | Requires Storage enabled in Console → Storage → Get Started first |

### Smoke checklist after rules

- [ ] Storefront loads products / settings
- [ ] Checkout creates an order (guest or signed-in)
- [ ] Admin login + lists (products, orders)
- [ ] Admin edits product / uploads image
- [ ] Mercado Pago webhook marks paid (or sandbox)
- [ ] Order emails (if Resend enabled)

---

## Which SDK where

```
Browser (customer / signed-in admin)
  → Firebase client SDK + Security Rules

Server (webhook, preference, Admin SSR, emails)
  → Firebase Admin SDK (bypasses rules)
```

Do not re-export Admin modules from barrels imported by Client Components (`orders/services/index.ts` documents this).

---

## Sell-ready backlog

| GAP | Status |
|-----|--------|
| GAP-001 Rules | done |
| GAP-004 Admin SDK | done |
| GAP-003 Notifications API | done |
| GAP-002 Server admin auth | open |
| GAP-005 Tests | open |
| GAP-006 Checkout revalidation | open |

---

## Changelog

| Date | Note |
|------|------|
| 2026-07-22 | Rules + Admin SDK + App Hosting secret + install guide; order emails use Admin when configured |
| 2026-07-22 | Doc in English; storefront product/category queries constrain `active == true` for locked rules |
