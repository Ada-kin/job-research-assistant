import type {
  AppState,
  ApplicationRecord,
  CoverLetter,
  CvData,
  CvSection,
  CvVersion,
  EducationItem,
  ExperienceItem,
  InterestItem,
  LanguageItem,
  Settings,
  SkillItem
} from './types';

export const STORAGE_KEY = 'job_research_assistant_v2';
const LEGACY_KEY = 'cv_builder_data_v1';
const SESSION_API_KEY = 'job_research_assistant_api_key_session';

export const EMPTY_FEEDBACK: Record<CvSection, string> = {
  personal: '',
  profile: '',
  experiences: '',
  education: '',
  skills: '',
  languages: '',
  interests: ''
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

function parseLines(input: string): string[] {
  return input
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizeExperience(item?: Partial<ExperienceItem>): ExperienceItem {
  return {
    id: item?.id || uid(),
    company: item?.company || '',
    role: item?.role || '',
    location: item?.location || '',
    startDate: item?.startDate || '',
    endDate: item?.endDate || '',
    description: item?.description || '',
    highlights: Array.isArray(item?.highlights) ? item!.highlights.filter(Boolean) : []
  };
}

function normalizeEducation(item?: Partial<EducationItem>): EducationItem {
  return {
    id: item?.id || uid(),
    institution: item?.institution || '',
    degree: item?.degree || '',
    field: item?.field || '',
    startDate: item?.startDate || '',
    endDate: item?.endDate || '',
    description: item?.description || ''
  };
}

function normalizeSkill(item?: Partial<SkillItem>): SkillItem {
  const level = item?.level || '';
  return {
    id: item?.id || uid(),
    name: item?.name || '',
    level: ['beginner', 'intermediate', 'advanced', 'expert', ''].includes(level) ? level : ''
  } as SkillItem;
}

function normalizeLanguage(item?: Partial<LanguageItem>): LanguageItem {
  const level = item?.level || '';
  return {
    id: item?.id || uid(),
    name: item?.name || '',
    level: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native', ''].includes(level) ? level : ''
  } as LanguageItem;
}

function normalizeInterest(item?: Partial<InterestItem>): InterestItem {
  return {
    id: item?.id || uid(),
    name: item?.name || ''
  };
}

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
  experiences: [],
  education: [],
  skills: [],
  languages: [],
  interests: []
};

export const DEFAULT_SETTINGS: Settings = {
  openaiApiKey: '',
  storeApiKey: false,
  defaultLanguage: 'fr',
  defaultTone: 'NEUTRE'
};

function normalizeCvData(input?: Partial<CvData> & Record<string, unknown>): CvData {
  const experiences = Array.isArray(input?.experiences)
    ? input.experiences.map((item) => normalizeExperience(item))
    : typeof input?.experiences === 'string'
      ? parseLines(input.experiences).map((line) => normalizeExperience({ role: line }))
      : [];

  const education = Array.isArray(input?.education)
    ? input.education.map((item) => normalizeEducation(item))
    : typeof input?.education === 'string'
      ? parseLines(input.education).map((line) => normalizeEducation({ degree: line }))
      : [];

  const skills = Array.isArray(input?.skills)
    ? input.skills.map((item) => normalizeSkill(item))
    : typeof input?.skills === 'string'
      ? parseLines(input.skills).map((line) => normalizeSkill({ name: line }))
      : [];

  const languages = Array.isArray(input?.languages)
    ? input.languages.map((item) => normalizeLanguage(item))
    : typeof input?.languages === 'string'
      ? parseLines(input.languages).map((line) => normalizeLanguage({ name: line }))
      : [];

  const interests = Array.isArray(input?.interests)
    ? input.interests.map((item) => normalizeInterest(item))
    : typeof input?.interests === 'string'
      ? parseLines(input.interests).map((line) => normalizeInterest({ name: line }))
      : [];

  return {
    personal: {
      ...DEFAULT_CV.personal,
      ...(input?.personal || {})
    },
    profile: typeof input?.profile === 'string' ? input.profile : '',
    experiences,
    education,
    skills,
    languages,
    interests
  };
}

function normalizeVersion(version: CvVersion): CvVersion {
  return {
    id: version.id || uid(),
    label: version.label || 'Version sans titre',
    createdAt: version.createdAt || nowIso(),
    data: normalizeCvData(version.data as unknown as Partial<CvData> & Record<string, unknown>),
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

  const experiences = Array.isArray(legacy.experiences)
    ? legacy.experiences.map((x) => {
        const item = (x || {}) as Record<string, unknown>;
        return normalizeExperience({
          company: String(item.company || ''),
          role: String(item.role || ''),
          location: String(item.location || ''),
          startDate: String(item.startDate || ''),
          endDate: String(item.endDate || ''),
          description: String(item.description || ''),
          highlights: Array.isArray(item.highlights) ? item.highlights.map((h) => String(h)) : []
        });
      })
    : [];

  const education = Array.isArray(legacy.education)
    ? legacy.education.map((x) => {
        const item = (x || {}) as Record<string, unknown>;
        return normalizeEducation({
          institution: String(item.institution || ''),
          degree: String(item.degree || ''),
          field: String(item.field || ''),
          startDate: String(item.startDate || ''),
          endDate: String(item.endDate || ''),
          description: String(item.description || '')
        });
      })
    : [];

  const skills = Array.isArray(legacy.skills)
    ? legacy.skills.map((x) => normalizeSkill({ name: String((x as Record<string, unknown>)?.name || '') }))
    : [];

  const languages = Array.isArray(legacy.languages)
    ? legacy.languages.map((x) => normalizeLanguage({ name: String((x as Record<string, unknown>)?.name || '') }))
    : [];

  const interests = Array.isArray(legacy.interests)
    ? legacy.interests.map((x) => normalizeInterest({ name: String((x as Record<string, unknown>)?.name || '') }))
    : [];

  const migratedCv: CvData = {
    personal: {
      fullName: String(personal.fullName || ''),
      title: String(personal.title || ''),
      email: String(personal.email || ''),
      phone: String(personal.phone || ''),
      location: String(personal.location || ''),
      website: String(personal.website || ''),
      linkedin: String(personal.linkedin || ''),
      github: String(personal.github || '')
    },
    profile: String(legacy.profile || ''),
    experiences,
    education,
    skills,
    languages,
    interests
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

      return {
        version: '2.0',
        updatedAt: parsed.updatedAt || nowIso(),
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        cv: {
          draft: normalizeCvData((parsed.cv?.draft || {}) as Partial<CvData> & Record<string, unknown>),
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
