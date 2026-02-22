# UI Migration Mapping (Next.js target)

## Feature flag
- Variable: `NEXT_PUBLIC_NEW_UI_ENABLED`
- `true`: new UX/UI pages + shell
- other: legacy pages/layout

## Application status mapping
- `A_POSTULER` -> `applied`
- `POSTULE` -> `applied`
- `ENTRETIEN_PREVU` -> `interview`
- `ENTRETIEN_PASSE` -> `interview`
- `OFFRE_RECUE` -> `offer`
- `DECLINE` -> `rejected`

Reverse mapping (UI -> persisted state):
- `applied` -> `POSTULE`
- `screening` -> `POSTULE`
- `interview` -> `ENTRETIEN_PREVU`
- `offer` -> `OFFRE_RECUE`
- `rejected` -> `DECLINE`

## CV mapping
- Persisted `CvVersion.label` <-> UI `title`
- Archive state is encoded in `label` using prefix `[ARCHIVED] `
- `CvData.personal` -> `info` (plus `title`, `website`, `github` kept)
- `profile` -> `summary`
- All non-symmetric fields are preserved in adapter structs and mapped back to `CvData`

## Date handling
- Persisted values remain ISO strings in app state.
- UI display can use `YYYY-MM-DD`.
- Adapter normalizes on write back to ISO when needed.
