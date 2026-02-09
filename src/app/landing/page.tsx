'use client';

import styles from './landing.module.css';

function CtaButton({ label }: { label: string }) {
  const checkoutUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL?.trim();

  const handleClick = () => {
    console.log('[landing] cta_click', { ts: Date.now() });
    window.location.href = checkoutUrl || '/checkout';
  };

  return (
    <button type="button" className={styles.cta} onClick={handleClick}>
      {label}
    </button>
  );
}

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={`${styles.block} ${styles.hero}`}>
          <h1 className={styles.title}>Tu ne sais pas si ton CV fonctionne.</h1>
          <p className={styles.subtitle}>
            Suis les performances de chaque version de ton CV et clarifie ton positionnement sur le marché.
          </p>
          <CtaButton label="Commencer mon mois de recherche — 29 €" />
          <p className={styles.micro}>Sans engagement. Tu arrêtes quand tu veux.</p>
        </section>

        <section className={styles.block}>
          <h2 className={styles.sectionTitle}>Le problème</h2>
          <ul className={styles.list}>
            <li>Tu ajustes ton CV sans savoir si c&apos;est mieux ou pire</li>
            <li>Tu envoies des candidatures sans feedback</li>
            <li>Tu ne sais pas quelle version fonctionne</li>
            <li>Tu doutes de ton positionnement réel sur le marché</li>
          </ul>
          <p className={styles.note}>Ce n&apos;est pas un problème de motivation. C&apos;est un problème de visibilité.</p>
        </section>

        <section className={styles.block}>
          <h2 className={styles.sectionTitle}>La solution</h2>
          <ul className={styles.list}>
            <li>Crée plusieurs versions de ton CV</li>
            <li>Lie chaque candidature à une version précise</li>
            <li>Suis réponses, entretiens, silences</li>
            <li>Compare ce qui marche réellement</li>
          </ul>
          <p className={styles.note}>Tu arrêtes d&apos;itérer à l&apos;aveugle.</p>
        </section>

        <section className={styles.block}>
          <h2 className={styles.sectionTitle}>Pour qui</h2>
          <ul className={styles.list}>
            <li>Tu envoies plusieurs candidatures</li>
            <li>Tu veux comprendre ce que le marché te renvoie</li>
            <li>Tu refuses de perdre du temps</li>
            <li>Tu préfères les faits aux intuitions</li>
          </ul>
          <p className={styles.note}>Ce n&apos;est pas pour toi si tu veux juste &ldquo;un joli CV&rdquo;.</p>
        </section>

        <section className={styles.block}>
          <h2 className={styles.sectionTitle}>Offre</h2>
          <p className={styles.note} style={{ marginTop: 0, marginBottom: 10, color: 'var(--text)', fontWeight: 600 }}>
            29 € pour 30 jours
          </p>
          <ul className={styles.list}>
            <li>CV illimités</li>
            <li>Suivi des performances par version</li>
            <li>Historique des candidatures</li>
            <li>Feedback orienté positionnement</li>
          </ul>
          <p className={styles.note}>Utilise-le pendant ta recherche. Stop quand tu veux.</p>
          <div style={{ marginTop: 12 }}>
            <CtaButton label="Commencer mon mois de recherche" />
          </div>
        </section>

        <footer className={styles.footer}>
          Paiement sécurisé • Pas d&apos;engagement long terme • Tu gardes tes données
        </footer>
      </div>
    </main>
  );
}
