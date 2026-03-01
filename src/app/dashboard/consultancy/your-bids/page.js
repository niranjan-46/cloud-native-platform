"use client";
import React, { useState, useEffect } from "react";
import styles from "./Posted-jobs.module.css";
import { FiSearch, FiPlus, FiEdit2, FiEye, FiChevronLeft, FiChevronRight, FiChevronDown, FiDollarSign, FiRefreshCcw } from "react-icons/fi";
import { BiFilterAlt } from "react-icons/bi";
import Cookies from "js-cookie";
import { ClipLoader } from "react-spinners";
import Link from "next/link";
import Image from "next/image";
import YourbidsActionbtn from "@/components/consultancy/models/yourbids/YourbidsActionbtn";
import SubmitCandidates from "@/components/consultancy/models/yourbids/submitcandidates/submitcandidates";



async function getBids() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bids/`, {
      headers: {
        'Authorization': `Bearer ${Cookies.get('access_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bids');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching bids:', error);
  }
}

async function getJobDetails(jobId) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobId}/`, {
      headers: {
        'Authorization': `Bearer ${Cookies.get('access_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch job details');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching job details:', error);
    return null;
  }
}

export default function YourBidsPage() {
  const [bids, setBids] = useState([]);
  const [jobs, setJobs] = useState({}); // Store job details by job ID
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const bidsPerPage = 5;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setIsLoading(true);
        const bidsData = await getBids();
        setBids(bidsData);

        // Fetch job details for each bid
        const jobDetails = {};
        for (const bid of bidsData) {
          if (!jobDetails[bid.job]) {
            const jobData = await getJobDetails(bid.job);
            if (jobData) {
              jobDetails[bid.job] = jobData;
            }
          }
        }
        setJobs(jobDetails);
      } catch (error) {
        console.error('Error fetching bids:', error);
        setError(error.message);
      } finally {
        console.log(bids);
        setIsLoading(false);
      }
    };
    fetchBids();
  }, []);


  // Filter bids based on search and filters
  const filteredBids = bids.filter(bid => {
    const job = jobs[bid.job];
    const matchesSearch = job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         bid.proposal?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== "All") matchesStatus = bid.status?.toLowerCase() === statusFilter.toLowerCase();
    
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

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-warning';
      case 'accepted':
        return 'bg-success';
      case 'rejected':
        return 'bg-danger';
      case 'withdrawn':
        return 'bg-secondary';
      default:
        return 'bg-info';
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <ClipLoader color="#0d6efd" size={50} />
          <p className="mt-3 text-black">Fetching your bids, please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <h2 className="text-red-600 text-xl font-semibold mb-2">Error Loading Bids</h2>
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
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
            <h4 className="mb-0 fw-bold">Your Bids</h4>
            <button onClick={() => window.location.reload()} className={`btn btn-primary d-flex align-items-center gap-2 ${styles["btn-modern"]}`}>
              <FiRefreshCcw size={18} /> Refresh
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
                      placeholder="Search bids by job title or proposal..."
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
                      <li><button className="dropdown-item" onClick={() => handleStatusFilter("Pending")}>Pending</button></li>
                      <li><button className="dropdown-item" onClick={() => handleStatusFilter("Accepted")}>Accepted</button></li>
                      <li><button className="dropdown-item" onClick={() => handleStatusFilter("Rejected")}>Rejected</button></li>
                      <li><button className="dropdown-item" onClick={() => handleStatusFilter("Withdrawn")}>Withdrawn</button></li>
                    </ul>
                  </div>
                </div>
                <div className="col-md-3">
                  <button 
                  className={`${styles.btn} btn btn-outline-secondary`} 
                  disabled={statusFilter === "All"}
                  onClick={() => {
                    setStatusFilter("All");
                    setSearchTerm("");
                  }}>
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bids Table */}
          <div className={`${styles.card} card border-0 shadow-sm bg-transparent border-0`}>
            <div className="table-responsive border-0 bg-transparent">
              <table className={`${styles.table} table table-hover mb-0 bg-transparent table-striped`}>
                <thead className="bg-transparent fw-bold">
                  <tr>
                    <th className="ps-4">S.No</th>
                    <th>Job Title</th>
                    <th>Proposal</th>
                    <th>Fee with percentage %</th>
                    <th>Status</th>
                    <th>Submitted On</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBids.length > 0 ? (
                    currentBids.map((bid, index) => {
                      const job = jobs[bid.job];
                      return (
                        <tr key={bid.id}>
                          <td className="ps-4 fw-semibold">{index + 1}</td>
                          <td>
                            {job ? (
                              <div className="d-flex flex-column">
                                <span className="fw-semibold">{job.title}</span>
                                <small className="text-muted">
                                  <Image 
                                    src={job.company_logo || 'https://www.svgrepo.com/show/530589/company.svg'} 
                                    alt={job.company_name} 
                                    width={20} 
                                    height={20} 
                                    className="rounded-circle me-2 mt-1"
                                  />
                                  <span className="mt-1">{job.company_name?.substring(0, 20)}</span>
                                </small>
                              </div>
                            ) : (
                              <span className="text-muted">Job details not available</span>
                            )}
                          </td>
                          <td>
                            <span className="text-truncate d-inline-block" style={{maxWidth: '200px'}}>
                              {bid.proposal.substring(0, 50)}...
                            </span>
                          </td>
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-semibold">
                                ₹&nbsp;
                                {parseFloat(bid.fee).toLocaleString()}
                              </span>
                              {jobs[bid.job] && (() => {
                                const fee = parseFloat(bid.fee);
                                if (!isNaN(fee)) {
                                  const percentage = ((fee / job.bid_budget) * 100).toFixed(2);
                                  return (
                                    <small className="text-muted">
                                      <p><strong className="text-primary">{percentage}%</strong> of the bid budget ₹&nbsp;{parseFloat(job.bid_budget).toLocaleString()}</p>
                                    </small>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(bid.status)}`}>
                              {bid.status}
                            </span>
                          </td>
                          <td>{formatDate(bid.created_at)}</td>
                          <td className="text-end pe-4">
                            <div className="d-flex justify-content-end gap-2">
                            <YourbidsActionbtn data={bid} />
                              {bid.status.toLowerCase() === 'approved' && (
                                <>
                                  <SubmitCandidates bidId={bid.id} />
                                </>
                              )}                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No bids found matching your criteria
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