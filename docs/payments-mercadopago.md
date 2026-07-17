# Mercado Pago payments (RFC-016)

Production guide for Checkout Pro, webhooks, and order synchronization.

Related: [ADR-016](./architecture/ADR-016-mercadopago-payments.md) · [ADR-010 Checkout](./architecture/ADR-010-checkout.md) · [ADR-011 Orders](./architecture/ADR-011-order-management.md)

---

## Overview

```
Checkout → Order (pending_payment)
        → Preference API (external_reference = order id)
        → Mercado Pago Checkout Pro
        → Webhook POST /api/webhooks/mercadopago
        → Payment.get(paymentId)
        → OrderService.updatePayment()
        → payment.status = paid, order.status = paid
        → Admin shows Paid
```

Cash on Delivery does not use Mercado Pago or webhooks.

---

## Required environment variables

| Variable | Required | Where | Purpose |
| -------- | -------- | ----- | ------- |
| `NEXT_PUBLIC_APP_URL` | **Yes** (for live payments) | Build + runtime | Public HTTPS origin. Used for `back_urls` and `notification_url`. Localhost omits both — webhooks will not sync. |
| `MERCADOPAGO_ACCESS_TOKEN` | **Yes** | Runtime (server) | Preference create + Payment.get. Never expose to the client. |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Optional | Build + runtime | Reserved for future client SDK / Bricks. Checkout Pro redirect does not require it today. |
| `MERCADOPAGO_WEBHOOK_SECRET` | **Yes** (for webhooks) | Runtime (server) | Validates `x-signature`. Missing/wrong → HTTP 401. |
| `MERCADOPAGO_SANDBOX` | Optional (default `true`) | Runtime | `true` → `sandbox_init_point`; `false` → production `init_point`. |

Firebase `NEXT_PUBLIC_FIREBASE_*` vars remain required for the app itself.

Secrets must **never** be stored in Firestore `StoreSettings`. Enable/disable Mercado Pago in Admin settings; credentials stay in env.

### Missing variables

| Situation | Behavior |
| --------- | -------- |
| Missing access token / app URL on preference | Preference route fails with a generic checkout error (no raw SDK message). |
| Missing webhook secret on notification | Webhook returns **401** Invalid webhook. |
| `APP_URL` is localhost | Preference succeeds but **without** `notification_url`; orders stay `pending_payment` until Admin marks paid. A server warning is logged. |

---

## Configure Mercado Pago

1. Open [Mercado Pago Developers](https://www.mercadopago.com/developers/panel/app) → your application.
2. Copy **Access Token** → `MERCADOPAGO_ACCESS_TOKEN`.
3. Copy **Public Key** → `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`.
4. Set `MERCADOPAGO_SANDBOX=true` while testing with sandbox credentials; `false` for live credentials.
5. Set `NEXT_PUBLIC_APP_URL` to your App Hosting (or custom) HTTPS origin, e.g. `https://your-backend.web.app` (no trailing slash).

---

## Configure the webhook

1. In the same MP application → **Webhooks** / notifications.
2. Production URL:

   `https://YOUR_DOMAIN/api/webhooks/mercadopago`

3. Subscribe to **Payments** (payment topic/events).
4. Copy the **secret signature** → `MERCADOPAGO_WEBHOOK_SECRET`.
5. Save. Optionally send a test ping; `GET` on the same path returns `{ ok: true, provider: "mercadopago" }`.

Preferences also set `notification_url` to the same path when `APP_URL` is public (defense in depth with the dashboard webhook).

---

## Status mapping

| Mercado Pago `status` | Order `payment.status` | Order `status` (when awaiting payment) |
| --------------------- | ---------------------- | ---------------------------------------- |
| `approved` | `paid` | `paid` |
| `pending` / `in_process` / `in_mediation` | `pending` | unchanged (`pending_payment`) |
| `authorized` | `authorized` | unchanged |
| `rejected` / `cancelled` | `failed` | unchanged |
| `refunded` / `charged_back` | `refunded` | unchanged |

Guarantees:

- Duplicate webhooks with the same state → no-op (idempotent).
- A later `cancelled` / `pending` notification does **not** overwrite an already `paid` payment.
- Sync to order `paid` only from `pending_payment` (does not rewind fulfillment past paid).

---

## Error handling (webhook)

| Case | HTTP | Notes |
| ---- | ---- | ----- |
| Invalid signature | **401** | Generic body; reason logged server-side only. |
| Not a payment notification | **200** | `{ handled: false, skippedReason: "..." }` |
| Missing `external_reference` | **200** | Logged; cannot map to an order. |
| Unknown order id | **200** | Acknowledged so MP stops retrying. |
| MP API / Firestore failure | **500** | Allows Mercado Pago to retry. |
| Duplicate / regression skip | **200** | Idempotent success. |

Checkout never receives raw Mercado Pago SDK errors — only `PaymentError` messages.

---

## Production deployment checklist

- [ ] Deploy latest version (App Hosting / target host)
- [ ] Set all required env vars (build + runtime): Firebase + Mercado Pago + `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_APP_URL` is public HTTPS (not localhost)
- [ ] `MERCADOPAGO_SANDBOX=false` when using production credentials
- [ ] Configure webhook URL + secret in Mercado Pago dashboard
- [ ] Enable Mercado Pago in Store Settings (`paymentProviders.mercadopago.enabled`)
- [ ] Place a real (or sandbox) successful payment
- [ ] Confirm webhook runs (App Hosting / Cloud Run logs: no signature errors)
- [ ] Confirm Firestore order: `payment.status = paid`, `status = paid`
- [ ] Confirm Admin order detail shows Paid without manual update
- [ ] Confirm a second identical webhook does not corrupt state
- [ ] Remove any leftover temporary debug (none expected after RFC-016.2)
- [ ] Tag release (e.g. `rfc-016-mercadopago`)

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| ------- | ------------ | --- |
| Order stays `pending_payment` after successful pay | `APP_URL` localhost / no `notification_url` / webhook not configured | Use public `NEXT_PUBLIC_APP_URL`; configure dashboard webhook |
| Webhook always 401 | Wrong or missing `MERCADOPAGO_WEBHOOK_SECRET` | Copy secret from MP Webhooks panel into hosting env; redeploy |
| Checkout cannot start MP | Missing `MERCADOPAGO_ACCESS_TOKEN` or preference API error | Check access token + sandbox flag vs credential type |
| Paid then overwritten? | Should not happen | Regression guard in `OrderService.updatePayment` blocks paid → pending/failed |
| Admin still shows pending | Webhook never reached Firestore | Check hosting logs for `[mercadopago.webhook]`; verify order id = `external_reference` |
| Works in sandbox, not live | `MERCADOPAGO_SANDBOX` still `true` or wrong token | Use production token + `SANDBOX=false` |

Never log access tokens, webhook secrets, or customer PII (email, phone, address).

---

## Key files

| Path | Role |
| ---- | ---- |
| `src/features/payments/providers/mercadopago/` | Preference, verify, webhook, config |
| `src/app/api/payments/mercadopago/preference/route.ts` | Server preference endpoint |
| `src/app/api/webhooks/mercadopago/route.ts` | Webhook HTTP entry |
| `src/features/orders/services/order.service.ts` | `updatePayment` + paid sync |
| `.env.example` | Env template |
