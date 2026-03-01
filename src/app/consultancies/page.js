import MarketingLandingPage from "../components/MarketingLandingPage";

export const metadata = {
  title: "Work With High-Intent Consultancies | HireLink",
  description: "Collaborate with professional recruitment consultancies to reduce hiring friction and improve candidate quality.",
};

const page = {
  eyebrow: "Partner Network",
  title: "Work With High-Intent Consultancies",
  description:
    "Collaborate with professional recruitment consultancies to reduce hiring friction and improve candidate quality.",
  highlights: [
    "Structured candidate submissions",
    "Transparent collaboration workflows",
    "Role-based hiring dashboard",
  ],
  primaryCta: { label: "Browse Consultancy Dashboard", href: "/dashboard/consultancy" },
  secondaryCta: { label: "Get Started", href: "/register" },
};

export default function ConsultanciesPage() {
  return <MarketingLandingPage page={page} />;
}
