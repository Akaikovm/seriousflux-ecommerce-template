# StoreSettings loading (RFC-004)

## Decision

Keep `getStoreSettings` in `src/features/settings/lib/get-store-settings.ts`, wrapped with React `cache()`.

## Why

1. **Root Layout and pages both need StoreSettings** — Layout for Header / Footer / brand CSS / metadata / maintenance; pages for Hero and price locale.
2. **App Router layouts cannot pass props into pages** — `children` is opaque; Layout cannot inject settings into `page.tsx`.
3. **`cache()` guarantees a single Firestore read per request** — all call sites share one `StoreSettingsService.getGeneralSettings()` invocation.
4. **This is an architectural workaround, not a premature optimization** — it exists because of App Router composition limits, not because we wanted an extra abstraction layer.

## Explicitly rejected (do not reintroduce without a new RFC)

- React Context
- Duplicate Firestore reads (Layout + pages each calling the service independently)
- Redesigning the layout so it owns Hero

## Call sites

- `src/app/layout.tsx` → metadata, `lang`, brand CSS vars, `AppLayout` (Header / Footer / maintenance)
- `src/app/page.tsx` → Hero + FeaturedProducts locale
- `src/app/products/[slug]/page.tsx` → ProductDetail locale

## Field usage

| Field | Consumer |
|--------|----------|
| `storeName` | Header, Footer, Hero, MaintenanceScreen, metadata title |
| `tagline` | Hero, MaintenanceScreen, metadata fallback |
| `description` | Hero, metadata description |
| `logo` | Header |
| `favicon` | metadata icons |
| `primaryColor` / `secondaryColor` | CSS `--primary` / `--brand-accent` |
| `locale` | `formatPrice` via product UI |
| `language` | `<html lang>` |
| `currency` | Fallback when a product has no currency; checkout will snapshot this |
| contact / social / `address` / `country` | Footer |
| `shippingEnabled` | Footer notice |
| `maintenanceMode` | AppLayout gate → MaintenanceScreen |
