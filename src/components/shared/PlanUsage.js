import React, { useState, useEffect, useContext } from 'react';
import { FiAlertCircle, FiCheckCircle, FiBriefcase, FiUsers, FiDatabase, FiStar, FiHeadphones, FiUserCheck, FiBarChart2 } from 'react-icons/fi';
import styles from './PlanUsage.module.css';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Spinner } from 'react-bootstrap';
import Plans from '@/components/employer/models/plans/Plans';
import { PlanContext } from '@/context/shared/Plan';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';


const PlanUsage = ({ userType='employer' }) => {
  const {userSubscription, setUserSubscription} = useContext(PlanContext);

  const [loading, setLoading] = useState(true);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState(0);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subscriptionRes, plansRes] = await Promise.all([
          axios.get(`${API_URL}/api/subscribe/`, {
            headers: { 'Authorization': `Bearer ${Cookies.get('access_token')}` }
          }),
          axios.get(`${API_URL}/api/plans/`, {
            headers: { 'Authorization': `Bearer ${Cookies.get('access_token')}` }
          })
        ]);
        setUserSubscription(subscriptionRes.data);
        setAvailablePlans(plansRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load subscription details');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
          <Spinner animation="border" role="status" className={`${['text-primary', 'text-white', 'text-success', 'text-danger', 'text-warning', 'text-info'][Math.floor(Math.random() * 6)]}`} />
      </div>
    );
  }

  if (!userSubscription?.has_subscription) {
    return (
      <>
        <div className={styles.noSubscription}>
          <FiAlertCircle size={48} className={`${styles.icon} text-warning mb-3`} />
          <h3 className={styles.title}>No Active Subscription</h3>
          <p className={styles.message}>You don&apos;t have an active subscription plan.</p>
          <button 
            className={`${styles.btnNO} btn btn-primary mt-3`}
            onClick={() => setIsPlansModalOpen(true)}
          >
            View Plans
          </button>
          <Plans 
            isOpen={isPlansModalOpen}
            onClose={() => setIsPlansModalOpen(false)}
            userType={userType}
            currentPlanId={currentPlanId}
          />
        </div>
      </>
    );
  }

  const calculateUsagePercentage = (used, limit) => {
    if (limit === 0 || limit === 'unlimited') return 0;
    return Math.min(100, ((limit-used) / limit) * 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return '#dc3545';
    if (percentage >= 70) return '#ffc107';
    return '#28a745';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFeatureIcon = (feature) => {
    const icons = {
      job_posts: <FiBriefcase color='green'/>,
      job_alerts: <FiAlertCircle color='green'/>,
      consultancy_bids: <FiUsers color='green'/>,
      employer_contact_access: <FiUserCheck color='green'/>,
      cv_database_access: <FiDatabase color='green'/>,
      priority_matching: <FiStar color='green'/>,
      priority_support: <FiHeadphones color='green'/>,
      dedicated_account_manager: <FiUserCheck color='green'/>,
      analytics_access: <FiBarChart2 color='green'/>,
      basic_applicant_management_dashboard: <FiDatabase color='green'/>,
      candidate_management_dashboard: <FiUsers color='green'/>,
      priority_customer_support: <FiHeadphones color='green'/>
    };
    return icons[feature] || <FiCheckCircle color='green'/>;
  };

  const renderFeature = (feature, value) => {
    if (typeof value === 'boolean') {
      return value ? (
        <div className={styles.featureItem}>
          {getFeatureIcon(feature)}
          <span>{feature.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
        </div>
      ) : null;
    }
    return (
      <div className={styles.featureItem}>
        {getFeatureIcon(feature)}
        <span>{feature.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}: {value}</span>
      </div>
    );
  };

  // Helper to get used and left
  const getUsageStats = (limit, total) => {
    if (total === 'unlimited' || total === 0) {
      return { used: 0, left: '∞' };
    }
    const used = total - limit;
    const left = limit;
    return { used: used < 0 ? 0 : used, left: left < 0 ? 0 : left };
  };

  return (
    <>
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.header}>
        <h2>Plan Usage</h2>
        <div className={styles.subscriptionInfo}>
          <span className={styles.status}>
            <FiCheckCircle className="text-success me-2" />
            Active Subscription
          </span>
          <span className={styles.validity}>
            Valid until {formatDate(userSubscription.end_date)}
          </span>
        </div>
      </div>

      <div className={styles.usageCards}>
        {userType==='employer'&&
        <motion.div 
          className={styles.usageCard}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3>Job Posts</h3>
          <div className={styles.progressContainer}>
            <motion.div 
              className={styles.progressBar}
              initial={{ width: 0 }}
              animate={{ 
                width: `${calculateUsagePercentage(userSubscription.job_limit, userSubscription.plan.description.job_posts)}%`,
                backgroundColor: getUsageColor(calculateUsagePercentage(userSubscription.job_limit, userSubscription.plan.description.job_posts))
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className={styles.usageDetails}>
            {(() => {
              const stats = getUsageStats(userSubscription.job_limit, userSubscription.plan.description.job_posts);
              return (
                <>
                  <span><strong>{stats.used}</strong> used</span>
                  <span><strong>{stats.left}</strong> left</span>
                </>
              );
            })()}
          </div>
        </motion.div>
        }

        <motion.div 
          className={styles.usageCard}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3>Bids</h3>
          <div className={styles.progressContainer}>
            <motion.div 
              className={styles.progressBar}
              initial={{ width: 0 }}
              animate={{ 
                width: `${calculateUsagePercentage(userSubscription.bid_limit, userSubscription.plan.description.consultancy_bids)}%`,
                backgroundColor: getUsageColor(calculateUsagePercentage(userSubscription.bid_limit, userSubscription.plan.description.consultancy_bids))
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className={styles.usageDetails}>
            {(() => {
              const stats = getUsageStats(userSubscription.bid_limit, userSubscription.plan.description.consultancy_bids);
              return (
                <>
                  <span><strong>{stats.used}</strong> used</span>
                  <span><strong>{stats.left}</strong> left</span>
                </>
              );
            })()}
          </div>
        </motion.div>
      </div>

      <div className={styles.subscriptionDetails}>
        <h3>Current Plan: <strong>{userSubscription.plan.name}</strong></h3>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.label}>Start Date</span>
            <span className={styles.value}>{formatDate(userSubscription.start_date)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>End Date</span>
            <span className={styles.value}>{formatDate(userSubscription.end_date)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>Status</span>
            <span className={`${styles.value} ${styles.status}`}>
              {userSubscription.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.label}>Price</span>
            <span className={styles.value}>{userSubscription.plan.currency === "INR" ? "₹ " : "$ "} {userSubscription.plan.price}</span>
          </div>
        </div>

        <div className={styles.features}>
          <h4>Plan Features</h4>
          <div className={styles.featuresGrid}>
            {Object.entries(userSubscription.plan.description).map(([feature, value]) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {renderFeature(feature, value)}
              </motion.div>
            ))}
          </div>
        </div>

        <div className={styles.upgradeSection}>
          <h4>Available Plans</h4>
          <div className={styles.plansGrid}>
            {availablePlans
              .filter(plan => plan.user_type === userSubscription.plan.user_type && plan.id !== userSubscription.plan.id)
              .map(plan => (
                <motion.div
                  key={plan.id}
                  className={styles.planCard}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <h5>{plan.name}</h5>
                  <div className={styles.planPrice}>
                    {plan.currency === "INR" ? "₹ " : "$ "} {parseInt(plan.price) === 0 ? "Custom" : plan.price}
                  </div>
                  <button
                    className={`${styles.btn} btn btn-outline-primary mt-3`}
                    onClick={() => setIsPlansModalOpen(true)}
                  >
                   {parseInt(plan.price) > parseInt(userSubscription.plan.price) ? "Upgrade to " + plan.name : "Switch to " + plan.name} 
                  </button>
                </motion.div>
              ))}
          </div>
        </div>
      </div>
    </motion.div>
    <Plans 
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        userType={userType}
        currentPlanId={currentPlanId}
    />
    </>
  );
};

export default PlanUsage;
