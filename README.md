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

## Variables d'environnement (optionnel)

- `DATABASE_URL` (obligatoire)
- `AUTH_SECRET` (obligatoire)
- `GOOGLE_CLIENT_ID` (obligatoire)
- `GOOGLE_CLIENT_SECRET` (obligatoire)
- `OPENAI_KEY_ENCRYPTION_SECRET` (obligatoire, 32 bytes utf8 ou base64)
- `GOTENBERG_URL` (defaut: `http://localhost:3001`)
- `PDF_TIMEOUT_MS` (defaut: `15000`)
- `OPENAI_MODEL` (defaut: `gpt-4.1-mini`)
- `OPENAI_TIMEOUT_MS` (defaut: `20000`)

## Endpoints

- `POST /api/ai/feedback`
- `POST /api/ai/cv-optimize`
- `POST /api/ai/cover-letter`
- `POST /api/pdf`

## Notes securite

- Authentification via Google OAuth.
- La cle OpenAI peut etre conservee cote serveur et est chiffree (AES-256-GCM).
- La cle OpenAI n'est jamais retournee au client apres stockage.
