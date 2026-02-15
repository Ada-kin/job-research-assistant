import Link from 'next/link';
import { AppStoreProvider } from '@/lib/app-store';
import { auth, signOut } from '@/auth';
import { isAuthDisabledForLocal } from '@/lib/auth-mode';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const bypassAuth = isAuthDisabledForLocal();
  const session = await auth();
  const isLoggedIn = bypassAuth || Boolean(session?.user);

  return (
    <AppStoreProvider>
      <header className="topbar">
        <div className="brand">job-research-assistant</div>
        {isLoggedIn ? (
          <>
            <nav className="nav">
              <Link href="/">Dashboard</Link>
              <Link href="/cv">CV Builder</Link>
              <Link href="/applications">Candidatures</Link>
              <Link href="/settings">Parametres</Link>
              {!bypassAuth ? (
                <form
                  action={async () => {
                    'use server';
                    await signOut({ redirectTo: '/login' });
                  }}
                >
                  <button type="submit">Se deconnecter</button>
                </form>
              ) : null}
            </nav>
            <div className="status">{session?.user?.email || (bypassAuth ? 'auth desactivee (local)' : '')}</div>
          </>
        ) : (
          <nav className="nav">
            <Link href="/login">Connexion</Link>
          </nav>
        )}
      </header>
      <div className="page-wrap">{children}</div>
    </AppStoreProvider>
  );
}
