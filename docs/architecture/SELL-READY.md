# Sell-ready & product path (SeriousFlux)

When the user asks **“¿está lista para vender?”**, **“sell-ready”**, **“punto para vender”**, or about **Shopify / self-serve / automático**, agents must read **this file first**, then `GAP-REGISTER.md`.

---

## Business path (intentional, phased)

### Phase 1 — Now (default): agency install

SeriousFlux is an **agency-installed ecommerce starter kit**.

| We do | We do **not** (Phase 1) |
|-------|-------------------------|
| Get a client → clone/configure the repo | Public “pay → instant store” with zero agency work |
| Firebase, env, domain, Mercado Pago, handoff | Multi-tenant hosted platform |
| Client gets a working store under their project | Compete with Shopify on self-serve UX **today** |

**Why Phase 1 first:** validate demand, ship real stores, keep complexity low. The kit must be **secure and installable by us** before we automate ourselves away.

### Phase 2 — Later (optional): self-serve / “plug and play”

**Aspiration (not a commitment):** if it becomes **reasonably easy** to offer something closer to Shopify — customer pays → provisioning runs → store is ready with little or no manual install — **that is desirable**.

| Rule | Meaning |
|------|---------|
| **Only if not complicated** | Do **not** force a SaaS platform while Phase 1 sell-ready is unfinished, or if multi-tenant + billing + provisioning is a multi-month rewrite. |
| **Reuse the kit** | Prefer automating *this* template (provision Firebase/project, seed, domain) over rebuilding commerce from scratch. |
| **Separate marketing site** | If we go self-serve, we need a **public website** (landing, pricing, checkout for *our* service) that can live in **another repo** — Serious Flux presents the offer; this repo remains the store engine. |
| **Revisit explicitly** | Self-serve starts only when someone says “evaluar Phase 2” / “SaaS path” and we write a short ADR or GAP for provisioning — not by drift. |

### Phase 3 — Full SaaS (even later, if ever)

Multi-tenant control plane, subscriptions, usage billing, support portal, etc. **Out of scope** until Phase 2 is proven cheap to operate.

```
Phase 1 (now)          Phase 2 (maybe)              Phase 3 (maybe later)
agency install    →    pay → auto provision    →    full SaaS ops
sell-ready GAPs        + marketing site             + multi-tenant depth
```

---

## Does this make sense?

**Yes.** Classic agency → product ladder:

1. Sell installs → learn what clients need.  
2. Automate the painful install steps only when they are clear and repeatable.  
3. Add a marketing site when you want inbound “buy without calling us”.  
4. Don’t build Shopify on day one — you’ll delay the first client.

Phase 2 is a **door we keep open**, not the current build target.

---

## Definition of “ready to sell” (Phase 1)

> A client can pay Serious Flux to **set up this repo** on their Firebase / domain, go live with catalog + checkout + admin, without critical security holes — with agency support for install and go-live.

It does **not** mean: anyone can buy online and self-install without us.

---

## Status summary

| Layer | Status | Notes |
|-------|--------|-------|
| Demo / pitch | **Ready** | Storefront + admin + `seed:demo` |
| Phase 1 agency sell / install | **Almost** | Security must-haves 1–4 done; blocked on GAP-005 + GAP-006 |
| Phase 2 self-serve / plug-and-play | **Parked** | Revisit only if low complexity; needs marketing site + provisioning design |
| Phase 3 full SaaS | **Out of scope** | — |

Update Phase 1 when must-have GAPs are `done`.

---

## Must-have before first paid client install (Phase 1)

| # | Must-have | GAP | Status |
|---|-----------|-----|--------|
| 1 | Firestore + Storage security rules in-repo + deploy docs | [GAP-001](./gaps/GAP-001-firestore-storage-rules.md) | done |
| 2 | Firebase Admin SDK for webhooks / privileged writes | [GAP-004](./gaps/GAP-004-firebase-admin-sdk.md) | done |
| 3 | Server-side Admin auth (not UI-only gate) | [GAP-002](./gaps/GAP-002-server-admin-auth.md) | done |
| 4 | Harden notifications dispatch API | [GAP-003](./gaps/GAP-003-harden-notifications-api.md) | done |
| 5 | Checkout price + availability revalidation | [GAP-006](./gaps/GAP-006-checkout-revalidation.md) | open |
| 6 | Minimal automated tests (critical paths) | [GAP-005](./gaps/GAP-005-automated-tests.md) | open |

