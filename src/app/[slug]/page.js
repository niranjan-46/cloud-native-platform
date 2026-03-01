import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./marketingPage.module.css";

const PAGE_CONTENT = {
  jobs: {
    eyebrow: "Talent Marketplace",
    title: "Discover Verified Job Opportunities",
    description:
      "Search high-quality openings from trusted employers and apply with a profile designed for faster screening.",
    highlights: ["Smart filters for role, location, and experience", "Verified employer listings", "Faster profile-first applications"],
    primaryCta: { label: "Go To Candidate Jobs", href: "/dashboard/candidate/find-jobs" },
    secondaryCta: { label: "Create Account", href: "/register" },
  },
  consultancies: {
    eyebrow: "Partner Network",
    title: "Work With High-Intent Consultancies",
    description:
      "Collaborate with professional recruitment consultancies to reduce hiring friction and improve candidate quality.",
    highlights: ["Structured candidate submissions", "Transparent collaboration workflows", "Role-based hiring dashboard"],
    primaryCta: { label: "Browse Consultancy Dashboard", href: "/dashboard/consultancy" },
    secondaryCta: { label: "Get Started", href: "/register" },
  },
  about: {
    eyebrow: "About HireLink",
    title: "Built For Seamless Hiring Between Teams",
    description:
      "HireLink connects employers, consultancies, and candidates through one workflow focused on speed, visibility, and trust.",
    highlights: ["Single platform for multi-party hiring", "Secure document and profile management", "Operational dashboards for each user role"],
    primaryCta: { label: "Explore Platform", href: "/" },
    secondaryCta: { label: "Contact Team", href: "/contact" },
  },
  "post-job": {
    eyebrow: "For Employers",
    title: "Post Roles And Receive Better-Matched Talent",
    description:
      "Create job postings, define role requirements, and manage consultancy responses from one employer workspace.",
    highlights: ["Job posting templates", "Bid and candidate review flow", "Centralized status tracking"],
    primaryCta: { label: "Open Employer Post Job", href: "/dashboard/employer/post-job" },
    secondaryCta: { label: "Employer Dashboard", href: "/dashboard/employer" },
  },
  "cv-database": {
    eyebrow: "For Employers",
    title: "Search A Curated Candidate Database",
    description:
      "Access a structured CV repository and shortlist candidates using profile quality, skills, and role relevance.",
    highlights: ["Profile quality checks", "Role-specific candidate filters", "Saved shortlist workflow"],
    primaryCta: { label: "View Candidate Jobs Area", href: "/dashboard/candidate/jobs" },
    secondaryCta: { label: "Sign In", href: "/login" },
  },
  pricing: {
    eyebrow: "Plans",
    title: "Simple Pricing For Growing Hiring Teams",
    description:
      "Choose the right plan based on hiring volume, team size, and support needs without hidden complexity.",
    highlights: ["Transparent plan tiers", "Business-ready usage controls", "Upgrade path for scaling teams"],
    primaryCta: { label: "View Employer Plans", href: "/dashboard/employer/plan-usage" },
    secondaryCta: { label: "Contact Sales", href: "/contact-sales" },
  },
  "browse-jobs": {
    eyebrow: "For Consultancies",
    title: "Browse Open Roles And Submit Candidates Faster",
    description:
      "Review active employer postings and respond with suitable candidates through a streamlined submission process.",
    highlights: ["Active role pipeline", "Submission tracking", "Feedback-ready workflow"],
    primaryCta: { label: "Open Consultancy Job Listing", href: "/dashboard/consultancy/job-listing" },
    secondaryCta: { label: "Consultancy Dashboard", href: "/dashboard/consultancy" },
  },
  "submit-cv": {
    eyebrow: "For Consultancies",
    title: "Submit Candidate Profiles With Confidence",
    description:
      "Send structured candidate submissions and monitor decisions in real time from your consultancy workspace.",
    highlights: ["Structured CV submissions", "Application status visibility", "Faster employer feedback loop"],
    primaryCta: { label: "Submit Candidate Flow", href: "/dashboard/consultancy/your-bids" },
    secondaryCta: { label: "Sign In", href: "/login" },
  },
  blog: {
    eyebrow: "Resources",
    title: "Hiring Insights, Product Updates, And Guides",
    description:
      "Read practical content on talent operations, recruitment quality, and platform best practices.",
    highlights: ["Hiring playbooks", "Recruitment operations tips", "Product and feature updates"],
    primaryCta: { label: "Explore Help Center", href: "/help-center" },
    secondaryCta: { label: "Go Home", href: "/" },
  },
  "help-center": {
    eyebrow: "Support",
    title: "Find Answers And Resolve Issues Quickly",
    description:
      "Get guidance on account setup, hiring workflows, and troubleshooting through curated support resources.",
    highlights: ["Frequently asked questions", "Issue resolution guidance", "Direct support contact channels"],
    primaryCta: { label: "Contact Support", href: "/contact" },
    secondaryCta: { label: "Back To Home", href: "/" },
  },
  contact: {
    eyebrow: "Support",
    title: "Contact The HireLink Team",
    description:
      "Reach out for product help, plan details, onboarding support, or partnership discussions.",
    highlights: ["Sales and plan support", "Technical and account assistance", "Partnership conversations"],
    primaryCta: { label: "Email Support", href: "mailto:niranjanannavarapu@gmail.com" },
    secondaryCta: { label: "Help Center", href: "/help-center" },
  },
  privacy: {
    eyebrow: "Legal",
    title: "Privacy Policy",
    description:
      "We protect user data with strict access controls, secure processing, and transparent handling practices.",
    highlights: ["Data minimization and access controls", "Secure storage and transmission standards", "Clear retention and deletion practices"],
    primaryCta: { label: "Terms Of Service", href: "/terms-of-service" },
    secondaryCta: { label: "Cookie Policy", href: "/cookie-policy" },
  },
  terms: {
    eyebrow: "Legal",
    title: "Terms Of Service",
    description:
      "These terms define platform usage, user responsibilities, and service boundaries for a safe ecosystem.",
    highlights: ["Clear account responsibilities", "Acceptable use guidelines", "Dispute and service terms"],
    primaryCta: { label: "Privacy Policy", href: "/privacy-policy" },
    secondaryCta: { label: "Cookie Policy", href: "/cookie-policy" },
  },
  cookies: {
    eyebrow: "Legal",
    title: "Cookie Policy",
    description:
      "Our cookie policy explains how we use cookies for platform performance, security, and user experience.",
    highlights: ["Essential cookies for session and security", "Performance analytics usage", "Cookie preference transparency"],
    primaryCta: { label: "Privacy Policy", href: "/privacy-policy" },
    secondaryCta: { label: "Terms Of Service", href: "/terms-of-service" },
  },
};

const PAGE_ALIASES = {
  help: "help-center",
  "privacy-policy": "privacy",
  "terms-of-service": "terms",
  "cookie-policy": "cookies",
};

function resolvePage(slug) {
  const normalizedSlug = (slug || "").toLowerCase();
  const pageKey = PAGE_ALIASES[normalizedSlug] || normalizedSlug;
  const page = PAGE_CONTENT[pageKey];

  if (!page) {
    return null;
  }

  return { pageKey, page };
}

export function generateStaticParams() {
  const pageSlugs = Object.keys(PAGE_CONTENT);
  const aliasSlugs = Object.keys(PAGE_ALIASES);
  return [...pageSlugs, ...aliasSlugs].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const resolved = resolvePage(slug);

  if (!resolved) {
    return {};
  }

  return {
    title: `${resolved.page.title} | HireLink`,
    description: resolved.page.description,
  };
}

export default async function MarketingPage({ params }) {
  const { slug } = await params;
  const resolved = resolvePage(slug);

  if (!resolved) {
    notFound();
  }

  const { page } = resolved;

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
