# FEBiS — Plateforme digitale (NYI-CDC-FEBIS-2026-001)

Site vitrine + fondation technique pour l’écosystème FEBiS (Côte d’Ivoire).

## Stack (choix projet)

- **Next.js 16** (App Router) + TypeScript + Tailwind
- **MongoDB** (base centrale unique)
- Auth JWT cookie + mots de passe **bcrypt** (4 rôles CDC)

> Le CDC mentionne aussi Strapi/PostgreSQL ; ici Next.js + MongoDB a été retenu pour le développement.

## Phase 1 — déjà en place

| Brique CDC | Statut |
|---|---|
| 4.1 Site vitrine (4 pôles + contact) | ✅ |
| Base DB + Auth + rôles | ✅ fondation |
| CRM clients (upsert contact) | ✅ amorce |
| Module Résidences (fiches seed) | ✅ amorce API |
| BTP / Event / Boutique / Finance / PDF / Wave | ⏳ à venir |

## Démarrage

```bash
npm install
# MongoDB local ou Atlas dans .env.local
npm run seed
npm run dev
```

- Vitrine : http://localhost:3000  
- Admin : http://localhost:3000/admin  
- Compte seed : `admin@febis.ci` / `FebisAdmin2026!`

## Collections MongoDB

`users` · `clients` · `contacts` · `lodgings` (+ modules à venir)

## Référence

Cahier des charges : `docs/NYI-CDC-FEBIS-2026-001_Cahier_Charges_Technique.pdf`
