'use client'

import React, { useState, useEffect, useRef } from 'react'
import styles from './Status.module.css'
import { FaCheckCircle, FaTimesCircle, FaEnvelope, FaExclamationCircle, FaClock } from 'react-icons/fa'
import Link from 'next/link'
import Cookies from 'js-cookie';

export default function StatusPage() {
  const [status, setStatus] = useState('verifying')
  const [error, setError] = useState(null)
  const pollingInterval = useRef(null)
  var regData = null;


  const checkStatus = async () => {
    try {
      regData = Cookies.get('registrationData') ? JSON.parse(Cookies.get('registrationData')) : null;
      console.log('Registration Data:', regData)
      if (!regData || !regData.email) {
        setStatus('User not found')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get-application-status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${regData.access}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch status')
      }

      const data = await response.json()
      const newStatus = data.application_status

      // Update status if it has changed
      if (newStatus !== status) {
          setStatus(newStatus)
      }

      // If status is approved or rejected, stop polling
      if (newStatus === 'approved' || newStatus === 'rejected') {
        if(newStatus === 'approved'){
        regData.reg_completed_steps = 'true';
        Cookies.set('registrationData', JSON.stringify(regData), {
          expires: 0.0208, // 30 minutes
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict'
        });
        }
        
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current)
        }
      }
      
    } catch (err) {
      console.error('Error fetching status:', err)
      setStatus('error')
      setError(err.message)
    }
  }



  useEffect(() => {

    if (regData) {

      if (regData.reg_completed_steps === 'true' || regData.reg_step === 6 || regData.reg_step === 7) {
        const timer = setTimeout(() => {
          Cookies.remove('registrationData', {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
          });
          console.log('registrationData cookie removed after 3 minutes');
        }, 3 * 60 * 1000); // 3 minutes in milliseconds

        return () => clearTimeout(timer); // Cleanup on unmount
      }
    }
  }, []);
  

  useEffect(() => {
    // Initial check
    checkStatus()

    // Set up polling every 30 seconds
    pollingInterval.current = setInterval(checkStatus, 30000)

    // Cleanup interval on component unmount
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, []) // Add status as dependency to check for changes

  const handleRetry = () => {
    setStatus('verifying')
    setError(null)
    checkStatus()
  }

  

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {status === 'verifying' && (
          <div className="text-center animate__animated animate__fadeIn">
            <div className={styles.loader}></div>
            <h4 className="mt-4 fw-semibold">Verifying Your Documents</h4>
            <p className="text-muted">Verification may take longer than usual. Once it&apos;s completed, you will receive an update via email.</p>
          </div>
        )}

        {status === 'approved' && (
          <div className="text-center animate__animated animate__fadeInUp">
            <FaCheckCircle className={`text-success ${styles.icon}`} />
            <h3 className="mt-3 fw-bold">Verification Successful</h3>
            <p className="text-muted">
              Your application has been verified successfully.
              <br />
              <FaCheckCircle className={`text-success`} /> You can now proceed to login and access your account.
              <br />
              <FaEnvelope className={`text-success`} /> Check your email for confirmation.
            </p>
            <Link href="/login" className="btn btn-success mt-3 px-4">
              Login Now
            </Link>
          </div>
        )}

        {status === 'rejected' && (
          <div className="text-center animate__animated animate__fadeInUp">
            <FaTimesCircle className={`text-danger ${styles.icon}`} />
            <h3 className="mt-3 fw-bold text-danger">Verification Rejected</h3>
            <p className="text-muted">
              Your submitted documents could not be verified.
              <br />
              <FaExclamationCircle className={`text-danger`} /> Check your email for the reason and further instructions.
              <br />
              <FaClock className={`text-danger`} /> You can re-apply after 12 to 24 hours.
            </p>
            <div className="d-flex justify-content-center gap-3 mt-3">
              <Link href="/support" className="btn btn-outline-danger px-4">Contact Support</Link>
              <Link href="/register/employer" className="btn btn-danger px-4">Re-Apply</Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center animate__animated animate__fadeInUp">
            <FaExclamationCircle className={`text-danger ${styles.icon}`} />
            <h3 className="mt-3 fw-bold text-danger">Error</h3>
            <p className="text-muted">An error occurred while fetching your application status.</p>
            {error && <p className="text-danger small">{error}</p>}
            <div className="d-flex justify-content-center gap-3 mt-3">
              <button 
                className="btn btn-primary px-4"
                onClick={handleRetry}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {status === 'User not found' && (
          <div className="text-center animate__animated animate__fadeInUp">
            <FaExclamationCircle className={`text-warning ${styles.icon}`} />
            <h3 className="mt-3 fw-bold text-warning">Session Expired</h3>
            <p className="text-muted">
              Your session has expired. Please log in again.
              <br />
              <FaClock className={`text-warning`} /> You will be redirected to the login page.
            </p>
            <div className="d-flex justify-content-center gap-3 mt-3">
              <Link href="/login" className="btn btn-primary px-4">
                Return to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
