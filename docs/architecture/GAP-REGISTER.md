# Production gap register (SeriousFlux starter kit)

**Purpose:** Track known weaknesses and deferred work so we can fix them deliberately (one GAP at a time), not as random drive-by refactors.

**Not ADRs.** ADRs record decisions already made. These are **GAP briefs** — open problems with priority, scope, and acceptance criteria. When a GAP is implemented, write or update an ADR and mark the GAP `done`.

**How to use (humans + agents):**
1. Open this register first when the user asks “what’s next?”, “harden production”, or “fix the gaps”.
2. Pick the highest-priority GAP with status `open` (or the one the user names).
3. Read `docs/architecture/gaps/GAP-XXX-….md` before coding.
4. Propose approach → get approval if architectural → implement → mark status `done` here and in the brief.
5. Do **not** invent new mega-features while P0/P1 security GAPs are open unless the user explicitly prioritizes product work.

---

## Priority legend

| Priority | Meaning |
|----------|---------|
| **P0** | Blocks safe production / client handoff |
| **P1** | High risk or high leverage before first paid client |
| **P2** | Product commerce depth (still important for kit maturity) |
| **P3** | Nice-to-have / later providers / polish |

| Status | Meaning |
|--------|---------|
| `open` | Not started |
| `in_progress` | Actively being worked |
| `done` | Shipped; keep brief for history |
| `deferred` | Consciously postponed |

---

## Register

| ID | Priority | Status | Title | Brief |
|----|----------|--------|-------|-------|
| GAP-001 | P0 | open | Firestore + Storage security rules in-repo | [gaps/GAP-001-firestore-storage-rules.md](./gaps/GAP-001-firestore-storage-rules.md) |
| GAP-002 | P0 | open | Server-side Admin auth (middleware / session / claims) | [gaps/GAP-002-server-admin-auth.md](./gaps/GAP-002-server-admin-auth.md) |
| GAP-003 | P0 | open | Harden notifications dispatch API | [gaps/GAP-003-harden-notifications-api.md](./gaps/GAP-003-harden-notifications-api.md) |
| GAP-004 | P1 | open | Firebase Admin SDK for privileged server paths | [gaps/GAP-004-firebase-admin-sdk.md](./gaps/GAP-004-firebase-admin-sdk.md) |
| GAP-005 | P1 | open | Minimal automated tests (inventory, payments, ownership) | [gaps/GAP-005-automated-tests.md](./gaps/GAP-005-automated-tests.md) |
| GAP-006 | P1 | open | Checkout price & availability revalidation | [gaps/GAP-006-checkout-revalidation.md](./gaps/GAP-006-checkout-revalidation.md) |
| GAP-007 | P2 | open | Real shipping methods from Settings | [gaps/GAP-007-shipping-methods.md](./gaps/GAP-007-shipping-methods.md) |
| GAP-008 | P2 | open | Inventory reservations (close oversell window) | [gaps/GAP-008-inventory-reservations.md](./gaps/GAP-008-inventory-reservations.md) |
| GAP-009 | P2 | open | Product variants (size/color + stockable ids) | [gaps/GAP-009-product-variants.md](./gaps/GAP-009-product-variants.md) |
| GAP-010 | P3 | open | Stripe / PayPal providers | [gaps/GAP-010-stripe-paypal.md](./gaps/GAP-010-stripe-paypal.md) |
| GAP-011 | P3 | open | Payment capture / refund implementations | [gaps/GAP-011-payment-capture-refund.md](./gaps/GAP-011-payment-capture-refund.md) |
| GAP-012 | P3 | open | Guest order claiming + address book / wishlist | [gaps/GAP-012-account-depth.md](./gaps/GAP-012-account-depth.md) |
| GAP-013 | P3 | open | Newsletter subscribe + i18n / copy system | [gaps/GAP-013-newsletter-i18n.md](./gaps/GAP-013-newsletter-i18n.md) |
| GAP-014 | P3 | open | First-admin bootstrap DX (documented, still manual-safe) | [gaps/GAP-014-admin-bootstrap-dx.md](./gaps/GAP-014-admin-bootstrap-dx.md) |

---

## Recommended sequence

```
GAP-001 rules
  → GAP-004 Admin SDK (often with 001/002)
  → GAP-002 server admin auth
  → GAP-003 harden notifications API
  → GAP-005 tests
  → GAP-006 checkout revalidation
  → GAP-007 shipping
  → GAP-008 / GAP-009 (commerce depth)
  → GAP-010+ (providers & polish)
```

Security first (001–004), then quality (005–006), then product depth.

---

## Related docs

- README “Deferred / not production-ready yet”
- [`docs/firestore.md`](../firestore.md)
- [`ADR-023`](./ADR-023-inventory-stock-management.md) (inventory MVP + accepted oversell window until GAP-008)
- [`ADR-017`](./ADR-017-identity-foundation.md) (roles; claims deferred → GAP-002)
- [`ADR-019`](./ADR-019-notification-system.md) (dispatch API → GAP-003)

---

## Changelog

| Date | Note |
|------|------|
| 2026-07-19 | Initial register created from post-RFC-023 readiness review |
