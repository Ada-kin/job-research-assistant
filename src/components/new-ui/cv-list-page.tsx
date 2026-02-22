'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/app-store';
import { toUiCvVersion, withArchivedLabel } from '@/lib/ui-adapters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Archive, FileText, Plus } from 'lucide-react';

export function NewCvListPage() {
  const { state, setState } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
  const cvVersions = useMemo(() => state.cv.versions.map(toUiCvVersion), [state.cv.versions]);

  const filtered = cvVersions.filter((cv) => (filter === 'all' ? true : cv.status === filter));

  function toggleArchive(id: string) {
    setState((prev) => ({
      ...prev,
      cv: {
        ...prev.cv,
        versions: prev.cv.versions.map((v) => (v.id === id ? { ...v, label: withArchivedLabel(v.label, !v.label.startsWith('[ARCHIVED] ')) } : v))
      }
    }));
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">CV</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerez vos versions et positionnements</p>
        </div>
        <Link href="/cv/new">
          <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Nouveau CV</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        {(['all', 'active', 'archived'] as const).map((f) => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="text-xs">
            {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : 'Archives'}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((cv) => (
          <Card key={cv.id} className="group hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <Link href={`/cv/${cv.id}`} className="text-sm font-medium hover:underline">{cv.title}</Link>
                    <p className="text-xs text-muted-foreground">Modifie le {cv.updatedAt.slice(0, 10)}</p>
                  </div>
                </div>
                <Badge variant={cv.status === 'active' ? 'secondary' : 'outline'} className="text-xs">
                  {cv.status === 'active' ? 'Actif' : 'Archive'}
                </Badge>
              </div>
              <div className="flex gap-1.5 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => toggleArchive(cv.id)}>
                  <Archive className="h-3 w-3" /> {cv.status === 'archived' ? 'Reactiver' : 'Archiver'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
