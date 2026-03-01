"use client";
import { useState, useEffect, useContext } from "react";
import Modal from "react-modal";
import styles from "./page.module.css";
import { FaEye, FaTimes, FaBuilding, FaChevronDown, FaChevronUp, FaTrash, FaEdit } from "react-icons/fa";
import { FiEdit2, FiEye } from "react-icons/fi";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import { PostedJobsContext } from "@/context/employer/Postedjobs";



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

export default function PostedJobActions({ data }) {
  const { jobs, setJobs } = useContext(PostedJobsContext);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    company_website: '',
    company_email: '',
    location: '',
    work_mode: '',
    job_type: '',
    experience_level: '',
    industry: '',
    min_salary: '',
    max_salary: '',
    currency: '',
    salary_type: '',
    bid_budget: '',
    bid_candidates: '',
    description: '',
    requirements: '',
    responsibilities: '',
    skills_required: '',
    deadline: '',
    vacancies: '',
    is_published: true
  });
  const router = useRouter();

  useEffect(() => {
    setIsBrowser(true);
    if (isBrowser) {
      Modal.setAppElement(document.body);
    }
  }, [isBrowser]);

  useEffect(() => {
    if (data) {
      setFormData({
        ...data,
        deadline: new Date(data.deadline).toISOString().split('T')[0]
      });
    }
  }, [data]);

  const handleClose = () => {
    setModalIsOpen(false);
    setShowDeleteConfirm(false);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${data.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update job');
      }

      toast.success('Job updated successfully');
      console.log('jobs CONTEXT:', jobs);
      setJobs(jobs.map(job => job.id === data.id ? { ...job, ...formData } : job));
      setIsEditing(false);
      // window.location.reload();
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Failed to update job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${data.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      toast.success('Job deleted successfully');
      handleClose();
      // Refresh the page or update the jobs list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job. Please try again.');
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
          <FiEdit2 size={16} />
        </motion.button>
        <motion.button 
          onClick={() => setModalIsOpen(true)} 
          className={styles.viewButton}
          title="View job details"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiEye size={16} />
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
                <h2 className={styles.heading}>{isEditing ? 'Edit Job' : 'Job Details'}</h2>
                <div className={styles.headerActions}>
                  {!isEditing && (
                    <>
                      <motion.button 
                        onClick={handleEdit}
                        className={styles.editButton}
                        title="Edit job"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaEdit className="me-2" /> Edit
                      </motion.button>
                      <motion.button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className={styles.deleteButton}
                        title="Delete job"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaTrash className="me-2" /> Delete
                      </motion.button>
                    </>
                  )}
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

              {isEditing ? (
                <form onSubmit={handleUpdate} className={styles.editForm}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Job Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Company Name</label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Company Website</label>
                      <input
                        type="url"
                        name="company_website"
                        value={formData.company_website}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Company Email</label>
                      <input
                        type="email"
                        name="company_email"
                        value={formData.company_email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Work Mode</label>
                      <select
                        name="work_mode"
                        value={formData.work_mode}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="onsite">Onsite</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Job Type</label>
                      <select
                        name="job_type"
                        value={formData.job_type}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Experience Level</label>
                      <select
                        name="experience_level"
                        value={formData.experience_level}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="entry">Entry</option>
                        <option value="intern">Intern</option>
                        <option value="junior">Junior</option>
                        <option value="mid">Mid</option>
                        <option value="senior">Senior</option>
                        <option value="lead">Lead</option>
                        <option value="manager">Manager</option>
                        <option value="director">Director</option>
                        <option value="executive">Executive</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Industry</label>
                      <input
                        type="text"
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Minimum Salary</label>
                      <input
                        type="number"
                        name="min_salary"
                        value={formData.min_salary}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Maximum Salary</label>
                      <input
                        type="number"
                        name="max_salary"
                        value={formData.max_salary}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Currency</label>
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="INR">INR</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Salary Type</label>
                      <select
                        name="salary_type"
                        value={formData.salary_type}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="yearly">Yearly</option>
                        <option value="monthly">Monthly</option>
                        <option value="hourly">Hourly</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Bid Budget</label>
                      <input
                        type="number"
                        name="bid_budget"
                        value={formData.bid_budget}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>No of Candidates</label>
                      <input
                        type="number"
                        name="bid_candidates"
                        value={formData.bid_candidates}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Application Deadline</label>
                      <input
                        type="date"
                        name="deadline"
                        value={formData.deadline}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Number of Vacancies</label>
                      <input
                        type="number"
                        name="vacancies"
                        value={formData.vacancies}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name="is_published"
                          checked={formData.is_published}
                          onChange={handleInputChange}
                        />
                        Publish Job
                      </label>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={4}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Requirements</label>
                    <textarea
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleInputChange}
                      required
                      rows={4}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Responsibilities</label>
                    <textarea
                      name="responsibilities"
                      value={formData.responsibilities}
                      onChange={handleInputChange}
                      required
                      rows={4}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Skills Required</label>
                    <textarea
                      name="skills_required"
                      value={formData.skills_required}
                      onChange={handleInputChange}
                      required
                      rows={2}
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
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
                      {isLoading ? 'Updating...' : 'Update Job'}
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
                      <p><strong>Bid Budget:</strong> {data.bid_budget} {data.currency}</p>
                      <p><strong>Required Candidates:</strong> {data.bid_candidates}</p>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onRequestClose={() => setShowDeleteConfirm(false)}
        style={customStyles}
        contentLabel="Delete Confirmation"
        ariaHideApp={isBrowser}
      >
        <div className={styles.deleteConfirmModal}>
          <h3>Confirm Delete</h3>
          <p>Are you sure you want to delete this job posting? This action cannot be undone.</p>
          <div className={styles.deleteConfirmButtons}>
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              className={styles.confirmDeleteButton}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
