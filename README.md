# SeriousFlux Ecommerce Template

A reusable **ecommerce starter kit** for Serious Flux client projects.

This is not a one-off store. It is the base product of the agency: one codebase that can be rebranded per client by changing Firestore data (logo, colors, catalog, settings) — not by forking business logic.

---

## What you get

### Storefront
- Homepage with hero, featured categories, featured products
- Category landing pages (`/categories/[slug]`) with filtered products
- Product detail pages (`/products/[slug]`)
- Shopping cart (Zustand + localStorage) with add/remove toasts
- Checkout that creates orders in Firestore
- Order confirmation page
- Branding driven by `settings/general` (name, colors, locale, contact, social, hero)

### Admin (`/admin`)
- Firebase Authentication login
- Dashboard
- Categories CRUD
- Products CRUD (image optional)
- Orders list + detail (payment / fulfillment / notes)
- Store settings editor (brand, locale, contact, social, hero, feature flags)
- Image uploads via Firebase Storage (`MediaService`)

### Architecture highlights
- Clean separation: UI → features → services → Firebase
- Domain services own Firestore/Storage (no Firebase imports in UI)
- Typed models + Zod validation on admin/checkout forms
- Payment provider id is abstracted (`mercadopago` | `stripe` | `paypal`) — live Mercado Pago capture is still upcoming

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI | shadcn/ui + Lucide |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| Client state | Zustand |
| Validation | Zod |
| Hosting (target) | Firebase App Hosting |

---

## Prerequisites

- Node.js 20+
- npm
- A Firebase project with:
  - Authentication (Email/Password enabled)
  - Cloud Firestore
  - Storage
  - Web app config (API key, etc.)

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in your Firebase web config from the Firebase Console → Project settings → Your apps.

### 3. Firebase setup (minimum)

1. **Authentication** — enable Email/Password. Create an admin user in the Console.
2. **Firestore** — create the database. For local development you may start with open rules; lock them down before production.
3. **Storage** — enable Storage. Rules must allow authenticated admins to write under `media/` (or temporarily allow authenticated writes in development).

Collections used by the kit:

| Collection | Purpose |
|------------|---------|
| `settings/general` | Store identity & branding |
| `categories` | Catalog groupings |
| `products` | Sellable items |
| `orders` | Checkout purchases |
| `customers` | Buyer profiles (Auth uid) — reserved / partial |

See [`docs/firestore.md`](docs/firestore.md) for the full data model.

### 4. Seed sample data (optional)

```bash
npm run seed:settings
npm run seed:products
```

Seeds write to the Firebase project configured in `.env.local`. Create categories in Admin (or Firestore) before expecting category pages to resolve products.

### 5. Run

```bash
npm run dev
```

| URL | Purpose |
|-----|---------|
| [http://localhost:3000](http://localhost:3000) | Storefront |
| [http://localhost:3000/admin/login](http://localhost:3000/admin/login) | Admin login |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run seed:settings` | Seed `settings/general` |
| `npm run seed:products` | Seed sample products |

---

## Project structure

```
src/
  app/
    (storefront)/          # Public store routes
    admin/                 # Admin dashboard + login
  components/              # App-level composition (e.g. layout shells)
  features/
    admin/                 # Admin UI (tables, forms, nav)
    auth/                  # Auth service, provider, RequireAuth
    cart/                  # Cart store + UI
    categories/            # Category domain + storefront cards
    checkout/              # Checkout form + shipping helpers
    customers/             # Customer domain (foundation)
    home/                  # Homepage section shells
    media/                 # MediaService + ImageUpload
    orders/                # Order domain + service
    products/              # Product domain + storefront UI
    settings/              # StoreSettings service + loaders
    storefront/            # Hero, footer, navbar pieces
  firebase/                # App / Auth / Firestore / Storage accessors
  lib/                     # Shared pure helpers (formatPrice, slugify, cn)
  shared/                  # Design tokens + UI primitives
docs/
  architecture/            # ADRs
  firestore.md             # Data model
scripts/                   # Seed scripts
```

**Rule of thumb:** pages compose features; features talk to services; only services talk to Firebase.

---

## Client rebrand checklist

For a new store, prefer changing data — not code:

1. Firebase project (or same project with new `settings/general`)
2. Logo, favicon, colors, hero — Admin → Settings
3. Currency / locale / country / language — Settings
4. Contact + social links — Settings
5. Categories + products — Admin catalog
6. Domain + hosting env vars

---

## Documentation

| Doc | Topic |
|-----|-------|
| [`docs/firestore.md`](docs/firestore.md) | Collections & fields |
| [`docs/store-settings-loading.md`](docs/store-settings-loading.md) | How settings reach the UI |
| [`docs/architecture/`](docs/architecture/) | Architecture Decision Records |
| [`AGENTS.md`](AGENTS.md) | Product / engineering conventions for agents |

---

## Current status (v0.1)

**Ready**
- Catalog (categories + products)
- Cart + checkout → Firestore orders
- Admin back office (CRUD + settings + orders)
- Image upload pipeline (UI → MediaService → Storage)
- Store branding from Firestore

**Not live yet / deferred**
- Real Mercado Pago / Stripe / PayPal capture (provider field exists; payment redirect flow TBD)
- Production-hardened Firestore & Storage security rules in-repo
- Product variants (size / color / stock)
- Customer account area on the storefront
- Coupons, reviews, inventory modules (modeled for later)

---

## Image uploads

Admin forms use `ImageUpload` → `MediaService` → Firebase Storage.

Requirements:
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` set correctly
- Storage enabled in Firebase
- Rules that allow the signed-in admin to upload

Product image is **optional** at create time so you can save a product and set the image URL later if Storage is not ready.

---

## License

Private — Serious Flux. All rights reserved unless otherwise agreed with a client.
