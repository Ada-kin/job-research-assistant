'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/app-store';
import { isNewUiEnabledClient } from '@/lib/feature-flags';
import { NewDashboardPage } from '@/components/new-ui/dashboard-page';

export default function DashboardPage() {
  if (isNewUiEnabledClient()) {
    return <NewDashboardPage />;
  }

  return <LegacyDashboardPage />;
}

function LegacyDashboardPage() {
  const { state, status } = useAppStore();

  const stats = useMemo(() => {
    const total = state.applications.length;
    const postule = state.applications.filter((a) => a.status === 'POSTULE').length;
    const entretien = state.applications.filter((a) => a.status === 'ENTRETIEN_PREVU' || a.status === 'ENTRETIEN_PASSE').length;
    const decline = state.applications.filter((a) => a.status === 'DECLINE').length;
    return { total, postule, entretien, decline };
  }, [state.applications]);

  return (
    <main className="dashboard">
      <section className="panel">
        <h1>Dashboard</h1>
        <p className="status">{status}</p>
      </section>

      <section className="grid-cards">
        <div className="panel stat-card"><h2>{stats.total}</h2><p>Total candidatures</p></div>
        <div className="panel stat-card"><h2>{stats.postule}</h2><p>Postulees</p></div>
        <div className="panel stat-card"><h2>{stats.entretien}</h2><p>Entretiens</p></div>
        <div className="panel stat-card"><h2>{stats.decline}</h2><p>Declinees</p></div>
      </section>

      <section className="panel">
        <h2>Acces rapide</h2>
        <div className="actions" style={{ marginTop: 8 }}>
          <Link className="button-like" href="/cv">Editer le CV</Link>
          <Link className="button-like" href="/applications">Suivre les candidatures</Link>
          <Link className="button-like" href="/settings">Configurer l'IA</Link>
          <Link className="button-like" href="/landing">Landing V1</Link>
        </div>
      </section>

      <section className="panel">
        <h2>Dernieres candidatures</h2>
        {state.applications.length === 0 ? (
          <p className="status">Aucune candidature pour le moment.</p>
        ) : (
          state.applications.slice(0, 6).map((app) => (
            <div key={app.id} className="card">
              <strong>{app.title || 'Sans titre'} - {app.company || 'Entreprise'}</strong>
              <p className="status">Statut: {app.status}</p>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
