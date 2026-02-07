export type CvSection =
  | 'personal'
  | 'profile'
  | 'experiences'
  | 'education'
  | 'skills'
  | 'languages'
  | 'interests';

export type ApplicationStatus =
  | 'A_POSTULER'
  | 'POSTULE'
  | 'ENTRETIEN_PREVU'
  | 'ENTRETIEN_PASSE'
  | 'OFFRE_RECUE'
  | 'DECLINE';

export type Tone = 'NEUTRE' | 'FORMELLE' | 'DYNAMIQUE';
export type Language = 'fr' | 'en';

export interface CvPersonal {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface CvData {
  personal: CvPersonal;
  profile: string;
  experiences: string;
  education: string;
  skills: string;
  languages: string;
  interests: string;
}

export interface CvVersion {
  id: string;
  label: string;
  createdAt: string;
  data: CvData;
  aiFeedback: Record<CvSection, string>;
}

export interface OfferData {
  sourceType: 'text' | 'url';
  sourceValue: string;
  offerText: string;
}

export interface ApplicationRecord {
  id: string;
  title: string;
  company: string;
  status: ApplicationStatus;
  notes: string;
  offer: OfferData;
  createdAt: string;
  updatedAt: string;
}

export interface CoverLetter {
  id: string;
  applicationId: string;
  cvVersionId: string;
  tone: Tone;
  language: Language;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  openaiApiKey: string;
  storeApiKey: boolean;
  defaultLanguage: Language;
  defaultTone: Tone;
}

export interface CvState {
  draft: CvData;
  currentVersionId: string;
  versions: CvVersion[];
}

export interface AppState {
  version: '2.0';
  updatedAt: string;
  settings: Settings;
  cv: CvState;
  applications: ApplicationRecord[];
  coverLetters: CoverLetter[];
}

export interface CvOptimizationResponse {
  alignmentScore: number;
  strengths: string[];
  gaps: string[];
  sectionRecommendations: Array<{
    section: CvSection;
    actions: string[];
    rewrite?: string;
  }>;
}
