"use client";
import { useState, useEffect, useContext } from "react";
import Modal from "react-modal";
import styles from "./ApplicationsActionbtn.module.css";
import { FaEye, FaTimes, FaDownload, FaChevronDown, FaChevronUp, FaUser, FaGraduationCap, FaBriefcase, FaCode } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import { toast } from 'react-toastify';
import Image from "next/image";
import { ApplicationsContext } from "@/context/employer/Applications";

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

// Rejection modal styles
const rejectionModalStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: 2000,
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
    maxWidth: "500px",
    width: "90%",
    padding: 0,
    border: "none",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
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

export default function ApplicationsAction({ data }) {
  const { applications, setApplications } = useContext(ApplicationsContext);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [rejectionModalIsOpen, setRejectionModalIsOpen] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRejectionLoading, setIsRejectionLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(data.status);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pendingStatus, setPendingStatus] = useState(null);

  useEffect(() => {
    setIsBrowser(true);
    if (isBrowser) {
      Modal.setAppElement(document.body);
    }
  }, [isBrowser]);

  const handleClose = () => {
    setModalIsOpen(false);
  };

  const handleRejectionModalClose = () => {
    setRejectionModalIsOpen(false);
    setRejectionReason("");
    setPendingStatus(null);
  };

  const handleStatusUpdate = async (newStatus) => {
    // If status is being changed to rejected, show rejection modal
    if (newStatus === "rejected") {
      setPendingStatus(newStatus);
      setRejectionModalIsOpen(true);
      return;
    }

    // For other statuses, proceed normally
    await updateStatus(newStatus);
  };

  const updateStatus = async (newStatus, rejectionReason = null) => {
    try {
      setIsLoading(true);
      const requestBody = { status: newStatus };
      
      // Add rejection reason if provided
      if (rejectionReason) {
        requestBody.rejection_reason = rejectionReason;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/${data.id}/update_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setStatus(newStatus);
      toast.success(`Application status updated to ${newStatus}`);
      console.log('applications CONTEXT:', applications);
      setApplications(applications.map(app => app.id === data.id ? { ...app, status: newStatus } : app));
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectionSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setIsRejectionLoading(true);
      await updateStatus(pendingStatus, rejectionReason);
      handleRejectionModalClose();
    } catch (error) {
      console.error('Error submitting rejection:', error);
    } finally {
      setIsRejectionLoading(false);
    }
  };

  const handleDownloadResume = () => {
    if (data.candidate.profile.resume) {
      window.open(data.candidate.profile.resume, '_blank');
    } else {
      toast.error('No resume available');
    }
  };

  if (!isBrowser) return null;

  return (
    <>
      <div className={styles.actionButtons}>
        <motion.button 
          onClick={() => setModalIsOpen(true)} 
          className={styles.viewButton}
          title="View application details"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaEye size={16} />
        </motion.button>
      </div>

      {/* Main Application Details Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={handleClose}
        style={customStyles}
        contentLabel="Application Details"
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
                <h2 className={styles.heading}>Application Details</h2>
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
                className={styles.applicationDetails}
                variants={containerVariants}
              >
                <motion.div 
                  className={styles.candidateHeader}
                  variants={itemVariants}
                >
                  <div className={styles.profileSection}>
                    <div className={styles.profileImage}>
                      {data.candidate.profile.profile_image ? (
                        <Image
                          src={data.candidate.profile.profile_image}
                          alt={data.candidate.user.name}
                          width={100}
                          height={100}
                          className={styles.image}
                        />
                      ) : (
                        <div className={styles.placeholderImage}>
                          <FaUser size={40} />
                        </div>
                      )}
                    </div>
                    <div className={styles.candidateInfo}>
                      <h3 className={styles.candidateName}>{data.candidate.user.name}</h3>
                      <p className={styles.candidateEmail}>{data.candidate.user.email}</p>
                      <p className={styles.candidatePhone}>{data.candidate.user.phone}</p>
                    </div>
                  </div>
                  <div className={styles.statusActions}>
                    <select 
                      value={status}
                      onChange={(e) => handleStatusUpdate(e.target.value)}
                      className={styles.statusSelect}
                      disabled={isLoading}
                    >
                      <option value="applied">Applied</option>
                      <option value="under_review">Under Review</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview_scheduled">Interview Scheduled</option>
                      <option value="interview_completed">Interview Completed</option>
                      <option value="offer_made">Offer Made</option>
                      <option value="offer_accepted">Offer Accepted</option>
                      <option value="offer_declined">Offer Declined</option>
                      <option value="rejected">Rejected</option>
                      <option value="withdrawn">Withdrawn by Candidate</option>
                      <option value="on_hold">On Hold</option>
                      <option value="hired">Hired</option>
                      <option value="pending">Pending</option>
                    </select>

                    <button 
                      onClick={handleDownloadResume}
                      className={styles.resumeButton}
                      disabled={!data.candidate.profile.resume}
                    >
                      <FaDownload className="me-2" /> Resume
                    </button>
                  </div>
                </motion.div>

                <motion.div 
                  className={styles.jobInfo}
                  variants={itemVariants}
                >
                  <h4>Applied Position</h4>
                  <p className={styles.jobTitle}>{data.job.title}</p>
                  <div className={styles.jobDetails}>
                    <p><strong>Company:</strong> {data.job.company_name}</p>
                    <p><strong>Location:</strong> {data.job.location}</p>
                    <p><strong>Work Mode:</strong> {data.job.work_mode}</p>
                    <p><strong>Job Type:</strong> {data.job.job_type}</p>
                    <p><strong>Experience Level:</strong> {data.job.experience_level}</p>
                  </div>
                </motion.div>

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
                    <motion.div 
                      className={styles.detailSection}
                      variants={itemVariants}
                    >
                      <h4><FaUser className="me-2" /> About</h4>
                      <p>{data.candidate.profile.about}</p>
                    </motion.div>

                    <motion.div 
                      className={styles.detailSection}
                      variants={itemVariants}
                    >
                      <h4><FaCode className="me-2" /> Skills</h4>
                      <div className={styles.skillsList}>
                        {data.candidate.profile.skills.split(',').map((skill, index) => (
                          <motion.span 
                            key={index} 
                            className={styles.skillTag}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {skill.trim()}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div 
                      className={styles.detailSection}
                      variants={itemVariants}
                    >
                      <h4><FaGraduationCap className="me-2" /> Education</h4>
                      <div className={styles.timeline}>
                        {data.candidate.education.map((edu, index) => (
                          <motion.div 
                            key={index} 
                            className={styles.timelineItem}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className={styles.timelineContent}>
                              <h5>{edu.degree} in {edu.field_of_study}</h5>
                              <p className={styles.schoolName}>{edu.school_name}</p>
                              <p className={styles.duration}>
                                {new Date(edu.start_date).getFullYear()} - {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Present'}
                              </p>
                              <p className={styles.grade}>Grade: {edu.grade}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div 
                      className={styles.detailSection}
                      variants={itemVariants}
                    >
                      <h4><FaBriefcase className="me-2" /> Experience</h4>
                      <div className={styles.timeline}>
                        {data.candidate.experience.map((exp, index) => (
                          <motion.div 
                            key={index} 
                            className={styles.timelineItem}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className={styles.timelineContent}>
                              <h5>{exp.designation}</h5>
                              <p className={styles.companyName}>{exp.company_name}</p>
                              <p className={styles.location}>{exp.location}</p>
                              <p className={styles.duration}>
                                {new Date(exp.start_date).toLocaleDateString()} - {exp.currently_working ? 'Present' : new Date(exp.end_date).toLocaleDateString()}
                              </p>
                              <p className={styles.description}>{exp.job_description}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {data.cover_letter && (
                      <motion.div 
                        className={styles.detailSection}
                        variants={itemVariants}
                      >
                        <h4>Cover Letter</h4>
                        <p>{data.cover_letter}</p>
                      </motion.div>
                    )}
                  </motion.div>
                </details>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={rejectionModalIsOpen}
        onRequestClose={handleRejectionModalClose}
        style={rejectionModalStyles}
        contentLabel="Rejection Reason"
        ariaHideApp={isBrowser}
        shouldCloseOnOverlayClick={false}
        shouldCloseOnEsc={false}
      >
        <motion.div 
          className={styles.rejectionModalContainer}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.rejectionModalHeader}>
            <h3 className={styles.rejectionModalTitle}>Rejection Reason Required</h3>
            <p className={styles.rejectionModalSubtitle}>
              Please provide a reason for rejecting this application. This information will be shared with the candidate.
            </p>
          </div>

          <div className={styles.rejectionModalContent}>
            <div className={styles.rejectionFormGroup}>
              <label htmlFor="rejectionReason" className={styles.rejectionLabel}>
                Rejection Reason *
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className={styles.rejectionTextarea}
                placeholder="Please provide a detailed reason for rejection..."
                rows={4}
                required
              />
            </div>
          </div>

          <div className={styles.rejectionModalActions}>
            <motion.button
              onClick={handleRejectionModalClose}
              className={styles.rejectionCancelButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isRejectionLoading}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleRejectionSubmit}
              className={styles.rejectionSubmitButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!rejectionReason.trim() || isRejectionLoading}
            >
              {isRejectionLoading ? 'Submitting...' : 'Submit Rejection'}
            </motion.button>
          </div>
        </motion.div>
      </Modal>
    </>
  );
}
