'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/app-store';
import { EMPTY_FEEDBACK, readApiKey, uidFactory } from '@/lib/storage';
import { renderCvHtml } from '@/lib/cv-html';
import type { CvOptimizationResponse, CvSection, EducationItem, ExperienceItem, InterestItem, LanguageItem, SkillItem } from '@/lib/types';

const SECTION_LABELS: Record<CvSection, string> = {
  personal: 'Identite',
  profile: 'Profil',
  experiences: 'Experiences',
  education: 'Formation',
  skills: 'Competences',
  languages: 'Langues',
  interests: 'Interets'
};

export default function CvPage() {
  const { state, setState, status, setStatus } = useAppStore();
  const [versionLabel, setVersionLabel] = useState('');
  const [feedbackBusy, setFeedbackBusy] = useState<CvSection | null>(null);
  const [optimizeBusy, setOptimizeBusy] = useState(false);
  const [optimization, setOptimization] = useState<CvOptimizationResponse | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');

  const activeVersion = useMemo(
    () => state.cv.versions.find((v) => v.id === state.cv.currentVersionId) || state.cv.versions[0],
    [state.cv.versions, state.cv.currentVersionId]
  );

  const selectedApplication = useMemo(
    () => state.applications.find((a) => a.id === selectedApplicationId) || null,
    [state.applications, selectedApplicationId]
  );

  const previewHtml = useMemo(() => renderCvHtml(state.cv.draft), [state.cv.draft]);

  function setPersonalField(field: keyof typeof state.cv.draft.personal, value: string) {
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        draft: {
          ...prev.cv.draft,
          personal: { ...prev.cv.draft.personal, [field]: value }
        }
      }
    }));
  }

  function updateExperience(id: string, patch: Partial<ExperienceItem>) {
    setState((prev) => ({ ...prev, cv: { ...prev.cv, draft: { ...prev.cv.draft, experiences: prev.cv.draft.experiences.map((x) => (x.id === id ? { ...x, ...patch } : x)) } } }));
  }

  function updateEducation(id: string, patch: Partial<EducationItem>) {
    setState((prev) => ({ ...prev, cv: { ...prev.cv, draft: { ...prev.cv.draft, education: prev.cv.draft.education.map((x) => (x.id === id ? { ...x, ...patch } : x)) } } }));
  }

  function updateSkill(id: string, patch: Partial<SkillItem>) {
    setState((prev) => ({ ...prev, cv: { ...prev.cv, draft: { ...prev.cv.draft, skills: prev.cv.draft.skills.map((x) => (x.id === id ? { ...x, ...patch } : x)) } } }));
  }

  function updateLanguage(id: string, patch: Partial<LanguageItem>) {
    setState((prev) => ({ ...prev, cv: { ...prev.cv, draft: { ...prev.cv.draft, languages: prev.cv.draft.languages.map((x) => (x.id === id ? { ...x, ...patch } : x)) } } }));
  }

  function updateInterest(id: string, patch: Partial<InterestItem>) {
    setState((prev) => ({ ...prev, cv: { ...prev.cv, draft: { ...prev.cv.draft, interests: prev.cv.draft.interests.map((x) => (x.id === id ? { ...x, ...patch } : x)) } } }));
  }

  function addExperience() {
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        draft: {
          ...prev.cv.draft,
          experiences: [...prev.cv.draft.experiences, { id: uidFactory(), company: '', role: '', location: '', startDate: '', endDate: '', description: '', highlights: [] }]
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
          education: [...prev.cv.draft.education, { id: uidFactory(), institution: '', degree: '', field: '', startDate: '', endDate: '', description: '' }]
        }
      }
    }));
  }

  function addSkill() {
    setState((prev) => ({ ...prev, cv: { ...prev.cv, draft: { ...prev.cv.draft, skills: [...prev.cv.draft.skills, { id: uidFactory(), name: '', level: '' }] } } }));
  }

  function addLanguage() {
    setState((prev) => ({ ...prev, cv: { ...prev.cv, draft: { ...prev.cv.draft, languages: [...prev.cv.draft.languages, { id: uidFactory(), name: '', level: '' }] } } }));
  }

  function addInterest() {
    setState((prev) => ({ ...prev, cv: { ...prev.cv, draft: { ...prev.cv.draft, interests: [...prev.cv.draft.interests, { id: uidFactory(), name: '' }] } } }));
  }

  function removeItem(type: 'experiences' | 'education' | 'skills' | 'languages' | 'interests', id: string) {
    setState((prev) => ({ ...prev, cv: { ...prev.cv, draft: { ...prev.cv.draft, [type]: prev.cv.draft[type].filter((x) => x.id !== id) } } }));
  }

  function saveVersion() {
    const id = uidFactory();
    const label = versionLabel.trim() || `Version ${new Date().toLocaleDateString()}`;
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        currentVersionId: id,
        versions: [{ id, label, createdAt: new Date().toISOString(), data: structuredClone(prev.cv.draft), aiFeedback: structuredClone(activeVersion?.aiFeedback || EMPTY_FEEDBACK) }, ...prev.cv.versions]
      }
    }));
    setVersionLabel('');
    setStatus('Version CV sauvegardee.');
  }

  function loadVersion(id: string) {
    setState((prev) => {
      const found = prev.cv.versions.find((x) => x.id === id);
      if (!found) return prev;
      return { ...prev, cv: { ...prev.cv, currentVersionId: id, draft: structuredClone(found.data) } };
    });
    setStatus('Version chargee.');
  }

  async function askFeedback(section: CvSection) {
    const apiKey = readApiKey(state);
    if (!apiKey) {
      setStatus('Ajoute une cle OpenAI dans Parametres.');
      return;
    }

    setFeedbackBusy(section);
    try {
      const sectionData = section === 'personal' ? state.cv.draft.personal : state.cv.draft[section];
      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          section,
          sectionData,
          jobContext: selectedApplication
            ? { title: selectedApplication.title, company: selectedApplication.company, offerText: selectedApplication.offer.offerText }
            : undefined
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Feedback indisponible');

      setState((prev) => ({
        ...prev,
        cv: {
          ...prev.cv,
          versions: prev.cv.versions.map((v) =>
            v.id === prev.cv.currentVersionId
              ? { ...v, aiFeedback: { ...v.aiFeedback, [section]: [data.feedback, data.suggestedRewrite ? `\n\nSuggestion:\n${data.suggestedRewrite}` : ''].join('') } }
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
    if (!apiKey) {
      setStatus('Ajoute une cle OpenAI dans Parametres.');
      return;
    }
    if (!selectedApplication?.offer.offerText.trim()) {
      setStatus('Selectionne une candidature avec offre.');
      return;
    }

    setOptimizeBusy(true);
    try {
      const response = await fetch('/api/ai/cv-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, cvData: state.cv.draft, offerText: selectedApplication.offer.offerText, targetRole: selectedApplication.title })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Optimisation indisponible');
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
        body: JSON.stringify({ html: previewHtml, fileName: `${(state.cv.draft.personal.fullName || 'cv').replace(/\s+/g, '-').toLowerCase()}.pdf` })
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
          <div className="actions" style={{ marginTop: 8 }}><button className="primary" onClick={exportPdf}>Exporter PDF</button></div>
        </div>

        <div className="panel section">
          <h2>Versions CV</h2>
          <div className="row">
            <div className="field"><label>Nom de version</label><input value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} placeholder="CV - Entreprise X" /></div>
            <div className="field"><label>&nbsp;</label><button className="primary" onClick={saveVersion}>Sauvegarder version</button></div>
          </div>
          <div className="field">
            <label>Version active</label>
            <select value={state.cv.currentVersionId} onChange={(e) => loadVersion(e.target.value)}>
              {state.cv.versions.map((v) => <option key={v.id} value={v.id}>{v.label} - {new Date(v.createdAt).toLocaleString()}</option>)}
            </select>
          </div>
        </div>

        <div className="panel section">
          <h2>Optimisation IA pour une offre</h2>
          <div className="field">
            <label>Candidature</label>
            <select value={selectedApplicationId} onChange={(e) => setSelectedApplicationId(e.target.value)}>
              <option value="">-- Selectionner --</option>
              {state.applications.map((a) => <option key={a.id} value={a.id}>{a.title} - {a.company}</option>)}
            </select>
          </div>
          <div className="actions"><button className="primary" onClick={optimizeCv} disabled={optimizeBusy}>{optimizeBusy ? 'Analyse...' : 'Optimiser mon CV'}</button></div>
          {optimization ? (
            <div className="card" style={{ marginTop: 8 }}>
              <strong>Score: {optimization.alignmentScore}/100</strong>
              {optimization.sectionRecommendations.map((r, idx) => (
                <div key={`${r.section}_${idx}`} className="card">
                  <strong>{SECTION_LABELS[r.section]}</strong>
                  <ul className="list">{r.actions.map((a, i) => <li key={`${a}_${i}`}>{a}</li>)}</ul>
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

        <SectionExperience state={state} addExperience={addExperience} updateExperience={updateExperience} removeItem={removeItem} askFeedback={askFeedback} activeFeedback={activeVersion?.aiFeedback.experiences || ''} feedbackBusy={feedbackBusy} />
        <SectionEducation state={state} addEducation={addEducation} updateEducation={updateEducation} removeItem={removeItem} askFeedback={askFeedback} activeFeedback={activeVersion?.aiFeedback.education || ''} feedbackBusy={feedbackBusy} />
        <SectionSkills state={state} addSkill={addSkill} updateSkill={updateSkill} removeItem={removeItem} askFeedback={askFeedback} activeFeedback={activeVersion?.aiFeedback.skills || ''} feedbackBusy={feedbackBusy} />
        <SectionLanguages state={state} addLanguage={addLanguage} updateLanguage={updateLanguage} removeItem={removeItem} askFeedback={askFeedback} activeFeedback={activeVersion?.aiFeedback.languages || ''} feedbackBusy={feedbackBusy} />
        <SectionInterests state={state} addInterest={addInterest} updateInterest={updateInterest} removeItem={removeItem} askFeedback={askFeedback} activeFeedback={activeVersion?.aiFeedback.interests || ''} feedbackBusy={feedbackBusy} />
      </section>

      <section className="preview-wrap">
        <div className="panel"><h2>Preview CV</h2></div>
        <iframe srcDoc={previewHtml} title="Preview CV" />
      </section>
    </main>
  );
}

function SectionExperience({ state, addExperience, updateExperience, removeItem, askFeedback, activeFeedback, feedbackBusy }: {
  state: ReturnType<typeof useAppStore>['state'];
  addExperience: () => void;
  updateExperience: (id: string, patch: Partial<ExperienceItem>) => void;
  removeItem: (type: 'experiences' | 'education' | 'skills' | 'languages' | 'interests', id: string) => void;
  askFeedback: (section: CvSection) => void;
  activeFeedback: string;
  feedbackBusy: CvSection | null;
}) {
  return <div className="panel section"><h2>Experiences</h2>{state.cv.draft.experiences.map((item, idx)=><div className="card" key={item.id}><div className="actions" style={{justifyContent:'space-between'}}><strong>Experience {idx+1}</strong><button className="danger" onClick={()=>removeItem('experiences', item.id)}>Supprimer</button></div><div className="row"><div className="field"><label>Entreprise</label><input value={item.company} onChange={(e)=>updateExperience(item.id,{company:e.target.value})} /></div><div className="field"><label>Poste</label><input value={item.role} onChange={(e)=>updateExperience(item.id,{role:e.target.value})} /></div></div><div className="row"><div className="field"><label>Debut</label><input value={item.startDate} onChange={(e)=>updateExperience(item.id,{startDate:e.target.value})} /></div><div className="field"><label>Fin</label><input value={item.endDate} onChange={(e)=>updateExperience(item.id,{endDate:e.target.value})} /></div></div><div className="field"><label>Lieu</label><input value={item.location} onChange={(e)=>updateExperience(item.id,{location:e.target.value})} /></div><div className="field"><label>Description</label><textarea value={item.description} onChange={(e)=>updateExperience(item.id,{description:e.target.value})} /></div><div className="field"><label>Highlights (1 ligne = 1 puce)</label><textarea value={item.highlights.join('\n')} onChange={(e)=>updateExperience(item.id,{highlights:e.target.value.split('\n').map((x)=>x.trim()).filter(Boolean)})} /></div></div>)}<div className="actions"><button onClick={addExperience}>Ajouter experience</button><button onClick={()=>askFeedback('experiences')} disabled={feedbackBusy==='experiences'}>Feedback IA</button></div>{activeFeedback ? <div className="feedback">{activeFeedback}</div> : null}</div>;
}

function SectionEducation({ state, addEducation, updateEducation, removeItem, askFeedback, activeFeedback, feedbackBusy }: {
  state: ReturnType<typeof useAppStore>['state'];
  addEducation: () => void;
  updateEducation: (id: string, patch: Partial<EducationItem>) => void;
  removeItem: (type: 'experiences' | 'education' | 'skills' | 'languages' | 'interests', id: string) => void;
  askFeedback: (section: CvSection) => void;
  activeFeedback: string;
  feedbackBusy: CvSection | null;
}) {
  return <div className="panel section"><h2>Formation</h2>{state.cv.draft.education.map((item, idx)=><div className="card" key={item.id}><div className="actions" style={{justifyContent:'space-between'}}><strong>Formation {idx+1}</strong><button className="danger" onClick={()=>removeItem('education', item.id)}>Supprimer</button></div><div className="row"><div className="field"><label>Institution</label><input value={item.institution} onChange={(e)=>updateEducation(item.id,{institution:e.target.value})} /></div><div className="field"><label>Diplome</label><input value={item.degree} onChange={(e)=>updateEducation(item.id,{degree:e.target.value})} /></div></div><div className="row"><div className="field"><label>Domaine</label><input value={item.field} onChange={(e)=>updateEducation(item.id,{field:e.target.value})} /></div><div className="field"><label>Debut</label><input value={item.startDate} onChange={(e)=>updateEducation(item.id,{startDate:e.target.value})} /></div></div><div className="row"><div className="field"><label>Fin</label><input value={item.endDate} onChange={(e)=>updateEducation(item.id,{endDate:e.target.value})} /></div><div className="field"><label>Description</label><input value={item.description} onChange={(e)=>updateEducation(item.id,{description:e.target.value})} /></div></div></div>)}<div className="actions"><button onClick={addEducation}>Ajouter formation</button><button onClick={()=>askFeedback('education')} disabled={feedbackBusy==='education'}>Feedback IA</button></div>{activeFeedback ? <div className="feedback">{activeFeedback}</div> : null}</div>;
}

function SectionSkills({ state, addSkill, updateSkill, removeItem, askFeedback, activeFeedback, feedbackBusy }: {
  state: ReturnType<typeof useAppStore>['state'];
  addSkill: () => void;
  updateSkill: (id: string, patch: Partial<SkillItem>) => void;
  removeItem: (type: 'experiences' | 'education' | 'skills' | 'languages' | 'interests', id: string) => void;
  askFeedback: (section: CvSection) => void;
  activeFeedback: string;
  feedbackBusy: CvSection | null;
}) {
  return <div className="panel section"><h2>Competences</h2>{state.cv.draft.skills.map((item, idx)=><div className="card" key={item.id}><div className="actions" style={{justifyContent:'space-between'}}><strong>Competence {idx+1}</strong><button className="danger" onClick={()=>removeItem('skills', item.id)}>Supprimer</button></div><div className="row"><div className="field"><label>Nom</label><input value={item.name} onChange={(e)=>updateSkill(item.id,{name:e.target.value})} /></div><div className="field"><label>Niveau</label><select value={item.level} onChange={(e)=>updateSkill(item.id,{level:e.target.value as SkillItem['level']})}><option value="">-</option><option value="beginner">beginner</option><option value="intermediate">intermediate</option><option value="advanced">advanced</option><option value="expert">expert</option></select></div></div></div>)}<div className="actions"><button onClick={addSkill}>Ajouter competence</button><button onClick={()=>askFeedback('skills')} disabled={feedbackBusy==='skills'}>Feedback IA</button></div>{activeFeedback ? <div className="feedback">{activeFeedback}</div> : null}</div>;
}

function SectionLanguages({ state, addLanguage, updateLanguage, removeItem, askFeedback, activeFeedback, feedbackBusy }: {
  state: ReturnType<typeof useAppStore>['state'];
  addLanguage: () => void;
  updateLanguage: (id: string, patch: Partial<LanguageItem>) => void;
  removeItem: (type: 'experiences' | 'education' | 'skills' | 'languages' | 'interests', id: string) => void;
  askFeedback: (section: CvSection) => void;
  activeFeedback: string;
  feedbackBusy: CvSection | null;
}) {
  return <div className="panel section"><h2>Langues</h2>{state.cv.draft.languages.map((item, idx)=><div className="card" key={item.id}><div className="actions" style={{justifyContent:'space-between'}}><strong>Langue {idx+1}</strong><button className="danger" onClick={()=>removeItem('languages', item.id)}>Supprimer</button></div><div className="row"><div className="field"><label>Nom</label><input value={item.name} onChange={(e)=>updateLanguage(item.id,{name:e.target.value})} /></div><div className="field"><label>Niveau</label><select value={item.level} onChange={(e)=>updateLanguage(item.id,{level:e.target.value as LanguageItem['level']})}><option value="">-</option><option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option><option value="B2">B2</option><option value="C1">C1</option><option value="C2">C2</option><option value="Native">Native</option></select></div></div></div>)}<div className="actions"><button onClick={addLanguage}>Ajouter langue</button><button onClick={()=>askFeedback('languages')} disabled={feedbackBusy==='languages'}>Feedback IA</button></div>{activeFeedback ? <div className="feedback">{activeFeedback}</div> : null}</div>;
}

function SectionInterests({ state, addInterest, updateInterest, removeItem, askFeedback, activeFeedback, feedbackBusy }: {
  state: ReturnType<typeof useAppStore>['state'];
  addInterest: () => void;
  updateInterest: (id: string, patch: Partial<InterestItem>) => void;
  removeItem: (type: 'experiences' | 'education' | 'skills' | 'languages' | 'interests', id: string) => void;
  askFeedback: (section: CvSection) => void;
  activeFeedback: string;
  feedbackBusy: CvSection | null;
}) {
  return <div className="panel section"><h2>Interets</h2>{state.cv.draft.interests.map((item, idx)=><div className="card" key={item.id}><div className="actions" style={{justifyContent:'space-between'}}><strong>Interet {idx+1}</strong><button className="danger" onClick={()=>removeItem('interests', item.id)}>Supprimer</button></div><div className="field"><label>Nom</label><input value={item.name} onChange={(e)=>updateInterest(item.id,{name:e.target.value})} /></div></div>)}<div className="actions"><button onClick={addInterest}>Ajouter interet</button><button onClick={()=>askFeedback('interests')} disabled={feedbackBusy==='interests'}>Feedback IA</button></div>{activeFeedback ? <div className="feedback">{activeFeedback}</div> : null}</div>;
}
