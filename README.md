# SeriousFlux Ecommerce Template

A reusable **ecommerce starter kit** for Serious Flux client projects.

This is not a one-off store. It is the base product of the agency: one codebase that can be rebranded per client by changing Firestore data (logo, colors, catalog, settings) — not by forking business logic.

---

## What you get

### Storefront
- Homepage with hero, featured categories, featured products, brand story, and newsletter
- Category landing pages (`/categories/[slug]`) with image header + product grid
- Product detail pages (`/products/[slug]`) with breadcrumbs
- Shopping cart (Zustand + localStorage) with add/remove toasts
- Checkout that creates orders in Firestore and redirects to the selected payment method
- Order confirmation page (branded, Settings-driven)
- Customer accounts: `/login`, `/signup`, `/forgot-password`, Google Sign-In
- Customer Account area: `/account` (dashboard with avatar, profile, orders)
- Guest checkout remains fully supported; optional sign-in at checkout; signed-in orders attach `customerId`
- Signed-in checkout prefills name, email, and phone (when saved on the profile)
- Checkout shows a loading state while finalizing the order (no empty-cart flash before confirmation)
- Branding driven by `settings/general` (name, logo, favicon, colors, locale, contact, social, hero)
- Maintenance mode gate from store settings
- Shared storefront chrome: brand lockup, page headers, breadcrumbs, summary panels

### Admin (`/admin`)
- Firebase Authentication + Firestore role gate (`role: admin`, `status: active`)
- **Admin Design System** (`features/admin/ui`) — brand-neutral tokens, surfaces, headers, tables, forms, sticky SaveBar (independent from storefront branding)
- Dashboard
- Categories CRUD
- Products CRUD (image optional)
- Orders list + detail (payment / fulfillment / notes)
- Modular Store Settings (General, Branding, Contact, Shipping, Payments, Notifications, Advanced) — one document, one save
- Image uploads via Firebase Storage (`MediaService`)

### Payments
- Provider abstraction (`PaymentProvider`) so checkout never talks to a gateway directly
- **Mercado Pago Checkout Pro** — preference API, redirect, webhook → order marked paid
- **Cash on Delivery** — offline method; payment stays pending until admin confirms
- Stripe / PayPal / bank transfer — reserved in settings & env; not registered at checkout yet

### Notifications (transactional email)
- The template **officially supports Resend** for outbound email
- Architecture is still provider-based (`NotificationProvider`) so SendGrid / SES / etc. can be added later **without** changing Checkout, Orders, or Account
- Server-only dispatch via `POST /api/notifications/dispatch` (never from `OrderService`)
- Events: order created / payment approved|failed / shipped / cancelled / welcome / admin alerts
- Admin → Store Settings → Notifications: **sender name, sender email, and enable toggles only** (no provider picker)
- Fire-and-forget: email failure never rolls back orders or auth
- Architecture: [`docs/architecture/ADR-019-notification-system.md`](docs/architecture/ADR-019-notification-system.md)

### Architecture highlights
- Clean separation: UI → features → services → Firebase
- Identity (`auth`) vs Account (`account`) vs Orders — separate ownership
- Domain services own Firestore/Storage (no Firebase imports in UI)
- **External integrations (Payments, Notifications, future Inventory/Analytics) run through server API routes** — not from client components or domain persistence services
- Typed models + Zod validation on admin/checkout forms
- Settings ∩ registered providers decide which payment methods appear at checkout
- Storefront design tokens + CSS variables from Settings (rebrand without forking UI)
- Admin Design System under `features/admin/ui` (neutral console; do not put Admin layouts in `shared/ui`)
- Full Mercado Pago guide: [`docs/payments-mercadopago.md`](docs/payments-mercadopago.md)

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Typography | Geist (body) + Plus Jakarta Sans (headings) |
| UI | shadcn/ui + Lucide |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| Payments | Mercado Pago (first provider) |
| Email | Resend (officially supported; provider-agnostic architecture) |
| Client state | Zustand |
| Validation | Zod |
| Hosting (target) | Firebase App Hosting |

---

## Prerequisites

- Node.js 20+
- npm
- A Firebase project with:
  - Authentication (**Email/Password** and **Google** enabled)
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

For Mercado Pago (optional locally; required for live redirect + auto-paid sync), also set `MERCADOPAGO_*` and `NEXT_PUBLIC_APP_URL`. See [`.env.example`](.env.example) and [`docs/payments-mercadopago.md`](docs/payments-mercadopago.md).

