# Spécifications fonctionnelles et techniques — job-research-assistant (V2)

## 1. Vision produit

`job-research-assistant` est une application web pour piloter la recherche d’emploi de bout en bout :

- construire et améliorer un CV,
- gérer les candidatures et leur statut,
- analyser des offres,
- générer des lettres de motivation via IA.

Positionnement : outil simple, local-first, sans compte obligatoire.

## 2. Évolution des contraintes

Changements validés :

- la contrainte “frontend en 1 fichier” est retirée,
- la stack peut être structurée,
- la clé API OpenAI est saisie par l’utilisateur,
- un système de versioning CV/offres est requis.

## 3. Stack recommandée

## 3.1 Choix principal

- **Next.js (App Router) + TypeScript**
- UI : React + CSS modules ou Tailwind (au choix équipe)
- Validation : Zod
- Persistance locale : localStorage
- PDF : API route Next proxifiant Gotenberg
- IA : API route Next appelant OpenAI avec clé fournie par l’utilisateur

## 3.2 Pourquoi ce choix

- rapide à itérer,
- séparation claire UI/API,
- typage strict,
- facile à maintenir et tester.

## 4. Architecture cible

## 4.1 Couches

- Frontend Next.js
  - pages/écrans (CV, candidatures, lettres, paramètres),
  - store client (state + persistence),
  - composants de versioning et diff.
- API routes Next.js
  - `POST /api/pdf`
  - `POST /api/ai/feedback`
  - `POST /api/ai/cover-letter`
- Services externes
  - Gotenberg,
  - OpenAI.

## 4.2 Principes

- aucune DB en MVP,
- aucune authentification en MVP,
- données utilisateur stockées localement,
- API key OpenAI jamais loggée côté serveur.

## 5. Modèle de données local

Clé localStorage recommandée : `job_research_assistant_v2`

```json
{
  "version": "2.0",
  "updatedAt": "ISO-8601",
  "settings": {
    "openaiApiKey": "string",
    "storeApiKey": true,
    "defaultLanguage": "fr",
    "defaultTone": "NEUTRE"
  },
  "cv": {
    "currentVersionId": "string",
    "versions": [
      {
        "id": "string",
        "label": "string",
        "createdAt": "ISO-8601",
        "data": {
          "personal": {},
          "profile": "",
          "experiences": [],
          "education": [],
          "skills": [],
          "languages": [],
          "interests": []
        },
        "aiFeedback": {
          "personal": "string",
          "profile": "string",
          "experiences": "string",
          "education": "string",
          "skills": "string",
          "languages": "string",
          "interests": "string"
        }
      }
    ]
  },
  "applications": [
    {
      "id": "string",
      "title": "string",
      "company": "string",
      "status": "A_POSTULER|POSTULE|ENTRETIEN_PREVU|ENTRETIEN_PASSE|OFFRE_RECUE|DECLINE",
      "notes": "string",
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601",
      "offer": {
        "currentVersionId": "string",
        "versions": [
          {
            "id": "string",
            "sourceType": "text|url",
            "sourceValue": "string",
            "offerText": "string",
            "createdAt": "ISO-8601",
            "summary": "string"
          }
        ]
      }
    }
  ],
  "coverLetters": [
    {
      "id": "string",
      "applicationId": "string",
      "cvVersionId": "string",
      "offerVersionId": "string",
      "tone": "NEUTRE|FORMELLE|DYNAMIQUE",
      "language": "fr|en",
      "content": "string",
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601"
    }
  ]
}
```

## 6. Versioning CV et offre

## 6.1 Versioning CV

L’utilisateur doit pouvoir :

- créer une version du CV (snapshot manuel),
- nommer une version,
- dupliquer une version pour adaptation,
- restaurer une version comme version courante,
- visualiser un diff textuel simple entre 2 versions (au minimum section par section).

Règles :

- une version est immuable après création,
- toute modification se fait sur un brouillon puis “sauvegarder en nouvelle version”.

## 6.2 Versioning offre

Pour chaque candidature :

- stockage de plusieurs versions d’offre,
- chaque version peut venir d’un texte collé ou d’une URL,
- l’utilisateur peut marquer une version comme active,
- les lettres générées doivent référencer la version d’offre utilisée.

## 7. Gestion de la clé OpenAI côté utilisateur

