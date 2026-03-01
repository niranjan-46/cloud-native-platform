"use client";
import React, { useState, useEffect, useContext } from "react";
import styles from "./Posted-jobs.module.css";
import { FiSearch, FiPlus, FiEdit2, FiEye, FiChevronLeft, FiChevronRight, FiChevronDown } from "react-icons/fi";
import { BiFilterAlt } from "react-icons/bi";
import Cookies from "js-cookie";
import { ClipLoader } from "react-spinners";
import Link from "next/link";
import PostedjobActionbtn from "@/components/employer/models/PostedjobActionbtn";
import { toast } from 'react-toastify';
import { PostedJobsContext } from "@/context/employer/Postedjobs";


async function getJobs() {
  try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/`,
        {
          headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      }
    );

  if (!response.ok) {
    throw new Error('Failed to fetch jobs');
  }

  const data = await response.json();
  return data;
}catch (error) {
  console.error('Error fetching jobs:', error);
}
}

export default function PostedJobsPage() {
  const { jobs, setJobs } = useContext(PostedJobsContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  

  useEffect(() => {
      const fetchJobs = async () => {
        try {
          setIsLoading(true);
          const jobs = await getJobs();
          setJobs(jobs);
        } catch (error) {
          console.error('Error fetching jobs:', error);
          setError(error.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchJobs();
  }, []);

  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase());
    // Status filter: 'All', 'Active', 'Inactive' mapped to is_published
    let matchesStatus = true;
    if (statusFilter === "Active") matchesStatus = job.is_published === true;
    else if (statusFilter === "Inactive") matchesStatus = job.is_published === false;
    // Level filter: 'All', 'Junior', 'Mid', 'Senior', etc. mapped to experience_level
    let matchesLevel = true;
    if (levelFilter !== "All") matchesLevel = (job.experience_level?.toLowerCase() === levelFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesLevel;
  });

  // Pagination logic
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleLevelFilter = (level) => {
    setLevelFilter(level);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <ClipLoader color="#0d6efd" size={50} />
          <p className="mt-3 text-black">Fetching content, please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <h2 className="text-red-600 text-xl font-semibold mb-2">Error Loading Profile</h2>
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`container-fluid min-vh-100 bg-transparent ${styles.wrapper}`}>
      <div className="row justify-content-center pt-2">
        <div className="p-0">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0 fw-bold">Posted Jobs</h4>
            <Link href="/dashboard/employer/post-job" className={`btn btn-primary d-flex align-items-center gap-2 ${styles["btn-modern"]}`}>
              <FiPlus size={18} /> Post New Job
            </Link>
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
                      placeholder="Search jobs..."
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
                      <li><button className="dropdown-item" onClick={() => handleStatusFilter("Active")}>Active</button></li>
                      <li><button className="dropdown-item" onClick={() => handleStatusFilter("Inactive")}>Inactive</button></li>
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
                      <li><button className="dropdown-item" onClick={() => handleLevelFilter("Intern")}>Intern</button></li>
                      <li><button className="dropdown-item" onClick={() => handleLevelFilter("Junior")}>Junior</button></li>
                      <li><button className="dropdown-item" onClick={() => handleLevelFilter("Mid")}>Mid</button></li>
                      <li><button className="dropdown-item" onClick={() => handleLevelFilter("Senior")}>Senior</button></li>
                      <li><button className="dropdown-item" onClick={() => handleLevelFilter("Lead")}>Lead</button></li>
                      <li><button className="dropdown-item" onClick={() => handleLevelFilter("Manager")}>Manager</button></li>
                      <li><button className="dropdown-item" onClick={() => handleLevelFilter("Director")}>Director</button></li>
                      <li><button className="dropdown-item" onClick={() => handleLevelFilter("Executive")}>Executive</button></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Jobs Table */}
          <div className={`${styles.card} card border-0 shadow-sm bg-transparent border-0`}>
            <div className="table-responsive border-0 bg-transparent">
              <table className={`${styles.table} table table-hover mb-0 bg-transparent table-striped`}>
                <thead className="bg-transparent fw-bold">
                  <tr>
                    <th className="ps-4">S.No</th>
                    <th>Job Title</th>
                    <th>Level</th>
                    <th>Location</th>
                    <th>Posted Date</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentJobs.length > 0 ? (
                    currentJobs.map((job, index) => (
                      (job?.posted_by?.email === Cookies.get('email') && (
                        <tr key={job.id}>
                          <td className="ps-4 fw-semibold">{index }</td>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="fw-semibold">{job.title}</span>
                            <small className="text-muted">#{job.id}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            job.experience_level === "entry" ? "bg-info" :
                            job.experience_level === "mid" ? "bg-primary" :
                            job.experience_level === "senior" ? "bg-warning" :
                            job.experience_level === "director" ? "bg-danger" :
                            job.experience_level === "executive" ? "bg-success" :
                            job.experience_level === "lead" ? "bg-warning" :
                            job.experience_level === "manager" ? "bg-primary" :
                            job.experience_level === "intern" ? "bg-info" : "bg-secondary"
                          }`}>
                            {job.experience_level}
                          </span>
                        </td>
                        <td>
                          <span className="fw-semibold">{job.location}</span>
                        </td>
                        <td>{formatDate(job.created_at)}</td>
                        <td>
                          <span className={`badge rounded-pill ${
                            job.is_published === true 
                              ? "bg-success bg-opacity-10 text-success" 
                              : "bg-danger bg-opacity-10 text-danger"
                          }`}>
                            {job.is_published ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-flex justify-content-end gap-2">
                            <PostedjobActionbtn data={job} />
                          </div>
                        </td>
                      </tr>
                      ))
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No jobs found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredJobs.length > jobsPerPage && (
              <div className="card-footer bg-transparent border-0 d-flex justify-content-between align-items-center py-3">
                <small className="text-muted">
                  Showing {indexOfFirstJob + 1}-{Math.min(indexOfLastJob, filteredJobs.length)} of {filteredJobs.length} jobs
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