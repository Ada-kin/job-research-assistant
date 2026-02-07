# Spécification technique — job-research-assistant

## 1. Stack

- Next.js (App Router)
- TypeScript strict
- Node.js 20+
- Zod pour validation
- Tests: Vitest/Jest + Playwright

## 2. Endpoints API

## 2.1 `POST /api/ai/feedback`

But : feedback sur une section CV.

Request :

- `apiKey: string`
- `section: "personal"|"profile"|"experiences"|"education"|"skills"|"languages"|"interests"`
- `sectionData: object|string`
- `jobContext?: { title?: string; company?: string; offerText?: string }`

Response 200 :

- `feedback: string`
- `suggestedRewrite?: string`

## 2.2 `POST /api/ai/cv-optimize`

But : recommandations globales pour optimiser un CV selon une offre.

Request :

- `apiKey: string`
- `cvData: object`
- `offerText: string`
- `targetRole?: string`

Response 200 :

- `alignmentScore: number`
- `strengths: string[]`
- `gaps: string[]`
- `sectionRecommendations: { section: string; actions: string[]; rewrite?: string }[]`

## 2.3 `POST /api/ai/cover-letter`

Request :

- `apiKey: string`
- `cvData: object`
- `offerText: string`
- `tone: "NEUTRE"|"FORMELLE"|"DYNAMIQUE"`
- `language: "fr"|"en"`

Response 200 :

- `letter: string`

## 2.4 `POST /api/pdf`

Request :

- `html: string`
- `fileName?: string`

Response : PDF binaire.

## 3. Modèle de données client

Store : `job_research_assistant_v2`

- `settings`
  - `openaiApiKey`, `storeApiKey`, préférences.
- `cv`
  - `currentVersionId`, `versions[]`, `aiFeedback`.
- `applications[]`
  - `id`, `title`, `company`, `status`, `notes`, `offer`.
- `applications[].offer`
  - `sourceType: "text"|"url"`
  - `sourceValue: string`
  - `offerText: string`
- `coverLetters[]`
  - `applicationId`, `cvVersionId`, `content`, `tone`, `language`.

Règles d’intégrité :

- `coverLetters.applicationId` doit exister.
- `coverLetters.cvVersionId` doit exister dans `cv.versions`.
- pas de `offerVersionId` en MVP.

## 4. Sécurité et robustesse

- validation Zod stricte,
- payload max 1MB,
- rate-limit par endpoint,
- timeout OpenAI/Gotenberg,
- aucune clé API en logs,
- clé jamais stockée serveur.

## 5. Tests minimum

1. Feedback section renvoie une structure valide.
2. `cv-optimize` renvoie score + recommandations par section.
3. Application partielle des recommandations crée une nouvelle version CV.
4. Génération lettre liée à `applicationId` + `cvVersionId`.
5. Export PDF inchangé.

## 6. Critères techniques de livraison

- build TypeScript sans erreurs,
- routes API valides (`feedback`, `cv-optimize`, `cover-letter`, `pdf`),
- migration schéma local vers v2 fonctionnelle,
- aucun champ lié au versioning d’offre dans le modèle MVP.
