const SAMPLE_JOBS = [
  {
    id: "sample-1",
    title: "Frontend Developer",
    company_name: "Dodo Payments",
    description: "Build performant React interfaces for checkout and merchant dashboards.",
    location: "Bengaluru",
    job_type: "full-time",
    experience_level: "mid",
    work_mode: "hybrid",
    created_at: "2026-02-25T09:00:00Z",
    company_logo: "",
  },
  {
    id: "sample-2",
    title: "Backend Engineer (Django)",
    company_name: "HireLink Labs",
    description: "Design secure APIs, optimize PostgreSQL queries, and ship production-grade backend services.",
    location: "Hyderabad",
    job_type: "full-time",
    experience_level: "senior",
    work_mode: "remote",
    created_at: "2026-02-24T12:30:00Z",
    company_logo: "",
  },
  {
    id: "sample-3",
    title: "DevOps Engineer",
    company_name: "Cloud Native Ops",
    description: "Own CI/CD, observability, and Kubernetes deployment automation.",
    location: "Pune",
    job_type: "contract",
    experience_level: "mid",
    work_mode: "remote",
    created_at: "2026-02-22T08:20:00Z",
    company_logo: "",
  },
  {
    id: "sample-4",
    title: "Product Designer",
    company_name: "Pixel Stack",
    description: "Create UX flows and high-fidelity UI for web platforms and internal tools.",
    location: "Chennai",
    job_type: "full-time",
    experience_level: "entry",
    work_mode: "onsite",
    created_at: "2026-02-20T14:45:00Z",
    company_logo: "",
  },
  {
    id: "sample-5",
    title: "Data Analyst",
    company_name: "InsightWorks",
    description: "Analyze hiring funnel and business performance metrics, create dashboards.",
    location: "Mumbai",
    job_type: "part-time",
    experience_level: "entry",
    work_mode: "hybrid",
    created_at: "2026-02-18T10:00:00Z",
    company_logo: "",
  },
];

function normalizeJob(job, idx = 0) {
  return {
    id: job?.id ?? `job-${idx + 1}`,
    title: job?.title || "Untitled Role",
    company_name: job?.company_name || "Confidential Company",
    description: job?.description || "No description available for this role.",
    location: job?.location || "Location not specified",
    job_type: (job?.job_type || "full-time").toLowerCase(),
    experience_level: (job?.experience_level || "entry").toLowerCase(),
    work_mode: (job?.work_mode || "remote").toLowerCase(),
    created_at: job?.created_at || new Date().toISOString(),
    company_logo: job?.company_logo || "",
    isSaved: Boolean(job?.isSaved),
    isApplied: Boolean(job?.isApplied),
  };
}

export function normalizeJobs(jobs) {
  if (!Array.isArray(jobs)) {
    return [];
  }
  return jobs.map((job, idx) => normalizeJob(job, idx));
}

export function getDummyJobs() {
  return SAMPLE_JOBS.map((job, idx) => normalizeJob(job, idx));
}

