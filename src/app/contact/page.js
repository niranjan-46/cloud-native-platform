import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "Contact Us | HireLink",
  description: "Contact HireLink sales and support teams.",
};

const CONTACT_CHANNELS = [
  {
    title: "Sales",
    description: "Plans, pricing, enterprise onboarding, and partnerships.",
    action: "mailto:niranjanannavarapu@gmail.com",
    actionLabel: "Email Sales",
  },
  {
    title: "Support",
    description: "Technical issues, account assistance, and usage guidance.",
    action: "mailto:niranjanannavarapu@gmail.com",
    actionLabel: "Email Support",
  },
  {
    title: "Legal",
    description: "Privacy, terms, compliance, and policy-related requests.",
    action: "mailto:niranjanannavarapu@gmail.com",
    actionLabel: "Email Legal",
  },
];

export default function ContactPage() {
  return (
    <section className={styles.shell}>
      <div className="container">
        <div className={styles.hero}>
          <span className={styles.badge}>Contact HireLink</span>
          <h1>Talk To Sales Or Support</h1>
          <p>
            Choose the right team below and we will route your request quickly.
          </p>
          <div className={styles.quickLinks}>
            <Link href="/pricing" className="btn btn-outline-primary">
              View Pricing
            </Link>
            <Link href="/help-center" className="btn btn-primary">
              Help Center
            </Link>
          </div>
        </div>

        <div className={styles.grid}>
          {CONTACT_CHANNELS.map((item) => (
            <article key={item.title} className={styles.card}>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <a href={item.action} className="btn btn-outline-primary">
                {item.actionLabel}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
