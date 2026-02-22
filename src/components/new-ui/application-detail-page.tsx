'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useAppStore } from '@/lib/app-store';
import { patchApplicationFromUi, toUiApplication, type UiApplicationStatus } from '@/lib/ui-adapters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ExternalLink, CheckCircle2, Circle } from 'lucide-react';

const statusConfig: Record<UiApplicationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  applied: { label: 'Envoyee', variant: 'outline' },
  screening: { label: 'Screening', variant: 'secondary' },
  interview: { label: 'Entretien', variant: 'default' },
  offer: { label: 'Offre', variant: 'default' },
  rejected: { label: 'Refusee', variant: 'destructive' }
};

const statusOrder: UiApplicationStatus[] = ['applied', 'screening', 'interview', 'offer'];

export function NewApplicationDetailPage({ id }: { id: string }) {
  const { state, setState } = useAppStore();
  const raw = useMemo(() => state.applications.find((a) => a.id === id) || null, [state.applications, id]);

  if (!raw) {
    return <div className="p-6"><p className="text-muted-foreground">Candidature introuvable.</p><Link href="/applications"><Button variant="link" className="px-0 mt-2">Retour</Button></Link></div>;
  }

  const rawId = raw.id;
  const app = toUiApplication(raw);

  function setNotes(notes: string) {
    setState((prev) => ({ ...prev, applications: prev.applications.map((a) => (a.id === rawId ? patchApplicationFromUi(a, { notes }) : a)) }));
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/applications"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3"><h1 className="text-xl font-semibold">{app.company}</h1><Badge variant={statusConfig[app.status].variant}>{statusConfig[app.status].label}</Badge></div>
          <p className="text-sm text-muted-foreground mt-0.5">{app.position}</p>
        </div>
        {app.url ? <a href={app.url} target="_blank" rel="noreferrer"><Button variant="outline" size="sm" className="gap-1.5 text-xs"><ExternalLink className="h-3 w-3" /> Voir l'offre</Button></a> : null}
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-medium mb-4">Parcours</h3>
          <div className="flex items-center gap-2">
            {statusOrder.map((status, i) => {
              const reached = statusOrder.indexOf(app.status === 'rejected' ? 'interview' : app.status) >= i;
              return (
                <div key={status} className="flex items-center gap-2 flex-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className={`flex items-center justify-center h-8 w-8 rounded-full ${reached ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {reached ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </div>
                    <span className="text-xs text-muted-foreground">{statusConfig[status].label}</span>
                  </div>
                  {i < statusOrder.length - 1 && <div className={`h-px flex-1 ${reached ? 'bg-primary' : 'bg-border'} -mt-6`} />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card><CardContent className="p-5"><h3 className="text-sm font-medium mb-3">Notes</h3><Textarea value={app.notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="text-sm" /></CardContent></Card>
    </div>
  );
}
