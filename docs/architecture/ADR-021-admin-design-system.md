# ADR-021 — Admin Design System Foundation

## Status

**Accepted** — foundation implemented (RFC-021).

**RFC:** RFC-021  
**Depends on:** ADR-001 (Design System), ADR-004 (Admin Dashboard), ADR-008 (Admin Management), ADR-020 (Admin Settings Redesign)  
**Enables:** Consistent Admin UX across Dashboard, Products, Categories, Orders, Customers (planned), Settings, and Auth — without rewriting domain logic

### Approved adjustments (locked)

1. **Admin remains brand-neutral** — independent from storefront `StoreSettings` colors; accent is charcoal (`--admin-accent`), not `--primary`.
2. **Design system lives under `features/admin/ui`** — do not pollute `shared/ui`.
3. **Tokens + CSS** — `tokens.css`, `admin.css` (shell), `admin-ui.css` (primitives), `settings.css` (Settings-only rail/chips).
4. **Primitives extracted from Settings** — `AdminPage`, `AdminPageHeader`, `AdminSurface`, `AdminSection`, `AdminSaveBar`, table/toolbar/row actions, form layout, empty/loading.
5. **Progressive migration completed for** Dashboard, Products, Categories, Orders, Settings (consumer), Login.
6. **Future Admin features must consume `features/admin/ui`** — no feature-specific visual systems.

---

## Context

RFC-020 raised Settings to a higher visual and interaction standard (section rail, soft surfaces, floating save bar, richer headers).

That quality must **not** remain a one-off. If left isolated:

- Settings becomes a visual exception
- Every future admin page invents its own spacing, surfaces, and headers
- Agency clients inherit an inconsistent console
- CSS duplication (`admin.css` + `settings.css` + per-feature Tailwind) grows without a system

This ADR reviews the **entire Admin UI** and proposes a reusable **Admin Design System** — presentation and composition only.

### Non-goals (hard stop)

- Storefront redesign
- Branding / StoreSettings theming changes
- Firestore, services, or domain architecture changes
- Feature rewrites (CRUD behavior stays)
- Implementation in this RFC

---

## Goals

1. Audit Admin UI inconsistency against the Settings quality bar.
2. Define reusable Admin primitives (not feature-specific widgets).
3. Recommend Admin-local design tokens and CSS architecture.
4. Clarify `shared/ui` vs Admin-only UI ownership.
5. Produce a migration plan that reduces duplicated CSS and markup.
6. Keep Admin **brand-neutral** so clients rebrand via Settings data, not console chrome.

---

## 1. Admin UI audit

### Quality bar (Settings — RFC-020)

| Pattern | Location | Notes |
|---------|----------|-------|
| Page header hierarchy | `.admin-settings__header` | Eyebrow + title + subtitle |
| Secondary navigation | Settings rail / mobile chips | Sticky, registry-driven |
| Section surface | `.admin-settings-section__surface` | Soft border, inset highlight, icon head |
| Floating save bar | `.admin-settings-savebar` | Dirty-only, elevated capsule |
| Spacing system | CSS vars (`--settings-*`) | Predictable content max-width |
| Interaction | Hash + flash + leave guard | Config-area UX |

### Per-surface comparison

| Surface | Header | Surfaces | Forms / actions | Spacing model | vs Settings |
|---------|--------|----------|-----------------|---------------|-------------|
| **Shell** | Pathname title in `AdminHeader` | Frosted oklch sidebar/header (`admin.css`) | N/A | Tailwind main padding + CSS vars | Neutral but coarser than Settings surfaces |
| **Dashboard** | Ad-hoc `h2` (duplicates shell title) | `Card` + `AdminStatCard` | None | Tailwind `gap-6` | No eyebrow; plain cards |
| **Products list** | `.admin-page-header` + CTA | `DataTable` border surface | Row `.admin-actions` | Tailwind `gap-4` | Flat list chrome |
| **Products form** | Title inside `Card`; plain back link | Single `Card max-w-2xl` | Bottom Cancel/Save | Tailwind form gaps | No dirty bar; no section chrome |
| **Categories list/form** | Same as Products | Same as Products | Same as Products | Same | Near-clone of Products |
| **Orders list** | `.admin-page-header` (no CTA) | `DataTable` + filter grid | Search + status filter | Tailwind | Only list with toolbar |
| **Orders detail** | Breadcrumb + title | Many plain `Card`s | Per-card Save buttons | `gap-6` stacks | “Card soup”; no unified save |
| **Settings** | Dedicated eyebrow hierarchy | Section surfaces + rail | Floating save bar | `settings.css` | **Quality bar** |
| **Admin login** | Centered `h1` | `Card` on `bg-muted/40` | Bottom submit | Tailwind | Outside shell; no admin tokens |
| **Customers** | Planned | — | — | — | Must inherit system from day one |

