'use client';

import styles from './landing.module.css';

const PRODUCT_NAME = 'Ladder';

const PRICING = {
  solo: { price: '79 EUR', cadence: '4 semaines', cta: 'Acheter maintenant - Solo' },
  pro: { price: '199 EUR', cadence: '4 semaines', cta: 'Acheter maintenant - Pro' }
};

type TrackPayload = Record<string, string | number | boolean | null | undefined>;

function track(eventName: string, payload: TrackPayload) {
  console.log('[track]', eventName, { ...payload, ts: Date.now() });
}

function onBuy(plan: 'solo' | 'pro', placement: string) {
  const checkoutUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL?.trim();
  track('cta_buy_click', { plan, placement });
  window.location.href = checkoutUrl || '/checkout';
}

function onDemo(placement: string) {
  track('cta_demo_click', { placement });
  document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function Metrics() {
  return (
    <div className={styles.metrics} aria-label="Apercu dashboard">
      <article>
        <p>Signal</p>
        <strong>72</strong>
      </article>
      <article>
        <p>Role</p>
        <strong>Senior IC</strong>
      </article>
      <article>
        <p>Semaine</p>
        <strong>3 / 4</strong>
      </article>
      <article>
        <p>Decision</p>
        <strong>En cours</strong>
      </article>
    </div>
  );
}

function Section({ id, label, title, children }: { id?: string; label: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className={styles.section}>
      <p className={styles.label}>{label}</p>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <div className={styles.bg} />

      <div className={styles.container}>
        <section className={styles.hero}>
          <p className={styles.pill}>{PRODUCT_NAME}</p>
          <h1>1 mois pour te positionner senior ou lead.</h1>
          <p className={styles.sub}>Moins d&apos;hesitation. Plus de signal.</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => onBuy('solo', 'hero')}>
              Acheter maintenant
            </button>
            <button type="button" className={styles.secondary} onClick={() => onDemo('hero')}>
              Voir demo
            </button>
          </div>
          <Metrics />
        </section>

        <Section label="Probleme" title="Tu avances sans feedback clair.">
          <div className={styles.grid3}>
            <article>CV non aligne.</article>
            <article>Pas de feedback.</article>
            <article>Strategie floue.</article>
          </div>
        </Section>

        <Section id="demo" label="Solution" title={`Ce que ${PRODUCT_NAME} active`}>
          <div className={styles.grid5}>
            <article>Positioning Map</article>
            <article>CV Versioning</article>
            <article>Job-CV match</article>
            <article>Plan 4 semaines</article>
            <article>Insights signal</article>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => onBuy('solo', 'solution')}>
              Acheter maintenant
            </button>
            <button type="button" className={styles.secondary} onClick={() => onDemo('solution')}>
              Voir demo
            </button>
          </div>
        </Section>

        <Section label="4 semaines" title="Execution simple, cadencee.">
          <div className={styles.grid4}>
            <article>S1 Positionnement</article>
            <article>S2 CV v1/v2</article>
            <article>S3 Feedback loop</article>
            <article>S4 Decision scope</article>
          </div>
        </Section>

        <Section label="Pourquoi" title="Feedback loop. Signal. Iteration.">
          <div className={styles.grid3}>
            <article>Decisions basees sur donnees.</article>
            <article>Moins de bruit.</article>
            <article>Progression hebdo.</article>
          </div>
        </Section>

        <Section label="Pricing" title="2 offres, paiement unique.">
          <div className={styles.pricing}>
            <article>
              <h3>Solo</h3>
              <p className={styles.price}>{PRICING.solo.price}</p>
              <p className={styles.meta}>{PRICING.solo.cadence}</p>
              <button type="button" className={styles.primary} onClick={() => onBuy('solo', 'pricing')}>
                {PRICING.solo.cta}
              </button>
            </article>
            <article className={styles.pro}>
              <h3>Pro</h3>
              <p className={styles.price}>{PRICING.pro.price}</p>
              <p className={styles.meta}>{PRICING.pro.cadence} + review manuelle</p>
              <button type="button" className={styles.primary} onClick={() => onBuy('pro', 'pricing')}>
                {PRICING.pro.cta}
              </button>
            </article>
          </div>
          <p className={styles.faqInline}>Annulation: pas de renouvellement auto. Remboursement: 7 jours si non commence.</p>
        </Section>

        <Section label="FAQ" title="Court et direct.">
          <div className={styles.grid4}>
            <article>Coach ? Non, systeme + option review.</article>
            <article>Temps ? 3-5h / semaine.</article>
            <article>Niveau ? Dev 2-5 ans XP.</article>
            <article>Pas en recherche ? Tu preps le prochain move.</article>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => onBuy('solo', 'faq')}>
              Acheter maintenant
            </button>
            <button type="button" className={styles.secondary} onClick={() => onDemo('faq')}>
              Voir demo
            </button>
          </div>
        </Section>

        <footer className={styles.footer}>
          <span>{PRODUCT_NAME}</span>
          <span>support@ladder.app</span>
        </footer>
      </div>
    </main>
  );
}
