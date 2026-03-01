"use client";
import { useState, useContext, useEffect } from "react";
import styles from "./Posted-jobs.module.css";
import { FiSearch, FiPlus, FiEdit2, FiEye, FiChevronLeft, FiChevronRight, FiChevronDown, FiPhone, FiMail } from "react-icons/fi";
import { BiFilterAlt } from "react-icons/bi";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import Link from "next/link";
import ApplicationsAction from "@/components/employer/models/applications/ApplicationsActionbtn";
import { ApplicationsContext } from "@/context/employer/Applications";

async function getApplications() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Cookies.get("access_token")}`,
        },
      }
    );
    if (!response.ok) {
      toast.error("Failed to fetch applications");
      throw new Error("Failed to fetch applications");
    }
    const applicationsData = await response.json();

    const allJobs = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Cookies.get("access_token")}`,
      },
    });
    if (!allJobs.ok) {
      toast.error("Failed to fetch jobs");
      throw new Error("Failed to fetch jobs");
    }
    const jobsData = await allJobs.json();

    async function getCandidateProfile(id) {
      const candidateProfile = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/candidateprofile/`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Cookies.get("access_token")}`,
        },
        method: "POST",
        body: JSON.stringify({
          id: parseInt(id),
        }),
      });
      if (!candidateProfile.ok) {
        toast.error("Failed to fetch candidate profile");
        throw new Error("Failed to fetch candidate profile");
      }
      const candidateProfileData = await candidateProfile.json();
      return candidateProfileData;
    }

    // Use Promise.all to wait for all async operations to complete
    const applications = await Promise.all(
      applicationsData.map(async (application) => {
        const job = jobsData.find(job => job.id === application.job);
        const candidateProfile = await getCandidateProfile(application.candidate);
        return {
          ...application,
          job: job,
          candidate: candidateProfile,
        };
      })
    );

    return applications;
  } catch (error) {
    toast.error("Error fetching applications:", error);
    return [];
  }
}

