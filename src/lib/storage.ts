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
    highlights: Array.isArray(item?.highlights) ? item.highlights.filter(Boolean) : [],
    hidden: Boolean(item?.hidden)
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

const INITIAL_VERSION_ID = 'initial-version';
const INITIAL_TIMESTAMP = '1970-01-01T00:00:00.000Z';

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
    id: INITIAL_VERSION_ID,
    label: 'Base',
    createdAt: INITIAL_TIMESTAMP,
    data: deepClone(DEFAULT_CV),
    aiFeedback: deepClone(EMPTY_FEEDBACK)
  };

  return {
    version: '2.0',
    updatedAt: INITIAL_TIMESTAMP,
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

export function normalizeAppState(input?: Partial<AppState>): AppState {
  const base = createInitialState();

  const versions = Array.isArray(input?.cv?.versions)
    ? input.cv.versions.map((version) => normalizeVersion(version))
    : base.cv.versions;

  const currentVersionId =
    input?.cv?.currentVersionId && versions.some((v) => v.id === input.cv?.currentVersionId)
      ? input.cv.currentVersionId
      : versions[0].id;

  return {
    version: '2.0',
    updatedAt: input?.updatedAt || nowIso(),
    settings: { ...DEFAULT_SETTINGS, ...(input?.settings || {}) },
    cv: {
      draft: normalizeCvData((input?.cv?.draft || {}) as Partial<CvData> & Record<string, unknown>),
      currentVersionId,
      versions
    },
    applications: Array.isArray(input?.applications) ? input.applications.map((item) => normalizeApplication(item)) : [],
    coverLetters: Array.isArray(input?.coverLetters) ? input.coverLetters.map((item) => normalizeCoverLetter(item)) : []
  };
}

export async function loadState(): Promise<AppState> {
  if (typeof window === 'undefined') {
    return createInitialState();
  }

  try {
    const response = await fetch('/api/state', { cache: 'no-store' });
    if (!response.ok) {
      return createInitialState();
    }
    const payload = (await response.json()) as { state?: Partial<AppState> };
    return normalizeAppState(payload.state);
  } catch {
    return createInitialState();
  }
}

export async function persistState(state: AppState): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  await fetch('/api/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state })
  });
}

export function readApiKey(state: AppState): string {
  return state.settings.openaiApiKey;
}

export function uidFactory(): string {
  return uid();
}
