# 🥐 Pockly Fullstack

Plateforme SaaS de commande en ligne pour restaurants, snacks, boulangeries.
**Version fullstack** : frontend React + backend Node.js + base PostgreSQL.

## 📁 Structure

```
pockly-fullstack/
├── frontend/              ← React + Vite (UI client + admin)
│   ├── src/
│   │   ├── App.jsx        ← Toute l'UI (1700+ lignes)
│   │   ├── api.js         ← Wrapper d'appels backend
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/               ← Vercel Serverless Functions (Node.js)
│   ├── api/
│   │   ├── auth/          ← signup, login, me
│   │   ├── restaurants/   ← CRUD multi-établissements
│   │   ├── products/      ← CRUD produits
│   │   ├── orders/        ← Création commandes (public) + gestion (admin)
│   │   └── health.js
│   ├── lib/               ← Helpers (Supabase, JWT, CORS)
│   └── package.json
│
├── database/
│   └── schema.sql         ← Schéma PostgreSQL complet
│
├── vercel.json            ← Config déploiement Vercel
├── .env.example           ← Variables d'environnement template
└── DEPLOY.md              ← Guide de déploiement pas-à-pas
```

## 🚀 Démarrage rapide

→ Suis le guide **[DEPLOY.md](./DEPLOY.md)**

En résumé :

1. **Supabase** : crée un projet, exécute `database/schema.sql`
2. **Vercel** : importe le repo, ajoute 3 variables d'env (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`)
3. **Deploy** : c'est tout

## ✨ Fonctionnalités

### Pour les clients
- Choix d'un établissement parmi les restaurants disponibles
- Catalogue produits avec photos, descriptions, catégories
- Produits **simples** (avec stock) et **composables** (poké bowls personnalisables)
- Panier multi-produits, checkout complet (231 pays supportés)
- Paiement sur place ou en ligne
- Bouton WhatsApp pour confirmer la commande au commerçant
- Programme de fidélité automatique

### Pour les commerçants
- Inscription avec onboarding établissement (1 écran)
- Dashboard temps réel des commandes (polling 15s)
- Notifications sonores (toggle ON/OFF)
- Statuts : pending → preparing → ready → done → cancelled
- Impression ticket optimisé 80mm
- Bouton "Répondre via WhatsApp" sur chaque commande
- Gestion produits, stock, fidélité, QR code, analytics

## 🛠 Stack technique

| Couche | Tech | Pourquoi |
|--------|------|----------|
| Frontend | React 18 + Vite | Rapide, simple, mobile-friendly |
| Backend | Node.js (Vercel Functions) | Serverless, gratuit, scalable |
| Base de données | PostgreSQL (Supabase) | Robuste, gratuit jusqu'à 500 MB |
| Auth | JWT + bcrypt maison | Pas de dépendance Supabase Auth — flexible |
| Déploiement | Vercel | Gratuit, déploiement Git auto |

## 🔒 Sécurité

- ✅ Mots de passe hashés avec bcrypt (cost 10)
- ✅ JWT signés avec secret côté serveur, expiration 30j
- ✅ `service_role` key Supabase **jamais** exposée au frontend
- ✅ Row Level Security activée sur toutes les tables
- ✅ Vérification d'ownership sur toutes les mutations (PATCH/DELETE)
- ✅ Validation des inputs côté backend
- ⚠️ **À ajouter en prod** : rate limiting, CSRF protection, RGPD consent

## 🧪 Endpoints API

```
POST   /api/auth/signup         { name, email, password, role }
POST   /api/auth/login          { email, password }
GET    /api/auth/me             [auth]

GET    /api/restaurants
POST   /api/restaurants         [merchant]
GET    /api/restaurants/:id
PATCH  /api/restaurants/:id     [merchant, owner]

GET    /api/products?restaurantId=xxx
POST   /api/products            [merchant]
GET    /api/products/:id
PATCH  /api/products/:id        [merchant, owner]
DELETE /api/products/:id        [merchant, owner]

POST   /api/orders              (public)
GET    /api/orders              [merchant]
GET    /api/orders/:id
PATCH  /api/orders/:id          [merchant, owner]

GET    /api/health
```

## 📈 Roadmap

- [x] V8 Frontend : multi-établissements, fidélité, QR, analytics, responsive
- [x] V9 Frontend : intégration WhatsApp via wa.me + notifications sonores
- [x] **V10 Fullstack : backend complet, Supabase, JWT auth, Vercel deployment**
- [ ] V11 : WhatsApp Cloud API (Meta) — quand 5+ commerçants payants
- [ ] V12 : Paiement en ligne réel (Mollie pour Belgique)
- [ ] V13 : Conformité RGPD complète (consentement, suppression, export)
- [ ] V14 : Admin SaaS multi-tenant (gérer plusieurs commerçants depuis Pockly)

## 📝 Licence

Projet privé — Tous droits réservés.
