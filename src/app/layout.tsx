import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { AppStoreProvider } from '@/lib/app-store';

export const metadata: Metadata = {
  title: 'Job Research Assistant',
  description: 'Manage applications, customize CVs and generate letters with AI.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AppStoreProvider>
          <header className="topbar">
            <div className="brand">job-research-assistant</div>
            <nav className="nav">
              <Link href="/">Dashboard</Link>
              <Link href="/cv">CV Builder</Link>
              <Link href="/applications">Candidatures</Link>
              <Link href="/settings">Parametres</Link>
            </nav>
          </header>
          <div className="page-wrap">{children}</div>
        </AppStoreProvider>
      </body>
    </html>
  );
}
