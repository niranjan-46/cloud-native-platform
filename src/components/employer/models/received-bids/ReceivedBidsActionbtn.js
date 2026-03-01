"use client";
import { useState, useEffect, useContext } from "react";
import Modal from "react-modal";
import styles from "./page.module.css";
import { FaEye, FaTimes, FaBuilding, FaChevronDown, FaChevronUp, FaHandshake, FaGavel, FaPencil } from "react-icons/fa";
import { FiEye, FiPencil } from "react-icons/fi";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import { ReceivedBidsContext } from "@/context/employer/Receivedbids";
import { initializeRazorpay } from "@/utils/razorpay";
import axios from "axios";
import { Spinner } from "react-bootstrap";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

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
  const { bids, setBids } = useContext(ReceivedBidsContext);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidData, setBidData] = useState({
    proposal: '',
    fee: ''
  });
  const [status, setStatus] = useState(data.status === 'approved' ? 'approve' : data.status === 'rejected' ? 'reject' : 'pending');
  const [isAgreed, setIsAgreed] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(false);
  const router = useRouter();

  const [checkPaymentForAlert, setCheckPaymentForAlert] = useState(false);
  const [isLoadingPaymentForAlert, setIsLoadingPaymentForAlert] = useState(false);

  const [isLoadingVerifyPayment, setIsLoadingVerifyPayment] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
    if (isBrowser) {
      Modal.setAppElement(document.body);
    }
  }, [isBrowser]);



  const checkPaymentStatusForAlert = async () => {
    setIsLoadingPaymentForAlert(true);
    try{
    const response = await axios.get(`${API_URL}/api/get-payment-details/${data.job.id}/`, {
      headers: {
        'Authorization': `Bearer ${Cookies.get('access_token')}`
      }
    });
  }catch(error){
    setCheckPaymentForAlert(true);
  }finally{
    setIsLoadingPaymentForAlert(false);
  }
  }


  const handleClose = () => {
    setModalIsOpen(false);
    setShowBidForm(false);
    setPaymentDetails(null);
  };


  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === 'approve' || newStatus === 'reject') {
      setStatus(newStatus);
      setShowAgreement(true);
      return;
    }
  };

  const initializePayment = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/create-order/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        },
        body: JSON.stringify({
          bid_id: data.id
        })
      });
      const orderData = await response.json();

      if (!response.ok) {
        toast.error(orderData.error);
        throw new Error('Failed to create payment order');
      }

      setPaymentDetails(orderData);

      if(orderData.status === 'approved'){
        toast.success('Bid has been approved.');
        setStatus(status);
        setBids(bids.map(bid => bid.id === data.id ? { ...bid, status: 'approved' } : bid));
        setShowAgreement(false);
        setIsAgreed(false);
        setPaymentStatus(true);
        return;
      }

      // Initialize Razorpay
      const Razorpay = await initializeRazorpay();
      if (!Razorpay) {
        throw new Error('Razorpay SDK failed to load');
      }

      const razorpayKey = orderData.razorpay_key_id || RAZORPAY_KEY;
      if (!razorpayKey) {
        throw new Error('Razorpay key is missing in backend/frontend configuration.');
      }
      
      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'HireLink',
        description: 'Payment for Bid Approval',
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            setIsLoadingVerifyPayment(true);
            // Verify payment
            const verifyResponse = await fetch(`${API_URL}/api/verify-payment/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Cookies.get('access_token')}`
              },
              body: JSON.stringify({
                payment_id: orderData.payment_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              toast.error(verifyData.error);
              throw new Error('Payment verification failed');
            }

            // If payment is successful, proceed with bid approval
            console.log('verifyData= ', verifyData);  
            if (verifyData.status === 'success') {
              toast.success(`Payment successful! Bid has been approved.`);
              setStatus(status);
              setBids(bids.map(bid => bid.id === data.id ? { ...bid, status: 'approved' } : bid));
              setShowAgreement(false);
              setIsAgreed(false);
              console.log('Payment successful= ', verifyData.status); 
              setPaymentStatus(true);
            }

          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed. Please try again.');
          } finally {
            setIsLoadingVerifyPayment(false);
          }
        },
        prefill: {
          name: data.consultancy.consultancy_name,
          email: data.job.company_email,
          contact: data.consultancy.phone_number
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
      toast.error(error.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmStatus = async () => {
    if (!isAgreed) {
      toast.error('Please agree to the terms before proceeding');
      return;
    }

    try {
      setIsLoading(true);
      
      if (status === 'approve' && !paymentStatus) {
        // Initialize payment for approval
        console.log('Initializing payment= ', paymentStatus);
        await initializePayment();
        return;
      }

      // For rejection, proceed normally
      const response = await fetch(`${API_URL}/api/bids/${data.id}/${status}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });

      if (!response.ok) {
        toast.error('Failed to update bid status');
        throw new Error('Failed to update bid status');
      }

      const responseData = await response.json();
      if (responseData) {
        toast.success(`Bid ${responseData.status} successfully! You will receive a confirmation email shortly.`);
        setStatus(status);
        setBids(bids.map(bid => bid.id === data.id ? { ...bid, status: responseData.status } : bid));
        setShowAgreement(false);
        setIsAgreed(false);
      }

    } catch (error) {
      console.error('Error updating bid status:', error);
      toast.error('Failed to update bid status. Please try again.');
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
          title="View bid details"
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.heading}>Bid Details</h2>
                <div className={styles.headerActions}>
                  <div className={styles.statusDropdown}>
                    <select
                      value={status}
                      onChange={async (e) => {
                        handleStatusUpdate(e.target.value);
                        if(e.target.value === 'approve' && data.status !== 'approved'){
                          await checkPaymentStatusForAlert();
                        }
                      }}
                      className={styles.statusSelect}
                      disabled={isLoading}
                    >
                      <option value="pending" disabled={true}>Pending</option>
                      <option value="approve">Approve</option>
                      <option value="reject">Reject</option>
                    </select>
                  </div>
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

              {showAgreement && (
                <>
                {status === 'approve' && isLoadingPaymentForAlert && data.status !== 'approved' ?
                <div className={styles.agreementSection} style={{textAlign: 'center'}}>
                  <div className={styles.agreementContent}>
                    <Spinner animation="border" role="status" />
                  </div>
                </div>
                : data.status !== 'approved' || status === 'reject' ? (
                <div className={styles.agreementSection}>
                  <div className={styles.agreementContent}>
                    <h3>Confirmation Required</h3>
                    <p>By proceeding with this action, you agree to:</p>
                    <ul>
                      <li>Confirm your decision to {status === 'approve' ? 'approve' : 'reject'} this bid</li>
                      {status === 'approve' && checkPaymentForAlert && (
                        <li>Make a payment of <strong className="text-primary">₹{(data.job.bid_budget/100*30).toLocaleString()}</strong> to approve this bid</li>
                      )}
                      <li>Receive a confirmation email with the agreement details</li>
                      <li>This action cannot be undone</li>
                    </ul>
                    <div className={styles.agreementCheckbox}>
                      <input
                        type="checkbox"
                        id="agreement"
                        checked={isAgreed}
                        onChange={(e) => setIsAgreed(e.target.checked)}
                      />
                      <label htmlFor="agreement">
                        I understand and agree to the terms above
                      </label>
                    </div>
                    <div className={styles.agreementActions}>
                      <button
                        onClick={() => {
                          setShowAgreement(false);
                          setIsAgreed(false);
                          setStatus('pending');
                        }}
                        className={styles.cancelButton}
                        disabled={isLoading || isLoadingVerifyPayment}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmStatus}
                        className={styles.confirmButton}
                        disabled={isLoading || isLoadingVerifyPayment || !isAgreed}
                      >
                        {isLoading || isLoadingVerifyPayment ? 'Processing...' : status === 'approve' && checkPaymentForAlert ? 'Proceed to Payment' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                </div>
                ) : (<></>)
                }
                </>
              )}

              <div className={styles.jobDetails}>
                {/* Consultancy Information */}
                <div className={styles.consultancySection}>
                  <h3 className={styles.sectionTitle}>Consultancy Information</h3>
                  <div className={styles.consultancyInfo}>
                    <div className={styles.infoRow}>
                      <p><strong>Name:</strong> {data.consultancy.consultancy_name}</p>
                      <p><strong>Specialization:</strong> {data.consultancy.specialization}</p>
                    </div>
                    <div className={styles.infoRow}>
                      <p><strong>Size:</strong> {data.consultancy.consultancy_size}</p>
                      <p><strong>Experience:</strong> {data.consultancy.experience_years || 'N/A'} years</p>
                    </div>
                    <div className={styles.infoRow}>
                      <p><strong>Address:</strong> {data.consultancy.office_address}</p>
                      <p><strong>Website:</strong> <a href={data.consultancy.website} target="_blank" rel="noopener noreferrer">{data.consultancy.website}</a></p>
                    </div>
                    <div className={styles.infoRow}>
                      <p><strong>Phone:</strong> {data.consultancy.phone_number}</p>
                      <p><strong>Verified:</strong> <span className={`${styles.statusBadge} ${data.consultancy.application_status === 'approved' ? styles.status_active : styles.status_inactive}`}>
                        {data.consultancy.application_status === 'approved' ? 'Yes' : 'No'}
                      </span></p>
                    </div>
                  </div>
                </div>

                {/* Job Information */}
                <div className={styles.jobSection}>
                  <h3 className={styles.sectionTitle}>Job Information</h3>
                  <div className={styles.companyHeader}>
                    <div className={styles.companyLogo}>
                      {data.company_logo ? (
                        <Image
                          src={data.job.profile_image}
                          alt={`${data.job.company_name} logo`}
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
                      <h3 className={styles.jobTitle}>{data.job.title}</h3>
                      <p className={styles.companyName}>{data.job.company_name}</p>
                    </div>
                  </div>

                  <div className={styles.jobInfo}>
                    <div className={styles.infoRow}>
                      <p><strong>Location:</strong> {data.job.location} ({data.job.work_mode})</p>
                      <p><strong>Type:</strong> {data.job.job_type}</p>
                    </div>
                    <div className={styles.infoRow}>
                      <p><strong>Experience Level:</strong> {data.job.experience_level}</p>
                      <p><strong>Industry:</strong> {data.job.industry}</p>
                    </div>
                    <div className={styles.infoRow}>
                      <p><strong>Salary:</strong> {data.job.min_salary} - {data.job.max_salary} {data.job.currency} ({data.job.salary_type})</p>
                      <p><strong>Posted Date:</strong> {new Date(data.job.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Bid Information */}
                <div className={styles.bidSection}>
                  <h3 className={styles.sectionTitle}>Bid Information</h3>
                  <div className={styles.bidInfo}>
                    <div className={styles.infoRow}>
                      <p><strong>Proposal:</strong></p>
                      <div className={styles.proposalText}>
                        {data.proposal}
                      </div>
                    </div>
                    <div className={styles.infoRow}>
                      <p className={styles.percentageInfo} style={{ marginTop: 8, color: '#888', fontSize: 13 }}>
                        <strong>Fee:</strong> <strong className="text-primary" >₹{data.fee}</strong><br/>
                          <><strong className="text-primary">{(data.fee/data.job.bid_budget*100).toFixed(2)}%</strong> of the ₹&nbsp;{(data.job.bid_budget).toLocaleString()}</>
                      </p>
                      <p><strong>Submitted On:</strong> {new Date(data.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </>
  );
}
