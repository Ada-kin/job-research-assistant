'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useAppStore } from '@/lib/app-store';
import { toUiApplication, toUiCvVersion } from '@/lib/ui-adapters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MessageSquare, Users, Trophy, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const statusLabels: Record<string, string> = {
  applied: 'Envoyee',
  screening: 'Screening',
  interview: 'Entretien',
  offer: 'Offre',
  rejected: 'Refusee'
};

export function NewDashboardPage() {
  const { state } = useAppStore();
  const applications = useMemo(() => state.applications.map(toUiApplication), [state.applications]);
  const cvVersions = useMemo(() => state.cv.versions.map(toUiCvVersion), [state.cv.versions]);

  const totalApps = applications.length;
  const responses = applications.filter((a) => a.status !== 'applied').length;
  const responseRate = totalApps > 0 ? Math.round((responses / totalApps) * 100) : 0;
  const interviews = applications.filter((a) => a.status === 'interview' || a.status === 'offer').length;
  const offers = applications.filter((a) => a.status === 'offer').length;

  const kpis = [
    { label: 'Candidatures', value: totalApps, icon: Briefcase, trend: '+3', up: true },
    { label: 'Taux de reponse', value: `${responseRate}%`, icon: MessageSquare, trend: '+5%', up: true },
    { label: 'Entretiens', value: interviews, icon: Users, trend: '+1', up: true },
    { label: 'Offres', value: offers, icon: Trophy, trend: '0', up: false }
  ];

  const weeklyData = [
    { week: 'S5', candidatures: 2, reponses: 1 },
    { week: 'S6', candidatures: 3, reponses: 2 },
    { week: 'S7', candidatures: 2, reponses: 1 },
    { week: 'S8', candidatures: 1, reponses: 1 }
  ];

  const cvPerformance = cvVersions.map((cv) => {
    const apps = applications.filter((a) => a.cvVersionId === cv.id);
    const resp = apps.filter((a) => a.status !== 'applied').length;
    return {
      name: cv.title,
      candidatures: apps.length,
      taux: apps.length > 0 ? Math.round((resp / apps.length) * 100) : 0
    };
  });

  const recentApps = [...applications].sort((a, b) => b.appliedDate.localeCompare(a.appliedDate)).slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de votre recherche</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-1 text-xs">
                  {kpi.up ? <TrendingUp className="h-3 w-3 text-success" /> : <TrendingDown className="h-3 w-3 text-muted-foreground" />}
                  <span className={kpi.up ? 'text-success' : 'text-muted-foreground'}>{kpi.trend}</span>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-medium mb-4">Activite hebdomadaire</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Line type="monotone" dataKey="candidatures" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="reponses" stroke="hsl(var(--info))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-medium mb-4">Performance par CV</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cvPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="taux" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Taux reponse %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Activite recente</h3>
            <Link href="/applications" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentApps.map((app) => (
              <Link key={app.id} href={`/applications/${app.id}`} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-medium">
                    {(app.company || 'NA').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{app.company}</p>
                    <p className="text-xs text-muted-foreground">{app.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{app.appliedDate}</span>
                  <Badge variant={app.status === 'offer' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs">
                    {statusLabels[app.status]}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
