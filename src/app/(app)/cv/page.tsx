'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/app-store';
import { EMPTY_FEEDBACK, readApiKey, uidFactory } from '@/lib/storage';
import { renderCvHtml } from '@/lib/cv-html';
import { isNewUiEnabledClient } from '@/lib/feature-flags';
import { NewCvListPage } from '@/components/new-ui/cv-list-page';
import type {
  CvOptimizationResponse,
  CvSection,
  EducationItem,
  ExperienceItem,
  InterestItem,
  LanguageItem,
  SkillItem,
  CvVersion
} from '@/lib/types';

const SECTION_LABELS: Record<CvSection, string> = {
  personal: 'Identite',
  profile: 'Profil',
  experiences: 'Experiences',
  education: 'Formation',
  skills: 'Competences',
  languages: 'Langues',
  interests: 'Interets'
};

function formatUtcDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Date inconnue';
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`;
}

export default function CvPage() {
  if (isNewUiEnabledClient()) {
    return <NewCvListPage />;
  }

  const { state, setState, status, setStatus } = useAppStore();

  const [versionLabel, setVersionLabel] = useState('');
  const [feedbackBusy, setFeedbackBusy] = useState<CvSection | null>(null);
  const [optimizeBusy, setOptimizeBusy] = useState(false);
  const [optimization, setOptimization] = useState<CvOptimizationResponse | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');

  const activeVersion = useMemo(
    () => state.cv.versions.find((v) => v.id === state.cv.currentVersionId) || state.cv.versions[0],
    [state.cv.currentVersionId, state.cv.versions]
  );

  const selectedApplication = useMemo(
    () => state.applications.find((a) => a.id === selectedApplicationId) || null,
    [selectedApplicationId, state.applications]
  );

  const previewHtml = useMemo(() => renderCvHtml(state.cv.draft), [state.cv.draft]);

  function setPersonalField(field: keyof typeof state.cv.draft.personal, value: string) {
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        draft: {
          ...prev.cv.draft,
          personal: {
            ...prev.cv.draft.personal,
            [field]: value
          }
        }
      }
    }));
  }

  function updateExperience(id: string, patch: Partial<ExperienceItem>) {
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        draft: {
          ...prev.cv.draft,
          experiences: prev.cv.draft.experiences.map((x) => (x.id === id ? { ...x, ...patch } : x))
        }
      }
    }));
  }

  function moveExperience(id: string, direction: 'up' | 'down') {
    setState((prev) => {
      const list = [...prev.cv.draft.experiences];
      const index = list.findIndex((x) => x.id === id);
      if (index < 0) {
        return prev;
      }

      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= list.length) {
        return prev;
      }

      const tmp = list[index];
      list[index] = list[target];
      list[target] = tmp;

      return {
        ...prev,
        cv: {
          ...prev.cv,
          draft: {
            ...prev.cv.draft,
            experiences: list
          }
        }
      };
    });
  }

  function updateEducation(id: string, patch: Partial<EducationItem>) {
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        draft: {
          ...prev.cv.draft,
          education: prev.cv.draft.education.map((x) => (x.id === id ? { ...x, ...patch } : x))
        }
      }
    }));
  }

  function updateSkill(id: string, patch: Partial<SkillItem>) {
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        draft: {
          ...prev.cv.draft,
          skills: prev.cv.draft.skills.map((x) => (x.id === id ? { ...x, ...patch } : x))
        }
      }
    }));
  }

  function updateLanguage(id: string, patch: Partial<LanguageItem>) {
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        draft: {
          ...prev.cv.draft,
          languages: prev.cv.draft.languages.map((x) => (x.id === id ? { ...x, ...patch } : x))
        }
      }
    }));
  }

  function updateInterest(id: string, patch: Partial<InterestItem>) {
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        draft: {
          ...prev.cv.draft,
          interests: prev.cv.draft.interests.map((x) => (x.id === id ? { ...x, ...patch } : x))
        }
      }
    }));
  }

  function addExperience() {
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        draft: {
          ...prev.cv.draft,
          experiences: [
            ...prev.cv.draft.experiences,
            {
              id: uidFactory(),
              company: '',
              role: '',
              location: '',
              startDate: '',
              endDate: '',
              description: '',
              highlights: [],
              hidden: false
            }
          ]
        }
      }
    }));
  }

  function addEducation() {
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        draft: {
          ...prev.cv.draft,
          education: [
            ...prev.cv.draft.education,
            {
              id: uidFactory(),
              institution: '',
              degree: '',
              field: '',
              startDate: '',
              endDate: '',
              description: ''
            }
          ]
        }
      }
    }));
  }

  function addSkill() {
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        draft: {
          ...prev.cv.draft,
          skills: [...prev.cv.draft.skills, { id: uidFactory(), name: '', level: '' }]
        }
      }
    }));
  }

  function addLanguage() {
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        draft: {
          ...prev.cv.draft,
          languages: [...prev.cv.draft.languages, { id: uidFactory(), name: '', level: '' }]
        }
      }
    }));
  }

  function addInterest() {
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        draft: {
          ...prev.cv.draft,
          interests: [...prev.cv.draft.interests, { id: uidFactory(), name: '' }]
        }
      }
    }));
  }

  function removeItem(type: 'experiences' | 'education' | 'skills' | 'languages' | 'interests', id: string) {
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        draft: {
          ...prev.cv.draft,
          [type]: prev.cv.draft[type].filter((x) => x.id !== id)
        }
      }
    }));
  }

  function createVersionFromDraft() {
    const id = uidFactory();
    const label = versionLabel.trim() || `Version ${new Date().toLocaleDateString()}`;

    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        currentVersionId: id,
        versions: [
          {
            id,
            label,
            createdAt: new Date().toISOString(),
            data: structuredClone(prev.cv.draft),
            aiFeedback: structuredClone(activeVersion?.aiFeedback || EMPTY_FEEDBACK)
          },
          ...prev.cv.versions
        ]
      }
    }));

    setVersionLabel('');
    setStatus('Nouvelle version creee depuis le brouillon.');
  }

  function loadVersion(versionId: string) {
    setState((prev) => {
      const found = prev.cv.versions.find((v) => v.id === versionId);
      if (!found) {
        return prev;
      }

      return {
        ...prev,
        cv: {
          ...prev.cv,
          currentVersionId: found.id,
          draft: structuredClone(found.data)
        }
      };
    });

    setStatus('Version chargee dans le brouillon.');
  }

  function renameVersion(versionId: string, label: string) {
    const trimmed = label.trim();
    if (!trimmed) {
      return;
    }

    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        versions: prev.cv.versions.map((v) => (v.id === versionId ? { ...v, label: trimmed } : v))
      }
    }));
  }

  function duplicateVersion(versionId: string) {
    setState((prev) => {
      const found = prev.cv.versions.find((v) => v.id === versionId);
      if (!found) {
        return prev;
      }

      const clone: CvVersion = {
        ...structuredClone(found),
        id: uidFactory(),
        label: `${found.label} (copie)`,
        createdAt: new Date().toISOString()
      };

      return {
        ...prev,
        cv: {
          ...prev.cv,
          currentVersionId: clone.id,
          draft: structuredClone(clone.data),
          versions: [clone, ...prev.cv.versions]
        }
      };
    });

    setStatus('Version dupliquee.');
  }

  function deleteVersion(versionId: string) {
    setState((prev) => {
      if (prev.cv.versions.length <= 1) {
        return prev;
      }

      const nextVersions = prev.cv.versions.filter((v) => v.id !== versionId);
      if (nextVersions.length === prev.cv.versions.length) {
        return prev;
      }

      const nextCurrent = nextVersions.some((v) => v.id === prev.cv.currentVersionId)
        ? prev.cv.currentVersionId
        : nextVersions[0].id;
      const nextDraft = nextVersions.find((v) => v.id === nextCurrent)?.data || prev.cv.draft;

      return {
        ...prev,
        cv: {
          ...prev.cv,
          versions: nextVersions,
          currentVersionId: nextCurrent,
          draft: structuredClone(nextDraft)
        }
      };
    });

    setStatus('Version supprimee.');
  }

  async function askFeedback(section: CvSection) {
    const apiKey = readApiKey(state);

    setFeedbackBusy(section);
    try {
      const sectionData = section === 'personal' ? state.cv.draft.personal : state.cv.draft[section];
      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(apiKey ? { apiKey } : {}),
          section,
          sectionData,
          jobContext: selectedApplication
            ? {
                title: selectedApplication.title,
                company: selectedApplication.company,
                offerText: selectedApplication.offer.offerText
              }
            : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Feedback indisponible');
      }

      setState((prev) => ({
        ...prev,
        cv: {
          ...prev.cv,
          versions: prev.cv.versions.map((v) =>
            v.id === prev.cv.currentVersionId
              ? {
                  ...v,
                  aiFeedback: {
                    ...v.aiFeedback,
                    [section]: [
                      data.feedback,
                      data.suggestedRewrite ? `\n\nSuggestion:\n${data.suggestedRewrite}` : ''
                    ].join('')
                  }
                }
              : v
          )
        }
      }));

      setStatus(`Feedback recu pour ${SECTION_LABELS[section]}.`);
    } catch (error) {
      setStatus(`Erreur feedback: ${(error as Error).message}`);
    } finally {
      setFeedbackBusy(null);
    }
  }

  async function optimizeCv() {
    const apiKey = readApiKey(state);
    if (!selectedApplication?.offer.offerText.trim()) {
      setStatus('Selectionne une candidature avec offre.');
      return;
    }

    setOptimizeBusy(true);
    try {
      const response = await fetch('/api/ai/cv-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(apiKey ? { apiKey } : {}),
          cvData: state.cv.draft,
          offerText: selectedApplication.offer.offerText,
          targetRole: selectedApplication.title
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Optimisation indisponible');
      }

      setOptimization(data as CvOptimizationResponse);
      setStatus('Optimisation terminee.');
    } catch (error) {
      setStatus(`Erreur optimisation: ${(error as Error).message}`);
    } finally {
      setOptimizeBusy(false);
    }
  }

  async function exportPdf() {
    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: previewHtml,
          fileName: `${(state.cv.draft.personal.fullName || 'cv').replace(/\s+/g, '-').toLowerCase()}.pdf`
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Export PDF impossible' }));
        throw new Error(payload.error || 'Export PDF impossible');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(state.cv.draft.personal.fullName || 'cv').replace(/\s+/g, '-').toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('PDF exporte.');
    } catch (error) {
      setStatus(`Erreur PDF: ${(error as Error).message}`);
    }
  }

  return (
    <main className="main">
      <section className="left">
        <div className="panel">
          <h1>CV Builder</h1>
          <p className="status">{status}</p>
          <div className="actions" style={{ marginTop: 8 }}>
            <button className="primary" onClick={exportPdf}>Exporter PDF</button>
          </div>
        </div>

        <div className="panel section">
          <h2>CRUD versions CV</h2>
          <div className="row">
            <div className="field">
              <label>Nom de la nouvelle version</label>
              <input
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder="CV - Entreprise X"
              />
            </div>
            <div className="field">
              <label>&nbsp;</label>
              <button className="primary" onClick={createVersionFromDraft}>Creer version depuis brouillon</button>
            </div>
          </div>

          {state.cv.versions.map((v) => (
            <div className="card" key={v.id}>
              <div className="field">
                <label>Nom</label>
                <input
                  defaultValue={v.label}
                  onBlur={(e) => renameVersion(v.id, e.target.value)}
                />
              </div>
              <p className="status">{formatUtcDateTime(v.createdAt)}</p>
              <div className="actions">
                <button onClick={() => loadVersion(v.id)}>{state.cv.currentVersionId === v.id ? 'Version active' : 'Charger'}</button>
                <button onClick={() => duplicateVersion(v.id)}>Dupliquer</button>
                <button className="danger" onClick={() => deleteVersion(v.id)} disabled={state.cv.versions.length <= 1}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>

        <div className="panel section">
          <h2>Optimisation IA pour une offre</h2>
          <div className="field">
            <label>Candidature</label>
            <select value={selectedApplicationId} onChange={(e) => setSelectedApplicationId(e.target.value)}>
              <option value="">-- Selectionner --</option>
              {state.applications.map((a) => (
                <option key={a.id} value={a.id}>{a.title} - {a.company}</option>
              ))}
            </select>
          </div>
          <div className="actions">
            <button className="primary" onClick={optimizeCv} disabled={optimizeBusy}>
              {optimizeBusy ? 'Analyse...' : 'Optimiser mon CV'}
            </button>
          </div>
          {optimization ? (
            <div className="card" style={{ marginTop: 8 }}>
              <strong>Score: {optimization.alignmentScore}/100</strong>
              {optimization.sectionRecommendations.map((r, idx) => (
                <div key={`${r.section}_${idx}`} className="card">
                  <strong>{SECTION_LABELS[r.section]}</strong>
                  <ul className="list">
                    {r.actions.map((a, i) => <li key={`${a}_${i}`}>{a}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="panel section">
          <h2>Identite</h2>
          <div className="row">
            <div className="field"><label>Nom complet</label><input value={state.cv.draft.personal.fullName} onChange={(e) => setPersonalField('fullName', e.target.value)} /></div>
            <div className="field"><label>Titre</label><input value={state.cv.draft.personal.title} onChange={(e) => setPersonalField('title', e.target.value)} /></div>
          </div>
          <div className="row">
            <div className="field"><label>Email</label><input value={state.cv.draft.personal.email} onChange={(e) => setPersonalField('email', e.target.value)} /></div>
            <div className="field"><label>Telephone</label><input value={state.cv.draft.personal.phone} onChange={(e) => setPersonalField('phone', e.target.value)} /></div>
          </div>
          <div className="row">
            <div className="field"><label>Localisation</label><input value={state.cv.draft.personal.location} onChange={(e) => setPersonalField('location', e.target.value)} /></div>
            <div className="field"><label>Site web</label><input value={state.cv.draft.personal.website} onChange={(e) => setPersonalField('website', e.target.value)} /></div>
          </div>
          <div className="row">
            <div className="field"><label>LinkedIn</label><input value={state.cv.draft.personal.linkedin} onChange={(e) => setPersonalField('linkedin', e.target.value)} /></div>
            <div className="field"><label>GitHub</label><input value={state.cv.draft.personal.github} onChange={(e) => setPersonalField('github', e.target.value)} /></div>
          </div>
          <div className="actions"><button onClick={() => askFeedback('personal')} disabled={feedbackBusy === 'personal'}>Feedback IA</button></div>
          {activeVersion?.aiFeedback.personal ? <div className="feedback">{activeVersion.aiFeedback.personal}</div> : null}
        </div>

        <div className="panel section">
          <h2>Profil</h2>
          <textarea value={state.cv.draft.profile} onChange={(e) => setState((prev) => ({ ...prev, cv: { ...prev.cv, draft: { ...prev.cv.draft, profile: e.target.value } } }))} />
          <div className="actions"><button onClick={() => askFeedback('profile')} disabled={feedbackBusy === 'profile'}>Feedback IA</button></div>
          {activeVersion?.aiFeedback.profile ? <div className="feedback">{activeVersion.aiFeedback.profile}</div> : null}
        </div>

        <SectionExperience
          experiences={state.cv.draft.experiences}
          onAdd={addExperience}
          onUpdate={updateExperience}
          onRemove={(id) => removeItem('experiences', id)}
          onMove={moveExperience}
          onAskFeedback={() => askFeedback('experiences')}
          feedback={activeVersion?.aiFeedback.experiences || ''}
          feedbackBusy={feedbackBusy === 'experiences'}
        />

        <SectionEducation
          education={state.cv.draft.education}
          onAdd={addEducation}
          onUpdate={updateEducation}
          onRemove={(id) => removeItem('education', id)}
          onAskFeedback={() => askFeedback('education')}
          feedback={activeVersion?.aiFeedback.education || ''}
          feedbackBusy={feedbackBusy === 'education'}
        />

        <SectionSkills
          skills={state.cv.draft.skills}
          onAdd={addSkill}
          onUpdate={updateSkill}
          onRemove={(id) => removeItem('skills', id)}
          onAskFeedback={() => askFeedback('skills')}
          feedback={activeVersion?.aiFeedback.skills || ''}
          feedbackBusy={feedbackBusy === 'skills'}
        />

        <SectionLanguages
          languages={state.cv.draft.languages}
          onAdd={addLanguage}
          onUpdate={updateLanguage}
          onRemove={(id) => removeItem('languages', id)}
          onAskFeedback={() => askFeedback('languages')}
          feedback={activeVersion?.aiFeedback.languages || ''}
          feedbackBusy={feedbackBusy === 'languages'}
        />

        <SectionInterests
          interests={state.cv.draft.interests}
          onAdd={addInterest}
          onUpdate={updateInterest}
          onRemove={(id) => removeItem('interests', id)}
          onAskFeedback={() => askFeedback('interests')}
          feedback={activeVersion?.aiFeedback.interests || ''}
          feedbackBusy={feedbackBusy === 'interests'}
        />
      </section>

      <section className="preview-wrap">
        <div className="panel"><h2>Preview CV</h2></div>
        <iframe srcDoc={previewHtml} title="Preview CV" />
      </section>
    </main>
  );
}

function SectionExperience({
  experiences,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
  onAskFeedback,
  feedback,
  feedbackBusy
}: {
  experiences: ExperienceItem[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<ExperienceItem>) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onAskFeedback: () => void;
  feedback: string;
  feedbackBusy: boolean;
}) {
  return (
    <div className="panel section">
      <h2>Experiences</h2>
      {experiences.map((item, idx) => (
        <div className={`card ${item.hidden ? 'card-hidden' : ''}`} key={item.id}>
          <div className="actions" style={{ justifyContent: 'space-between' }}>
            <strong>Experience {idx + 1}</strong>
            <div className="actions">
              <button onClick={() => onMove(item.id, 'up')} disabled={idx === 0}>Monter</button>
              <button onClick={() => onMove(item.id, 'down')} disabled={idx === experiences.length - 1}>Descendre</button>
              <button className="warning" onClick={() => onUpdate(item.id, { hidden: !item.hidden })}>
                {item.hidden ? '👁 Afficher' : '👁 Masquer'}
              </button>
              <button className="danger" onClick={() => onRemove(item.id)}>Supprimer</button>
            </div>
          </div>

          <div className="row">
            <div className="field"><label>Entreprise</label><input value={item.company} onChange={(e) => onUpdate(item.id, { company: e.target.value })} /></div>
            <div className="field"><label>Poste</label><input value={item.role} onChange={(e) => onUpdate(item.id, { role: e.target.value })} /></div>
          </div>
          <div className="row">
            <div className="field"><label>Debut</label><input value={item.startDate} onChange={(e) => onUpdate(item.id, { startDate: e.target.value })} /></div>
            <div className="field"><label>Fin</label><input value={item.endDate} onChange={(e) => onUpdate(item.id, { endDate: e.target.value })} /></div>
          </div>
          <div className="field"><label>Lieu</label><input value={item.location} onChange={(e) => onUpdate(item.id, { location: e.target.value })} /></div>
          <div className="field"><label>Description</label><textarea value={item.description} onChange={(e) => onUpdate(item.id, { description: e.target.value })} /></div>
          <div className="field">
            <label>Highlights (1 ligne = 1 puce)</label>
            <textarea
              value={item.highlights.join('\n')}
              onChange={(e) => onUpdate(item.id, { highlights: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })}
            />
          </div>
          {item.hidden ? <p className="status">Cette experience est masquee dans le rendu final.</p> : null}
        </div>
      ))}

      <div className="actions">
        <button onClick={onAdd}>Ajouter experience</button>
        <button onClick={onAskFeedback} disabled={feedbackBusy}>Feedback IA</button>
      </div>
      {feedback ? <div className="feedback">{feedback}</div> : null}
    </div>
  );
}

function SectionEducation({
  education,
  onAdd,
  onUpdate,
  onRemove,
  onAskFeedback,
  feedback,
  feedbackBusy
}: {
  education: EducationItem[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<EducationItem>) => void;
  onRemove: (id: string) => void;
  onAskFeedback: () => void;
  feedback: string;
  feedbackBusy: boolean;
}) {
  return (
    <div className="panel section">
      <h2>Formation</h2>
      {education.map((item, idx) => (
        <div className="card" key={item.id}>
          <div className="actions" style={{ justifyContent: 'space-between' }}>
            <strong>Formation {idx + 1}</strong>
            <button className="danger" onClick={() => onRemove(item.id)}>Supprimer</button>
          </div>
          <div className="row">
            <div className="field"><label>Institution</label><input value={item.institution} onChange={(e) => onUpdate(item.id, { institution: e.target.value })} /></div>
            <div className="field"><label>Diplome</label><input value={item.degree} onChange={(e) => onUpdate(item.id, { degree: e.target.value })} /></div>
          </div>
          <div className="row">
            <div className="field"><label>Domaine</label><input value={item.field} onChange={(e) => onUpdate(item.id, { field: e.target.value })} /></div>
            <div className="field"><label>Debut</label><input value={item.startDate} onChange={(e) => onUpdate(item.id, { startDate: e.target.value })} /></div>
          </div>
          <div className="row">
            <div className="field"><label>Fin</label><input value={item.endDate} onChange={(e) => onUpdate(item.id, { endDate: e.target.value })} /></div>
            <div className="field"><label>Description</label><input value={item.description} onChange={(e) => onUpdate(item.id, { description: e.target.value })} /></div>
          </div>
        </div>
      ))}

      <div className="actions">
        <button onClick={onAdd}>Ajouter formation</button>
        <button onClick={onAskFeedback} disabled={feedbackBusy}>Feedback IA</button>
      </div>
      {feedback ? <div className="feedback">{feedback}</div> : null}
    </div>
  );
}

function SectionSkills({
  skills,
  onAdd,
  onUpdate,
  onRemove,
  onAskFeedback,
  feedback,
  feedbackBusy
}: {
  skills: SkillItem[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<SkillItem>) => void;
  onRemove: (id: string) => void;
  onAskFeedback: () => void;
  feedback: string;
  feedbackBusy: boolean;
}) {
  return (
    <div className="panel section">
      <h2>Competences</h2>
      {skills.map((item, idx) => (
        <div className="card" key={item.id}>
          <div className="actions" style={{ justifyContent: 'space-between' }}>
            <strong>Competence {idx + 1}</strong>
            <button className="danger" onClick={() => onRemove(item.id)}>Supprimer</button>
          </div>
          <div className="row">
            <div className="field"><label>Nom</label><input value={item.name} onChange={(e) => onUpdate(item.id, { name: e.target.value })} /></div>
            <div className="field">
              <label>Niveau</label>
              <select value={item.level} onChange={(e) => onUpdate(item.id, { level: e.target.value as SkillItem['level'] })}>
                <option value="">-</option>
                <option value="beginner">beginner</option>
                <option value="intermediate">intermediate</option>
                <option value="advanced">advanced</option>
                <option value="expert">expert</option>
              </select>
            </div>
          </div>
        </div>
      ))}
      <div className="actions">
        <button onClick={onAdd}>Ajouter competence</button>
        <button onClick={onAskFeedback} disabled={feedbackBusy}>Feedback IA</button>
      </div>
      {feedback ? <div className="feedback">{feedback}</div> : null}
    </div>
  );
}

function SectionLanguages({
  languages,
  onAdd,
  onUpdate,
  onRemove,
  onAskFeedback,
  feedback,
  feedbackBusy
}: {
  languages: LanguageItem[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<LanguageItem>) => void;
  onRemove: (id: string) => void;
  onAskFeedback: () => void;
  feedback: string;
  feedbackBusy: boolean;
}) {
  return (
    <div className="panel section">
      <h2>Langues</h2>
      {languages.map((item, idx) => (
        <div className="card" key={item.id}>
          <div className="actions" style={{ justifyContent: 'space-between' }}>
            <strong>Langue {idx + 1}</strong>
            <button className="danger" onClick={() => onRemove(item.id)}>Supprimer</button>
          </div>
          <div className="row">
            <div className="field"><label>Nom</label><input value={item.name} onChange={(e) => onUpdate(item.id, { name: e.target.value })} /></div>
            <div className="field">
              <label>Niveau</label>
              <select value={item.level} onChange={(e) => onUpdate(item.id, { level: e.target.value as LanguageItem['level'] })}>
                <option value="">-</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
                <option value="Native">Native</option>
              </select>
            </div>
          </div>
        </div>
      ))}
      <div className="actions">
        <button onClick={onAdd}>Ajouter langue</button>
        <button onClick={onAskFeedback} disabled={feedbackBusy}>Feedback IA</button>
      </div>
      {feedback ? <div className="feedback">{feedback}</div> : null}
    </div>
  );
}

function SectionInterests({
  interests,
  onAdd,
  onUpdate,
  onRemove,
  onAskFeedback,
  feedback,
  feedbackBusy
}: {
  interests: InterestItem[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<InterestItem>) => void;
  onRemove: (id: string) => void;
  onAskFeedback: () => void;
  feedback: string;
  feedbackBusy: boolean;
}) {
  return (
    <div className="panel section">
      <h2>Interets</h2>
      {interests.map((item, idx) => (
        <div className="card" key={item.id}>
          <div className="actions" style={{ justifyContent: 'space-between' }}>
            <strong>Interet {idx + 1}</strong>
            <button className="danger" onClick={() => onRemove(item.id)}>Supprimer</button>
          </div>
          <div className="field"><label>Nom</label><input value={item.name} onChange={(e) => onUpdate(item.id, { name: e.target.value })} /></div>
        </div>
      ))}
      <div className="actions">
        <button onClick={onAdd}>Ajouter interet</button>
        <button onClick={onAskFeedback} disabled={feedbackBusy}>Feedback IA</button>
      </div>
      {feedback ? <div className="feedback">{feedback}</div> : null}
    </div>
  );
}
