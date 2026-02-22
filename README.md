# job-research-assistant

Application Next.js + TypeScript pour piloter une recherche d'emploi :

- edition et versioning de CV,
- feedback IA par section CV,
- optimisation du CV pour une offre,
- suivi de candidatures,
- generation de lettres de motivation,
- export PDF via Gotenberg.

## Prerequis

- Node.js 20+
- PostgreSQL
- Gotenberg v8 (local ou distant)
- OAuth Google configure (client id / secret)

## Installation

```bash
npm install
npx prisma generate
npx prisma migrate dev
```

## Lancement

```bash
npm run dev
```

Puis ouvrir `http://localhost:3000`.
Landing marketing: `http://localhost:3000/landing`.

## Script de lancement (local/prod)

```bash
# Local: demarre postgres + gotenberg, prepare Prisma, puis lance l'app
./scripts/start.sh local

# Prod: lance le deploiement Ansible
./scripts/start.sh prod

# Prod (dry-run)
./scripts/start.sh prod-check
```

## Deploiement auto avant push `main` (hook Git local + rsync)

Le deploiement est declenche localement avant un `git push` de `main`, via le hook:
- `.githooks/pre-push`

Ce hook lance:
- `scripts/deploy-on-push.sh`
- puis `./scripts/start.sh prod` (Ansible en `local_sync`, donc transfert `rsync` depuis le poste local vers le VPS).

Activation sur ce poste:

```bash
git config core.hooksPath .githooks
```

Comportement:
- push de `main` -> deploiement auto (si le deploiement echoue, le push est bloque)
- push d'une autre branche -> rien
- pour skipper ponctuellement: `SKIP_AUTO_DEPLOY=true git push`

## Landing (Ladder)

- Fichier principal: `src/app/(marketing)/landing/page.tsx`
- Styles: `src/app/(marketing)/landing/landing.module.css`
- Layout dedie landing: `src/app/(marketing)/layout.tsx`
- Layout app (dashboard/topbar): `src/app/(app)/layout.tsx`
- Nom produit (temporaire): constante `PRODUCT_NAME` dans `src/app/(marketing)/landing/page.tsx`
- Pricing: constante `PRICING` dans `src/app/(marketing)/landing/page.tsx`
- Tracking CTA: fonction `track(eventName, payload)` dans `src/app/(marketing)/landing/page.tsx`

## Variables d'environnement (optionnel)

- `DATABASE_URL` (obligatoire)
- `AUTH_SECRET` (obligatoire)
- `AUTH_DEBUG` (optionnel, `true` pour logs auth server-side en debug)
- `DISABLE_AUTH_LOCAL` (optionnel, `true` uniquement en local/dev pour bypass login)
- `GOOGLE_CLIENT_ID` (obligatoire)
- `GOOGLE_CLIENT_SECRET` (obligatoire)
- `OPENAI_KEY_ENCRYPTION_SECRET` (obligatoire, 32 bytes utf8 ou base64)
- `GOTENBERG_URL` (defaut: `http://localhost:3001`)
- `PDF_TIMEOUT_MS` (defaut: `15000`)
- `OPENAI_MODEL` (defaut: `gpt-4.1-mini`)
- `OPENAI_TIMEOUT_MS` (defaut: `20000`)
- `NEXT_PUBLIC_NEW_UI_ENABLED` (optionnel, `true` pour activer la nouvelle UX/UI; rollback immediat en repassant a `false`)

## Migration UX/UI

- Mapping canonique des adaptations UI/data: `docs/ui-migration-mapping.md`
- Le backend (`/api/state`, `/api/ai/*`, `/api/pdf`, Prisma, NextAuth) reste identique.
- Le switch se fait via le feature flag `NEXT_PUBLIC_NEW_UI_ENABLED`.

## Endpoints

- `POST /api/ai/feedback`
- `POST /api/ai/cv-optimize`
- `POST /api/ai/cover-letter`
- `POST /api/pdf`

## Notes securite

- Authentification via Google OAuth.
- La cle OpenAI peut etre conservee cote serveur et est chiffree (AES-256-GCM).
- La cle OpenAI n'est jamais retournee au client apres stockage.
