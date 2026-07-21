# GAP-013 — Newsletter + i18n

| Field | Value |
|-------|-------|
| Priority | **P3** |
| Status | `open` |

## Problem

Newsletter UI fakes success locally. `locale` formats money but UI copy is hardcoded (mostly English).

## Goal

- Persist newsletter emails (collection or provider) with consent notes
- Lightweight copy strategy (dictionaries or later CMS) — not full i18n framework unless needed

## Language approach (shipped)

UI chrome uses `src/i18n` dictionaries (`en` / `es`).
Default language comes from `StoreSettings.language` (Admin → Settings → General).
Optional: enable `allowLanguageSwitch` so the storefront shows an ES/EN control; preference is stored in the `sf_lang` cookie and overrides the default for UI chrome.
`StoreSettings.locale` remains for number/date formatting only.
Agency sets the default language per client install; bilingual stores opt into the switch.

Still open: newsletter persistence (below).

## Scope

- Newsletter service + Admin export or list
- ~~Decide ES/EN strategy for starter kit~~ (done: dictionaries + settings.language)

## Acceptance criteria

- [ ] Newsletter submissions stored or sent to provider
- [x] Documented language approach for client rebrands

## When done

Mark `done` in [GAP-REGISTER.md](../GAP-REGISTER.md).
