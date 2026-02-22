import type {
  ApplicationRecord,
  ApplicationStatus,
  CvData,
  CvVersion,
  EducationItem,
  ExperienceItem,
  InterestItem,
  LanguageItem,
  SkillItem
} from '@/lib/types';

export type UiApplicationStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';

export interface UiCvVersion {
  id: string;
  title: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  info: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website: string;
    github: string;
  };
  summary: string;
  experiences: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  languages: LanguageItem[];
  interests: InterestItem[];
}

export interface UiApplication {
  id: string;
  company: string;
  position: string;
  cvVersionId: string;
  status: UiApplicationStatus;
  appliedDate: string;
  notes: string;
  url?: string;
  offerText: string;
}

const ARCHIVED_PREFIX = '[ARCHIVED] ';

function toUiStatus(status: ApplicationStatus): UiApplicationStatus {
  switch (status) {
    case 'A_POSTULER':
    case 'POSTULE':
      return 'applied';
    case 'ENTRETIEN_PREVU':
    case 'ENTRETIEN_PASSE':
      return 'interview';
    case 'OFFRE_RECUE':
      return 'offer';
    case 'DECLINE':
      return 'rejected';
    default:
      return 'applied';
  }
}

export function fromUiStatus(status: UiApplicationStatus): ApplicationStatus {
  switch (status) {
    case 'applied':
      return 'POSTULE';
    case 'screening':
      return 'POSTULE';
    case 'interview':
      return 'ENTRETIEN_PREVU';
    case 'offer':
      return 'OFFRE_RECUE';
    case 'rejected':
      return 'DECLINE';
    default:
      return 'POSTULE';
  }
}

export function isArchivedLabel(label: string): boolean {
  return label.startsWith(ARCHIVED_PREFIX);
}

export function withArchivedLabel(label: string, archived: boolean): string {
  const clean = label.startsWith(ARCHIVED_PREFIX) ? label.slice(ARCHIVED_PREFIX.length) : label;
  return archived ? `${ARCHIVED_PREFIX}${clean}` : clean;
}

export function toUiCvVersion(version: CvVersion): UiCvVersion {
  const archived = isArchivedLabel(version.label);
  const title = archived ? version.label.slice(ARCHIVED_PREFIX.length) : version.label;

  return {
    id: version.id,
    title,
    status: archived ? 'archived' : 'active',
    createdAt: version.createdAt,
    updatedAt: version.createdAt,
    info: {
      fullName: version.data.personal.fullName,
      title: version.data.personal.title,
      email: version.data.personal.email,
      phone: version.data.personal.phone,
      location: version.data.personal.location,
      linkedin: version.data.personal.linkedin,
      website: version.data.personal.website,
      github: version.data.personal.github
    },
    summary: version.data.profile,
    experiences: version.data.experiences,
    education: version.data.education,
    skills: version.data.skills,
    languages: version.data.languages,
    interests: version.data.interests
  };
}

export function patchCvVersionFromUi(previous: CvVersion, next: UiCvVersion): CvVersion {
  const nextData: CvData = {
    personal: {
      fullName: next.info.fullName,
      title: next.info.title,
      email: next.info.email,
      phone: next.info.phone,
      location: next.info.location,
      website: next.info.website,
      linkedin: next.info.linkedin,
      github: next.info.github
    },
    profile: next.summary,
    experiences: next.experiences,
    education: next.education,
    skills: next.skills,
    languages: next.languages,
    interests: next.interests
  };

  return {
    ...previous,
    label: withArchivedLabel(next.title || 'Version sans titre', next.status === 'archived'),
    data: nextData
  };
}

export function toUiApplication(app: ApplicationRecord): UiApplication {
  return {
    id: app.id,
    company: app.company,
    position: app.title,
    cvVersionId: '',
    status: toUiStatus(app.status),
    appliedDate: app.createdAt.slice(0, 10),
    notes: app.notes,
    url: app.offer.sourceType === 'url' ? app.offer.sourceValue : undefined,
    offerText: app.offer.offerText
  };
}

export function patchApplicationFromUi(previous: ApplicationRecord, next: Partial<UiApplication>): ApplicationRecord {
  const offerSourceType = next.url ? 'url' : previous.offer.sourceType;

  return {
    ...previous,
    title: next.position ?? previous.title,
    company: next.company ?? previous.company,
    status: next.status ? fromUiStatus(next.status) : previous.status,
    notes: next.notes ?? previous.notes,
    updatedAt: new Date().toISOString(),
    offer: {
      sourceType: offerSourceType,
      sourceValue: next.url ?? previous.offer.sourceValue,
      offerText: next.offerText ?? previous.offer.offerText
    }
  };
}
