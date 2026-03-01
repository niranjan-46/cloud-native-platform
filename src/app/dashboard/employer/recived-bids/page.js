"use client";
import React, { useState, useEffect, useContext } from "react";
import styles from "./Bids.module.css";
import { FiSearch, FiPlus, FiEdit2, FiEye, FiChevronLeft, FiChevronRight, FiChevronDown, FiPhone, FiUsers } from "react-icons/fi";
import { BiFilterAlt } from "react-icons/bi";
import Cookies from "js-cookie";
import Image from "next/image";
import ReceivedBidsActionbtn from "@/components/employer/models/received-bids/ReceivedBidsActionbtn";
import { ReceivedBidsContext } from "@/context/employer/Receivedbids";
import ReviewCandidates from "@/components/employer/models/received-bids/reviewcandidates/Reviewcandidates";

export default function PostedJobsPage() {
  const { bids, setBids } = useContext(ReceivedBidsContext);
  const [jobs, setJobs] = useState({}); // Store job details by job ID
  const [consultancies, setConsultancies] = useState({}); // Store consultancy details by consultancy ID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const bidsPerPage = 5;

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bids/`,
          {
            headers: {
              'Authorization': `Bearer ${Cookies.get('access_token')}`
            }
          }
        );
        if (!response.ok) {
          throw new Error('Failed to fetch bids');
        }
        const data = await response.json();
        setBids(data);
        
        // Fetch job details for each unique job ID
        const jobIds = [...new Set(data.map(bid => bid.job))];
        const consultancyIds = [...new Set(data.map(bid => bid.consultancy))];
        const jobDetails = {};
        const consultancyDetails = {};
        
        // Fetch job details
        for (const jobId of jobIds) {
          const jobResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobId}/`,
            {
              headers: {
                'Authorization': `Bearer ${Cookies.get('access_token')}`
              }
            }
          );
          if (jobResponse.ok) {
            const jobData = await jobResponse.json();
            jobDetails[jobId] = jobData;
          }
        }

        // Fetch consultancy details
        for (const consultancyId of consultancyIds) {
          const consultancyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consultancy-profile/${consultancyId}/`,
            {
              headers: {
                'Authorization': `Bearer ${Cookies.get('access_token')}`
              }
            }
          );
          if (consultancyResponse.ok) {
            const consultancyData = await consultancyResponse.json();
            consultancyDetails[consultancyId] = consultancyData;
          }
        }
        
        setJobs(jobDetails);
        setConsultancies(consultancyDetails);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchBids();
  }, []);

  // Filter bids based on search and filters
  const filteredBids = bids.filter(bid => {
    const job = jobs[bid.job] || {};
    const consultancy = consultancies[bid.consultancy] || {};
    const matchesSearch = 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      job.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultancy.consultancy_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || bid.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const indexOfLastBid = currentPage * bidsPerPage;
  const indexOfFirstBid = indexOfLastBid - bidsPerPage;
  const currentBids = filteredBids.slice(indexOfFirstBid, indexOfLastBid);
  const totalPages = Math.ceil(filteredBids.length / bidsPerPage);

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={`container-fluid min-vh-100 bg-transparent ${styles.wrapper}`}>
        <div className="row justify-content-center pt-2">
          <div className="p-0">
            <div className="d-flex justify-content-center align-items-center min-vh-100">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`container-fluid min-vh-100 bg-transparent ${styles.wrapper}`}>
        <div className="row justify-content-center pt-2">
          <div className="p-0">
            <div className="alert alert-danger">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`container-fluid min-vh-100 bg-transparent ${styles.wrapper}`}>
      <div className="row justify-content-center pt-2">
        <div className="p-0">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0 fw-bold">Received Bids</h4>
            <button className={`btn btn-primary d-flex align-items-center gap-2 ${styles["btn-modern"]}`}>
              <FiPlus size={18} /> Post New Bid
            </button>
          </div>

          {/* Filters and Search */}
          <div className={`${styles.card} card border-0 shadow-sm mb-4`}>
            <div className="card-body p-3">
              <div className="row g-3">
                <div className="col-md-8">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <FiSearch className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Search by job title, company or consultancy..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
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
                        <BiFilterAlt className="me-2" />
                        {statusFilter === "All" ? "Status" : statusFilter}
                      </span>
                      <FiChevronDown className="text-muted" />
                    </button>
                    <ul className="dropdown-menu w-100">
                      <li><button className="dropdown-item" onClick={() => handleStatusFilter("All")}>All Status</button></li>
                      <li><button className="dropdown-item" onClick={() => handleStatusFilter("shortlisted")}>Shortlisted</button></li>
                      <li><button className="dropdown-item" onClick={() => handleStatusFilter("pending")}>Pending</button></li>
                      <li><button className="dropdown-item" onClick={() => handleStatusFilter("rejected")}>Rejected</button></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bids Table */}
          <div className={`${styles.card} card border-0 shadow-sm bg-transparent rounded-3`}>
            <div className="table-responsive border-0 bg-transparent">
              <table className={`${styles.table} table table-hover mb-0 bg-transparent table-striped`}>
                <thead className="bg-transparent fw-bold">
                  <tr>
                    <th className="ps-4">Bid ID</th>
                    <th>Job Title</th>
                    <th>Consultancy</th>
                    <th>Proposal</th>
                    <th>Fee with percentage %</th>
                    <th>Submitted On</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {currentBids.length > 0 ? (
                    currentBids.map((bid, index) => {
                      const job = jobs[bid.job] || {};
                      const consultancy = consultancies[bid.consultancy] || {};
                      return (
                        <tr key={bid.id}>
                          <td className="ps-4 fw-semibold">{index + 1}</td>
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-semibold">{job.title || 'N/A'}</span>
                              <small className="text-muted">{job.work_mode} • {job.job_type} • {job.experience_level} • {job.location}</small>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-semibold"><Image src={consultancy.profile_image || 'https://www.svgrepo.com/show/530589/company.svg'} alt={consultancy.consultancy_name} width={20} height={20} className="rounded-circle me-1"/> {consultancy.consultancy_name || 'N/A'}</span>
                              <small className="text-muted"><FiUsers/> {consultancy.consultancy_size} • {consultancy.specialization}</small>
                            </div>
                          </td>
                          <td>
                            <span className="fw-semibold">{(bid.proposal).substring(0, 25)}...</span>
                          </td>
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-semibold">{formatCurrency(bid.fee)}</span>
                              {job && (() => {
                                const fee = parseFloat(bid.fee);
                                if (!isNaN(fee)) {
                                  const percentage = ((fee / job.bid_budget) * 100).toFixed(2);
                                  return (
                                    <small className="text-muted">
                                      <strong className="text-primary">{percentage}%</strong> of the bid budget 
                                      <span className="fw-semibold text-primary">
                                      &nbsp;₹&nbsp;
                                      {parseFloat(job.bid_budget).toLocaleString()}
                                      </span>
                                    </small>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </td>
                          <td>
                            <span className="text-muted">{formatDate(bid.created_at)}</span>
                          </td>
                          <td>
                            <span className={`badge rounded-pill ${
                              bid.status === "approved" 
                                ? "bg-success bg-opacity-10 text-success" 
                                : bid.status === "rejected"
                                  ? "bg-danger bg-opacity-10 text-danger"
                                  : "bg-warning bg-opacity-10 text-warning"
                            }`}>
                              {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                            </span>
                          </td>
                          <td className="text-end pe-4">
                            <div className="d-flex justify-content-end gap-2">
                              <ReceivedBidsActionbtn data={{
                                ...bid,
                                job: jobs[bid.job] || {},
                                consultancy: consultancies[bid.consultancy] || {}
                              }} />
                              {bid.status === "approved" && (
                              <ReviewCandidates data={{
                                ...bid,
                                job: jobs[bid.job] || {},
                                consultancy: consultancies[bid.consultancy] || {}
                              }} />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">
                        {searchTerm || statusFilter !== "All" ? 
                          "No bids found matching your criteria" : 
                          "No bids received yet"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredBids.length > bidsPerPage && (
              <div className="card-footer bg-transparent border-0 d-flex justify-content-between align-items-center py-3">
                <small className="text-muted">
                  Showing {indexOfFirstBid + 1}-{Math.min(indexOfLastBid, filteredBids.length)} of {filteredBids.length} bids
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