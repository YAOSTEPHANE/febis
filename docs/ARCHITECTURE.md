# Architecture FEBiS

Plateforme Next.js (App Router) + MongoDB.

## Modules

| Module | Public | Admin | Lib |
|--------|--------|-------|-----|
| Vitrine / CMS home | `/` | hero, poles, stats, blog, témoignages, travaux | `homepage-data` |
| Résidences | `/residences`, `/residences/[slug]` | residences, reservations | `residences-data` |
| Événementiel | `/evenementiel` | evenementiel | `evenementiel-data` |
| Boutique | `/boutique`, panier, commandes | boutique | `boutique-data` |
| BTP | `/btp` | btp | `btp-data` |
| CRM / Finance / Facturation | — | crm, finance, paiements, facturation | `crm`, `finance`, `facturation`, `facturation-pdf`, `paiements` |
| RH | — | rh | `rh` |
| Auth RBAC | `/admin` | 4 rôles | `auth`, `rbac` |

## Sécurité

- **Middleware** (`src/middleware.ts`) : JWT cookie `febis_session` obligatoire pour `/admin/dashboard/*` et `/api/admin/*`. Permissions fines via `can()` dans chaque route.
- **Rate-limit** mémoire (`src/lib/rate-limit.ts`) sur les POST publics : paiements/initiate, contact, BTP prospects, réservations, devis event, commandes boutique. Renvoie `429` + `Retry-After`.

## Paiements

1. `POST /api/payments/initiate` → intent `paymentIntents` (pending)
2. Confirmation :
   - Admin `POST /api/admin/paiements/confirm`
   - Simulation `POST /api/payments/simulate-success`
   - Webhooks `/api/payments/webhooks/{wave,orange,mtn}`
3. `confirmPaymentIntent` → `recordPayment` + transition métier :
   - réservation → étape `acompte`
   - commande → `confirmee`
   - devis event → `accepte`

Sans clés opérateurs : mode manuel / simulation. Secrets optionnels : `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET`, `ORANGE_WEBHOOK_SECRET`, `MTN_WEBHOOK_SECRET`.

## Cron

`POST|GET /api/cron/daily` — backup quotidien + scans stock/échéances.  
Header : `Authorization: Bearer <CRON_SECRET>` (obligatoire en production).

## Collections Mongo principales

`users`, `lodgings`, `reservations`, `equipment`, `eventQuotes`, `products`, `shopOrders`, `btpProjects`, `clients`, `payments`, `paymentIntents`, `invoices`, `expenses`, `notifications`, `backups`, `employees`, `homepage`, `contacts`.
