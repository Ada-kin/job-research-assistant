# Spécification fonctionnelle — job-research-assistant

## 1. Objectif produit

`job-research-assistant` aide l’utilisateur à :

- gérer son CV,
- suivre ses candidatures,
- optimiser un CV pour une offre,
- générer une lettre de motivation via IA.

## 2. Périmètre fonctionnel

## 2.1 Module CV

L’utilisateur peut :

- créer/éditer un CV par sections (identité, profil, expériences, formation, compétences, langues, intérêts),
- voir un aperçu en temps réel,
- exporter en PDF,
- demander un feedback IA section par section,
- appliquer les suggestions IA.

## 2.2 Versioning CV (conservé)

L’utilisateur peut :

- créer une version CV (snapshot),
- nommer une version,
- dupliquer/restaurer une version,
- comparer 2 versions (diff textuel simple).

Objectif métier : permettre un CV “général” + des CV adaptés par offre.

## 2.3 Module Candidatures

Entité métier : **Candidature**.

L’utilisateur peut :

- créer une candidature,
- renseigner poste, entreprise, notes,
- associer une offre via texte collé ou URL,
- changer le statut,
- filtrer/rechercher les candidatures.

Statuts MVP :

- `A_POSTULER`
- `POSTULE`
- `ENTRETIEN_PREVU`
- `ENTRETIEN_PASSE`
- `OFFRE_RECUE`
- `DECLINE`

## 2.4 Offre (simplifiée)

Il n’y a **pas de version d’offre** en MVP.

Chaque candidature contient une seule offre courante :

- `sourceType` (`text` ou `url`),
- `sourceValue` (URL ou texte brut initial),
- `offerText` (texte de travail utilisé pour l’IA).

## 2.5 Optimisation CV pour une offre (nouveau focus)

Depuis une candidature, l’utilisateur peut lancer une analyse IA :

- comparaison offre vs CV actif,
- recommandations section par section,
- suggestions de reformulation,
- mots-clés manquants,
- priorités d’amélioration.

Résultat attendu :

- score d’alignement (simple, ex: `/100`),
- liste d’actions concrètes,
- possibilité d’appliquer les suggestions,
- sauvegarde en **nouvelle version CV ciblée offre**.

## 2.6 Lettre de motivation IA

L’utilisateur peut :

- générer une lettre depuis une candidature,
- choisir la version CV à utiliser,
- choisir langue + tonalité,
- éditer, sauvegarder, exporter `.txt`.

Chaque lettre référence :

- `applicationId`
- `cvVersionId`

## 2.7 Clé API OpenAI

L’utilisateur peut :

- saisir sa clé API dans Paramètres,
- choisir de la mémoriser localement ou session uniquement,
- tester la clé.

## 3. Parcours clés

## 3.1 Parcours “adapter CV à une offre”

1. Créer/ouvrir une candidature.
2. Coller l’offre (ou URL + texte).
3. Sélectionner une version CV de départ.
4. Lancer “Optimiser mon CV pour cette offre”.
5. Appliquer des suggestions IA.
6. Sauvegarder une nouvelle version CV nommée (ex: `CV - Backend - Entreprise X`).

## 3.2 Parcours lettre

1. Depuis candidature, choisir une version CV.
2. Générer lettre IA.
3. Éditer et sauvegarder.

## 4. Règles métier

- Une candidature a une seule offre active (pas d’historique versionné en MVP).
- Une lettre est toujours liée à une candidature et une version CV.
- Les versions CV sont immuables après création.
- Toute optimisation IA appliquée est sauvegardable dans une nouvelle version CV.

## 5. Critères d’acceptation

- feedback IA disponible pour chaque section,
- optimisation IA globale CV/offre disponible,
- création de version CV adaptée à une offre,
- gestion candidature + statuts,
- génération lettre avec référence `cvVersionId`,
- export PDF sans régression.
