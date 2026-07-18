# ADR-020 — Admin Settings Redesign

## Status

**Accepted** — implemented (RFC-020).

**RFC:** RFC-020  
**Depends on:** ADR-004 (Admin Dashboard), ADR-008 (Admin Management), ADR-016 (Payments / paymentProviders on settings), ADR-019 (Notifications on settings)  
**Enables:** Scalable admin configuration UX for future modules (Analytics, Inventory, Taxes, Integrations, SEO, Theme) without changing the settings data model

### Approved adjustments (locked)

1. **Registry-driven sections** — `SETTINGS_SECTIONS` in `config/settings-sections.ts` owns id, title, icon, order, fieldRoots, and section component. Sidebar and content both render from this registry.
2. **Single form / single save** — one `StoreSettings` values object, one Zod pipeline, one `updateGeneralSettings()` call. No section-level persistence.
3. **Hash navigation** — `/admin/settings#payments` etc.; clicking a section scrolls to its anchored card. Active section syncs via IntersectionObserver + hash.
4. **Last opened section** — `localStorage` key `lastSettingsSection`.
5. **Sticky Save Bar** — visible only when dirty; Unsaved changes + Cancel + Save Changes.
6. **Leave warning** — `ConfirmDialog` when navigating away via in-app links while dirty (not `beforeunload` as primary).
7. **Mobile** — drawer section navigation (not tabs); same field UI as desktop.
8. **`AdminSettingsView` deleted** — dead RFC-011 read view removed.

---

## Context

Admin Settings (`/admin/settings`) started as a compact branding form (RFC-012 / ADR-008). It has since absorbed:

| Module | Source |
|--------|--------|
| Brand / locale / contact / social / hero / feature flags | ADR-008 |
| Payment methods (`paymentProviders`) | ADR-016 |
| Notifications (business-facing email config) | ADR-019 / RFC-019.1 |

The page was a **single long scroll** inside one `Card` + one `<form>`. More modules are planned. A scrolling wall of fields is no longer a maintainable or discoverable admin experience.

This ADR redesigns **presentation and composition only**.

### Non-goals (hard stop)

- Do **not** change Firestore collections or `settings/general` shape
- Do **not** change `StoreSettingsService` contracts (`getGeneralSettings` / `updateGeneralSettings`)
- Do **not** change Zod validation *rules* (messages / constraints stay equivalent)
- Do **not** change notification, payment, or shipping **domain** architecture
- Do **not** introduce section-level persistence or multiple save endpoints

---

## Goals

1. Transform Admin Settings into a **modular, navigable** configuration area.
2. Keep **one** `StoreSettings` object, **one** validation pipeline, **one** save operation.
3. Make adding a future module a **single new section** (registry + UI), not a form rewrite.
4. Preserve existing field behavior, uploads, and service calls.
5. Add proper **unsaved-changes** UX (today it is effectively missing).
6. Work well on desktop (sticky section nav) and mobile (collapsible section nav).

---

## Architecture review (as-is)

### Route and data load

```
app/admin/(dashboard)/settings/page.tsx
  → getStoreSettings()
  → toStoreSettingsFormData(settings)
  → <StoreSettingsForm settings={…} />
```

The page is a thin Server Component. That pattern should remain.

### Current UI structure

`StoreSettingsForm` (~677 lines) owns:

- Full form state (`useState` of all writable fields)
- Zod schema (`storeSettingsFormSchema`)
- Error mapping for flat + nested paths (`hero`, `paymentProviders`, `notifications`)
- Submit → `StoreSettingsService.updateGeneralSettings`
- Inline markup for every section, separated only by `SectionHeading`

Current visual sections (in document order):

1. Brand  
2. Locale & commerce  
3. Contact  
4. Social  
5. Homepage hero  
6. Payment methods  
7. Notifications  
8. Feature flags  

There is **no** section navigation, **no** hash routing, **no** sticky secondary nav.

### Already extracted (reuse as-is)

