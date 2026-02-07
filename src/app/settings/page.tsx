'use client';

import { useAppStore } from '@/lib/app-store';
import type { Language, Tone } from '@/lib/types';

export default function SettingsPage() {
  const { state, setState, status } = useAppStore();

  function updateSettings(patch: Partial<typeof state.settings>) {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }

  return (
    <main className="dashboard">
      <section className="panel">
        <h1>Parametres</h1>
        <p className="status">{status}</p>
      </section>

      <section className="panel">
        <h2>OpenAI</h2>
        <div className="field">
          <label>Cle API</label>
          <input type="password" value={state.settings.openaiApiKey} onChange={(e) => updateSettings({ openaiApiKey: e.target.value })} placeholder="sk-..." />
        </div>
        <div className="field">
          <label>Stocker la cle localement</label>
          <select value={String(state.settings.storeApiKey)} onChange={(e) => updateSettings({ storeApiKey: e.target.value === 'true' })}>
            <option value="false">Non (session)</option>
            <option value="true">Oui (localStorage)</option>
          </select>
        </div>
      </section>

      <section className="panel">
        <h2>Preferences IA</h2>
        <div className="row">
          <div className="field">
            <label>Langue par defaut</label>
            <select value={state.settings.defaultLanguage} onChange={(e) => updateSettings({ defaultLanguage: e.target.value as Language })}>
              <option value="fr">fr</option>
              <option value="en">en</option>
            </select>
          </div>
          <div className="field">
            <label>Ton par defaut</label>
            <select value={state.settings.defaultTone} onChange={(e) => updateSettings({ defaultTone: e.target.value as Tone })}>
              <option value="NEUTRE">Neutre</option>
              <option value="FORMELLE">Formelle</option>
              <option value="DYNAMIQUE">Dynamique</option>
            </select>
          </div>
        </div>
      </section>
    </main>
  );
}
