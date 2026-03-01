"use client";
import { useState, useEffect } from "react";
import Modal from "react-modal";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import { toast } from 'react-toastify';
import axios from 'axios';
import styles from './EmailPreferencesModal.module.css';

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

const EmailPreferencesModal = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState({
    security_alerts: true,
    product_updates: true,
    newsletter: true,
    communityUpdates: false,
    marketingEmails: false,
    job_alerts: true,
    job_alerts_frequency: 'daily',
    job_alerts_time: '09:00',
    job_alerts_days: 'monday',
    job_alerts_days_of_week: 'monday',
    email_notifications: true,
    email_notifications_frequency: 'daily',
    email_notifications_time: '09:00',
    email_notifications_days: 'monday',
    email_notifications_days_of_week: 'monday'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
    if (isBrowser) {
      Modal.setAppElement(document.body);
    }
  }, [isBrowser]);

  useEffect(() => {
    if (isOpen) {
      const fetchPreferences = async () => {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/email-preference/`,
            {
              headers: {
                Authorization: `Bearer ${Cookies.get("access_token")}`,
              },
            }
          );
          setPreferences(response.data);
        } catch (error) {
          console.error("Error fetching preferences:", error);
          toast.error("Failed to load email preferences");
        }
      };
      fetchPreferences();
    }
  }, [isOpen]);

  const handlePreferenceChange = (preference, value) => {
    setPreferences(prev => ({
      ...prev,
      [preference]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setSuccess(false);

      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/email-preference/`,
        preferences,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("access_token")}`,
          },
        }
      );

      toast.success("Email preferences updated successfully!");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences. Please try again.");
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
      contentLabel="Email Preferences"
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
              <h2 className={styles.heading}>Email Preferences</h2>
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

            <p className={styles.description}>
              Choose which emails you&apos;d like to receive from us. You can update these preferences at any time.
            </p>

            <motion.div variants={containerVariants}>
              <div className={styles.preferenceGroup}>
                <h3 className={styles.preferenceTitle}>Account & Security</h3>
                <div className={styles.preferenceItem}>
                  <input
                    type="checkbox"
                    id="security_alerts"
                    className={styles.checkbox}
                    checked={preferences.security_alerts}
                    onChange={(e) => handlePreferenceChange("security_alerts", e.target.checked)}
                  />
                  <label htmlFor="security_alerts" className={styles.checkboxLabel}>
                    Security alerts
                  </label>
                </div>
                <p className={styles.subtext}>
                  Important notifications about your account security
                </p>
              </div>

              <div className={styles.preferenceGroup}>
                <h3 className={styles.preferenceTitle}>Product Updates</h3>
                <div className={styles.preferenceItem}>
                  <input
                    type="checkbox"
                    id="product_updates"
                    className={styles.checkbox}
                    checked={preferences.product_updates}
                    onChange={(e) => handlePreferenceChange("product_updates", e.target.checked)}
                  />
                  <label htmlFor="product_updates" className={styles.checkboxLabel}>
                    Product updates and announcements
                  </label>
                </div>
                <div className={styles.preferenceItem}>
                  <input
                    type="checkbox"
                    id="newsletter"
                    className={styles.checkbox}
                    checked={preferences.newsletter}
                    onChange={(e) => handlePreferenceChange("newsletter", e.target.checked)}
                  />
                  <label htmlFor="newsletter" className={styles.checkboxLabel}>
                    Weekly newsletter
                  </label>
                </div>
                <p className={styles.subtext}>
                  Tips, news, and updates about our products
                </p>
              </div>

              <div className={styles.preferenceGroup}>
                <h3 className={styles.preferenceTitle}>Job Alerts</h3>
                <div className={styles.preferenceItem}>
                  <input
                    type="checkbox"
                    id="job_alerts"
                    className={styles.checkbox}
                    checked={preferences.job_alerts}
                    onChange={(e) => handlePreferenceChange("job_alerts", e.target.checked)}
                  />
                  <label htmlFor="job_alerts" className={styles.checkboxLabel}>
                    Job alerts
                  </label>
                </div>
                {preferences.job_alerts && (
                  <div className={styles.preferenceSubGroup}>
                    <div className={styles.preferenceItem}>
                      <label htmlFor="job_alerts_frequency" className={styles.selectLabel}>
                        Frequency:
                      </label>
                      <select
                        id="job_alerts_frequency"
                        value={preferences.job_alerts_frequency}
                        onChange={(e) => handlePreferenceChange("job_alerts_frequency", e.target.value)}
                        className={styles.select}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className={styles.preferenceItem}>
                      <label htmlFor="job_alerts_time" className={styles.selectLabel}>
                        Time:
                      </label>
                      <input
                        type="time"
                        id="job_alerts_time"
                        value={preferences.job_alerts_time}
                        onChange={(e) => handlePreferenceChange("job_alerts_time", e.target.value)}
                        className={styles.timeInput}
                      />
                    </div>
                    <div className={styles.preferenceItem}>
                      <label htmlFor="job_alerts_days" className={styles.selectLabel}>
                        Day:
                      </label>
                      <select
                        id="job_alerts_days"
                        value={preferences.job_alerts_days}
                        onChange={(e) => handlePreferenceChange("job_alerts_days", e.target.value)}
                        className={styles.select}
                      >
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.preferenceGroup}>
                <h3 className={styles.preferenceTitle}>Community & Marketing</h3>
                <div className={styles.preferenceItem}>
                  <input
                    type="checkbox"
                    id="communityUpdates"
                    className={styles.checkbox}
                    checked={preferences.communityUpdates}
                    onChange={(e) => handlePreferenceChange("communityUpdates", e.target.checked)}
                  />
                  <label htmlFor="communityUpdates" className={styles.checkboxLabel}>
                    Community updates
                  </label>
                </div>
                <div className={styles.preferenceItem}>
                  <input
                    type="checkbox"
                    id="marketingEmails"
                    className={styles.checkbox}
                    checked={preferences.marketingEmails}
                    onChange={(e) => handlePreferenceChange("marketingEmails", e.target.checked)}
                  />
                  <label htmlFor="marketingEmails" className={styles.checkboxLabel}>
                    Promotional offers
                  </label>
                </div>
                <p className={styles.subtext}>
                  News about events, promotions, and community activities
                </p>
              </div>
            </motion.div>

            {success && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.successMessage}
              >
                Preferences saved successfully!
              </motion.p>
            )}

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
                className={`${styles.button} ${styles.saveButton}`}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Preferences"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default EmailPreferencesModal;