| Asset | Path | Role |
|-------|------|------|
| Payment fields | `PaymentProvidersSettingsFields.tsx` | Controlled nested UI |
| Notification fields | `NotificationsSettingsFields.tsx` | Controlled nested UI (RFC-019.1) |
| Serializable DTO | `store-settings-form-data.ts` | Server → client props + notifications mappers |
| Domain service | `StoreSettingsService` | Single read/write for `settings/general` |
| Domain types | `StoreSettings`, `StoreSettingsUpdateInput` | Unchanged contract |
| Media upload | `ImageUpload` + `MediaService` | Logo / favicon / hero |
| Admin shell | `AdminLayout` / `AdminSidebar` | Primary admin nav (pattern reference) |

### Legacy / dead

| Asset | Notes |
|-------|-------|
| `AdminSettingsView.tsx` | Read-only RFC-011 view; **not used** by the settings page. Safe to remove or leave unused during RFC-020. |

### Save flow (keep)

1. Client Zod `safeParse` on the **full** form values  
2. Map notifications form → domain via `toNotificationsSettings`  
3. `new StoreSettingsService().updateGeneralSettings({ … })`  
4. Toast success / domain error  
5. `router.refresh()`  

This must remain the only persistence path.

### Validation (keep rules, relocate schema)

Validation lives **inside** `StoreSettingsForm.tsx` today. Rules are correct for the product; they should move to a dedicated module (e.g. `store-settings-form-schema.ts`) so section components stay presentational. **Do not** change constraint semantics.

### Dirty / unsaved state (gap)

| Capability | Current state |
|------------|---------------|
| Detect unsaved changes | **Missing** — only a post-save `saved` flag cleared on edit |
| Disable Save until dirty | **Missing** — Save always enabled (except while `loading`) |
| “Unsaved changes” indicator | **Missing** |
| Warn before leaving route | **Missing** |
| `beforeunload` / browser leave | **Missing** (and not required as a first-class hack) |

`setSaved(false)` on field change is not a dirty model: after load, Save is active even with zero edits; after save + edit, there is no comparison against the last persisted snapshot.

### Responsive (gap)

Admin shell already handles primary nav (desktop sticky sidebar / mobile off-canvas). Settings has **no** secondary navigation, so mobile users must scroll the entire form. The redesign must add section nav without duplicating the admin shell chrome.

---

## Decision

### 1. UX model: sectioned shell, single form

Replace the long single-column page with:

```
Settings (page title)
├── SettingsSidebar (section nav — sticky on desktop)
├── SettingsContent (active section fields)
└── SettingsSaveBar (dirty indicator + Save Changes)
```

**One** React form / one values object spans all sections. Switching sections only changes what is **visible**, not what is **owned**.

**Why**

- Discoverability: users know where Payments vs Notifications live.
- Scalability: new modules add one nav item + one section component.
- Correctness: one save keeps `settings/general` consistent (payments + notifications + branding stay a single document write).

### 2. Navigation model: in-page sections + hash deep-links

**Recommended:** stay on `/admin/settings` and use hash deep-links:

| URL | Section |
|-----|---------|
| `/admin/settings` or `#general` | General |
| `#branding` | Branding |
| `#contact` | Contact |
| `#shipping` | Shipping |
| `#payments` | Payments |
| `#notifications` | Notifications |
| `#advanced` | Advanced |

**Why hash (not `/admin/settings/payments` routes)**

- Matches “one form / one save” — no nested layouts fighting shared state.
- Shareable deep-links with zero Firestore or router data-loading changes.
- Page Server Component stays unchanged (still one `getStoreSettings()`).

**Remember last section:** optional nice-to-have via `sessionStorage` (or hash only). Prefer hash as source of truth; session restore is secondary.

### 3. Section map (field ownership)

Reorganize **existing fields** into the RFC nav labels. No new domain fields.

