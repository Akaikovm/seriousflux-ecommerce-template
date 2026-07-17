# ADR-016: Mercado Pago Checkout Pro & Webhooks

**Status:** Accepted  
**Date:** 2026-07-18  
**RFC:** RFC-016 / RFC-016.1 / RFC-016.2 / RFC-016.5  
**Depends on:** ADR-010 (Checkout), ADR-011 (Orders), payment provider abstraction  
**Enables:** Production card payments; future Stripe/PayPal providers behind the same interface

---

## Decision

Mercado Pago is the first live `PaymentProvider` implementation.

| Concern | Owner |
| ------- | ----- |
| Checkout method selection | `PaymentMethodSelector` + Store Settings `paymentProviders` |
| Order creation | `PaymentService` → `OrderService.create` (unchanged by MP) |
| Redirect to Checkout Pro | `MercadoPagoProvider.createCheckout` → preference API |
| Preference + Access Token | Server-only (`mercadopago.preference` / config) |
| Payment truth | Mercado Pago API `Payment.get` (never trust webhook body alone) |
| Order payment + status sync | `OrderService.updatePayment` |
| Credentials | Environment variables only — not Firestore |

**Webhook is the source of paid confirmation.** Admin can still mark payment manually as a fallback.

---

## Why

- Separates UI from provider SDKs (template reusability).
- `external_reference = order.id` keeps a single lookup key.
- Idempotent + non-regressive payment updates tolerate MP retries.
- Provider config in settings is public enable/display only; secrets stay in env (RFC-016.5).

---

## Consequences

- Production requires a **public** `NEXT_PUBLIC_APP_URL` or webhooks never auto-sync.
- Localhost checkout can create preferences but will not receive MP notifications.
- Invalid signatures return 401; API failures return 500 for retry; unknown orders return 200.

Operational docs: [`docs/payments-mercadopago.md`](../payments-mercadopago.md).
