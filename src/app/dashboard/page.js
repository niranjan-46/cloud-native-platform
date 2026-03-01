import Link from "next/link";
import styles from "./dashboardLanding.module.css";

const DASHBOARD_OPTIONS = [
  {
    title: "Candidate Dashboard",
    description: "Track applications, saved jobs, and profile progress in one place.",
    href: "/dashboard/candidate",
  },
  {
    title: "Employer Dashboard",
    description: "Post jobs, review candidates, and manage hiring operations efficiently.",
    href: "/dashboard/employer",
  },
  {
    title: "Consultancy Dashboard",
    description: "Browse open roles and submit high-quality candidate profiles.",
    href: "/dashboard/consultancy",
  },
];

export const metadata = {
  title: "Dashboard Access | HireLink",
  description: "Select your dashboard workspace.",
};

export default function DashboardLandingPage() {
  return (
    <section className={styles.shell}>
      <div className="container">
        <div className={styles.panel}>
          <h1 className={styles.title}>Choose Your Workspace</h1>
          <p className={styles.subtitle}>
            Select the dashboard that matches your role. If you are not signed in, continue to login first.
          </p>
          <div className={styles.actions}>
            <Link href="/login" className="btn btn-primary btn-lg">
              Login
            </Link>
            <Link href="/register" className="btn btn-outline-primary btn-lg">
              Register
            </Link>
          </div>
        </div>

        <div className={styles.grid}>
          {DASHBOARD_OPTIONS.map((item) => (
            <article key={item.title} className={styles.card}>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <Link href={item.href} className="btn btn-outline-primary">
                Open
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
