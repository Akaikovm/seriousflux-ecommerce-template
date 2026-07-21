# Agency install: Security rules + Firebase Admin (GAP-001 / GAP-004)

Guía práctica para ti (y para el próximo cliente). Complementa [ADR-024](./ADR-024-firestore-rules-admin-sdk.md).

---

## Qué problema resolvimos

Antes, con rules abiertas, cualquiera con la API key web podía leer/escribir Firestore.  
Al cerrar rules, el servidor (webhooks, Admin SSR, emails) dejaba de poder escribir/leer porque usaba el **client SDK sin usuario**.

**Solución:**

1. **Rules** en el repo (`firestore.rules`, `storage.rules`) — quién puede qué desde el navegador.
2. **Firebase Admin SDK** en el servidor — bypass de rules solo en código de confianza.

---

## Template vs cliente (Casacas / próximo store)

| Qué | Dónde vive | ¿Se vende con el template? |
|-----|------------|----------------------------|
| Código Next.js / features | Este repo | Sí — motor reutilizable |
| Marca demo “Serious Flux” | Seeds + defaults en código | Solo para demos (`npm run seed:demo`) |
| Marca real del cliente | Firestore `settings/general` + Admin Settings | Por proyecto Firebase |
| Catálogo / pedidos | Firestore del proyecto | Por cliente |
| Secrets (Admin key, MP, Resend) | `.env.local` / App Hosting secrets | **Nunca** en Git |
| Proyecto Firebase | p.ej. `the-casacas-club` | Un proyecto (o copia) por cliente |

**Casacas Club** = primer install en Firebase `the-casacas-club`.  
**Serious Flux** = nombre de tu agencia / kit. No hay que “limpiar Casacas del código” si la marca está en Firestore, no hardcodeada en TypeScript.

Para el **siguiente cliente**: nuevo Firebase + nuevo `.env` + seed o import de catálogo + Admin Settings. El mismo repo.

---

## Archivos importantes

| Archivo | Rol |
|---------|-----|
| `firestore.rules` / `storage.rules` | Modelo de seguridad |
| `firebase.json` | Apunta el CLI a esas rules |
| `.firebaserc` | Proyecto Firebase activo (hoy: `the-casacas-club`) |
| `src/firebase/admin.ts` | Init Admin SDK (server-only) |
| `src/features/orders/services/order.admin.ts` | Órdenes privilegiadas |
| `src/features/inventory/services/inventory.admin.ts` | Commit/restore stock en webhook |
| `src/features/admin/lib/admin-server-data.ts` | Lecturas Admin SSR |
| `apphosting.yaml` | Referencia al secret `FIREBASE_SERVICE_ACCOUNT_KEY` |

**Nunca commits:** `.env.local`, `.secrets/`, `*firebase-adminsdk*.json`

---

## Local (tu máquina)

1. Service account JSON en `.secrets/firebase-admin.json`
2. En `.env.local`:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=.secrets/firebase-admin.json
   ```
   (alternativa: `FIREBASE_SERVICE_ACCOUNT_KEY=` + JSON en una línea)
3. `npm run dev`

Con Admin configurado: Admin SSR + webhooks + emails de orden funcionan **aunque** las rules estén desplegadas.

---

## App Hosting (producción)

Ya creado en el proyecto:

- Secret: `FIREBASE_SERVICE_ACCOUNT_KEY`
- Backend: `seriousflux-ecommerce`
- Referencia en `apphosting.yaml` (`RUNTIME`)

Tras push de `apphosting.yaml`, hace falta un **nuevo rollout**.

Otros secrets (cuando quieras):

```bash
firebase use the-casacas-club
firebase apphosting:secrets:set NOTIFICATIONS_DISPATCH_SECRET
firebase apphosting:secrets:set MERCADOPAGO_ACCESS_TOKEN
firebase apphosting:secrets:set MERCADOPAGO_WEBHOOK_SECRET
firebase apphosting:secrets:set RESEND_API_KEY
```

Luego descomenta esos bloques en `apphosting.yaml`.

`NEXT_PUBLIC_*` y `NEXT_PUBLIC_APP_URL` (HTTPS del store) → Console → App Hosting → Environment.

---

## Desplegar Security Rules

```bash
firebase use the-casacas-club
firebase deploy --only firestore:rules,storage
```

**Estado (Casacas / `the-casacas-club`):**

| Target | Estado |
|--------|--------|
| Firestore rules | Desplegadas (2026-07-22) |
| Storage rules | Pendiente — hay que activar Storage en Console → Storage → Get Started, luego `firebase deploy --only storage` |

**Antes de desplegar rules:** Admin SDK debe estar configurado (local y/o App Hosting). Si no, Admin SSR y sync de pagos se rompen.

### Smoke checklist después de rules

- [ ] Storefront carga productos / settings
- [ ] Checkout crea orden (guest o logged-in)
- [ ] Admin login + listados (productos, pedidos)
- [ ] Admin edita producto / sube imagen
- [ ] Mercado Pago webhook marca paid (o sandbox)
- [ ] Emails de pedido (si Resend está on)

---

## Quién usa qué SDK

```
Browser (cliente / admin logueado)
  → Firebase client SDK + Security Rules

Server (webhook, preference, Admin SSR, emails)
  → Firebase Admin SDK (bypassa rules)
```

No reexportes módulos Admin desde barrels que importan Client Components (`orders/services/index.ts` ya lo documenta).

---

## Qué queda pendiente (sell-ready)

| GAP | Estado |
|-----|--------|
| GAP-001 Rules | done |
| GAP-004 Admin SDK | done |
| GAP-003 Notifications API | done |
| GAP-002 Server admin auth | open |
| GAP-005 Tests | open |
| GAP-006 Checkout revalidation | open |

---

## Changelog de esta entrega

| Fecha | Nota |
|-------|------|
| 2026-07-22 | Rules + Admin SDK + secret App Hosting + docs de install; emails de orden leen vía Admin cuando está configurado |
