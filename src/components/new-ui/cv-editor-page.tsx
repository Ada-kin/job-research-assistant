'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/lib/app-store';
import { toUiCvVersion, patchCvVersionFromUi, type UiCvVersion } from '@/lib/ui-adapters';
import { renderCvHtml } from '@/lib/cv-html';
import { uidFactory, EMPTY_FEEDBACK } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export function NewCvEditorPage({ id }: { id: string }) {
  const { state, setState, setStatus } = useAppStore();
  const isNew = id === 'new';

  const sourceVersion = useMemo(() => {
    if (isNew) {
      return {
        id: uidFactory(),
        label: 'Nouveau CV',
        createdAt: new Date().toISOString(),
        data: state.cv.draft,
        aiFeedback: EMPTY_FEEDBACK
      };
    }
    return state.cv.versions.find((v) => v.id === id) || state.cv.versions[0];
  }, [id, isNew, state.cv.draft, state.cv.versions]);

  const [cv, setCv] = useState<UiCvVersion>(toUiCvVersion(sourceVersion));
  useEffect(() => setCv(toUiCvVersion(sourceVersion)), [sourceVersion]);

  const save = () => {
    const next = patchCvVersionFromUi(sourceVersion, cv);
    setState((prev) => {
      const exists = prev.cv.versions.some((v) => v.id === next.id);
      return {
        ...prev,
        cv: {
          ...prev.cv,
          draft: next.data,
          currentVersionId: next.id,
          versions: exists ? prev.cv.versions.map((v) => (v.id === next.id ? next : v)) : [next, ...prev.cv.versions]
        }
      };
    });
    setStatus('Version enregistree.');
  };

  const previewHtml = useMemo(() => renderCvHtml(patchCvVersionFromUi(sourceVersion, cv).data), [sourceVersion, cv]);

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <Link href="/cv"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <Input value={cv.title} onChange={(e) => setCv((p) => ({ ...p, title: e.target.value }))} placeholder="Positionnement" className="text-sm font-medium border-0 p-0 h-auto bg-transparent focus-visible:ring-0 shadow-none" />
        </div>
        <Button size="sm" onClick={save}>Enregistrer</Button>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={50} minSize={35}>
          <div className="p-5 overflow-auto h-full space-y-6">
            <section className="space-y-3">
              <h3 className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Informations</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Nom complet</Label><Input value={cv.info.fullName} onChange={(e) => setCv((p) => ({ ...p, info: { ...p.info, fullName: e.target.value } }))} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs">Email</Label><Input value={cv.info.email} onChange={(e) => setCv((p) => ({ ...p, info: { ...p.info, email: e.target.value } }))} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs">Telephone</Label><Input value={cv.info.phone} onChange={(e) => setCv((p) => ({ ...p, info: { ...p.info, phone: e.target.value } }))} className="mt-1 h-8 text-sm" /></div>
                <div><Label className="text-xs">Localisation</Label><Input value={cv.info.location} onChange={(e) => setCv((p) => ({ ...p, info: { ...p.info, location: e.target.value } }))} className="mt-1 h-8 text-sm" /></div>
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Resume</h3>
              <Textarea value={cv.summary} onChange={(e) => setCv((p) => ({ ...p, summary: e.target.value }))} rows={3} className="text-sm" />
            </section>

            <Separator />

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Experiences</h3>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setCv((p) => ({ ...p, experiences: [...p.experiences, { id: uidFactory(), company: '', role: '', location: '', startDate: '', endDate: '', description: '', highlights: [], hidden: false }] }))}><Plus className="h-3 w-3" /> Ajouter</Button>
              </div>
              {cv.experiences.map((exp) => (
                <div key={exp.id} className="space-y-2 p-3 rounded-md border">
                  <div className="flex items-center justify-between">
                    <Input value={exp.role} onChange={(e) => setCv((p) => ({ ...p, experiences: p.experiences.map((x) => x.id === exp.id ? { ...x, role: e.target.value } : x) }))} placeholder="Poste" className="h-7 text-sm border-0 p-0 bg-transparent focus-visible:ring-0 shadow-none font-medium" />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCv((p) => ({ ...p, experiences: p.experiences.filter((x) => x.id !== exp.id) }))}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input value={exp.company} onChange={(e) => setCv((p) => ({ ...p, experiences: p.experiences.map((x) => x.id === exp.id ? { ...x, company: e.target.value } : x) }))} placeholder="Entreprise" className="h-7 text-xs" />
                    <Input value={exp.startDate} onChange={(e) => setCv((p) => ({ ...p, experiences: p.experiences.map((x) => x.id === exp.id ? { ...x, startDate: e.target.value } : x) }))} placeholder="Debut" className="h-7 text-xs" />
                    <Input value={exp.endDate} onChange={(e) => setCv((p) => ({ ...p, experiences: p.experiences.map((x) => x.id === exp.id ? { ...x, endDate: e.target.value } : x) }))} placeholder="Fin" className="h-7 text-xs" />
                  </div>
                  <Textarea value={exp.description} onChange={(e) => setCv((p) => ({ ...p, experiences: p.experiences.map((x) => x.id === exp.id ? { ...x, description: e.target.value } : x) }))} placeholder="Description" rows={2} className="text-xs" />
                </div>
              ))}
            </section>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="p-8 overflow-auto h-full bg-muted/30">
            <iframe title="CV preview" srcDoc={previewHtml} className="w-full min-h-[70vh] rounded-md border bg-white" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
