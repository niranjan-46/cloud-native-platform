"use client";
import { useState, useEffect } from "react";
import Modal from "react-modal";
import styles from "./page.module.css";
import { FaEye, FaTimes, FaBuilding, FaChevronDown, FaChevronUp } from "react-icons/fa";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// Custom modal styles that work with Next.js
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
  },
};

export default function JobApplicationsModal({data}) {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
    if (isBrowser) {
      Modal.setAppElement(document.body);
    }
  }, [isBrowser]);

  const handleClose = () => {
    setModalIsOpen(false);
  };

  if (!isBrowser) return null;

  // Transform the data structure to match the expected format
  const transformedData = [{
    job: data.job,
    app: data.application
  }];

  return (
    <>
      <motion.button 
        onClick={() => setModalIsOpen(true)} 
        className={styles.viewButton}
        title="View application details"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FaEye className="me-2" /> View Details
      </motion.button>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={handleClose}
        style={customStyles}
        contentLabel="Job Application Details"
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

              <div className={styles.jobList}>
                {Array.isArray(transformedData) && transformedData.length > 0 ? (
                  transformedData.map((item, index) => {
                    const job = item?.job || {};
                    const app = item?.app || {};

                    return (
                      <motion.div 
                        key={index} 
                        className={styles.jobCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={styles.companyHeader}>
                          <div className={styles.companyLogo}>
                            {job.company_logo ? (
                              <Image
                                src={job.company_logo}
                                alt={`${job.company_name} logo`}
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
                            <h3 className={styles.jobTitle}>{job.title || "No title"}</h3>
                            <p className={styles.companyName}>{job.company_name}</p>
                          </div>
                          <span className={`${styles.statusBadge} ${styles[`status_${app.status?.toLowerCase()}`]}`}>
                            {app.status}
                          </span>
                        </div>

                        <div className={styles.jobInfo}>
                          <div className={styles.infoRow}>
                            <p><strong>Location:</strong> {job.location} ({job.work_mode})</p>
                            <p><strong>Type:</strong> {job.job_type}</p>
                          </div>
                          <div className={styles.infoRow}>
                            <p><strong>Experience Level:</strong> {job.experience_level}</p>
                            <p><strong>Industry:</strong> {job.industry}</p>
                          </div>
                          <div className={styles.infoRow}>
                            <p><strong>Salary:</strong> {job.min_salary} - {job.max_salary} {job.currency} ({job.salary_type})</p>
                            <p><strong>Applied Date:</strong> {new Date(app.applied_at).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <details className={styles.details}>
                          <summary className={styles.summary}>
                            <motion.span
                              animate={{ rotate: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                             {
                                isOpen ? (
                                    <span onClick={() => setIsOpen(false)}>
                                    <FaChevronUp className="me-2" />
                                    Less Details
                                    </span>
                                ) : (
                                    <span onClick={() => setIsOpen(true)}>
                                    <FaChevronDown className="me-2" />
                                    More Details
                                    </span>
                                )
                                }
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
                              <p>{job.description}</p>
                            </div>
                            <div className={styles.detailSection}>
                              <h4>Requirements</h4>
                              <p>{job.requirements}</p>
                            </div>
                            <div className={styles.detailSection}>
                              <h4>Responsibilities</h4>
                              <p>{job.responsibilities}</p>
                            </div>
                            <div className={styles.detailSection}>
                              <h4>Skills Required</h4>
                              <p>{job.skills_required}</p>
                            </div>
                            <div className={styles.detailSection}>
                              <h4>Application Deadline</h4>
                              <p>{new Date(job.deadline).toLocaleDateString()}</p>
                            </div>
                            {app.status === "rejected" && app?.rejection_reason && (
                              <div className={styles.detailSection}>
                                <h4>Rejection reason</h4>
                                <p className='text-danger'>{app?.rejection_reason}</p>
                              </div>
                            )}
                          </motion.div>
                        </details>
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.p 
                    className={styles.noApplications}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    No application details found
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </>
  );
}