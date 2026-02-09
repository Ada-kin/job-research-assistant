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

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights: string[];
  hidden: boolean;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | '';
}

export interface LanguageItem {
  id: string;
  name: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Native' | '';
}

export interface InterestItem {
  id: string;
  name: string;
}

export interface CvData {
  personal: CvPersonal;
  profile: string;
  experiences: ExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  languages: LanguageItem[];
  interests: InterestItem[];
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
