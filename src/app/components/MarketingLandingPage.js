import Link from "next/link";
import styles from "../[slug]/marketingPage.module.css";

export default function MarketingLandingPage({ page }) {
  return (
    <section className={styles.pageShell}>
      <div className={`container ${styles.contentWrap}`}>
        <div className={styles.heroCard}>
          <span className={styles.eyebrow}>{page.eyebrow}</span>
          <h1 className={styles.title}>{page.title}</h1>
          <p className={styles.description}>{page.description}</p>

          <div className={styles.actionRow}>
            <Link href={page.primaryCta.href} className="btn btn-primary btn-lg">
              {page.primaryCta.label}
            </Link>
            <Link href={page.secondaryCta.href} className="btn btn-outline-primary btn-lg">
              {page.secondaryCta.label}
            </Link>
          </div>
        </div>

        <div className={styles.cardGrid}>
          {page.highlights.map((item) => (
            <article key={item} className={styles.infoCard}>
              <h2>{item}</h2>
              <p>
                This section is being actively expanded. You can use the primary action above to access
                the working flow now.
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
