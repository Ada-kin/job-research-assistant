import Link from 'next/link';
import { AppStoreProvider } from '@/lib/app-store';
import { auth, signOut } from '@/auth';
import { isAuthDisabledForLocal } from '@/lib/auth-mode';
import { isNewUiEnabledServer } from '@/lib/feature-flags';
import { NewAppLayoutShell } from '@/components/new-ui/app-layout-shell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const bypassAuth = isAuthDisabledForLocal();
  const session = bypassAuth ? null : await auth();
  const isLoggedIn = bypassAuth || Boolean(session?.user);
  const useNewUi = isNewUiEnabledServer();

  return (
    <AppStoreProvider>
      {useNewUi ? (
        <NewAppLayoutShell
          userEmail={session?.user?.email || (bypassAuth ? 'auth desactivee (local)' : '')}
          headerActions={
            isLoggedIn && !bypassAuth ? (
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/login' });
                }}
              >
                <button type="submit" className="text-xs underline">Se deconnecter</button>
              </form>
            ) : null
          }
        >
          {children}
        </NewAppLayoutShell>
      ) : (
        <div className="legacy-ui">
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
        </div>
      )}
    </AppStoreProvider>
  );
}
