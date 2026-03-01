import MarketingLandingPage from "../components/MarketingLandingPage";

export const metadata = {
  title: "About HireLink | Built For Seamless Hiring",
  description: "HireLink connects employers, consultancies, and candidates through one workflow focused on speed, visibility, and trust.",
};

const page = {
  eyebrow: "About HireLink",
  title: "Built For Seamless Hiring Between Teams",
  description:
    "HireLink connects employers, consultancies, and candidates through one workflow focused on speed, visibility, and trust.",
  highlights: [
    "Single platform for multi-party hiring",
    "Secure document and profile management",
    "Operational dashboards for each user role",
  ],
  primaryCta: { label: "Explore Platform", href: "/" },
  secondaryCta: { label: "Contact Team", href: "/contact" },
};

export default function AboutPage() {
  return <MarketingLandingPage page={page} />;
}
