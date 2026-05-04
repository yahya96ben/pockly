# 🚀 Pockly Fullstack — Guide de déploiement

Ce guide te mène de zéro à une app en production en **30-60 minutes** la première fois.

## 📋 Prérequis

- Node.js 18+ installé
- Un compte GitHub (pour héberger le code et déployer Vercel)
- Une carte bancaire pour Vercel/Supabase (les plans gratuits ne demandent généralement pas la CB, mais avoir une au cas où)

---

## Étape 1 — Créer la base de données Supabase (~5 min)

1. Va sur [supabase.com](https://supabase.com) et crée un compte (gratuit)
2. Clique **"New project"**
   - Nom : `pockly`
   - Mot de passe DB : génère-en un fort, **copie-le quelque part**
   - Région : `Europe (Frankfurt)` ou la plus proche de toi
3. Attends ~2 min que le projet soit provisionné
4. Va dans **SQL Editor** (icône `</>`)  → **New query**
5. Ouvre le fichier `database/schema.sql` de ce ZIP, **copie tout son contenu**
6. Colle dans l'éditeur Supabase, clique **"Run"** (en bas à droite)
7. Tu devrais voir `Success. No rows returned` ou similaire
8. Va dans **Table Editor** → tu dois voir 4 tables : `users`, `restaurants`, `products`, `orders`. Et 3 restaurants de démo dans `restaurants`.

### Récupère tes clés Supabase

1. Va dans **Settings** → **API**
2. Copie ces 2 valeurs (à coller dans Vercel plus tard) :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **service_role key** (cliquer "Reveal") : `eyJhbGc...` (longue chaîne)

⚠️ **La `service_role` key bypasse toutes les sécurités.** Ne la partage jamais. Ne la mets jamais dans le frontend. Elle ne vit que dans Vercel/le backend.

---

## Étape 2 — Pousser le code sur GitHub (~3 min)

```bash
# Dézippe pockly-fullstack.zip
cd pockly-fullstack

git init
git add .
git commit -m "Initial commit"

# Crée un repo sur github.com (privé recommandé) puis :
git remote add origin git@github.com:TONUSER/pockly.git
git branch -M main
git push -u origin main
```

---

## Étape 3 — Déployer sur Vercel (~5 min)

1. Va sur [vercel.com](https://vercel.com), connecte-toi avec GitHub
2. **"Add New" → "Project"**
3. **"Import"** ton repo `pockly`
4. **Framework Preset** : Vercel détecte généralement "Other". Laisse comme ça (le `vercel.json` à la racine fait tout le boulot).
5. **Root Directory** : laisse `./` (la racine)
6. **NE déploie pas tout de suite** — clique d'abord sur **"Environment Variables"** et ajoute ces 3 variables :

| Name | Value |
|------|-------|
| `SUPABASE_URL` | (l'URL Supabase de l'étape 1) |
| `SUPABASE_SERVICE_ROLE_KEY` | (la service_role key) |
| `JWT_SECRET` | une chaîne aléatoire de 32+ caractères |

   Pour générer un JWT_SECRET solide :
   ```bash
   # Linux/Mac :
   openssl rand -hex 32
   # Windows PowerShell :
   [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
   ```

7. Clique **"Deploy"**
8. Attends 1-2 min. Tu devrais voir "Congratulations" et une URL `xxx.vercel.app`

---

## Étape 4 — Tester que tout marche (~2 min)

1. **Test API** : ouvre `https://TON-PROJET.vercel.app/api/health` dans ton navigateur
   → tu dois voir `{"status":"ok","db":"reachable","time":"..."}`

2. **Test frontend** : ouvre `https://TON-PROJET.vercel.app`
   → tu dois voir la page d'accueil Pockly avec les 3 restaurants démo

3. **Test signup** :
   - Clique "Espace commerçant" → "Créer un compte"
   - Remplis et valide
   - Tu arrives sur l'écran d'onboarding restaurant
   - Crée un établissement
   - Tu arrives sur le dashboard admin

4. **Test commande client** :
   - Logout → "Commander"
   - Choisis un restaurant
   - Ajoute un produit, va au panier, valide
   - **Vérifie dans Supabase Table Editor → orders** qu'il y a une nouvelle ligne ✓

---

## 🛠 Développement local (optionnel)

Si tu veux développer sur ton PC avant de déployer :

```bash
# Terminal 1 — Backend
cd backend
npm install
# Crée backend/.env avec SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
npm i -g vercel
vercel dev   # lance le backend sur http://localhost:3000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev  # lance le frontend sur http://localhost:5173
```

Le frontend proxy automatiquement `/api/*` vers `localhost:3000`.

---

## 🔧 Ajout de fonctionnalités

### Ajouter un endpoint API

1. Crée un fichier dans `backend/api/...`
2. Ajoute la rewrite dans `vercel.json`
3. Push sur GitHub → déploiement automatique

### Modifier la DB

1. Écris ton SQL dans `database/migrations/001_xxx.sql`
2. Lance-le manuellement dans Supabase SQL Editor
3. Pour les vrais projets, utilise [supabase CLI](https://supabase.com/docs/guides/cli) avec `supabase db push`

---

## 💸 Coûts attendus

| Service | Plan gratuit | Quand passer payant |
|---------|--------------|---------------------|
| **Vercel** | 100 GB bandwidth/mois | Si > 5000 utilisateurs/jour |
| **Supabase** | 500 MB DB + 1 GB storage | Si > 50 000 commandes |
| **GitHub** | Repos privés illimités | Jamais pour ce projet |

Tu peux faire tourner ce projet **gratuitement à 100%** jusqu'à plusieurs milliers d'utilisateurs.

---

## 🆘 Dépannage

### `/api/health` retourne 500
- Vérifie tes 3 variables d'env Vercel (Project Settings → Environment Variables)
- Vérifie que tu as bien lancé `schema.sql` dans Supabase
- Va dans Vercel → Deployments → clique sur le dernier déploiement → **Functions** → tu verras les logs d'erreur

### Le frontend dit "Network error"
- Ouvre la console du navigateur (F12) → onglet Network → tu verras quelle requête échoue
- Si l'URL de l'API est mauvaise, vérifie `VITE_API_URL` dans Vercel (doit être `/api`)

### "Email already in use" alors que tu n'as jamais signupé
- Probablement un compte de test resté en DB. Vide la table : `DELETE FROM users;` dans le SQL Editor

### Le bouton "Ouvrir WhatsApp" ne fait rien
- Le numéro de téléphone du restaurant est vide ou mal formaté
- Vérifie que `restaurants.phone` est au format E.164 (ex: `+32470123456`)

---

## 📚 Architecture

```
┌─────────────────┐       ┌──────────────────┐
│  Browser        │       │  Vercel Edge     │
│  (frontend)     │ ─────▶│  (your domain)   │
│  React + Vite   │       │                  │
└─────────────────┘       │  ┌─────────────┐ │
                          │  │ Static HTML │ │
                          │  │ + JS + CSS  │ │
                          │  └─────────────┘ │
                          │                  │
                          │  ┌─────────────┐ │      ┌──────────────┐
                          │  │ /api/*      │ ├─────▶│  Supabase    │
                          │  │ Functions   │ │      │  PostgreSQL  │
                          │  │ (Node.js)   │ │      │              │
                          │  └─────────────┘ │      └──────────────┘
                          └──────────────────┘
```

Tout vit sous le même domaine, pas de CORS à gérer en prod.

---

## ✉️ Questions ?

Reviens vers moi avec :
- Une capture d'écran de l'erreur
- Le code de la requête qui échoue (Network tab)
- Les logs Vercel (Deployments → ta deploy → Functions)

Bonne route ! 🚀
