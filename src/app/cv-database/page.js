import MarketingLandingPage from "../components/MarketingLandingPage";

export const metadata = {
  title: "Search A Curated Candidate Database | HireLink",
  description: "Access a structured CV repository and shortlist candidates using profile quality, skills, and role relevance.",
};

const page = {
  eyebrow: "For Employers",
  title: "Search A Curated Candidate Database",
  description:
    "Access a structured CV repository and shortlist candidates using profile quality, skills, and role relevance.",
  highlights: [
    "Profile quality checks",
    "Role-specific candidate filters",
    "Saved shortlist workflow",
  ],
  primaryCta: { label: "View Candidate Jobs Area", href: "/dashboard/candidate/jobs" },
  secondaryCta: { label: "Sign In", href: "/login" },
};

export default function CvDatabasePage() {
  return <MarketingLandingPage page={page} />;
}
