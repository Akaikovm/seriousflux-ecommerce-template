# GAP-010 — Stripe / PayPal providers

| Field | Value |
|-------|-------|
| Priority | **P3** |
| Status | `open` |
| Related | PaymentProvider abstraction |

## Problem

Env slots and settings stubs exist; providers are not registered at checkout.

## Goal

Implement `StripeProvider` and/or `PayPalProvider` behind the same `PaymentProvider` interface as Mercado Pago.

## Scope

- Provider modules + webhook/callback routes
- Settings enable flags
- Docs per provider

## Out of scope

- Replacing Mercado Pago as default LATAM provider

## Acceptance criteria

- [ ] Checkout can offer provider when enabled + env set
- [ ] Paid sync updates order like MP
- [ ] No checkout code that hardcodes a gateway

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md).
