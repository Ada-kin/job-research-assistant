import Link from 'next/link';

export default function CheckoutPage() {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 16px' }}>
      <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1>Checkout bientôt disponible</h1>
        <p className="status">La page de paiement est en cours de configuration.</p>
        <p>
          Pour être informé rapidement, écris-nous à{' '}
          <a href="mailto:contact@cv-builder.local" style={{ textDecoration: 'underline' }}>
            contact@cv-builder.local
          </a>
          .
        </p>
        <Link className="button-like" href="/landing">
          Retour a la landing
        </Link>
      </section>
    </main>
  );
}
