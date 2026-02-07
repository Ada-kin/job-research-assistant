'use client';

import { useEffect, useMemo, useState } from 'react';
import { renderCvHtml } from '@/lib/cv-html';
import { createInitialState, loadState, persistState, readApiKey, uidFactory } from '@/lib/storage';
import type {
  AppState,
  ApplicationRecord,
  ApplicationStatus,
  CoverLetter,
  CvOptimizationResponse,
  CvSection,
  Language,
  Tone
} from '@/lib/types';

const STATUS_OPTIONS: ApplicationStatus[] = [
  'A_POSTULER',
  'POSTULE',
  'ENTRETIEN_PREVU',
  'ENTRETIEN_PASSE',
  'OFFRE_RECUE',
  'DECLINE'
];

const SECTION_LABELS: Record<CvSection, string> = {
  personal: 'Identite',
  profile: 'Profil',
  experiences: 'Experiences',
  education: 'Formation',
  skills: 'Competences',
  languages: 'Langues',
  interests: 'Interets'
};

const SECTIONS: CvSection[] = ['profile', 'experiences', 'education', 'skills', 'languages', 'interests'];

export default function Page() {
  const [state, setState] = useState<AppState>(() => createInitialState());
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Pret.');
  const [versionLabel, setVersionLabel] = useState('');
  const [feedbackBusy, setFeedbackBusy] = useState<CvSection | null>(null);
  const [optimizationBusy, setOptimizationBusy] = useState(false);
  const [optimization, setOptimization] = useState<CvOptimizationResponse | null>(null);
  const [letterBusy, setLetterBusy] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [selectedCvVersionId, setSelectedCvVersionId] = useState('');

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    setSelectedCvVersionId(loaded.cv.currentVersionId);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const timer = window.setTimeout(() => {
      persistState(state);
      setStatus(`Sauvegarde locale: ${new Date().toLocaleTimeString()}`);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [state, ready]);

  const activeCvVersion = useMemo(
    () => state.cv.versions.find((item) => item.id === state.cv.currentVersionId) || state.cv.versions[0],
    [state.cv.versions, state.cv.currentVersionId]
  );

  const selectedApplication = useMemo(
    () => state.applications.find((item) => item.id === selectedApplicationId) || null,
    [state.applications, selectedApplicationId]
  );

  const previewHtml = useMemo(() => renderCvHtml(state.cv.draft), [state.cv.draft]);

  function setDraftField(field: keyof AppState['cv']['draft'], value: string) {
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        draft: {
          ...prev.cv.draft,
          [field]: value
        }
      }
    }));
  }

  function setPersonalField(field: keyof AppState['cv']['draft']['personal'], value: string) {
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

  function updateSettings(patch: Partial<AppState['settings']>) {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }

  function saveCvVersion() {
    const label = versionLabel.trim() || `Version ${new Date().toLocaleDateString()}`;
    const id = uidFactory();

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
            aiFeedback: activeCvVersion?.aiFeedback || {
              personal: '',
              profile: '',
              experiences: '',
              education: '',
              skills: '',
              languages: '',
              interests: ''
            }
          },
          ...prev.cv.versions
        ]
      }
    }));

    setSelectedCvVersionId(id);
    setVersionLabel('');
    setStatus('Nouvelle version CV creee.');
  }

  function loadCvVersion(versionId: string) {
    setState((prev) => {
      const found = prev.cv.versions.find((item) => item.id === versionId);
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
    setSelectedCvVersionId(versionId);
    setStatus('Version CV chargee dans le brouillon.');
  }

  async function requestSectionFeedback(section: CvSection) {
    const apiKey = readApiKey(state);
    if (!apiKey) {
      setStatus('Ajoute une cle OpenAI dans Parametres.',);
      return;
    }

    setFeedbackBusy(section);
    try {
      const payload = {
        apiKey,
        section,
        sectionData: section === 'personal' ? state.cv.draft.personal : state.cv.draft[section],
        jobContext: selectedApplication
          ? {
              title: selectedApplication.title,
              company: selectedApplication.company,
              offerText: selectedApplication.offer.offerText
            }
          : undefined
      };

      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Feedback IA indisponible.');
      }

      setState((prev) => {
        const versions = prev.cv.versions.map((item) =>
          item.id === prev.cv.currentVersionId
            ? {
                ...item,
                aiFeedback: {
                  ...item.aiFeedback,
                  [section]: [data.feedback, data.suggestedRewrite ? `\n\nSuggestion:\n${data.suggestedRewrite}` : ''].join('')
                }
              }
            : item
        );

        return { ...prev, cv: { ...prev.cv, versions } };
      });

      setStatus(`Feedback IA recu pour ${SECTION_LABELS[section]}.`);
    } catch (error) {
      setStatus(`Erreur feedback: ${(error as Error).message}`);
    } finally {
      setFeedbackBusy(null);
    }
  }

  function applyRewrite(section: CvSection, rewrite: string) {
    if (!rewrite.trim()) {
      return;
    }

    if (section === 'personal') {
      return;
    }

    setDraftField(section as keyof AppState['cv']['draft'], rewrite.trim());
    setStatus(`Suggestion appliquee a la section ${SECTION_LABELS[section]}.`);
  }

  async function optimizeCvForOffer() {
    const apiKey = readApiKey(state);
    if (!apiKey) {
      setStatus('Ajoute une cle OpenAI dans Parametres.');
      return;
    }
    if (!selectedApplication?.offer.offerText.trim()) {
      setStatus('Selectionne une candidature avec une offre exploitable.');
      return;
    }

    setOptimizationBusy(true);
    try {
      const response = await fetch('/api/ai/cv-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          cvData: state.cv.draft,
          offerText: selectedApplication.offer.offerText,
          targetRole: selectedApplication.title
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Optimisation indisponible.');
      }

      setOptimization(data as CvOptimizationResponse);
      setStatus('Analyse CV/offre terminee.');
    } catch (error) {
      setStatus(`Erreur optimisation: ${(error as Error).message}`);
    } finally {
      setOptimizationBusy(false);
    }
  }

  function upsertApplication(item: ApplicationRecord) {
    setState((prev) => {
      const exists = prev.applications.some((app) => app.id === item.id);
      const nextApplications = exists
        ? prev.applications.map((app) => (app.id === item.id ? { ...item, updatedAt: new Date().toISOString() } : app))
        : [{ ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev.applications];

      return {
        ...prev,
        applications: nextApplications
      };
    });
  }

  function removeApplication(applicationId: string) {
    setState((prev) => ({
      ...prev,
      applications: prev.applications.filter((item) => item.id !== applicationId),
      coverLetters: prev.coverLetters.filter((letter) => letter.applicationId !== applicationId)
    }));

    if (selectedApplicationId === applicationId) {
      setSelectedApplicationId('');
    }
    setStatus('Candidature supprimee.');
  }

  async function generateCoverLetter() {
    const apiKey = readApiKey(state);
    if (!apiKey) {
      setStatus('Ajoute une cle OpenAI dans Parametres.');
      return;
    }

    const application = selectedApplication;
    if (!application) {
      setStatus('Selectionne une candidature.');
      return;
    }

    const version = state.cv.versions.find((item) => item.id === selectedCvVersionId);
    if (!version) {
      setStatus('Selectionne une version CV valide.');
      return;
    }

    if (!application.offer.offerText.trim()) {
      setStatus('Le texte d\'offre est requis pour la lettre.');
      return;
    }

    setLetterBusy(true);
    try {
      const response = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          cvData: version.data,
          offerText: application.offer.offerText,
          tone: state.settings.defaultTone,
          language: state.settings.defaultLanguage
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Generation lettre impossible.');
      }

      const record: CoverLetter = {
        id: uidFactory(),
        applicationId: application.id,
        cvVersionId: version.id,
        tone: state.settings.defaultTone,
        language: state.settings.defaultLanguage,
        content: data.letter,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setState((prev) => ({ ...prev, coverLetters: [record, ...prev.coverLetters] }));
      setStatus('Lettre generee.');
    } catch (error) {
      setStatus(`Erreur lettre: ${(error as Error).message}`);
    } finally {
      setLetterBusy(false);
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
        const data = await response.json().catch(() => ({ error: 'PDF export failed' }));
        throw new Error(data.error || 'PDF export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(state.cv.draft.personal.fullName || 'cv').replace(/\s+/g, '-').toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Export PDF termine.');
    } catch (error) {
      setStatus(`Erreur PDF: ${(error as Error).message}`);
    }
  }

  const feedbackMap = activeCvVersion?.aiFeedback;

  return (
    <main className="main">
      <section className="left">
        <div className="panel">
          <h1>job-research-assistant</h1>
          <p className="status">{status}</p>
          <div className="actions" style={{ marginTop: 8 }}>
            <button className="primary" onClick={exportPdf}>Exporter PDF CV</button>
          </div>
        </div>

        <div className="panel section">
          <h2>Parametres IA</h2>
          <div className="field">
            <label>Cle OpenAI</label>
            <input
              type="password"
              value={state.settings.openaiApiKey}
              onChange={(e) => updateSettings({ openaiApiKey: e.target.value })}
              placeholder="sk-..."
            />
          </div>
          <div className="field">
            <label>Stocker la cle dans ce navigateur</label>
            <select
              value={String(state.settings.storeApiKey)}
              onChange={(e) => updateSettings({ storeApiKey: e.target.value === 'true' })}
            >
              <option value="false">Non (session uniquement)</option>
              <option value="true">Oui (localStorage)</option>
            </select>
          </div>
          <div className="row">
            <div className="field">
              <label>Langue par defaut</label>
              <select
                value={state.settings.defaultLanguage}
                onChange={(e) => updateSettings({ defaultLanguage: e.target.value as Language })}
              >
                <option value="fr">fr</option>
                <option value="en">en</option>
              </select>
            </div>
            <div className="field">
              <label>Ton par defaut</label>
              <select
                value={state.settings.defaultTone}
                onChange={(e) => updateSettings({ defaultTone: e.target.value as Tone })}
              >
                <option value="NEUTRE">Neutre</option>
                <option value="FORMELLE">Formelle</option>
                <option value="DYNAMIQUE">Dynamique</option>
              </select>
            </div>
          </div>
        </div>

        <div className="panel section">
          <h2>Versions CV</h2>
          <div className="row">
            <div className="field">
              <label>Nouvelle version</label>
              <input value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} placeholder="CV - Backend - Entreprise X" />
            </div>
            <div className="field" style={{ justifyContent: 'end' }}>
              <label>&nbsp;</label>
              <button className="primary" onClick={saveCvVersion}>Sauvegarder version</button>
            </div>
          </div>
          <div className="field">
            <label>Version active</label>
            <select
              value={state.cv.currentVersionId}
              onChange={(e) => loadCvVersion(e.target.value)}
            >
              {state.cv.versions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.label} - {new Date(version.createdAt).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="panel section">
          <h2>CV</h2>
          <h3>Identite</h3>
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
          <div className="actions">
            <button onClick={() => requestSectionFeedback('personal')} disabled={feedbackBusy === 'personal'}>
              {feedbackBusy === 'personal' ? 'Analyse...' : 'Feedback IA identite'}
            </button>
          </div>
          {feedbackMap?.personal ? <div className="feedback" style={{ marginTop: 8 }}>{feedbackMap.personal}</div> : null}

          {SECTIONS.map((section) => {
            const rewrite = optimization?.sectionRecommendations.find((item) => item.section === section)?.rewrite || '';
            return (
              <div key={section} style={{ marginTop: 10 }}>
                <h3>{SECTION_LABELS[section]}</h3>
                <textarea
                  value={state.cv.draft[section]}
                  onChange={(e) => setDraftField(section, e.target.value)}
                  placeholder={`Contenu section ${SECTION_LABELS[section]} (une ligne = une puce)`}
                />
                <div className="actions">
                  <button onClick={() => requestSectionFeedback(section)} disabled={feedbackBusy === section}>
                    {feedbackBusy === section ? 'Analyse...' : `Feedback IA ${SECTION_LABELS[section]}`}
                  </button>
                  {rewrite ? (
                    <button className="warning" onClick={() => applyRewrite(section, rewrite)}>
                      Appliquer suggestion optimisation
                    </button>
                  ) : null}
                </div>
                {feedbackMap?.[section] ? <div className="feedback" style={{ marginTop: 8 }}>{feedbackMap[section]}</div> : null}
              </div>
            );
          })}
        </div>

        <div className="panel section">
          <h2>Candidatures</h2>
          <ApplicationEditor onSave={upsertApplication} />
          {state.applications.map((application) => (
            <div className="card" key={application.id}>
              <div className="actions" style={{ justifyContent: 'space-between' }}>
                <strong>{application.title || 'Sans titre'} - {application.company || 'Entreprise'}</strong>
                <span className="badge">{application.status}</span>
              </div>
              <p className="status">{application.notes || 'Aucune note'}</p>
              <div className="field" style={{ marginTop: 6 }}>
                <label>Statut</label>
                <select
                  value={application.status}
                  onChange={(e) =>
                    upsertApplication({
                      ...application,
                      status: e.target.value as ApplicationStatus
                    })
                  }
                >
                  {STATUS_OPTIONS.map((statusItem) => (
                    <option key={statusItem} value={statusItem}>{statusItem}</option>
                  ))}
                </select>
              </div>
              <div className="actions">
                <button
                  onClick={() => {
                    setSelectedApplicationId(application.id);
                    setStatus('Candidature selectionnee pour optimisation/lettre.');
                  }}
                >
                  Selectionner
                </button>
                <button className="danger" onClick={() => removeApplication(application.id)}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>

        <div className="panel section">
          <h2>Optimiser CV pour une offre</h2>
          <p className="status">
            {selectedApplication
              ? `Candidature active: ${selectedApplication.title} - ${selectedApplication.company}`
              : 'Selectionne une candidature pour analyser l\'alignement CV/offre.'}
          </p>
          <div className="actions" style={{ marginTop: 8 }}>
            <button className="primary" onClick={optimizeCvForOffer} disabled={optimizationBusy || !selectedApplication}>
              {optimizationBusy ? 'Analyse en cours...' : 'Optimiser mon CV'}
            </button>
          </div>
          {optimization ? (
            <div className="card" style={{ marginTop: 8 }}>
              <strong>Score d'alignement: {optimization.alignmentScore}/100</strong>
              <h4 style={{ marginTop: 8 }}>Points forts</h4>
              <ul className="list">
                {optimization.strengths.map((item, index) => (
                  <li key={`${item}_${index}`}>{item}</li>
                ))}
              </ul>
              <h4 style={{ marginTop: 8 }}>Manques</h4>
              <ul className="list">
                {optimization.gaps.map((item, index) => (
                  <li key={`${item}_${index}`}>{item}</li>
                ))}
              </ul>
              <h4 style={{ marginTop: 8 }}>Actions par section</h4>
              {optimization.sectionRecommendations.map((recommendation, index) => (
                <div key={`${recommendation.section}_${index}`} className="card">
                  <strong>{SECTION_LABELS[recommendation.section as CvSection] || recommendation.section}</strong>
                  <ul className="list">
                    {recommendation.actions.map((action, actionIndex) => (
                      <li key={`${action}_${actionIndex}`}>{action}</li>
                    ))}
                  </ul>
                  {recommendation.rewrite ? (
                    <div className="actions" style={{ marginTop: 6 }}>
                      <button
                        className="warning"
                        onClick={() => {
                          const sec = recommendation.section as CvSection;
                          if (sec !== 'personal') {
                            applyRewrite(sec, recommendation.rewrite || '');
                          }
                        }}
                      >
                        Appliquer rewrite
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="panel section">
          <h2>Lettres de motivation</h2>
          <div className="field">
            <label>Version CV utilisee</label>
            <select value={selectedCvVersionId} onChange={(e) => setSelectedCvVersionId(e.target.value)}>
              {state.cv.versions.map((version) => (
                <option key={version.id} value={version.id}>{version.label}</option>
              ))}
            </select>
          </div>
          <div className="actions">
            <button className="primary" onClick={generateCoverLetter} disabled={letterBusy || !selectedApplication}>
              {letterBusy ? 'Generation...' : 'Generer lettre IA'}
            </button>
          </div>

          {state.coverLetters
            .filter((letter) => !selectedApplicationId || letter.applicationId === selectedApplicationId)
            .map((letter) => (
              <div className="card" key={letter.id}>
                <p className="status">
                  {new Date(letter.createdAt).toLocaleString()} - CV version {letter.cvVersionId.slice(0, 8)}
                </p>
                <textarea
                  value={letter.content}
                  onChange={(e) => {
                    const value = e.target.value;
                    setState((prev) => ({
                      ...prev,
                      coverLetters: prev.coverLetters.map((item) =>
                        item.id === letter.id ? { ...item, content: value, updatedAt: new Date().toISOString() } : item
                      )
                    }));
                  }}
                />
                <div className="actions">
                  <button
                    onClick={() => {
                      const blob = new Blob([letter.content], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `lettre-${letter.id.slice(0, 8)}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Exporter .txt
                  </button>
                </div>
              </div>
            ))}
        </div>
      </section>

      <section className="preview-wrap">
        <div className="panel">
          <h2>Preview CV (brouillon)</h2>
        </div>
        <iframe srcDoc={previewHtml} title="Preview CV" />
      </section>
    </main>
  );
}

function ApplicationEditor({ onSave }: { onSave: (application: ApplicationRecord) => void }) {
  const [model, setModel] = useState<ApplicationRecord>({
    id: '',
    title: '',
    company: '',
    status: 'A_POSTULER',
    notes: '',
    offer: {
      sourceType: 'text',
      sourceValue: '',
      offerText: ''
    },
    createdAt: '',
    updatedAt: ''
  });

  return (
    <div className="card">
      <div className="row">
        <div className="field"><label>Poste</label><input value={model.title} onChange={(e) => setModel((prev) => ({ ...prev, title: e.target.value }))} /></div>
        <div className="field"><label>Entreprise</label><input value={model.company} onChange={(e) => setModel((prev) => ({ ...prev, company: e.target.value }))} /></div>
      </div>
      <div className="field"><label>Notes</label><textarea value={model.notes} onChange={(e) => setModel((prev) => ({ ...prev, notes: e.target.value }))} /></div>
      <div className="row">
        <div className="field">
          <label>Type de source offre</label>
          <select
            value={model.offer.sourceType}
            onChange={(e) =>
              setModel((prev) => ({
                ...prev,
                offer: {
                  ...prev.offer,
                  sourceType: e.target.value as 'text' | 'url'
                }
              }))
            }
          >
            <option value="text">Texte colle</option>
            <option value="url">URL</option>
          </select>
        </div>
        <div className="field">
          <label>{model.offer.sourceType === 'url' ? 'URL offre' : 'Source brute'}</label>
          <input
            value={model.offer.sourceValue}
            onChange={(e) => setModel((prev) => ({ ...prev, offer: { ...prev.offer, sourceValue: e.target.value } }))}
          />
        </div>
      </div>
      <div className="field">
        <label>Texte de l'offre</label>
        <textarea
          value={model.offer.offerText}
          onChange={(e) => setModel((prev) => ({ ...prev, offer: { ...prev.offer, offerText: e.target.value } }))}
        />
      </div>
      <div className="actions">
        <button
          className="primary"
          onClick={() => {
            if (!model.title.trim() || !model.company.trim()) {
              return;
            }
            onSave({
              ...model,
              id: model.id || uidFactory()
            });
            setModel({
              id: '',
              title: '',
              company: '',
              status: 'A_POSTULER',
              notes: '',
              offer: { sourceType: 'text', sourceValue: '', offerText: '' },
              createdAt: '',
              updatedAt: ''
            });
          }}
        >
          Enregistrer candidature
        </button>
      </div>
    </div>
  );
}
