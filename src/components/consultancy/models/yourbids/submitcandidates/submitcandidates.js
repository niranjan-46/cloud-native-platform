"use client";
import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2, Users, FileIcon, ExternalLink } from 'lucide-react';
import Modal from 'react-modal';
import styles from './page.module.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

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

export default function SubmitCandidates({ bidId }) {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [submittedResumes, setSubmittedResumes] = useState([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
    if (isBrowser) {
      Modal.setAppElement(document.body);
    }
  }, [isBrowser]);

  useEffect(() => {
    if (modalIsOpen) {
      fetchSubmittedResumes();
    }
  }, [modalIsOpen]);

  const fetchSubmittedResumes = async () => {
    try {
      setIsLoadingResumes(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/candidate-submissions/${bidId}/`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch resumes');
      }

      const data = await response.json();
      if (data && data.length > 0) {
        setSubmittedResumes(data[0].resumes || []);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to load submitted resumes');
    } finally {
      setIsLoadingResumes(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const newCandidates = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: '',
      status: 'pending',
      error: null
    }));
    setCandidates(prev => [...prev, ...newCandidates]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true
  });

  const handleNameChange = (id, name) => {
    setCandidates(prev =>
      prev.map(candidate =>
        candidate.id === id ? { ...candidate, name } : candidate
      )
    );
  };

  const removeCandidate = (id) => {
    setCandidates(prev => prev.filter(candidate => candidate.id !== id));
  };

  const uploadCandidate = async (candidate) => {
    const formData = new FormData();
    formData.append('resume', candidate.file);
    formData.append('name', candidate.name);
    formData.append('bid_id', bidId);

    try {
      // First upload the file to get the URL
      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload-resume/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.detail || 'File upload failed');
      }

      const uploadData = await uploadResponse.json();
      return {
        name: candidate.name,
        resume: uploadData.url
      };
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async () => {
    const invalidCandidates = candidates.filter(c => !c.name.trim());
    if (invalidCandidates.length > 0) {
      toast.error('Please provide names for all candidates');
      return;
    }

    setIsLoading(true);
    try {
      // First upload all files and get their URLs
      const uploadPromises = candidates.map(async (candidate) => {
        try {
          setUploadProgress(prev => ({
            ...prev,
            [candidate.id]: 'uploading'
          }));

          const uploadResult = await uploadCandidate(candidate);
          
          setUploadProgress(prev => ({
            ...prev,
            [candidate.id]: 'success'
          }));

          return uploadResult;
        } catch (error) {
          setUploadProgress(prev => ({
            ...prev,
            [candidate.id]: 'error'
          }));
          throw error;
        }
      });

      const uploadResults = await Promise.all(uploadPromises);

      // Then submit all candidates with their resume URLs
      const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/submit-candidates/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        },
        body: JSON.stringify({
          bid_id: bidId,
          candidates: uploadResults
        })
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.detail || 'Failed to submit candidates');
      }

      const responseData = await submitResponse.json();
      toast.success(responseData.detail || 'Candidates submitted successfully');
      handleClose();
    } catch (error) {
      console.error('Error submitting candidates:', error);
      toast.error(error.message || 'Failed to submit candidates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setModalIsOpen(false);
    setCandidates([]);
    setUploadProgress({});
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className={styles.successIcon} />;
      case 'error':
        return <AlertCircle className={styles.errorIcon} />;
      case 'uploading':
        return <Loader2 className={styles.loadingIcon} />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return styles.pendingStatus;
      case 'shortlisted':
        return styles.shortlistedStatus;
      case 'rejected':
        return styles.rejectedStatus;
      case 'hired':
        return styles.hiredStatus;
      default:
        return styles.defaultStatus;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (resumeUrl) => {
    const extension = resumeUrl.split('.').pop().toLowerCase();
    if (['pdf'].includes(extension)) {
      return <FileText className={styles.fileIcon} />;
    }
    return <FileIcon className={styles.fileIcon} />;
  };

  if (!isBrowser) return null;

  return (
    <>
      <motion.button 
        onClick={() => setModalIsOpen(true)} 
        className={styles.actionButton}
        title="Submit Candidates"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Users size={16} />
      </motion.button>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={handleClose}
        style={customStyles}
        contentLabel="Submit Candidates"
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
                <h2 className={styles.heading}>Submit Candidates</h2>
                <motion.button 
                  onClick={handleClose} 
                  className={styles.closeButton}
                  aria-label="Close modal"
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <motion.div 
                className={styles.modalContent}
                variants={containerVariants}
              >
                <div
                  {...getRootProps()}
                  className={`${styles.dropzone} ${isDragActive ? styles.dragActive : ''}`}
                >
                  <input {...getInputProps()} />
                  <Upload size={48} className={styles.uploadIcon} />
                  <p>Drag & drop resumes here, or click to select files</p>
                  <p className={styles.fileTypes}>Supported formats: PDF, PNG, JPG (max 10MB)</p>
                </div>

                <AnimatePresence>
                  {candidates.length > 0 && (
                    <motion.div
                      className={styles.candidatesList}
                      variants={itemVariants}
                    >
                      {candidates.map((candidate) => (
                        <motion.div
                          key={candidate.id}
                          className={styles.candidateItem}
                          variants={itemVariants}
                        >
                          <div className={styles.candidateInfo}>
                            <FileText className={styles.fileIcon} />
                            <input
                              type="text"
                              placeholder="Enter candidate name"
                              value={candidate.name}
                              onChange={(e) => handleNameChange(candidate.id, e.target.value)}
                              className={styles.nameInput}
                            />
                            <span className={styles.fileName}>{candidate.file.name}</span>
                            {getStatusIcon(uploadProgress[candidate.id])}
                          </div>
                          <button
                            onClick={() => removeCandidate(candidate.id)}
                            className={styles.removeButton}
                            disabled={isLoading}
                          >
                            <X size={20} />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {candidates.length > 0 && (
                  <motion.button
                    className={styles.submitButton}
                    onClick={handleSubmit}
                    disabled={isLoading}
                    variants={itemVariants}
                  >
                    {isLoading ? 'Uploading...' : 'Submit Candidates'}
                  </motion.button>
                )}

                <div className={styles.submittedResumes}>
                  <h3 className={styles.sectionTitle}>Submitted Resumes: <span className={styles.submittedCount}>{submittedResumes.length}</span></h3>
                  {isLoadingResumes ? (
                    <div className={styles.loadingState}>
                      <Loader2 className={styles.loadingIcon} />
                      <p>Loading resumes...</p>
                    </div>
                  ) : submittedResumes.length > 0 ? (
                    <div className={styles.resumesGrid}>
                      {submittedResumes.map((resume) => (
                        <motion.div
                          key={resume.id}
                          className={styles.resumeCard}
                          variants={itemVariants}
                        >
                          <div className={styles.resumeHeader}>
                            {getFileIcon(resume.resume)}
                            <span className={styles.resumeName}>{resume.name}</span>
                          </div>
                          <div className={styles.resumeDetails}>
                            <span className={`${styles.statusBadge} ${getStatusBadgeClass(resume.status)}`}>
                              {resume.status}
                            </span>
                            <span className={styles.submittedDate}>
                              {formatDate(resume.created_at)}
                            </span>
                          </div>
                          <span className="text-danger small" style={{ fontSize: '12px' }}>{resume?.rejection_reason}</span>
                          <a
                            href={resume.resume}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.viewResume}
                          >
                            <ExternalLink size={16} />
                            View Resume
                          </a>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noResumes}>No resumes submitted yet</p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </>
  );
}