For transactional email, set `RESEND_API_KEY`, then in **Admin → Settings → Notifications** set sender name/email and enable the toggles you need. The sender address must be verified in Resend. Admins do not choose email providers — Resend is the supported integration.

### 3. Firebase setup (minimum)

1. **Authentication** — enable Email/Password and Google.
2. For **production Google Sign-In**, add your App Hosting (or custom) domain under Firebase Console → Authentication → Settings → **Authorized domains** (`localhost` is already allowed).
3. **Create the first admin manually** (never through the app signup):
   - Create a user in Firebase Console → Authentication.
   - Copy the user's `uid`.
   - Create Firestore document `customers/{uid}` with at least:

     ```json
     {
       "email": "admin@example.com",
       "displayName": "Admin",
       "photoURL": null,
       "role": "admin",
       "status": "active",
       "addresses": [],
       "createdAt": "<timestamp>",
       "updatedAt": "<timestamp>"
     }
     ```

4. **Firestore** — create the database. For local development you may start with open rules; lock them down before production.
5. **Storage** — enable Storage. Rules must allow authenticated admins to write under `media/` (or temporarily allow authenticated writes in development).

Collections used by the kit:

| Collection | Purpose |
|------------|---------|
| `settings/general` | Store identity & branding |
| `categories` | Catalog groupings |
| `products` | Sellable items |
| `orders` | Checkout purchases |
| `customers` | Identity + buyer profile (`role`, `status`) — Auth uid |

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
| [http://localhost:3000/login](http://localhost:3000/login) | Customer sign in (email + Google) |
| [http://localhost:3000/signup](http://localhost:3000/signup) | Customer sign up (email + Google) |
| [http://localhost:3000/account](http://localhost:3000/account) | Customer Account (requires auth) |
| [http://localhost:3000/admin/login](http://localhost:3000/admin/login) | Admin login |

---

## Deploy (Firebase App Hosting — test)

Target hosting is **Firebase App Hosting** (Next.js SSR on Cloud Run).

### Before you start
1. Firebase project on the **Blaze** plan (required for App Hosting).
2. Auth, Firestore, and Storage enabled (same as local).
3. This GitHub repo accessible to your Firebase / Google account.
4. Live git branch: **`master`** (this repo does not use `main`).

### Console steps
1. Open [Firebase Console](https://console.firebase.google.com/) → your project.
2. Go to **App Hosting** → **Get started** / **Create backend**.
3. Connect **GitHub** → select `Akaikovm/seriousflux-ecommerce-template`.
4. Set:
   - **Root directory:** `/` (repo root)
   - **Live branch:** `master`
   - Automatic rollouts: on (recommended for testing)
5. Create the backend and wait for the first build.
6. Under the backend → **Environment**, add the same keys as `.env.example` / `.env.local` (`NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_APP_URL`, Mercado Pago vars).  
   They must be available at **build and runtime**.
7. Configure Mercado Pago webhook → `https://YOUR_APP_HOSTING_URL/api/webhooks/mercadopago` (details: [`docs/payments-mercadopago.md`](docs/payments-mercadopago.md)).
8. Trigger a new rollout (or push a commit) so the env vars are picked up.
9. Open the App Hosting URL when the rollout succeeds.

Optional local config lives in [`apphosting.yaml`](apphosting.yaml) (runtime sizing; env can stay in Console for now).

### Smoke-test checklist after deploy
- `/` loads with store name from Firestore
- `/admin/login` works only for users with `customers/{uid}.role === "admin"` and `status === "active"`
- `/login` and `/signup` create customer accounts (`role: customer`) via email or Google
- `/account` shows dashboard, profile, and own orders (ownership-checked)
- Guest checkout still works; optional Google / Sign in at checkout; signed-in checkout sets `orders.customerId` and prefills customer fields
- Navbar shows **Login** (guest) or **Account** (authenticated)
- Google Sign-In works only if the live domain is in Firebase **Authorized domains**
- Catalog / cart / checkout still talk to the same Firebase project
- Image upload only works if Storage rules allow your admin user
- Mercado Pago (if enabled): successful pay → Admin order shows **Paid** without manual update

### Payments

See **[`docs/payments-mercadopago.md`](docs/payments-mercadopago.md)** for env vars, webhook setup, production checklist, and troubleshooting.

### Local production build check

```bash
npm run build
npm run start
```

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
    api/                   # Preference + Mercado Pago webhooks
  components/              # App-level composition (e.g. layout shells)
  features/
    admin/                 # Admin UI + Admin Design System (`ui/`, styles, features)
    auth/                  # Identity: AuthService, RoleResolver, Google, guards, hooks
    account/               # Customer Account UI + AccountService (profile)
    cart/                  # Cart store + UI
    categories/            # Category domain + storefront cards
    checkout/              # Checkout form + optional auth prompt
    customers/             # Customer domain types (CustomerProfile)
    home/                  # Homepage section shells
    media/                 # MediaService + ImageUpload
    notifications/         # NotificationProvider + Resend + templates
    orders/                # Order domain + service
    payments/              # PaymentProvider registry + Mercado Pago / COD
    products/              # Product domain + storefront UI
    settings/              # StoreSettings service + loaders
    storefront/            # Shell: Hero, Navbar, Footer, BrandStory, shared chrome
  firebase/                # App / Auth / Firestore / Storage accessors
  lib/                     # Shared pure helpers (formatPrice, slugify, cn)
  shared/                  # Design tokens + UI primitives
docs/
  architecture/            # ADRs
  firestore.md             # Data model
  payments-mercadopago.md  # MP setup, webhooks, troubleshooting
scripts/                   # Seed scripts
```

**Rule of thumb:** pages compose features; features talk to services; only services talk to Firebase.

**Favicon:** set via Admin → Settings (`favicon`, falls back to `logo`). Do not add a static `src/app/favicon.ico` — it overrides Settings metadata and shows the Next default.

---

## Client rebrand checklist

For a new store, prefer changing data — not code:

1. Firebase project (or same project with new `settings/general`)
2. Logo, favicon, colors, hero — Admin → Settings
3. Currency / locale / country / language — Settings
4. Contact + social links — Settings
5. Categories + products — Admin catalog
6. Payment methods — enable in Settings + set server env secrets (MP / future Stripe)
7. Domain + hosting env vars (`NEXT_PUBLIC_APP_URL`, Firebase, payment credentials)

---

## Documentation

| Doc | Topic |
|-----|-------|
| [`docs/firestore.md`](docs/firestore.md) | Collections & fields |
| [`docs/payments-mercadopago.md`](docs/payments-mercadopago.md) | Mercado Pago Checkout Pro + webhooks |
| [`docs/store-settings-loading.md`](docs/store-settings-loading.md) | How settings reach the UI |
| [`docs/architecture/ADR-019-notification-system.md`](docs/architecture/ADR-019-notification-system.md) | Transactional email |
| [`docs/architecture/ADR-020-admin-settings-redesign.md`](docs/architecture/ADR-020-admin-settings-redesign.md) | Modular Admin Settings |
| [`docs/architecture/ADR-021-admin-design-system.md`](docs/architecture/ADR-021-admin-design-system.md) | Admin Design System |
| [`docs/architecture/`](docs/architecture/) | All Architecture Decision Records |
| [`AGENTS.md`](AGENTS.md) | Product / engineering conventions for agents |

---

## Current status (v0.1)

**Ready**
- Catalog (categories + products)
- Cart + checkout → Firestore orders
- Mercado Pago Checkout Pro (redirect + webhook paid sync)
- Cash on Delivery at checkout
- Admin back office (CRUD + settings + orders)
- Image upload pipeline (UI → MediaService → Storage)
- Store branding / favicon / maintenance mode from Firestore
- Elevated storefront design system (tokens, headings, shared page chrome)
- Admin Design System (modular Settings, shared Admin UI primitives, brand-neutral console)
- Identity foundation (email/password + Google, roles in Firestore, shared AuthProvider)
- Customer Account (`/account` — dashboard with avatar, profile, own orders)
- Checkout UX: session prefill + loading while redirecting to confirmation
- Transactional email via Resend (Notifications settings + dispatch API)
- Deploy path via Firebase App Hosting

**Deferred / not production-ready yet**
- Stripe / PayPal providers (settings + env slots only)
- `capturePayment` / `refund` on the payment interface (stubs)
- Production-hardened Firestore & Storage security rules committed in-repo
- Custom claims / Next.js middleware session cookies (client role gate today)
- Admin user management UI (first admin is seeded manually)
- Wishlist / Addresses / Notifications
- Apple / Facebook OAuth (Google is supported)
- Per-client custom font families from Settings (kit default fonts today)
- Product variants, inventory, coupons, reviews
- Real shipping methods (single free “Standard” stub today)
- Category filters / sort (listing UI is presentational today)
- Guest order claiming (orders without `customerId` stay unlinked)

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