export default function PostedJobsPage() {
  const {applications, setApplications} = useContext(ApplicationsContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const applicationsPerPage = 5;

  // Filter jobs based on search and filters
  const filteredApplications = applications.filter(application => {
    const matchesSearch = application.candidate.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    application.job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || application.status === statusFilter.toLowerCase();
    const matchesLevel = levelFilter === "All" || application.job.experience_level === levelFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesLevel;
  });

  // Pagination logic
  const indexOfLastApplication = currentPage * applicationsPerPage;
  const indexOfFirstApplication = indexOfLastApplication - applicationsPerPage;
  const currentApplications = filteredApplications.slice(indexOfFirstApplication, indexOfLastApplication);
  const totalPages = Math.ceil(filteredApplications.length / applicationsPerPage);

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleLevelFilter = (level) => {
    setLevelFilter(level);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const applications = await getApplications();
        setApplications(applications);
      } catch (error) {
        setError("Failed to fetch applications. Please try again later.");
        console.error("Error fetching applications:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApplications();
  }, []);

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`container-fluid min-vh-100 bg-transparent${styles.wrapper}`}>
      <div className="row justify-content-center pt-2">
        <div className="p-0">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0 fw-bold">Received Applications</h4>
            <button className={`btn btn-primary d-flex align-items-center gap-2 ${styles["btn-modern"]}`}>
              <FiPlus size={18} /> Post New Job
            </button>
          </div>

          {/* Filters and Search */}
          <div className={`${styles.card} card border-0 shadow-sm mb-4`}>
            <div className="card-body p-3">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FiSearch className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Search by name or position..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="dropdown">
                    <button 
                      className="btn btn-outline-secondary w-100 d-flex justify-content-between align-items-center"
                      type="button" 
                      data-bs-toggle="dropdown"
                    >
                      <span>
                        <BiFilterAlt className="me-2" />
                        {statusFilter === "All" ? "Status" : statusFilter}
                      </span>
                      <FiChevronDown className="text-muted" />
                    </button>
                    <ul className="dropdown-menu w-100">
                      <li><button className="dropdown-item" onClick={() => handleStatusFilter("All")}>All Status</button></li>
                      <li><button className="dropdown-item" onClick={() => handleStatusFilter("Shortlisted")}>Shortlisted</button></li>
                      <li><button className="dropdown-item" onClick={() => handleStatusFilter("Pending")}>Pending</button></li>
                      <li><button className="dropdown-item" onClick={() => handleStatusFilter("Rejected")}>Rejected</button></li>
                      <li><button className="dropdown-item" onClick={() => handleStatusFilter("Applied")}>Applied</button></li>
                    </ul>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="dropdown">
                    <button 
                      className="btn btn-outline-secondary w-100 d-flex justify-content-between align-items-center"
                      type="button" 
                      data-bs-toggle="dropdown"
                    >
                      <span>
                        <BiFilterAlt className="me-2" />
                        {levelFilter === "All" ? "Level" : levelFilter}
                      </span>
                      <FiChevronDown className="text-muted" />
                    </button>
                    <ul className="dropdown-menu w-100">
                      <li><button className="dropdown-item" onClick={() => handleLevelFilter("All")}>All Levels</button></li>
                      <li><button className="dropdown-item" onClick={() => handleLevelFilter("Entry")}>Entry</button></li>
                      <li><button className="dropdown-item" onClick={() => handleLevelFilter("Mid")}>Mid</button></li>
                      <li><button className="dropdown-item" onClick={() => handleLevelFilter("Senior")}>Senior</button></li>
                      <li><button className="dropdown-item" onClick={() => handleLevelFilter("Executive")}>Executive</button></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Jobs Table */}
          <div className={`${styles.card} card border-0 shadow-sm bg-transparent rounded-3`}>
            <div className="table-responsive border-0 bg-transparent">
              <table className={`${styles.table} table table-hover mb-0 bg-transparent table-striped`}>
                <thead className="bg-transparent fw-bold">
                  <tr>
                    <th className="ps-4">ID</th>
                    <th>Candidates</th>
                    <th>Level</th>
                    <th>Positions</th>
                    <th>Applied date</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {currentApplications.length > 0 ? (
                    currentApplications.map((app, index) => (
                      <tr key={app.id}>
                        <td className="ps-4 fw-semibold">#{app.id}</td>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="fw-semibold">{app.candidate.user.name}</span>
                            <small className="text-muted link-offset-2 link-underline link-underline-opacity-0"><FiMail size={16} /> {app.candidate.user.email}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            app.job.experience_level === "entry" ? "bg-info" :
                            app.job.experience_level === "mid" ? "bg-primary" :
                            app.job.experience_level === "senior" ? "bg-success" :
                            app.job.experience_level === "executive" ? "bg-warning" : "bg-danger"
                          }`}>
                            {app.job.experience_level.charAt(0).toUpperCase() + app.job.experience_level.slice(1)}
                          </span>
                        </td>
                        <td>
                          <span>
                            {app.job.title}
                          </span>
                        </td>
                        <td>
                          <span className="fw-semibold">{formatDate(app.applied_at)}</span>
                        </td>
                        <td>
                          <span className={`badge rounded-pill ${
                            app.status === "shortlisted" 
                              ? "bg-success bg-opacity-10 text-success" 
                              : app.status === "pending"
                                ? "bg-warning bg-opacity-10 text-warning"
                                : app.status === "rejected"
                                  ? "bg-danger bg-opacity-10 text-danger"
                                  : app.status === "applied"
                                    ? "bg-info bg-opacity-10 text-info"
                                    : "bg-secondary bg-opacity-10 text-secondary"
                          }`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-flex justify-content-end gap-2">
                            <Link 
                              href={`tel:${app.candidate.user.phone}`}
                              className={`btn btn-sm btn-outline-secondary d-flex align-items-center ${styles["btn-modern"]}`}
                              title="Call"
                            >
                              <FiPhone size={16} />
                            </Link>
                            <ApplicationsAction data={app} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No applications found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredApplications.length > applicationsPerPage && (
              <div className="card-footer bg-transparent border-0 d-flex justify-content-between align-items-center py-3">
                <small className="text-muted">
                  Showing {indexOfFirstApplication + 1}-{Math.min(indexOfLastApplication, filteredApplications.length)} of {filteredApplications.length} applications
                </small>
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      >
                        <FiChevronLeft />
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      >
                        <FiChevronRight />
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}