**Phase 1 sell-ready = all six `done`.**

Nice-to-have for smoother installs (not blocking the first sale):

| # | Nice-to-have | GAP | Status |
|---|--------------|-----|--------|
| A | First-admin bootstrap DX | [GAP-014](./gaps/GAP-014-admin-bootstrap-dx.md) | open |
| B | Install / handoff runbook (below) | this doc | open |

---

## Explicitly NOT required to sell (Phase 1)

Do **not** block a sale on: reservations, variants, Stripe/PayPal, wishlist, full i18n, advanced shipping, or building the marketing SaaS site.

Client gets: branding + catalog + cart + checkout (MP and/or COD) + orders + admin + inventory MVP + email if configured.

---

## Agency install package (what you sell in Phase 1)

1. Repo (private copy or licensed use)  
2. Firebase project (Auth, Firestore, Storage, rules)  
3. Env + hosting  
4. Branding via Settings  
5. Catalog (seed or import)  
6. Mercado Pago (+ webhook)  
7. First admin  
8. Handoff (products, orders, maintenance)

Optional upsells: theme polish, shipping methods, variants, Stripe, migrations.

---

## Phase 2 sketch (only when we reopen it)

If we evaluate “plug and play”, expect roughly:

| Piece | Where it lives | Notes |
|-------|----------------|-------|
| Marketing / pricing / “Buy” | **Separate site** (you can build it) | Not required inside this ecommerce template |
| Payment for *Serious Flux service* | That marketing site + billing | Different from store Mercado Pago |
| Provisioning | Scripts / Admin SDK / CI | Create project or tenant, seed, set admin |
| This repo | Store engine per client (or tenant) | Still the commerce product |

**Gate before building Phase 2:** Phase 1 sell-ready done + written estimate that provisioning is achievable without a platform rewrite. If it’s hard → stay on agency installs longer.

Possible future artifact: `GAP-015` or ADR “Self-serve provisioning” — **do not create until Phase 2 is explicitly started**.

---

## Install runbook (Phase 1 draft)

1. Create Firebase project (Blaze if App Hosting)  
2. Enable Auth (Email + Google), Firestore, Storage  
3. Deploy **rules** from repo (GAP-001)  
4. Configure `.env` / secrets (incl. Admin SDK — GAP-004)  
5. `npm run seed:demo` **or** client catalog  
6. Create first admin (GAP-014 / manual)  
7. Mercado Pago webhook → live URL  
8. Smoke: browse → cart → COD or MP sandbox → Admin order → stock  
9. Hand off Admin URL + docs  

Status: **draft** until P0 GAPs land.

---

## How to ask the agent

| You say | Agent does |
|---------|------------|
| “¿Está lista para vender?” / “sell-ready?” | This file → Phase 1 checklist status |
| “Avancemos lo de vender” | Next open must-have GAP |
| “¿Y lo de Shopify / automático / Phase 2?” | Explain parked path; do **not** start SaaS unless asked to evaluate |
| “Evaluar Phase 2” | Complexity/ADR sketch only — no big build by default |
| “GAP-001” | That gap only |

---

## Related docs

- [GAP-REGISTER.md](./GAP-REGISTER.md)  
- [README.md](../../README.md)  
- [ADR-023](./ADR-023-inventory-stock-management.md)  

---

## Changelog

| Date | Note |
|------|------|
| 2026-07-21 | GAP-001 + GAP-004 marked done (rules + Admin SDK) |
| 2026-07-21 | GAP-003 notifications dispatch hardening marked done |
| 2026-07-19 | Created: Phase 1 agency sell checklist |
| 2026-07-19 | Documented Phase 2 optional plug-and-play + separate marketing site; Phase 3 parked |