| Section id | Label | Fields (from current form) |
|------------|-------|----------------------------|
| `general` | General | `storeName`, `tagline`, `description`, `currency`, `country`, `locale`, `language` |
| `branding` | Branding | `logo`, `favicon`, `primaryColor`, `secondaryColor`, `hero.*` |
| `contact` | Contact | `email`, `phone`, `whatsapp`, `address`, social (`instagram`, `facebook`, `tiktok`, `youtube`) |
| `shipping` | Shipping | `shippingEnabled` (placeholder-ready for future shipping modules) |
| `payments` | Payments | `paymentProviders` → existing `PaymentProvidersSettingsFields` |
| `notifications` | Notifications | `notifications` → existing `NotificationsSettingsFields` |
| `advanced` | Advanced | `maintenanceMode` (+ future dangerous / rarely touched flags) |

**Why this split**

- Matches the proposed IA.
- Social folds into Contact (no orphan “Social” nav item).
- Hero belongs with Branding (visual identity).
- Locale/commerce sits under General (store identity + market), not Branding.
- Shipping and Advanced are thin today but reserve stable slots for RFCs.

### 4. Folder structure

```
features/admin/settings/
  components/
    SettingsLayout.tsx       # sidebar + content + save bar chrome
    SettingsSidebar.tsx      # section nav (desktop sticky / mobile collapsible)
    SettingsContent.tsx      # renders active section
    SettingsSaveBar.tsx      # dirty label + disabled/enabled Save
    SettingsSection.tsx      # section title + description wrapper
  sections/
    GeneralSettingsSection.tsx
    BrandingSettingsSection.tsx
    ContactSettingsSection.tsx
    ShippingSettingsSection.tsx
    PaymentsSettingsSection.tsx   # wraps PaymentProvidersSettingsFields
    NotificationsSettingsSection.tsx  # wraps NotificationsSettingsFields
    AdvancedSettingsSection.tsx
  config/
    settings-nav.ts          # registry: id, label, icon?, hash
  StoreSettingsForm.tsx      # orchestrator: state, validate, save, dirty
  store-settings-form-schema.ts  # Zod (moved out of the form)
  store-settings-form-data.ts    # keep
  PaymentProvidersSettingsFields.tsx  # keep
  NotificationsSettingsFields.tsx     # keep
  index.ts
```

**Why under `features/admin/settings/` (not a new domain feature)**

- Domain settings already live in `features/settings` (service + types).
- This work is **admin presentation**. ADR-008 already established `features/admin/*` for admin UI.
- Avoids splitting business logic out of `StoreSettingsService`.

### 5. Component hierarchy

```
AdminSettingsPage (RSC)
  └─ StoreSettingsForm (client orchestrator)
       ├─ page header (“Settings”)
       └─ SettingsLayout
            ├─ SettingsSidebar ← settings-nav registry
            ├─ SettingsContent
            │    └─ SettingsSection
            │         └─ *SettingsSection (fields only)
            └─ SettingsSaveBar
                 └─ Save Changes (submit)
```

Sections receive **slices** of values + setters / `onChange` + field errors + `disabled`. They never call `StoreSettingsService`.

### 6. Save strategy (locked)

| Rule | Decision |
|------|----------|
| Document | Single `StoreSettings` / `settings/general` |
| Persist API | Only `StoreSettingsService.updateGeneralSettings` |
| Validation | One Zod parse of the **entire** form before save |
| UI button | One **Save Changes** in `SettingsSaveBar` |
| Section save | **Forbidden** |

Editing Payments then switching to Notifications without saving keeps both edits in memory until one successful save (or discard via leave/reset).

### 7. Unsaved changes (required)

Implement a real dirty model:

1. Keep `initialValues` (from props / last successful save).  
2. `isDirty = !deepEqual(values, initialValues)` (or a small stable serializer).  
3. Save button **disabled** when `!isDirty || loading`.  
4. Show “Unsaved changes” in `SettingsSaveBar` when dirty.  
5. Warn before leaving the **route** when dirty:
   - Prefer Next.js App Router navigation interception / confirm dialog (`ConfirmDialog` already in the design system per ADR-008).
   - Optional `beforeunload` only if product requires tab-close protection; not the primary mechanism.

