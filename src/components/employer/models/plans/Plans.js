import React, { useState, useEffect, useContext } from 'react';
import Modal from 'react-modal';
import styles from './page.module.css';
import { 
  FiX, 
  FiStar, 
  FiCheck, 
  FiCreditCard, 
  FiDollarSign,
  FiPackage,
  FiAward,
  FiTrendingUp,
  FiUsers,
  FiDatabase,
  FiHeadphones,
  FiUserCheck,
  FiBarChart2,
  FiTarget,
  FiClock,
  FiAlertCircle,
  FiMail,
  FiRefreshCw
} from 'react-icons/fi';
import { FaCheckCircle } from 'react-icons/fa'
import axios from 'axios';
import { Spinner } from 'react-bootstrap';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { initializeRazorpay } from '@/utils/razorpay';
import { PlanContext } from '@/context/shared/Plan';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';


// Set the app element to the root div
if (typeof window !== 'undefined') {
  Modal.setAppElement('body');
}

// Custom modal styles
const customStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: 0,
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    background: 'white',
  },
};

const Plans = ({ isOpen, onClose, userType, currentPlanId }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const {userSubscription, setUserSubscription} = useContext(PlanContext);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isLoadingVerifyPayment, setIsLoadingVerifyPayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [showPaymentFailedModal, setShowPaymentFailedModal] = useState(false);
  const [paymentFailedDetails, setPaymentFailedDetails] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/api/plans/`);
        const allPlans = Array.isArray(response.data) ? response.data : [];
        const normalizedUserType = (userType || '').toLowerCase();
        const filteredPlans = allPlans.filter(
          (plan) => (plan?.user_type || '').toLowerCase() === normalizedUserType
        );
        setPlans(filteredPlans);
        setLoading(false);
      } catch (err) {
        toast.error('Failed to load plans. Please try again later.');
        setError('Failed to load plans. Please try again later.');
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen, userType]);

  useEffect(() => {
    const fetchUserSubscription = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/subscribe/`,
          {
            headers: {
              'Authorization': `Bearer ${Cookies.get('access_token')}`
            }
          }
        );
        if (response.data.has_subscription) {
          setUserSubscription(response.data);
        } else {
          setUserSubscription(null);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setUserSubscription(null);
      }
    };
    fetchUserSubscription();
  }, []);

  const initializePayment = async (planId, planPrice) => {
    try {
      setProcessing(true);
      setProcessingPlanId(planId);
      setError(null);

      if (!Cookies.get('access_token')) {
        throw new Error('Login required. Please sign in again.');
      }

      if (!API_URL) {
        throw new Error('API URL is not configured.');
      }

      if (parseInt(planPrice) === 0) {
        setShowSupportModal(true);
        setProcessing(false);
        setProcessingPlanId(null);
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/subscribe/create-payment/`,
        { plan_id: planId },
        {
          headers: {
            'Authorization': `Bearer ${Cookies.get('access_token')}`
          }
        }
      );

      if (!response.data) {
        throw new Error('Failed to create payment order');
      }

      const paymentData = response.data;
      const razorpayKey = paymentData.razorpay_key_id || RAZORPAY_KEY;
      if (!razorpayKey) {
        throw new Error('Razorpay key is missing in backend/frontend configuration.');
      }
      setPaymentDetails(paymentData);

      // Initialize Razorpay
      const Razorpay = await initializeRazorpay();
      if (!Razorpay) {
        throw new Error('Razorpay SDK failed to load');
      }

      const options = {
        key: razorpayKey,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'Zyukthi',
        description: 'Subscription Payment',
        order_id: paymentData.order_id,
        handler: async function (response) {
          try {
            setIsLoadingVerifyPayment(true);
            // Verify payment using the paymentData from closure
            const verifyResponse = await axios.post(
              `${API_URL}/api/subscribe/verify-payment/`,
              {
                payment_id: paymentData.payment_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              },
              {
                headers: {
                  'Authorization': `Bearer ${Cookies.get('access_token')}`
                }
              }
            );

            if (verifyResponse.data.status === 'success') {
              toast.success(verifyResponse.data.message);
              // Fetch updated subscription
              const subscriptionResponse = await axios.get(
                `${API_URL}/api/subscribe/`,
                {
                  headers: {
                    'Authorization': `Bearer ${Cookies.get('access_token')}`
                  }
                }
              );
              setUserSubscription(subscriptionResponse.data);
              // onClose();
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error(error.response?.data?.error || 'Payment verification failed. Please try again.');
            
            // Set payment failed details and show modal
            setPaymentFailedDetails({
              message: error.response?.data?.error || 'Payment verification failed. Please try again.',
              order_id: paymentData.order_id,
              payment_id: paymentData.payment_id,
              amount: paymentData.amount,
              currency: paymentData.currency,
              email: userSubscription?.user?.email || '',
              contact: userSubscription?.user?.phone || '',
              error_code: error.response?.data?.error_code || 'UNKNOWN_ERROR',
              timestamp: new Date().toISOString()
            });
            setShowPaymentFailedModal(true);
          } finally {
            setIsLoadingVerifyPayment(false);
          }
        },
        prefill: {
          name: userSubscription?.user?.name || '',
          email: userSubscription?.user?.email || '',
          contact: userSubscription?.user?.phone || ''
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function() {
            toast.info('Payment cancelled');
          }
        }
      };

      const razorpay = new Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error initializing payment:', error);
      toast.error(error.response?.data?.error || 'Failed to initialize payment. Please try again.');
      setError(error.response?.data?.error || 'Failed to initialize payment. Please try again.');
    } finally {
      setProcessing(false);
      setProcessingPlanId(null);
    }
  };

  const formatPrice = (price, currency) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getPlanIcon = (planName) => {
    switch (planName.toLowerCase()) {
      case 'starter':
        return <FiPackage className={styles.planIcon} />;
      case 'growth':
        return <FiTrendingUp className={styles.planIcon} />;
      case 'enterprise':
        return <FiAward className={styles.planIcon} />;
      case 'basic':
        return <FiPackage className={styles.planIcon} />;
      case 'pro':
        return <FiTrendingUp className={styles.planIcon} />;
      case 'elite':
        return <FiAward className={styles.planIcon} />;
      default:
        return <FiPackage className={styles.planIcon} />;
    }
  };

  const getFeatureIcon = (feature) => {
    switch (feature.toLowerCase()) {
      case 'job_posts':
        return <FiUsers />;
      case 'consultancy_bids':
      case 'bids':
        return <FiTarget />;
      case 'cv_database_access':
        return <FiDatabase />;
      case 'priority_support':
        return <FiHeadphones />;
      case 'dedicated_account_manager':
        return <FiUserCheck />;
      case 'candidate_management_dashboard':
        return <FiBarChart2 />;
      case 'analytics_access':
        return <FiBarChart2 />;
      case 'priority_matching':
        return <FiTarget />;
      default:
        return <FiCheck />;
    }
  };

  const renderDescriptionItems = (description) => {
    if (!description || typeof description !== 'object' || Array.isArray(description)) {
      return (
        <li className={styles.descriptionItem}>
          <span className={styles.descriptionIcon}>
            <FiCheck />
          </span>
          Features will be shown soon
        </li>
      );
    }

    return Object.entries(description).map(([key, value]) => {
      const formattedKey = key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      let displayValue = value;
      if (typeof value === 'boolean') {
        displayValue = value ? 'Yes' : 'No';
      } else if (value === 'unlimited') {
        displayValue = 'Unlimited';
      }

      return (
        <li key={key} className={styles.descriptionItem}>
          <span className={styles.descriptionIcon}>
            {getFeatureIcon(key)}
          </span>
          {formattedKey}: {displayValue}
        </li>
      );
    });
  };

  const isPopularPlan = (plan) => {
    // Define which plan should be highlighted as popular
    return plan.name.toLowerCase() === 'growth' || plan.name.toLowerCase() === 'pro';
  };

  if (loading) {
    return (
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        style={customStyles}
        contentLabel="Loading Plans"
      >
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
          <Spinner animation="border" role="status" className={`${['text-primary', 'text-white', 'text-success', 'text-danger', 'text-warning', 'text-info'][Math.floor(Math.random() * 6)]}`} />
        </div>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        style={customStyles}
        contentLabel="Error"
      >
        <div className="text-center text-danger py-4">
          <p className="mb-0">{error}</p>
          <button 
            className="btn btn-link mt-3" 
            onClick={() => setError(null)}
          >
            Try Again
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        className={styles.modalContent}
        overlayClassName={styles.modalOverlay}
        // style={customStyles}
        contentLabel="Subscription Plans"
        closeTimeoutMS={200}
      >
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <FiX />
        </button>
        
        <h2 className={styles.modalTitle}>
          <FiCreditCard className={styles.titleIcon} />
          {userSubscription?.has_subscription ? 'Upgrade Your Plan' : 'Choose Your Plan'}
        </h2>
        <div className={styles.plansContainer}>
          {plans.length === 0 && (
            <div className="text-center py-4">
              <p className="mb-2">No plans available for user type: <strong>{userType}</strong></p>
              <p className="text-muted mb-3">Please contact support to enable plans for this account.</p>
              <a href="mailto:niranjanannavarapu@gmail.com" className="btn btn-primary">
                Contact Sales
              </a>
            </div>
          )}
          {plans.map((plan) => {
            const isCurrentPlan = userSubscription?.has_subscription && userSubscription.plan.id === plan.id;
            const currentPlanPrice = Number(userSubscription?.plan?.price || 0);
            const isUpgrade = userSubscription?.has_subscription && Number(plan.price) > currentPlanPrice;
            const isProcessing = processingPlanId === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`${styles.planCard} ${
                  isCurrentPlan ? styles.currentPlan : ''
                } ${isPopularPlan(plan) ? styles.popularPlan : ''}`}
              >
                {isPopularPlan(plan) && (
                  <div className={styles.popularBadge}>
                    <FiStar />
                    Most Popular
                  </div>
                )}
                <h3 className={styles.planName}>
                  {getPlanIcon(plan.name)}
                  {plan.name}
                </h3>
                <div className={styles.planPrice}>
                  {parseInt(plan.price) !== 0 ? (formatPrice(plan.price, plan.currency)) : 'Custom'}
                  <span className={styles.pricePeriod}>/month</span>
                </div>
                <ul className={styles.planDescription}>
                  {renderDescriptionItems(plan.description)}
                </ul>
                <button
                  className={`${!isCurrentPlan ? styles.selectButton : styles.renewButton}`}
                  onClick={() => initializePayment(plan.id, plan.price)}
                  disabled={ processing || isLoadingVerifyPayment}
                >
                  {isProcessing || isLoadingVerifyPayment ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {plan.currency === 'INR' ? "₹ " : <FiDollarSign />}
                      {isCurrentPlan 
                        ? 'Renew Current Plan' 
                        : isUpgrade 
                          ? 'Upgrade Plan' 
                          : 'Select Plan'
                      }
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </Modal>

      <Modal
        isOpen={showSupportModal}
        onRequestClose={() => setShowSupportModal(false)}
        style={customStyles}
        contentLabel="Contact Support"
        closeTimeoutMS={200}
      >
        <button
          className={styles.closeButton}
          onClick={() => setShowSupportModal(false)}
          aria-label="Close"
        >
          <FiX />
        </button>

        <div className="text-center py-4 px-3">
          <h3 className="mb-3">Contact Support</h3>
          <p className="mb-4">For more information and personalized proposals, please contact our sales team.</p>

          <div className="border rounded p-4 bg-light text-start mx-auto" style={{ maxWidth: '400px' }}>
            <h5 className="text-primary mb-3"><FiAward /> Custom Plan</h5>
            <p className="fw-bold mb-1">Custom Pricing / month</p>
            <ul className="list-unstyled mb-3">
              <li><FaCheckCircle color="green" className="me-2" /> Job Posts: <strong>Unlimited</strong></li>
              <li><FaCheckCircle color="green" className="me-2" /> Priority Support: <strong>Yes</strong></li>
              <li><FaCheckCircle color="green" className="me-2" /> Dedicated Account Manager: <strong>Yes</strong></li>
              <li><FaCheckCircle color="green" className="me-2" /> Custom Feature Requests: <strong>Available</strong></li>
              <li><FaCheckCircle color="green" className="me-2" /> API Access & Integration Support: <strong>Included</strong></li>
            </ul>
            <p className="small text-muted">Get a tailored solution based on your business needs.</p>
          </div>

          <a
            href="mailto:niranjanannavarapu@gmail.com"
            className="btn btn-primary mt-4"
          >
            📧 Contact Sales: niranjanannavarapu@gmail.com
          </a>
        </div>
      </Modal>

      <Modal
        isOpen={showPaymentFailedModal}
        onRequestClose={() => setShowPaymentFailedModal(false)}
        style={customStyles}
        contentLabel="Payment Failed"
        closeTimeoutMS={200}
      >
        <button
          className={styles.closeButton}
          onClick={() => setShowPaymentFailedModal(false)}
          aria-label="Close"
        >
          <FiX />
        </button>

        <div className="text-center py-4 px-3">
          <div className="mb-4">
            <FiAlertCircle size={48} className="text-danger mb-3" />
            <h3 className="text-danger mb-2">Payment Failed</h3>
            <p className="text-muted mb-3">{paymentFailedDetails?.message}</p>
          </div>

          <div className="alert alert-info mb-4">
            <div className="d-flex align-items-center">
              <FiMail className="me-2" />
              <div>
                <strong>Check your email for updates!</strong>
                <p className="mb-0 small">We&apos; ve sent you an email with payment details and next steps. Please check your inbox and spam folder.</p>
              </div>
            </div>
          </div>

          <div className="border rounded p-4 bg-light text-start mx-auto mb-4" style={{ maxWidth: '500px' }}>
            <h5 className="text-primary mb-3">
              <FiCreditCard className="me-2" />
              Transaction Details
            </h5>
            <div className="row">
              <div className="col-md-6">
                <p className="mb-2"><strong>Order ID:</strong></p>
                <p className="text-muted small mb-3">{paymentFailedDetails?.order_id}</p>
                
                <p className="mb-2"><strong>Payment ID:</strong></p>
                <p className="text-muted small mb-3">{paymentFailedDetails?.payment_id}</p>
                
                <p className="mb-2"><strong>Amount:</strong></p>
                <p className="text-muted small mb-3">
                  {paymentFailedDetails?.amount && paymentFailedDetails?.currency 
                    ? formatPrice((paymentFailedDetails.amount / 100).toFixed(2), paymentFailedDetails.currency)
                    : 'N/A'
                  }
                </p>
              </div>
              <div className="col-md-6">
                <p className="mb-2"><strong>Currency:</strong></p>
                <p className="text-muted small mb-3">{paymentFailedDetails?.currency}</p>
                
                <p className="mb-2"><strong>Email:</strong></p>
                <p className="text-muted small mb-3">{paymentFailedDetails?.email}</p>
                
                <p className="mb-2"><strong>Contact:</strong></p>
                <p className="text-muted small mb-3">{paymentFailedDetails?.contact}</p>
              </div>
            </div>
            {paymentFailedDetails?.error_code && (
              <div className="mt-3 pt-3 border-top">
                <p className="mb-2"><strong>Error Code:</strong></p>
                <p className="text-danger small mb-0">{paymentFailedDetails.error_code}</p>
              </div>
            )}
          </div>

          <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
            <button
              className="btn btn-outline-primary"
              onClick={() => {
                setShowPaymentFailedModal(false);
                // Retry payment logic can be added here
              }}
            >
              <FiRefreshCw className="me-2" />
              Try Again
            </button>
            <a
              href={`mailto:niranjanannavarapu@gmail.com?subject=Payment Failed - Order ID: ${paymentFailedDetails?.order_id}`}
              className="btn btn-primary"
            >
              <FiMail className="me-2" />
              Contact Support
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Plans;
