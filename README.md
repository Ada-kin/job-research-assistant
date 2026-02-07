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
- Gotenberg v8 (local ou distant)
- Une cle OpenAI saisie par l'utilisateur dans l'interface

## Installation

```bash
npm install
```

## Lancement

```bash
npm run dev
```

Puis ouvrir `http://localhost:3000`.

## Variables d'environnement (optionnel)

- `GOTENBERG_URL` (defaut: `http://localhost:3000`)
- `PDF_TIMEOUT_MS` (defaut: `15000`)
- `OPENAI_MODEL` (defaut: `gpt-4.1-mini`)
- `OPENAI_TIMEOUT_MS` (defaut: `20000`)

## Endpoints

- `POST /api/ai/feedback`
- `POST /api/ai/cv-optimize`
- `POST /api/ai/cover-letter`
- `POST /api/pdf`

## Notes securite

- La cle OpenAI est fournie par l'utilisateur.
- La cle n'est jamais stockee cote serveur.
- Le stockage local de la cle est optionnel (parametre utilisateur).