### Inconsistency inventory

| Concern | Current state |
|---------|---------------|
| **Page headers** | 3+ patterns: `admin-page-header`, settings eyebrow header, dashboard ad-hoc, form-in-card titles |
| **Cards / surfaces** | `shared/ui/Card` (token radius ~0.75rem) vs Settings 1rem soft panels vs DataTable `rounded-lg` |
| **Forms** | Product/Category: one Card + footer buttons; Settings: sections + floating bar; Orders: per-card saves |
| **Tables** | Shared `DataTable` pattern (good) but surface not aligned with Settings elevation |
| **Action bars** | `.admin-actions` row chips vs floating save vs inline Card footers |
| **Empty / loading** | `EmptyState` / `LoadingState` reused (good); route `loading.tsx` skeleton is generic |
| **Typography** | Mix of `text-lg font-semibold`, settings 1.375rem / weight 650, shell `text-base` |
| **Colors** | Shell/settings: hardcoded oklch; content: Tailwind semantic (`primary`, `border`) — **storefront brand can leak** into Admin buttons/badges |
| **Shadows / radius** | Token shadows in Card; custom oklch shadows in settings; DataTable lighter |
| **CSS ownership** | `admin.css` + `settings.css` (loaded globally via `AdminLayout`) + scattered Tailwind |

### What already works (keep)

- Shell isolation from storefront (`AdminLayout` / `admin.css`)
- `DataTable` as a single list primitive
- `shared/ui` controls (`Input`, `Button`, `Switch`, …)
- `EmptyState` / `LoadingState` / `ConfirmDialog` / Toast
- Settings **registry** pattern for extensible sections
- Controlled forms + Zod (ADR-008) — do not replace with a second form architecture

---

## 2. Reusable components that should exist

Organize under **`features/admin/ui/`** (Admin-only design system). Do **not** put these in `shared/ui`.

### Core layout

