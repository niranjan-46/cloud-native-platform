"use client";
import { useState, useEffect } from "react";
import Modal from "react-modal";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import { toast } from 'react-toastify';
import axios from 'axios';
import styles from './DeleteAccountModal.module.css';
import { ClipLoader } from "react-spinners";
import { logout } from "@/utils/logout";
import { useRouter } from "next/navigation";




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

const DeleteAccountModal = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [timer, setTimer] = useState(60); // 60 seconds = 1 minute
  const [isTimerActive, setIsTimerActive] = useState(false);
  const router = useRouter();
  useEffect(() => {
    setIsBrowser(true);
    if (isBrowser) {
      Modal.setAppElement(document.body);
    }
  }, [isBrowser]);

  useEffect(() => {
    // Start timer when modal opens
    if (isOpen && !isTimerActive) {
      setIsTimerActive(true);
      setTimer(60);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const handleSubmit = async () => {
    try {
      setError("");
      
      if (!password) {
        setError("Please enter your password to confirm account deletion.");
        return;
      }

      setIsLoading(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/delete-account/`,
        { password },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("access_token")}`,
          },
        }
      );

      toast.success("Account deleted successfully. Goodbye!");
      
      onClose();

      logout(router);
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to delete account. Please try again.";
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
      contentLabel="Delete Account"
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
              <h2 className={styles.heading}>Delete Account</h2>
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

            <div className={styles.warningSection}>
              <h3 className={styles.warningTitle}>Warning: This action is permanent</h3>
              <p className={styles.warningText}>
                Deleting your account will immediately remove all your data including:
              </p>
              <ul className={styles.warningText}>
                <li>- Your profile information</li>
                <li>- All saved preferences</li>
                <li>- Any connected accounts</li>
                <li>- All your content and history</li>
              </ul>
              <p className={styles.warningText}>
                This action cannot be undone. Please be certain before proceeding.
              </p>
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

            <motion.div variants={containerVariants}>
              <motion.div 
                className={styles.inputGroup}
                variants={itemVariants}
              >
                <label className={styles.label}>
                  Enter your password to confirm deletion
                </label>
                <input
                  type="password"
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || timer > 0}
                />
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
                className={`${styles.button} ${styles.deleteButton}`}
                disabled={isLoading || timer > 0}
              >
                {isLoading ? <span className="d-flex align-items-center gap-2"><ClipLoader color="#fff" size={17} /> Deleting...</span> : `Delete Account ${timer > 0 ? `(${timer}s)` : ''}`}
              </motion.button>
            </motion.div>

            {timer > 0 && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.timerText}
              >
                Please read the above information carefully. Delete button will be enabled in {timer} seconds.
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default DeleteAccountModal;