## 7.1 Exigence

La clé OpenAI doit être saisissable dans l’UI (écran Paramètres).

## 7.2 Comportement

- champ masqué avec bouton afficher/cacher,
- option “mémoriser la clé dans ce navigateur” (on/off),
- si off : clé conservée en mémoire session seulement,
- test de validité via endpoint de ping IA,
- message d’avertissement sécurité explicite.

## 7.3 Sécurité minimale

- ne jamais afficher la clé complète (masquage partiel),
- ne jamais logger la clé,
- ne jamais persister côté serveur,
- transmettre la clé à l’API route uniquement via payload HTTPS.

Note : stocker une clé en localStorage reste moins sûr. Ce comportement est volontaire car demandé.

## 8. Parcours fonctionnels

## 8.1 CV + feedback IA

- éditer le CV,
- demander feedback IA par section,
- appliquer ou ignorer suggestions,
- créer une nouvelle version CV quand prêt.

## 8.2 Pipeline de candidatures

- créer une candidature,
- coller l’offre ou renseigner une URL,
- créer des versions d’offre au fil du temps,
- faire évoluer le statut (kanban/listing),
- générer une lettre liée à une version CV + version offre.

## 8.3 Lettre de motivation IA

- sélectionner candidature,
- sélectionner version CV,
- sélectionner version offre,
- choisir langue/ton,
- générer, éditer, sauvegarder, exporter.

## 9. API (Next.js Route Handlers)

## 9.1 `POST /api/ai/feedback`

Entrée :

- `apiKey` (string, requis)
- `section` (enum, requis)
- `sectionData` (object|string, requis)
- `jobContext` (optionnel)

Sortie :

- `feedback` (string)
- `suggestedRewrite` (string, optionnel)

## 9.2 `POST /api/ai/cover-letter`

Entrée :

- `apiKey` (string, requis)
- `cvData` (object, requis)
- `offerText` (string, requis)
- `tone` (enum, requis)
- `language` (enum, requis)

Sortie :

- `letter` (string)

## 9.3 `POST /api/pdf`

Entrée :

- `html` (string)
- `fileName` (string)

Sortie :

- PDF binaire.

## 9.4 Erreurs et protections

- validation Zod stricte,
- payload max 1MB,
- rate-limit par IP et endpoint,
- timeout OpenAI et Gotenberg,
- réponses homogènes JSON en erreur (`400/429/502/504/500`).

## 10. Règles IA

- prompts contraints à des réponses actionnables,
- interdiction d’inventer des expériences non présentes,
- limiter la longueur des sorties,
- inclure un style professionnel.

## 11. Non-objectifs explicites

- pas de DB,
- pas de comptes utilisateurs,
- pas de sync cloud,
- pas d’ATS scraping avancé garanti,
- pas d’envoi automatique de candidature.

## 12. Plan de livraison

## Phase 1

- migration vers Next.js + TypeScript,
- portage des features CV existantes,
- endpoint PDF opérationnel.

## Phase 2

- module candidatures (CRUD, statuts, recherche/filtre),
- modèle offre versionnée.

## Phase 3

- écran paramètres + clé OpenAI utilisateur,
- endpoints IA feedback + lettre.

## Phase 4

- versioning CV (snapshot, restauration, duplication),
- liaison lettres avec versions CV/offre.

## Phase 5

- stabilisation UX,
- tests manuels complets,
- documentation d’exploitation.

## 13. Critères de done

- l’utilisateur peut saisir sa clé OpenAI et l’utiliser immédiatement,
- feedback IA disponible pour chaque section du CV,
- candidatures gérées avec statuts,
- versioning CV et offre fonctionnel,
- génération de lettre liée à version CV/offre,
- export PDF du CV sans régression.

## 14. Tests manuels minimum

1. Saisie clé OpenAI, test de validité, génération feedback section `profile`.
2. Création candidature, changement de statut, persistance après reload.
3. Création de 2 versions d’offre pour une même candidature, switch de version active.
4. Création de 2 versions CV, génération lettre sur combinaison CVv2 + Offrev1.
5. Vérification des références stockées (`cvVersionId`, `offerVersionId`) dans la lettre.
6. Export PDF CV OK après migration.
7. Cas erreur : clé absente/invalide, timeout IA, payload trop gros.