**Do not** treat section switches as “leave” if the form stays mounted (preferred). If a future implementation unmounts section trees aggressively, dirty state must still live in the parent orchestrator.

### 8. Responsive behavior

| Viewport | Behavior |
|----------|----------|
| Desktop (`lg+`) | Sticky settings sidebar (secondary nav) beside scrollable content; save bar sticky at bottom or under header |
| Mobile | Collapsible section nav (select / disclosure / horizontal chip list — pick one pattern, no duplicate field UIs) |
| Both | Only one section’s fields visible at a time (or one primary focus); avoid stacking all sections again on mobile |

Reuse mental model of `AdminSidebar` (persistent vs compact) without nesting a second off-canvas that fights the admin shell. Prefer a **compact top/select nav** on small screens.

### 9. Extensibility registry

`settings-nav.ts` is the extension point:

```ts
type SettingsSectionId =
  | "general"
  | "branding"
  | "contact"
  | "shipping"
  | "payments"
  | "notifications"
  | "advanced";
  // future: "analytics" | "inventory" | "taxes" | "integrations" | "seo" | "theme"

type SettingsNavItem = {
  id: SettingsSectionId;
  label: string;
  hash: string; // e.g. "payments"
  icon?: LucideIcon; // nice-to-have
};
```

Adding Analytics later:

1. Append nav item  
2. Add `AnalyticsSettingsSection`  
3. Wire fields into the existing form values + Zod schema **only if** the data model already gained those fields in a separate RFC  

ADR-020 does **not** invent those domain fields.

### 10. Nice-to-haves (in scope if cheap)

| Idea | Recommendation |
|------|----------------|
| Section icons (Lucide) | **Yes** — matches `AdminSidebar` icons; low cost via registry |
| Hash deep-links | **Yes** — core to navigation proposal |
| Remember last section | **Optional** — hash alone is enough for v1 |

---

## Existing code to reuse

| Keep unchanged | Reason |
|----------------|--------|
| `StoreSettingsService` | Contract frozen by this ADR |
| `StoreSettings` / `StoreSettingsUpdateInput` | Data model frozen |
| `toStoreSettingsFormData` / `toNotificationsSettings` | Serialization boundary |
| `PaymentProvidersSettingsFields` | Already modular |
| `NotificationsSettingsFields` | Already modular |
| `ImageUpload` | Branding media |
| `getStoreSettings` + settings page load | RSC composition |
| Shared UI (`Button`, `Input`, `Card`, `Switch`, `Toast`, `ConfirmDialog`) | Design system |

| Refactor / split | Reason |
|------------------|--------|
| `StoreSettingsForm.tsx` | Too large; becomes orchestrator only |
| Inline Zod schema | Move beside form data helpers |
| Inline Brand / Contact / etc. JSX | Become `sections/*` |

| Remove or deprecate | Reason |
|---------------------|--------|
| `AdminSettingsView` usage / export | Superseded; optional cleanup in same RFC |

---

## Files to create

```
docs/architecture/ADR-020-admin-settings-redesign.md   # this document

src/features/admin/settings/components/SettingsLayout.tsx
src/features/admin/settings/components/SettingsSidebar.tsx
src/features/admin/settings/components/SettingsContent.tsx
src/features/admin/settings/components/SettingsSaveBar.tsx
src/features/admin/settings/components/SettingsSection.tsx

src/features/admin/settings/sections/GeneralSettingsSection.tsx
src/features/admin/settings/sections/BrandingSettingsSection.tsx
src/features/admin/settings/sections/ContactSettingsSection.tsx
src/features/admin/settings/sections/ShippingSettingsSection.tsx
src/features/admin/settings/sections/PaymentsSettingsSection.tsx
src/features/admin/settings/sections/NotificationsSettingsSection.tsx
src/features/admin/settings/sections/AdvancedSettingsSection.tsx

src/features/admin/settings/config/settings-nav.ts
src/features/admin/settings/store-settings-form-schema.ts
```

