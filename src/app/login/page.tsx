import { redirect } from 'next/navigation';
import { auth, signIn } from '@/auth';
import { isAuthDisabledForLocal } from '@/lib/auth-mode';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (isAuthDisabledForLocal()) {
    redirect('/');
  }

  const session = await auth();
  if (session?.user) {
    redirect('/');
  }

  return (
    <main className="legacy-ui dashboard">
      <section className="panel">
        <h1>Connexion</h1>
        <p className="status">Connecte-toi avec Google pour acceder a ton espace.</p>
        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/' });
          }}
        >
          <button className="primary" type="submit">Continuer avec Google</button>
        </form>
      </section>
    </main>
  );
}
