'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/app-store';
import { patchApplicationFromUi, toUiApplication, type UiApplicationStatus } from '@/lib/ui-adapters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, Plus } from 'lucide-react';

const statusConfig: Record<UiApplicationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  applied: { label: 'Envoyee', variant: 'outline' },
  screening: { label: 'Screening', variant: 'secondary' },
  interview: { label: 'Entretien', variant: 'default' },
  offer: { label: 'Offre', variant: 'default' },
  rejected: { label: 'Refusee', variant: 'destructive' }
};

const allStatuses: UiApplicationStatus[] = ['applied', 'screening', 'interview', 'offer', 'rejected'];

export function NewApplicationsListPage() {
  const { state, setState } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const applications = useMemo(() => state.applications.map(toUiApplication), [state.applications]);
  const filtered = applications
    .filter((a) => statusFilter === 'all' || a.status === statusFilter)
    .sort((a, b) => b.appliedDate.localeCompare(a.appliedDate));

  function updateStatus(id: string, status: UiApplicationStatus) {
    setState((prev) => ({
      ...prev,
      applications: prev.applications.map((a) => (a.id === id ? patchApplicationFromUi(a, { status }) : a))
    }));
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Candidatures</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} candidature{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Ajouter</Button>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {allStatuses.map((s) => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Entreprise</TableHead>
              <TableHead className="text-xs">Poste</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Statut</TableHead>
              <TableHead className="text-xs w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((app) => (
              <TableRow key={app.id} className="group">
                <TableCell><Link href={`/applications/${app.id}`} className="text-sm font-medium hover:underline">{app.company}</Link></TableCell>
                <TableCell className="text-sm text-muted-foreground">{app.position}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{app.appliedDate}</TableCell>
                <TableCell>
                  <Select value={app.status} onValueChange={(v) => updateStatus(app.id, v as UiApplicationStatus)}>
                    <SelectTrigger className="h-7 w-28 border-0 p-0 shadow-none">
                      <Badge variant={statusConfig[app.status].variant} className="text-xs">{statusConfig[app.status].label}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {allStatuses.map((s) => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Link href={`/applications/${app.id}`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"><ExternalLink className="h-3.5 w-3.5" /></Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