(Optional) `hooks/use-settings-dirty.ts` or `lib/settings-form-dirty.ts` if equality helpers deserve isolation.

---

## Files to modify

| File | Change |
|------|--------|
| `StoreSettingsForm.tsx` | Slim to orchestrator + wire layout / dirty / hash |
| `index.ts` | Export new public surface if needed; drop dead `AdminSettingsView` if removed |
| `app/admin/(dashboard)/settings/page.tsx` | Likely unchanged (still renders form) |
| `features/admin/index.ts` | Mirror export cleanup |
| `admin.css` (optional) | Sticky settings subnav / save bar tokens only if Tailwind alone is insufficient |

**Do not modify:** `store-settings.service.ts`, settings domain types, payment/notification provider modules, Firestore rules/docs for structure.

---

## Navigation proposal (IA)

```
Settings
├── General        # identity + market
├── Branding       # logo, colors, hero
├── Contact        # contact + social
├── Shipping       # shippingEnabled (thin)
├── Payments       # paymentProviders
├── Notifications  # sender + enable flags
└── Advanced       # maintenanceMode
```

Default active section: `general` (or hash override).

Active item styling should mirror admin nav (`data-active`) for consistency.

---

## Risks

| Risk | Mitigation |
|------|------------|
| Accidental domain / service changes while refactoring | Code review checklist: no service/type diffs except UI imports |
| Dirty false positives (object identity, undefined vs missing) | Compare against normalized `StoreSettingsFormData` snapshots |
| Validation errors in a hidden section | On failed parse, auto-switch to the first section that owns an error; show badge on nav items with errors |
| Nested scroll / sticky conflicts with admin shell | Test `lg` sticky sidebar + main scroll; keep settings sidebar inside `admin-main` |
| Mobile double-nav fatigue | Compact section control; never a second full off-canvas like AdminSidebar |
| Shipping / Advanced feel empty | Short helper copy + “more options coming” is acceptable; reserve the slot |
| Hash + Next soft navigation | Sync `hashchange` + initial `window.location.hash` in the client form only |

---

## Open questions (resolved in RFC-020)

| Question | Decision |
|----------|----------|
| Mobile section control | **Drawer** (button opens section list); not tabs |
| All sections vs one-at-a-time | **All sections rendered**; sidebar click **scrolls** to anchored section |
| Error badges on nav | **Yes** — `sectionStatuses.hasErrors` dots + scroll to first error on failed validate |
| Discard / Cancel | **Cancel** on sticky save bar resets to last saved snapshot; leave uses `ConfirmDialog` |
| `AdminSettingsView` | **Deleted** |
| Social placement | **Contact** |
| `shippingEnabled` | **Shipping** section |

---

## Implementation notes (RFC-020)

### Registry-driven architecture

`config/settings-sections.ts` exports `SETTINGS_SECTIONS`. Adding a module requires one registry entry + one section component (+ domain fields only when a separate RFC adds them).

### Sticky Save Bar

`SettingsSaveBar` mounts only when `isDirty`. Shows “Unsaved changes”, Cancel (revert snapshot), and Save Changes (`type="submit"`).

### Hash navigation

Section wrappers use `id={sectionId}` and `scroll-mt-24`. Navigation updates `location.hash` via `history.replaceState`, scrolls into view, and persists `lastSettingsSection` in `localStorage`.

### Modular sections

Field UI lives under `sections/*`. Existing `PaymentProvidersSettingsFields` and `NotificationsSettingsFields` are reused unchanged.

### Future extensibility

`SettingsSectionStatus` already supports `dirty`, `hasErrors`, `warning`, `incomplete`, `complete` for sidebar indicators without redesigning nav.

### Unchanged contracts

`StoreSettingsService`, Firestore `settings/general`, Zod **rules**, payment and notification domain modules — unchanged.
)
