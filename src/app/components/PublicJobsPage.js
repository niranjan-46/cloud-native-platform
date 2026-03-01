"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getDummyJobs, normalizeJobs } from "@/utils/jobsData";

export default function PublicJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs`, {
          method: "GET",
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error("Failed to fetch public jobs");
        }
        setJobs(normalizeJobs(payload));
      } catch (error) {
        setJobs(getDummyJobs());
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return jobs;
    }

    return jobs.filter((job) =>
      [job.title, job.company_name, job.location, job.description]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [jobs, search]);

  return (
    <section className="py-5" style={{ background: "linear-gradient(120deg, #f6fbff 0%, #eef5fc 100%)", minHeight: "100vh" }}>
      <div className="container" style={{ marginTop: "4rem" }}>
        <div className="bg-white border rounded-4 p-4 shadow-sm mb-4">
          <h1 className="h3 fw-bold mb-2">Public Jobs</h1>
          <p className="text-muted mb-3">Browse open roles. Sign in to apply, save jobs, and track your applications.</p>
          <input
            type="text"
            className="form-control"
            placeholder="Search by title, company, location, keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="alert alert-info">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="alert alert-warning">No jobs found for your search.</div>
        ) : (
          <div className="row g-3">
            {filteredJobs.map((job) => (
              <div className="col-12 col-md-6" key={job.id}>
                <article className="bg-white border rounded-4 p-4 h-100 shadow-sm">
                  <h2 className="h5 fw-bold mb-1">{job.title}</h2>
                  <div className="text-primary fw-semibold mb-1">{job.company_name}</div>
                  <div className="text-muted small mb-2">
                    {job.location} • {job.job_type} • {job.work_mode}
                  </div>
                  <p className="text-secondary mb-3">
                    {job.description.length > 140 ? `${job.description.slice(0, 140)}...` : job.description}
                  </p>
                  <div className="d-flex gap-2">
                    <Link href="/login" className="btn btn-primary btn-sm">
                      Login to Apply
                    </Link>
                    <Link href="/register" className="btn btn-outline-primary btn-sm">
                      Create Account
                    </Link>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

