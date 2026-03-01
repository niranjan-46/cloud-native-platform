"use client";
import { useState, useEffect } from "react";
import Modal from "react-modal";
import styles from "./page.module.css";
import { FaEye, FaTimes, FaEdit, FaTrash, FaChevronDown, FaChevronUp, FaDollarSign, FaFileAlt, FaUndo, FaExclamationTriangle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import { toast } from 'react-toastify';
import Image from "next/image";
import { Undo2, X, Trash2 } from 'lucide-react';

// Custom modal styles
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

const confirmationModalStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1001,
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
    maxWidth: "400px",
    width: "90%",
    padding: "20px",
    border: "none",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    background: "white",
  },
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: {
      duration: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3
    }
  }
};

export default function BidAction({ data, onBidUpdate }) {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(data.status);
  const [jobDetails, setJobDetails] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    proposal: data.proposal,
    fee: data.fee
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
    if (isBrowser) {
      Modal.setAppElement(document.body);
    }
  }, [isBrowser]);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${data.job}/`, {
          headers: {
            'Authorization': `Bearer ${Cookies.get('access_token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch job details');
        }
        
        const jobData = await response.json();
        setJobDetails(jobData);
      } catch (error) {
        console.error('Error fetching job details:', error);
        toast.error('Failed to load job details');
      }
    };

    if (modalIsOpen && data.job) {
      fetchJobDetails();
    }
  }, [modalIsOpen, data.job]);

  const handleClose = () => {
    setModalIsOpen(false);
    setIsEditMode(false);
    setEditForm({
      proposal: data.proposal,
      fee: data.fee
    });
  };

  const handleWithdrawBid = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/delete-bid/${data.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to withdraw bid');
      }

      toast.success('Bid withdrawn successfully');
      setShowConfirmation(false);
      handleClose();
      if (onBidUpdate) {
        onBidUpdate();
      }
    } catch (error) {
      console.error('Error withdrawing bid:', error);
      toast.error('Failed to withdraw bid. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmWithdrawal = () => {
    setShowConfirmation(true);
  };

  const cancelWithdrawal = () => {
    setShowConfirmation(false);
  };

  const handleEditBid = () => {
    setIsEditMode(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if(editForm.fee < jobDetails.bid_budget/2 || editForm.fee > jobDetails.bid_budget) {
      toast.error('Fee must be greater than 50% of the bid budget and less than the bid budget or equal to the bid budget');
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/update-bid/${data.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update bid');
      }

      const updatedBid = await response.json();
      toast.success('Bid updated successfully');
      data.proposal = updatedBid.proposal;
      data.fee = updatedBid.fee;
      setIsEditMode(false);
      setEditForm({
        proposal: updatedBid.proposal,
        fee: updatedBid.fee
      });
    } catch (error) {
      console.error('Error updating bid:', error);
      toast.error(error.message || 'Failed to update bid. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return styles.pendingStatus;
      case 'accepted':
        return styles.acceptedStatus;
      case 'rejected':
        return styles.rejectedStatus;
      case 'withdrawn':
        return styles.withdrawnStatus;
      default:
        return styles.defaultStatus;
    }
  };

  const getFeePercentage = (fee) => {
    const feeValue = parseFloat(fee);
    if (isNaN(feeValue)) return null;
    if (jobDetails?.bid_budget === 0) return null;
    return ((feeValue / jobDetails?.bid_budget) * 100).toFixed(2);
  };

  if (!isBrowser) return null;

  return (
    <>
      <div className={styles.actionButtons}>
        <motion.button 
          onClick={() => setModalIsOpen(true)} 
          className={styles.viewButton}
          title="View bid details"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaEye size={16} />
        </motion.button>
        {data.status.toLowerCase() != 'approved' || data.status.toLowerCase() != 'rejected' && (
          <motion.button 
            onClick={confirmWithdrawal}
            className={styles.viewButton}
            title="Withdraw bid"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isLoading}
          >
            <Undo2 size={16} />
          </motion.button>
        )}
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={handleClose}
        style={customStyles}
        contentLabel="Bid Details"
        ariaHideApp={isBrowser}
        shouldCloseOnOverlayClick={true}
        shouldCloseOnEsc={true}
        closeTimeoutMS={300}
      >
        <AnimatePresence>
          {modalIsOpen && (
            <motion.div 
              className={styles.modalContainer}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.heading}>Bid Details</h2>
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

              <motion.div 
                className={styles.bidDetails}
                variants={containerVariants}
              >
                <motion.div 
                  className={styles.bidHeader}
                  variants={itemVariants}
                >
                  <div className={styles.bidStatus}>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(data.status)}`}>
                      {data.status}
                    </span>
                    <p className={styles.submittedDate}>
                      Submitted on: {new Date(data.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className={styles.bidActions}>
                    {data.status.toLowerCase() === 'pending' && (
                      <>
                        <button 
                          onClick={handleEditBid}
                          className={styles.editButton}
                          disabled={isLoading}
                        >
                          <FaEdit className="me-2" /> Edit Bid
                        </button>
                        <button 
                          onClick={confirmWithdrawal}
                          className={styles.withdrawButton}
                          disabled={isLoading}
                        >
                          <FaTrash className="me-2" /> Withdraw
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>

                {isEditMode ? (
                  <motion.form 
                    className={styles.editForm}
                    onSubmit={handleEditSubmit}
                    variants={itemVariants}
                  >
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="fee">Proposed Fee (₹)</label>
                      <input
                        type="number"
                        id="fee"
                        name="fee"
                        value={editForm.fee}
                        onChange={handleEditFormChange}
                        required
                        min="0"
                        step="0.01"
                        className={`${styles.formInput} ${editForm?.fee < jobDetails?.bid_budget/2 || editForm?.fee > jobDetails?.bid_budget ? 'border-danger' : ''}`}
                      />
                      {editForm.fee && jobDetails && getFeePercentage(editForm.fee) !== null && (
                        <div className={styles.percentageInfo} style={{ marginTop: 8, color: '#888', fontSize: 13 }}>
                          Your bid is <strong className="text-primary text-bold text-lg">{getFeePercentage(editForm.fee)}%</strong> of the bid budget ₹&nbsp;{parseFloat(jobDetails.bid_budget).toLocaleString()}
                          <br/>{editForm.fee < jobDetails.bid_budget/2 || editForm.fee > jobDetails.bid_budget ? <span className="text-danger"> <FaExclamationTriangle className='text-danger me-1'/> Fee must be greater than 50% of the ₹&nbsp;{parseFloat(jobDetails.bid_budget).toLocaleString()} and less than the ₹&nbsp;{parseFloat(jobDetails.bid_budget).toLocaleString()} or equal to the ₹&nbsp;{parseFloat(jobDetails.bid_budget).toLocaleString()}</span> : ''}
                        </div>
                      )}
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="proposal">Proposal</label>
                      <textarea
                        id="proposal"
                        name="proposal"
                        value={editForm.proposal}
                        onChange={handleEditFormChange}
                        required
                        rows="6"
                        className={styles.formTextarea}
                      />
                    </div>
                    <div className={styles.formActions}>
                      <button
                        type="button"
                        onClick={() => setIsEditMode(false)}
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
                        {isLoading ? 'Updating...' : 'Update Bid'}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <>
                    <motion.div 
                      className={styles.jobInfo}
                      variants={itemVariants}
                    >
                      <h4>Job Details</h4>
                      {jobDetails ? (
                        <>
                          <p className={styles.jobTitle}>{jobDetails.title}</p>
                          <div className={styles.jobDetails}>
                            <div className={styles.companyInfo}>
                              {jobDetails.company_logo && (
                                <Image
                                  src={jobDetails.company_logo}
                                  alt={jobDetails.company_name}
                                  width={40}
                                  height={40}
                                  className={styles.companyLogo}
                                />
                              )}
                              <p><strong>Company:</strong> {jobDetails.company_name}</p>
                            </div>
                            <p><strong>Location:</strong> {jobDetails.location}</p>
                            <p><strong>Work Mode:</strong> {jobDetails.work_mode}</p>
                            <p><strong>Job Type:</strong> {jobDetails.job_type}</p>
                            <p><strong>Experience Level:</strong> {jobDetails.experience_level}</p>
                            <p><strong>Deadline:</strong> {new Date(jobDetails.deadline).toLocaleDateString()}</p>
                          </div>
                        </>
                      ) : (
                        <div className={styles.loadingJob}>
                          Loading job details...
                        </div>
                      )}
                    </motion.div>

                    <motion.div 
                      className={styles.bidInfo}
                      variants={itemVariants}
                    >
                      <div className={styles.feeSection}>
                        <h4>₹&nbsp; Proposed Fee</h4>
                        <p className={styles.feeAmount}>
                          {parseFloat(data.fee).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'INR'
                          })}
                        </p>
                        {jobDetails && getFeePercentage(data.fee) !== null && (
                          <p className={styles.percentageInfo} style={{ marginTop: 8, color: '#888', fontSize: 13 }}>
                            Your bid is <strong className="text-primary text-bold text-lg">{getFeePercentage(data.fee)}%</strong> of the bid budget ({jobDetails.bid_budget} {jobDetails.currency})
                          </p>
                        )}
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
                                Hide Proposal
                              </span>
                            ) : (
                              <span onClick={() => setIsOpen(true)}>
                                <FaChevronDown className="me-2" />
                                View Full Proposal
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
                          <motion.div 
                            className={styles.proposalSection}
                            variants={itemVariants}
                          >
                            <h4><FaFileAlt className="me-2" /> Proposal</h4>
                            <div className={styles.proposalText}>
                              {data.proposal.split('\n').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                              ))}
                            </div>
                          </motion.div>
                        </motion.div>
                      </details>
                    </motion.div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmation}
        onRequestClose={cancelWithdrawal}
        style={confirmationModalStyles}
        contentLabel="Confirm Withdrawal"
        ariaHideApp={isBrowser}
        shouldCloseOnOverlayClick={true}
        shouldCloseOnEsc={true}
        closeTimeoutMS={300}
      >
        <div className={styles.confirmationModal}>
          <h3>Confirm Withdrawal</h3>
          <p>Are you sure you want to withdraw this bid? This action cannot be undone.</p>
          <div className={styles.confirmationButtons}>
            <button 
              onClick={cancelWithdrawal}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              onClick={handleWithdrawBid}
              className={`${styles.confirmDeleteButton} ms-2`}
              disabled={isLoading}
            >
              {isLoading ? 'Withdrawing...' : 'Yes, Withdraw'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}