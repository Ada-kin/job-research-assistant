'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/app-store';
import { readApiKey, uidFactory } from '@/lib/storage';
import type { ApplicationRecord, ApplicationStatus, CoverLetter } from '@/lib/types';

const STATUS_OPTIONS: ApplicationStatus[] = [
  'A_POSTULER',
  'POSTULE',
  'ENTRETIEN_PREVU',
  'ENTRETIEN_PASSE',
  'OFFRE_RECUE',
  'DECLINE'
];

export default function ApplicationsPage() {
  const { state, setState, status, setStatus } = useAppStore();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [selectedCvVersionId, setSelectedCvVersionId] = useState('');
  const [letterBusy, setLetterBusy] = useState(false);

  const selectedApplication = useMemo(
    () => state.applications.find((a) => a.id === selectedApplicationId) || null,
    [state.applications, selectedApplicationId]
  );

  const filtered = useMemo(() => {
    return state.applications.filter((item) => {
      const statusMatch = filterStatus === 'ALL' || item.status === filterStatus;
      const text = `${item.title} ${item.company} ${item.notes}`.toLowerCase();
      const searchMatch = !search.trim() || text.includes(search.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [state.applications, filterStatus, search]);

  function upsertApplication(item: ApplicationRecord) {
    setState((prev) => {
      const exists = prev.applications.some((x) => x.id === item.id);
      return {
        ...prev,
        applications: exists
          ? prev.applications.map((x) => (x.id === item.id ? { ...item, updatedAt: new Date().toISOString() } : x))
          : [{ ...item, id: uidFactory(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev.applications]
      };
    });
  }

  function removeApplication(id: string) {
    setState((prev) => ({
      ...prev,
      applications: prev.applications.filter((x) => x.id !== id),
      coverLetters: prev.coverLetters.filter((x) => x.applicationId !== id)
    }));
    if (selectedApplicationId === id) {
      setSelectedApplicationId('');
    }
    setStatus('Candidature supprimee.');
  }

  async function generateLetter() {
    const apiKey = readApiKey(state);
    if (!apiKey) {
      setStatus('Ajoute une cle OpenAI dans Parametres.');
      return;
    }
    if (!selectedApplication) {
      setStatus('Selectionne une candidature.');
      return;
    }
    const version = state.cv.versions.find((v) => v.id === selectedCvVersionId) || state.cv.versions[0];
    if (!version) {
      setStatus('Aucune version CV disponible.');
      return;
    }
    if (!selectedApplication.offer.offerText.trim()) {
      setStatus('Le texte de l\'offre est requis.');
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
          offerText: selectedApplication.offer.offerText,
          tone: state.settings.defaultTone,
          language: state.settings.defaultLanguage
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Generation impossible');
      }

      const letter: CoverLetter = {
        id: uidFactory(),
        applicationId: selectedApplication.id,
        cvVersionId: version.id,
        tone: state.settings.defaultTone,
        language: state.settings.defaultLanguage,
        content: data.letter,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setState((prev) => ({ ...prev, coverLetters: [letter, ...prev.coverLetters] }));
      setStatus('Lettre generee.');
    } catch (error) {
      setStatus(`Erreur lettre: ${(error as Error).message}`);
    } finally {
      setLetterBusy(false);
    }
  }

  return (
    <main className="dashboard">
      <section className="panel">
        <h1>Suivi des candidatures</h1>
        <p className="status">{status}</p>
      </section>

      <section className="panel">
        <h2>Nouvelle candidature</h2>
        <ApplicationEditor onSave={upsertApplication} />
      </section>

      <section className="panel">
        <h2>Filtres</h2>
        <div className="row">
          <div className="field">
            <label>Statut</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="ALL">Tous</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Recherche</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="poste, entreprise, note" />
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Liste</h2>
        {filtered.length === 0 ? <p className="status">Aucune candidature.</p> : filtered.map((item) => (
          <div className="card" key={item.id}>
            <div className="actions" style={{ justifyContent: 'space-between' }}>
              <strong>{item.title || 'Sans titre'} - {item.company || 'Entreprise'}</strong>
              <span className="badge">{item.status}</span>
            </div>
            <p className="status">{item.notes || 'Aucune note'}</p>
            <div className="field">
              <label>Statut</label>
              <select value={item.status} onChange={(e) => upsertApplication({ ...item, status: e.target.value as ApplicationStatus })}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="actions">
              <button onClick={() => { setSelectedApplicationId(item.id); if (!selectedCvVersionId && state.cv.versions[0]) setSelectedCvVersionId(state.cv.versions[0].id); }}>Selectionner pour lettre</button>
              <button className="danger" onClick={() => removeApplication(item.id)}>Supprimer</button>
            </div>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>Lettre de motivation IA</h2>
        <p className="status">{selectedApplication ? `Candidature active: ${selectedApplication.title} - ${selectedApplication.company}` : 'Selectionne une candidature depuis la liste.'}</p>
        <div className="field" style={{ marginTop: 8 }}>
          <label>Version CV</label>
          <select value={selectedCvVersionId} onChange={(e) => setSelectedCvVersionId(e.target.value)}>
            <option value="">-- Selectionner --</option>
            {state.cv.versions.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </div>
        <div className="actions"><button className="primary" onClick={generateLetter} disabled={letterBusy}>{letterBusy ? 'Generation...' : 'Generer lettre IA'}</button></div>

        {state.coverLetters.filter((l) => !selectedApplicationId || l.applicationId === selectedApplicationId).map((letter) => (
          <div key={letter.id} className="card">
            <p className="status">{new Date(letter.createdAt).toLocaleString()} - CV {letter.cvVersionId.slice(0, 8)}</p>
            <textarea value={letter.content} onChange={(e) => {
              const value = e.target.value;
              setState((prev) => ({
                ...prev,
                coverLetters: prev.coverLetters.map((x) => (x.id === letter.id ? { ...x, content: value, updatedAt: new Date().toISOString() } : x))
              }));
            }} />
            <div className="actions"><button onClick={() => {
              const blob = new Blob([letter.content], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `lettre-${letter.id.slice(0, 8)}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}>Exporter .txt</button></div>
          </div>
        ))}
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
    offer: { sourceType: 'text', sourceValue: '', offerText: '' },
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
          <label>Source offre</label>
          <select value={model.offer.sourceType} onChange={(e) => setModel((prev) => ({ ...prev, offer: { ...prev.offer, sourceType: e.target.value as 'text' | 'url' } }))}>
            <option value="text">Texte colle</option>
            <option value="url">URL</option>
          </select>
        </div>
        <div className="field"><label>{model.offer.sourceType === 'url' ? 'URL offre' : 'Source brute'}</label><input value={model.offer.sourceValue} onChange={(e) => setModel((prev) => ({ ...prev, offer: { ...prev.offer, sourceValue: e.target.value } }))} /></div>
      </div>
      <div className="field"><label>Texte de l'offre</label><textarea value={model.offer.offerText} onChange={(e) => setModel((prev) => ({ ...prev, offer: { ...prev.offer, offerText: e.target.value } }))} /></div>
      <div className="actions"><button className="primary" onClick={() => {
        if (!model.title.trim() || !model.company.trim()) return;
        onSave({ ...model, id: model.id || uidFactory() });
        setModel({ id: '', title: '', company: '', status: 'A_POSTULER', notes: '', offer: { sourceType: 'text', sourceValue: '', offerText: '' }, createdAt: '', updatedAt: '' });
      }}>Enregistrer candidature</button></div>
    </div>
  );
}
