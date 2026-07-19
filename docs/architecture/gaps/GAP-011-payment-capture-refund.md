# GAP-011 — Payment capture / refund

| Field | Value |
|-------|-------|
| Priority | **P3** |
| Status | `open` |
| Related | PaymentProvider stubs today |

## Problem

`capturePayment` / `refund` throw `notImplemented` on current providers.

## Goal

Implement real capture/refund where the gateway supports it; Admin actions call the abstraction only.

## Scope

- Mercado Pago refund (and capture if using auth flows)
- COD admin “mark refunded” without gateway call
- Inventory `restoreSale` coordination on refund (already partially wired)

## Out of scope

- Partial line-item refunds (unless trivial)

## Acceptance criteria

- [ ] Interface methods no longer stubs for supported providers
- [ ] Admin refund path documented
- [ ] Inventory restore remains idempotent

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md).