| Primitive | Purpose | Promote from |
|-----------|---------|--------------|
| **`AdminPage`** | Standard page wrapper (max width, vertical rhythm, optional sticky footer slot) | Implicit page `div`s |
| **`AdminPageHeader`** | Eyebrow + title + description + actions slot | Settings header + `.admin-page-header` |
| **`AdminBreadcrumb`** | Light trail (Orders / #1234) | Order detail ad-hoc text |
| **`AdminBackLink`** | Consistent “Back to …” | Product/Category plain links |

### Surfaces

| Primitive | Purpose | Promote from |
|-----------|---------|--------------|
| **`AdminSurface`** | Default elevated panel (border, radius, soft shadow, optional flash) | Settings section surface |
| **`AdminSection`** | Surface + icon + title + description + body | `SettingsSection` |
| **`AdminStatCard`** | Dashboard metric (already exists — restyle to `AdminSurface`) | `dashboard/AdminStatCard` |
| **`AdminPanel`** | Compact nested block inside a surface (order detail sub-blocks) | Plain nested Cards |

### Lists & toolbars

| Primitive | Purpose | Promote from |
|-----------|---------|--------------|
| **`AdminTable`** | Tokenized wrapper around existing DataTable | `components/DataTable` |
| **`AdminTableToolbar`** | Search / filters / primary CTA row | Orders filter grid + list CTAs |
| **`AdminRowActions`** | Compact action cluster | `.admin-actions` |

### Forms & persistence UX

| Primitive | Purpose | Promote from |
|-----------|---------|--------------|
| **`AdminFormLayout`** | Form page scaffold (header + surface(s) + footer slot) | ProductForm / CategoryForm Card |
| **`AdminFormSection`** | Grouped fields inside a form (optional icon) | Settings subsections / future multi-section product forms |
| **`AdminSaveBar`** | Sticky/floating dirty save chrome | `SettingsSaveBar` |
| **`AdminFormFooter`** | Non-sticky Cancel/Save for short forms (optional alternate to SaveBar) | Current Product/Category footer |

### Feedback

| Primitive | Purpose | Promote from |
|-----------|---------|--------------|
| **`AdminEmptyState`** | Thin Admin wrapper or documented composition of `EmptyState` | Already shared — standardize props/copy patterns |
| **`AdminLoadingState`** | Same for `LoadingState` + page skeleton recipe | `(dashboard)/loading.tsx` |
| **`AdminConfirmDialog`** | Prefer keeping `ConfirmDialog` in shared; Admin hosts motion CSS | Status quo with cleanup |

### Explicitly **not** Admin-wide (Settings-specific)

| Keep Settings-only | Why |
|--------------------|-----|
| Section **rail / chip nav** | Multi-module config IA; lists/forms do not need secondary nav |
| Hash + `lastSettingsSection` memory | Settings information architecture |
| Settings **registry** (`SETTINGS_SECTIONS`) | Domain-specific extension point |
| Full-page single-document dirty model spanning many modules | Unique to Store Settings |

**Promote to Admin-wide from Settings:** surface language, header hierarchy, floating `AdminSaveBar` pattern, spacing rhythm, icon+title section heads (where a page has logical sections).

---

## 3. Shared styling opportunities

| Opportunity | Benefit |
|-------------|---------|
| One **Admin surface** recipe | End Card-vs-Settings-vs-DataTable mismatch |
| One **page header** API | Kill 3 header dialects |
| One **save / dirty** pattern for long forms | Product/Category (and future Customers) match Settings |
| Unify **row actions** | Same density on Products / Categories / Orders / Customers |
| Shared **filter toolbar** slot | Orders today; Customers/Products filters tomorrow |
| Align **radius to 1rem** (or token `xl`) for Admin panels | Visual continuity with Settings |
| Neutralize **primary button** inside Admin | Stop storefront brand color leaking into console CTAs (or document intentional exception) |

---

## 4. Design token recommendations

### Decision: Admin-local tokens (yes)

Introduce **`features/admin/styles/tokens.css`** (or `admin-tokens.css`) consumed by `admin.css` + future `admin-ui.css`.

Do **not** fold Admin chrome into storefront `StoreSettings` brand tokens.

### Proposed token groups

| Group | Examples | Notes |
|-------|----------|-------|
| **Surface** | `--admin-bg`, `--admin-surface`, `--admin-surface-elevated`, `--admin-border` | Replace scattered oklch |
| **Text** | `--admin-fg`, `--admin-fg-muted`, `--admin-fg-subtle` | Keep console readable and brand-neutral |
| **Accent** | `--admin-accent`, `--admin-accent-fg` | **Neutral** accent for active nav / primary Admin CTA — not `--primary` from storefront |
| **Elevation** | `--admin-shadow-sm`, `--admin-shadow-md`, `--admin-shadow-float` | Save bar + surfaces |
| **Radius** | `--admin-radius-sm/md/lg` | Map to 0.5 / 0.75 / 1rem |
| **Space** | `--admin-space-*` | Align with `shared/design` spacing scale where possible |
| **Type** | `--admin-text-title`, `--admin-text-section`, `--admin-text-eyebrow` | Encode Settings hierarchy |
| **Motion** | Reuse existing admin enter / dialog / toast timings | Prefer `prefers-reduced-motion` (already started) |
| **Icons** | Size tokens `sm/md` (14/16px) | Lucide remains the icon set |

### Relationship to `shared/design/tokens.ts`

| Layer | Owns |
|-------|------|
| `shared/design` + `shared/ui` | Cross-app primitives (inputs, dialogs) — structural tokens |
| `features/admin` tokens | Console chrome, surfaces, accent neutrality |
| Storefront + StoreSettings | Customer-facing brand |

Controls keep using `shared/ui`; **layout chrome** uses Admin tokens.

---

## 5. CSS architecture recommendations

```
features/admin/
  styles/
    tokens.css          # Admin design tokens (new)
    admin.css           # Shell only (sidebar, header, main) — consumes tokens
    admin-ui.css        # Primitives: page, surface, section, savebar, table, toolbar (new)
  ui/                   # React primitives (new)
    AdminPage/
    AdminPageHeader/
    AdminSurface/
    …
  components/           # Shell wiring (Layout, Sidebar, Header, DataTable→migrate)
  {feature}/            # Feature composition only — minimal local CSS
```

### Rules

1. **Feature folders must not invent new visual systems** — compose `admin/ui` + tokens.
2. **`settings.css` migrates into `admin-ui.css`** — Settings becomes a consumer, not a parallel design language.
3. **Stop loading Settings-only CSS as a side effect** of every page once primitives are global (or load `admin-ui.css` once on purpose).
4. Prefer **CSS classes for chrome**; Tailwind for **one-off layout grids** inside features.
5. **No `!important` button overrides** long-term — extend Button variant API or Admin-specific button wrapper.

### Folder naming: `shared/admin-ui` vs `features/admin/ui`

| Option | Pros | Cons |
|--------|------|------|
| **`features/admin/ui` (recommended)** | Matches “Admin is a feature product”; keeps `shared/ui` clean; ADR-004 boundary | Slightly longer imports |
| `shared/admin-ui` | Feels “design system-y” | Pollutes `shared/` with app-shell concepts; blurs storefront/admin |

**Recommendation:** `features/admin/ui` + `features/admin/styles/*`. Do **not** create `shared/admin-ui`.

---

## 6. Component hierarchy

```
AdminDashboardShell
  ToastProvider
  RequireRole
  AdminLayout                    # shell
    AdminSidebar
    AdminHeader
    main
      AdminPage                  # page primitive
        AdminPageHeader
        AdminBreadcrumb? 
        AdminTableToolbar?       # lists
        AdminTable | children
        AdminSurface / AdminSection*
        AdminSaveBar?            # sticky slot
```

**Forms:**

```
AdminPage
  AdminPageHeader (+ AdminBackLink)
  AdminFormLayout
    AdminSurface / AdminFormSection*
    AdminSaveBar | AdminFormFooter
```

**Settings (after migration):**

```
AdminPage
  AdminPageHeader
  SettingsLayout                 # Settings-specific IA
    SettingsSidebar (rail)       # Settings-only
    SettingsContent
      AdminSection               # shared surface language
    AdminSaveBar                 # shared primitive (was SettingsSaveBar)
```

---

## 7. Migration plan

Principle: **extract primitives first**, then restyle pages to consume them. Each step should **delete** duplicated markup/CSS, not only add layers.

### Phase 0 — Foundation (no user-facing redesign required)

1. Add `tokens.css` (extract oklch from `admin.css` / `settings.css`).
2. Create `features/admin/ui` skeleton: `AdminPage`, `AdminPageHeader`, `AdminSurface`, `AdminSection`, `AdminSaveBar`.
3. Refactor Settings to use those primitives **visually unchanged** (prove extraction).
4. Merge settings surface rules into `admin-ui.css`; thin Settings-specific CSS for rail/chips only.

### Phase 1 — Dashboard (first visible migration)

**Why first:** Small surface area; high visibility; validates `AdminPageHeader` + `AdminSurface` / `AdminStatCard` without form/dirty complexity.

### Phase 2 — Products & Categories lists

Adopt `AdminPage` + `AdminPageHeader` + `AdminTable` + `AdminTableToolbar` + `AdminRowActions`.  
Products and Categories migrate **together** (near-clones).

### Phase 3 — Product & Category forms

Adopt `AdminFormLayout` + `AdminSurface` + **`AdminSaveBar` with dirty tracking** (behavior upgrade aligned with Settings; domain logic unchanged).

### Phase 4 — Orders list

`AdminTableToolbar` standardization (search + filters).

### Phase 5 — Orders detail

Replace Card soup with `AdminSection` / `AdminPanel`; decide per-panel save vs future unified bar (open question).

### Phase 6 — Admin login

Optional: wrap in Admin-neutral shell styling (same tokens) without mounting full dashboard chrome.

### Phase 7 — Customers (planned)

**Must ship on Admin Design System from day one** — no legacy path.

### Settings

Already at quality bar; becomes **reference implementation** after Phase 0 extraction — not “migrated last,” but **source of truth first**.

### Suggested order (summary)

1. Foundation extraction (Settings → primitives)  
2. Dashboard  
3. Products + Categories (lists)  
4. Products + Categories (forms + SaveBar)  
5. Orders list  
6. Orders detail  
7. Login polish  
8. Customers (greenfield)

---

## 8. Risks

| Risk | Mitigation |
|------|------------|
| Big-bang rewrite of all Admin | Phased migration; Settings extraction first |
| New abstraction layer without deleting old CSS | Each PR must remove duplicate classes/markup |
| Storefront `--primary` leak into Admin CTAs | Admin accent token + audit Badge/Button usage in Admin |
| Over-generalizing Settings rail into every page | Keep rail Settings-only |
| Dirty SaveBar on Order detail conflicts with multi-save cards | Separate decision for Orders; don’t force one model blindly |
| `ConfirmDialog` / Toast coupled to `admin-*` motion classes | Document host requirement or move motion to shared |
| Token file drift from `shared/design` spacing | Mirror scale names; document mapping |
| Scope creep into business logic | RFC gate: UI-only PRs |

---

## 9. Open questions

1. **Admin accent:** Pure neutral charcoal (current Settings active rail) vs slight cool gray-blue — lock before Phase 1.  
2. **Should Admin buttons ignore storefront `--primary`?** Recommendation: **yes** for console chrome.  
3. **Order detail save model:** keep per-card saves, or move toward section-level / single SaveBar?  
4. **Short forms:** always `AdminSaveBar`, or allow `AdminFormFooter` for create pages? Recommendation: SaveBar when dirty tracking exists; footer acceptable for tiny forms in v1.  
5. **DataTable:** stay under `features/admin` (yes) or move to `shared/ui` (no — Admin-specific).  
6. **Login:** full Admin token alignment in Phase 6, or leave minimal forever?  
7. **Eyebrow copy:** required on all pages, or optional? Recommendation: optional; title+description required.

---

## 10. Final recommendation

**Accept ADR-021 as the Admin Design System foundation plan.**

1. Treat **Settings (RFC-020) as the visual source of truth**, not an exception.  
2. Extract **Admin-local tokens + `features/admin/ui` primitives** — do not pollute `shared/ui`.  
3. **Migrate Dashboard next**, then Products/Categories, then Orders; Customers greenfield.  
4. Keep Settings-only IA (rail, hash, registry); promote **surface, header, save bar, spacing**.  
5. Explicitly neutralize Admin accent so **client branding stays on the storefront**.

**Do not implement until this ADR is approved.** Implementation should land as a sequenced set of RFCs/PRs (Foundation → Dashboard → Catalog → Orders), each reducing CSS duplication.

---

## Appendix — Key paths audited

```
src/features/admin/styles/admin.css
src/features/admin/styles/settings.css
src/features/admin/components/AdminLayout|Sidebar|Header|DataTable
src/features/admin/dashboard/*
src/features/admin/products/*
src/features/admin/categories/*
src/features/admin/orders/*
src/features/admin/settings/*
src/features/auth/components/AdminLoginForm.tsx
src/app/admin/**
src/shared/ui/**
src/shared/design/tokens.ts
```
