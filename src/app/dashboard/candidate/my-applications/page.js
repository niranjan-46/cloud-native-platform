// Enhanced version of MyApplications component
"use client";

import React, { useState, useEffect } from 'react';
import { FaSearch, FaMapMarkerAlt, FaClock, FaBriefcase, FaCheckCircle, FaFilter, FaEye, FaChevronLeft, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import styles from './My-applications.module.css';
import Image from 'next/image';
import { Table } from 'react-bootstrap';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { useRouter } from 'next/navigation';
import Viewappliedjob from '@/components/candidate/Viewappliedjob';

const MyApplications = () => {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const applicationsPerPage = 5;

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${Cookies.get("access_token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch applications");

      const jobsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${Cookies.get("access_token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!jobsRes.ok) throw new Error("Failed to fetch jobs");

      const jobsData = await jobsRes.json();
      const data = await response.json();

      const applications = data.map((app) => {
        const job = jobsData.find((job) => job.id === app.job);
        return { application: app, job };
      });
      setApplications(applications);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const applyFilters = (app) => {
    const statusMatch = !statusFilter || app.application.status.toLowerCase() === statusFilter;

    const dateMatch = (() => {
      if (!dateFilter) return true;
      const appliedDate = new Date(app.application.applied_at);
      const now = new Date();
      const diffTime = now - appliedDate;
      const days = diffTime / (1000 * 60 * 60 * 24);
      if (dateFilter === '24h') return days <= 1;
      if (dateFilter === '7d') return days <= 7;
      if (dateFilter === '15d') return days <= 15;
      if (dateFilter === '30d') return days <= 30;
      return true;
    })();

    const searchMatch = app?.job?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && dateMatch && searchMatch;
  };

  // Pagination logic
  const filteredApplications = applications.filter(app => applyFilters(app));
  const indexOfLastApplication = currentPage * applicationsPerPage;
  const indexOfFirstApplication = indexOfLastApplication - applicationsPerPage;
  const currentApplications = filteredApplications.slice(indexOfFirstApplication, indexOfLastApplication);
  const totalPages = Math.ceil(filteredApplications.length / applicationsPerPage);

  if (loading) {
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
      <div className="container py-5 text-center">
        <h2 className="text-danger mb-3">Error</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/login')} className="btn btn-danger mt-3">Go to Login</button>
      </div>
    );
  }

  return (
    <div className={`container-fluid min-vh-100 bg-transparent ${styles.wrapper}`}>
      <div className="row justify-content-center pt-2">
        <div className="p-0">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0 fw-bold">My Applications</h4>
          </div>

          {/* Filters and Search */}
          <div className={`${styles.card} card border-0 shadow-sm mb-4`}>
            <div className="card-body p-3">
              <div className="row g-3">
                <div className="col-md-8">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FaSearch className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Search by job title or company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="dropdown">
                    <button 
                      className="btn btn-outline-secondary w-100 d-flex justify-content-between align-items-center"
                      type="button" 
                      data-bs-toggle="dropdown"
                    >
                      <span>
                        <FaFilter className="me-2" />
                        {statusFilter || "Status"}
                      </span>
                      <FaChevronDown className="text-muted" />
                    </button>
                    <ul className="dropdown-menu w-100">
                      <li><button className="dropdown-item" onClick={() => setStatusFilter("")}>All Status</button></li>
                      <li><button className="dropdown-item" onClick={() => setStatusFilter("pending")}>Pending</button></li>
                      <li><button className="dropdown-item" onClick={() => setStatusFilter("rejected")}>Rejected</button></li>
                      <li><button className="dropdown-item" onClick={() => setStatusFilter("scheduled")}>Scheduled</button></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Applications Table */}
          <div className={`${styles.card} card border-0 shadow-sm bg-transparent rounded-3`}>
            <div className="table-responsive border-0 bg-transparent">
              <table className={`${styles.table} table table-hover mb-0 bg-transparent table-striped`}>
                <thead className="bg-transparent fw-bold">
                  <tr>
                    <th className="ps-4">S.No</th>
                    <th>Company</th>
                    <th>Position</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentApplications.length > 0 ? (
                    currentApplications.map((app, index) => (
                      <tr key={index}>
                        <td className="ps-4 fw-semibold">{indexOfFirstApplication + index + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className={styles.companyLogo}>
                              <Image
                                src={app?.job?.company_logo || '/Dashboards/default_company.svg'}
                                alt={`${app?.job?.company_name} logo`}
                                width={40}
                                height={40}
                                className="rounded-circle"
                              />
                            </div>
                            <div className="ms-3">
                              <div className="fw-semibold">{app?.job?.company_name}</div>
                              <small className="text-muted d-flex align-items-center gap-2">
                                <FaMapMarkerAlt /> {app?.job?.location}
                                <FaBriefcase /> {app?.job?.job_type}
                                <FaClock /> {app?.job?.work_mode}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-semibold">{app?.job?.title}</span>
                        </td>
                        <td>
                          <span className="text-muted">{formatDate(app?.application?.applied_at)}</span>
                        </td>
                        <td>
                          <span className={`badge rounded-pill ${
                            app?.application?.status?.toLowerCase() === "rejected" 
                              ? "bg-danger bg-opacity-10 text-danger" 
                              : app?.application?.status?.toLowerCase() === "pending"
                                ? "bg-warning bg-opacity-10 text-warning"
                                : "bg-success bg-opacity-10 text-success"
                          }`}>
                            {app?.application?.status}
                          </span>
                        </td>
                        <td>
                          <div className="float-end">
                            <Viewappliedjob data={app} />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        {searchQuery || statusFilter ? 
                          "No applications found matching your criteria" : 
                          "No applications yet"}
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
                        <FaChevronLeft />
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
                        <FaChevronRight />
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
};

export default MyApplications;