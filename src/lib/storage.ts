import type {
  AppState,
  ApplicationRecord,
  CoverLetter,
  CvData,
  CvSection,
  CvVersion,
  Settings
} from './types';

export const STORAGE_KEY = 'job_research_assistant_v2';
const LEGACY_KEY = 'cv_builder_data_v1';
const SESSION_API_KEY = 'job_research_assistant_api_key_session';

const EMPTY_FEEDBACK: Record<CvSection, string> = {
  personal: '',
  profile: '',
  experiences: '',
  education: '',
  skills: '',
  languages: '',
  interests: ''
};

export const DEFAULT_CV: CvData = {
  personal: {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    github: ''
  },
  profile: '',
  experiences: '',
  education: '',
  skills: '',
  languages: '',
  interests: ''
};

export const DEFAULT_SETTINGS: Settings = {
  openaiApiKey: '',
  storeApiKey: false,
  defaultLanguage: 'fr',
  defaultTone: 'NEUTRE'
};

function uid(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function linesFromLegacy(items: unknown): string {
  if (!Array.isArray(items)) {
    return '';
  }

  const lines: string[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const record = item as Record<string, unknown>;
    const parts = [record.role, record.company, record.degree, record.institution]
      .filter((v) => typeof v === 'string' && v.trim())
      .map((v) => String(v).trim());

    const description = typeof record.description === 'string' ? record.description.trim() : '';
    const combined = [parts.join(' - '), description].filter(Boolean).join(': ');
    if (combined) {
      lines.push(combined);
    }

    if (Array.isArray(record.highlights)) {
      for (const h of record.highlights) {
        if (typeof h === 'string' && h.trim()) {
          lines.push(h.trim());
        }
      }
    }
  }
  return lines.join('\n');
}

function normalizeVersion(version: CvVersion): CvVersion {
  return {
    id: version.id || uid(),
    label: version.label || 'Version sans titre',
    createdAt: version.createdAt || nowIso(),
    data: { ...deepClone(DEFAULT_CV), ...version.data, personal: { ...DEFAULT_CV.personal, ...(version.data?.personal || {}) } },
    aiFeedback: { ...EMPTY_FEEDBACK, ...(version.aiFeedback || {}) }
  };
}

function normalizeApplication(item: Partial<ApplicationRecord>): ApplicationRecord {
  return {
    id: item.id || uid(),
    title: item.title || '',
    company: item.company || '',
    status: item.status || 'A_POSTULER',
    notes: item.notes || '',
    offer: {
      sourceType: item.offer?.sourceType || 'text',
      sourceValue: item.offer?.sourceValue || '',
      offerText: item.offer?.offerText || ''
    },
    createdAt: item.createdAt || nowIso(),
    updatedAt: item.updatedAt || nowIso()
  };
}

function normalizeCoverLetter(item: Partial<CoverLetter>): CoverLetter {
  return {
    id: item.id || uid(),
    applicationId: item.applicationId || '',
    cvVersionId: item.cvVersionId || '',
    tone: item.tone || 'NEUTRE',
    language: item.language || 'fr',
    content: item.content || '',
    createdAt: item.createdAt || nowIso(),
    updatedAt: item.updatedAt || nowIso()
  };
}

export function createInitialState(): AppState {
  const initialVersion: CvVersion = {
    id: uid(),
    label: 'Base',
    createdAt: nowIso(),
    data: deepClone(DEFAULT_CV),
    aiFeedback: deepClone(EMPTY_FEEDBACK)
  };

  return {
    version: '2.0',
    updatedAt: nowIso(),
    settings: deepClone(DEFAULT_SETTINGS),
    cv: {
      draft: deepClone(DEFAULT_CV),
      currentVersionId: initialVersion.id,
      versions: [initialVersion]
    },
    applications: [],
    coverLetters: []
  };
}

function fromLegacy(raw: string): AppState {
  const initial = createInitialState();
  const legacy = JSON.parse(raw) as Record<string, unknown>;
  const personal = typeof legacy.personal === 'object' && legacy.personal ? (legacy.personal as Record<string, unknown>) : {};

  const migratedCv: CvData = {
    personal: {
      fullName: typeof personal.fullName === 'string' ? personal.fullName : '',
      title: typeof personal.title === 'string' ? personal.title : '',
      email: typeof personal.email === 'string' ? personal.email : '',
      phone: typeof personal.phone === 'string' ? personal.phone : '',
      location: typeof personal.location === 'string' ? personal.location : '',
      website: typeof personal.website === 'string' ? personal.website : '',
      linkedin: typeof personal.linkedin === 'string' ? personal.linkedin : '',
      github: typeof personal.github === 'string' ? personal.github : ''
    },
    profile: typeof legacy.profile === 'string' ? legacy.profile : '',
    experiences: linesFromLegacy(legacy.experiences),
    education: linesFromLegacy(legacy.education),
    skills: Array.isArray(legacy.skills)
      ? legacy.skills.map((s) => (typeof s === 'object' && s && typeof (s as Record<string, unknown>).name === 'string' ? String((s as Record<string, unknown>).name) : '')).filter(Boolean).join('\n')
      : '',
    languages: Array.isArray(legacy.languages)
      ? legacy.languages.map((s) => (typeof s === 'object' && s && typeof (s as Record<string, unknown>).name === 'string' ? String((s as Record<string, unknown>).name) : '')).filter(Boolean).join('\n')
      : '',
    interests: Array.isArray(legacy.interests)
      ? legacy.interests.map((s) => (typeof s === 'object' && s && typeof (s as Record<string, unknown>).name === 'string' ? String((s as Record<string, unknown>).name) : '')).filter(Boolean).join('\n')
      : ''
  };

  const version: CvVersion = {
    id: uid(),
    label: 'Import ancien CV Builder',
    createdAt: nowIso(),
    data: migratedCv,
    aiFeedback: deepClone(EMPTY_FEEDBACK)
  };

  initial.cv = {
    draft: deepClone(migratedCv),
    currentVersionId: version.id,
    versions: [version]
  };

  return initial;
}

export function loadState(): AppState {
  if (typeof window === 'undefined') {
    return createInitialState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      const base = createInitialState();

      const versions = Array.isArray(parsed.cv?.versions)
        ? parsed.cv.versions.map((version) => normalizeVersion(version))
        : base.cv.versions;

      const currentVersionId =
        parsed.cv?.currentVersionId && versions.some((v) => v.id === parsed.cv?.currentVersionId)
          ? parsed.cv.currentVersionId
          : versions[0].id;

      const draft = { ...deepClone(DEFAULT_CV), ...(parsed.cv?.draft || {}), personal: { ...DEFAULT_CV.personal, ...(parsed.cv?.draft?.personal || {}) } };

      return {
        version: '2.0',
        updatedAt: parsed.updatedAt || nowIso(),
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        cv: {
          draft,
          currentVersionId,
          versions
        },
        applications: Array.isArray(parsed.applications) ? parsed.applications.map((item) => normalizeApplication(item)) : [],
        coverLetters: Array.isArray(parsed.coverLetters) ? parsed.coverLetters.map((item) => normalizeCoverLetter(item)) : []
      };
    }

    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      return fromLegacy(legacy);
    }

    return createInitialState();
  } catch {
    return createInitialState();
  }
}

export function persistState(state: AppState): void {
  if (typeof window === 'undefined') {
    return;
  }

  const toStore: AppState = {
    ...state,
    updatedAt: nowIso(),
    settings: {
      ...state.settings,
      openaiApiKey: state.settings.storeApiKey ? state.settings.openaiApiKey : ''
    }
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));

  if (state.settings.openaiApiKey) {
    if (state.settings.storeApiKey) {
      window.sessionStorage.removeItem(SESSION_API_KEY);
    } else {
      window.sessionStorage.setItem(SESSION_API_KEY, state.settings.openaiApiKey);
    }
  }
}

export function readApiKey(state: AppState): string {
  if (state.settings.openaiApiKey) {
    return state.settings.openaiApiKey;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  return window.sessionStorage.getItem(SESSION_API_KEY) || '';
}

export function uidFactory(): string {
  return uid();
}
