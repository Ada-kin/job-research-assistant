import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { AppStoreProvider } from '@/lib/app-store';
import { auth, signOut } from '@/auth';

export const metadata: Metadata = {
  title: 'Job Research Assistant',
  description: 'Manage applications, customize CVs and generate letters with AI.'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="fr">
      <body>
        <AppStoreProvider>
          <header className="topbar">
            <div className="brand">job-research-assistant</div>
            {session?.user ? (
              <>
                <nav className="nav">
                  <Link href="/">Dashboard</Link>
                  <Link href="/cv">CV Builder</Link>
                  <Link href="/applications">Candidatures</Link>
                  <Link href="/settings">Parametres</Link>
                  <form
                    action={async () => {
                      'use server';
                      await signOut({ redirectTo: '/login' });
                    }}
                  >
                    <button type="submit">Se deconnecter</button>
                  </form>
                </nav>
                <div className="status">{session.user.email || ''}</div>
              </>
            ) : (
              <nav className="nav">
                <Link href="/login">Connexion</Link>
              </nav>
            )}
          </header>
          <div className="page-wrap">{children}</div>
        </AppStoreProvider>
      </body>
    </html>
  );
}
