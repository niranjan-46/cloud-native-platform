"use client";
import { useState, useEffect } from "react";
import Modal from "react-modal";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import { toast } from 'react-toastify';
import axios from 'axios';
import styles from './ChangePasswd.module.css';
import { FiEye, FiEyeOff } from "react-icons/fi";
import { ClipLoader } from "react-spinners";

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
    maxWidth: "500px",
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

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [currentPasswdVisible, setCurrentPasswdVisible] = useState(false);
  const [newPasswdVisible, setNewPasswdVisible] = useState(false);
  const [confirmPasswdVisible, setConfirmPasswdVisible] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
    if (isBrowser) {
      Modal.setAppElement(document.body);
    }
  }, [isBrowser]);

  const handleSubmit = async () => {
    try {
      setError("");
      
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("All fields are required.");
        return;
      }
      
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match.");
        return;
      }

      setIsLoading(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/change-password/`,
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("access_token")}`,
          },
        }
      );

      toast.success("Password changed successfully!");
      onClose();
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to change password. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isBrowser) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel="Change Password"
      ariaHideApp={isBrowser}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
      closeTimeoutMS={300}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={styles.modalContainer}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.heading}>Change Password</h2>
              <motion.button 
                onClick={onClose} 
                className={styles.closeButton}
                aria-label="Close modal"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.errorText}
              >
                {error}
              </motion.p>
            )}

            <motion.div 
              variants={containerVariants}
            >
              <motion.div 
                className={styles.inputGroup}
                variants={itemVariants}
              >
                <label className={styles.label}>
                  Current Password
                </label>
                <div className="input-group">
                  <input
                    type={currentPasswdVisible ? "text" : "password"}
                    className={`${styles.input} form-control`}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <span className="input-group-text" onClick={() => setCurrentPasswdVisible(!currentPasswdVisible)} style={{ cursor: 'pointer' }}>
                    {currentPasswdVisible ? <FiEyeOff /> : <FiEye />}
                  </span>
                </div>
              </motion.div>

              <motion.div 
                className={styles.inputGroup}
                variants={itemVariants}
              >
                <label className={styles.label}>
                  New Password
                </label>
                <div className="input-group">
                  <input
                    type={newPasswdVisible ? "text" : "password"}
                    className={`${styles.input} form-control`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <span className="input-group-text" onClick={() => setNewPasswdVisible(!newPasswdVisible)} style={{ cursor: 'pointer' }}>
                    {newPasswdVisible ? <FiEyeOff /> : <FiEye />}
                  </span>
                </div>
              </motion.div>

              <motion.div 
                className={styles.inputGroup}
                variants={itemVariants}
              >
                <label className={styles.label}>
                  Confirm New Password
                </label>
                <div className="input-group">
                  <input
                    type={confirmPasswdVisible ? "text" : "password"}
                    className={`${styles.input} form-control`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <span className="input-group-text" onClick={() => setConfirmPasswdVisible(!confirmPasswdVisible)} style={{ cursor: 'pointer' }}>
                    {confirmPasswdVisible ? <FiEyeOff /> : <FiEye />}
                  </span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              className={styles.buttonGroup}
              variants={itemVariants}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className={`${styles.button} ${styles.cancelButton}`}
                disabled={isLoading}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className={`${styles.button} ${styles.submitButton}`}
                disabled={isLoading}
              >
                {isLoading ? <span className="d-flex align-items-center gap-2"><ClipLoader color="#fff" size={17} /> Changing...</span> : "Change"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default ChangePasswordModal;