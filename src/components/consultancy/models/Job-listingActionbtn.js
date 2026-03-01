"use client";
import { useState, useEffect, useContext } from "react";
import Modal from "react-modal";
import styles from "./page.module.css";
import { FaEye, FaTimes, FaBuilding, FaChevronDown, FaChevronUp, FaHandshake, FaGavel, FaPercent, FaExclamationTriangle } from "react-icons/fa";
import { FiEye } from "react-icons/fi";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import CheckPlanUsage from "@/components/shared/CheckPlanUsage";
import Plans from '@/components/employer/models/plans/Plans';
import { PlanContext } from '@/context/shared/Plan';





const customStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    maxWidth: "800px",
    width: "90%",
    maxHeight: "90vh",
    overflow: "auto",
    padding: 0,
    border: "none",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
    background: "white",
  },
};

export default function PostedJobActions({ data }) {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidData, setBidData] = useState({
    proposal: '',
    fee_percentage: null,
    fee: null
  });
  const router = useRouter();
  CheckPlanUsage({type: 'bid'});
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState(0);
  const {userSubscription, setUserSubscription} = useContext(PlanContext);
  const isPlanUsage = !!(
      userSubscription &&
      userSubscription.has_subscription &&
      parseInt(userSubscription.bid_limit) > 0
    );
    


  useEffect(() => {
    setIsBrowser(true);
    if (isBrowser) {
      Modal.setAppElement(document.body);
    }
  }, [isBrowser]);

  const handleClose = () => {
    setModalIsOpen(false);
    setShowBidForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBidData(prev => ({
      ...prev,
      [name]: value
    }));
  };



  const handleBidSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // Validate fee is a positive number
      if (isNaN(bidData.fee) || bidData.fee === '') {
        throw new Error('Fee must be a number');
      }
      if (parseFloat(bidData.fee) <= 0) {
        throw new Error('Fee must be a positive amount');
      }

      if(bidData?.fee < data.bid_budget/2 || bidData?.fee > data.bid_budget){
        toast.error("Fee must be greater than half of the bid budget and less than the bid budget or equal to the bid budget");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bids/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        },
        body: JSON.stringify({
          job: data.id,
          proposal: bidData.proposal,
          fee: parseFloat(bidData.fee)
        })
      });

      let responseData;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          responseData = await response.json();
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
          toast.error('Server error occurred. Please try again later.');
          return;
        }
      } else {
        console.error('Server returned non-JSON response');
        toast.error('Server error occurred. Please try again later.');
        return;
      }

      if (!response.ok) {
        // Handle specific validation errors with user-friendly messages
        if (response.status === 400) {
          if (responseData.non_field_errors) {
            const errorMessage = responseData.non_field_errors[0];
            if (errorMessage.includes("3 bids per job")) {
              toast.error("You have reached the maximum limit of 3 bids for this job. Please review your existing bids.");
            } else if (errorMessage.includes("already submitted this proposal")) {
              toast.error("You have already submitted this exact proposal for this job. Please modify your proposal.");
            } else {
              toast.error(responseData.detail || errorMessage);
            }
            return;
          }
          if (responseData.proposal) {
            toast.error(responseData.proposal[0]);
            return;
          }
          if (responseData.fee) {
            toast.error(responseData.fee[0]);
            return;
          }
        }
        if (response.status === 403) {
          toast.error("You don't have permission to perform this action.");
          return;
        }
        if (response.status === 401) {
          toast.error("Your session has expired. Please log in again.");
          return;
        }
        if (response.status >= 500) {
          toast.error("Server error occurred. Please try again later.");
          return;
        }
        toast.error(responseData.detail || 'Failed to submit bid. Please try again.');
        return;
      }

      setUserSubscription(prev => ({
        ...prev,
        bid_limit: parseInt(prev.bid_limit) - 1
      }));
      
      toast.success('Bid submitted successfully! Your proposal has been sent to the employer.');
      setShowBidForm(false);
      setBidData({ proposal: '', fee: '' });
    } catch (error) {
      console.error('Error submitting bid:', error);
      // Handle specific error cases
      if (error.message.includes("3 bids per job")) {
        toast.error("You have reached the maximum limit of 3 bids for this job. Please review your existing bids.");
      } else if (error.message.includes("already submitted this proposal")) {
        toast.error("You have already submitted this exact proposal for this job. Please modify your proposal.");
      } else if (error.message.includes("Failed to fetch")) {
        toast.error("Network error. Please check your internet connection and try again.");
      } else {
        toast.error(error.message || 'Failed to submit bid. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isBrowser) return null;

  return (
    <>
      <div className={styles.actionButtons}>
        <motion.button 
          onClick={() => setModalIsOpen(true)} 
          className={styles.viewButton}
          title="View job details"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaGavel size={16} />
        </motion.button>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={handleClose}
        style={customStyles}
        contentLabel="Job Details"
        ariaHideApp={isBrowser}
        shouldCloseOnOverlayClick={true}
        shouldCloseOnEsc={true}
        closeTimeoutMS={300}
      >
        <AnimatePresence>
          {modalIsOpen && (
            <motion.div 
              className={styles.modalContainer}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.heading}>Job Details</h2>
                <div className={styles.headerActions}>
                <motion.button 
                  onClick={() => {
                    if (isPlanUsage) {
                      setShowBidForm(true);
                    } else {
                      setIsPlansModalOpen(true);
                    }
                  }}
                  className={styles.bidButton}
                  title="Make a bid"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaHandshake className="me-2" />
                  {isPlanUsage ? 'Make a Bid' : 'Upgrade Plan to make a Bid'}
                </motion.button>

                  <motion.button 
                    onClick={handleClose} 
                    className={styles.closeButton}
                    aria-label="Close modal"
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaTimes />
                  </motion.button>
                </div>
              </div>

              {showBidForm ? (
                <form onSubmit={handleBidSubmit} className={styles.bidForm}>
                  <div className={styles.formGroup}>
                    <label>Your Proposal</label>
                    <textarea
                      name="proposal"
                      value={bidData.proposal}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      placeholder="Describe your approach, qualifications, and why you're the best fit for this job..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Fee (%)</label>
                    <input
                      type="number"
                      name="fee_percentage"
                      className={`${bidData.fee < data.bid_budget/2 || bidData.fee > data.bid_budget ? 'border-danger' : ''}`}
                      value={bidData.fee_percentage || ''}
                      onChange={(e) => {
                        const percentage = parseFloat(e.target.value);
                        setBidData({
                          ...bidData,
                          fee_percentage: percentage,
                          fee: (percentage / 100) * parseInt(data.bid_budget)
                        });
                      }}
                      required
                      min={0}
                      max={100}
                      step="0.01"
                      placeholder="Enter your fee percentage"
                    />
                    {bidData.fee_percentage && !isNaN(bidData.fee_percentage) && !isNaN(bidData.fee) && (
                      <>
                      <p className={styles.amountInfo} style={{ marginTop: 8, color: '#888', fontSize: 13 }}>
                        Fee amount: <strong className={`text-success text-bold text-lg ${bidData.fee < data.bid_budget/2 || bidData.fee > data.bid_budget ? 'text-danger' : ''}`}>
                                                  ₹&nbsp;
                                                  {parseFloat(bidData.fee).toLocaleString()}
                        </strong>
                      </p>
                            <span className={`text-danger text-bold text-lg ${bidData.fee < data.bid_budget/2 || bidData.fee > data.bid_budget ? 'text-danger' : ''}`}>
                            {bidData.fee < data.bid_budget/2 || bidData.fee > data.bid_budget ? <><FaExclamationTriangle className="me-2" /> Fee must be greater than 50% of the ₹&nbsp;{parseFloat(data.bid_budget).toLocaleString()} and less than the ₹&nbsp;{parseFloat(data.bid_budget).toLocaleString()} or equal to the ₹&nbsp;{parseFloat(data.bid_budget).toLocaleString()}</> : ''}
                          </span>
                      </>
                    )}
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      onClick={() => setShowBidForm(false)}
                      className={styles.cancelButton}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Submitting...' : 'Submit Bid'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className={styles.jobDetails}>
                  <div className={styles.companyHeader}>
                    <div className={styles.companyLogo}>
                      {data.company_logo ? (
                        <Image
                          src={data.company_logo}
                          alt={`${data.company_name} logo`}
                          width={60}
                          height={60}
                          className={styles.logoImage}
                        />
                      ) : (
                        <div className={styles.placeholderLogo}>
                          <FaBuilding />
                        </div>
                      )}
                    </div>
                    <div className={styles.companyInfo}>
                      <h3 className={styles.jobTitle}>{data.title}</h3>
                      <p className={styles.companyName}>{data.company_name}</p>
                    </div>
                    <span className={`${styles.statusBadge} ${data.is_published ? styles.status_active : styles.status_inactive}`}>
                      {data.is_published ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className={styles.jobInfo}>
                    <div className={styles.infoRow}>
                      <p><strong>Location:</strong> {data.location} ({data.work_mode})</p>
                      <p><strong>Type:</strong> {data.job_type}</p>
                    </div>
                    <div className={styles.infoRow}>
                      <p><strong>Experience Level:</strong> {data.experience_level}</p>
                      <p><strong>Industry:</strong> {data.industry}</p>
                    </div>
                    <div className={styles.infoRow}>
                      <p><strong>Salary:</strong> {data.min_salary} - {data.max_salary} {data.currency} ({data.salary_type})</p>
                      <p><strong>Posted Date:</strong> {new Date(data.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className={styles.infoRow}>
                      <p className="text-primary"><strong>Bid Budget:</strong> {data.bid_budget} {data.currency} </p>
                      <p className="text-primary"><strong>No of Candidates required:</strong> {data.bid_candidates}</p>
                    </div>
                  </div>

                  <details className={styles.details}>
                    <summary className={styles.summary}>
                      <motion.span
                        animate={{ rotate: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isOpen ? (
                          <span onClick={() => setIsOpen(false)}>
                            <FaChevronUp className="me-2" />
                            Less Details
                          </span>
                        ) : (
                          <span onClick={() => setIsOpen(true)}>
                            <FaChevronDown className="me-2" />
                            More Details
                          </span>
                        )}
                      </motion.span>
                    </summary>
                    <motion.div 
                      className={styles.detailsContent}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className={styles.detailSection}>
                        <h4>Description</h4>
                        <p>{data.description}</p>
                      </div>
                      <div className={styles.detailSection}>
                        <h4>Requirements</h4>
                        <p>{data.requirements}</p>
                      </div>
                      <div className={styles.detailSection}>
                        <h4>Responsibilities</h4>
                        <p>{data.responsibilities}</p>
                      </div>
                      <div className={styles.detailSection}>
                        <h4>Skills Required</h4>
                        <p>{data.skills_required}</p>
                      </div>
                      <div className={styles.detailSection}>
                        <h4>Application Deadline</h4>
                        <p>{new Date(data.deadline).toLocaleDateString()}</p>
                      </div>
                    </motion.div>
                  </details>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
      <Plans 
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        userType={'consultancy'}
        currentPlanId={currentPlanId}
      />
    </>
  );
}