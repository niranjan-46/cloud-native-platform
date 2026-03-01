"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from './Forgot-password.module.css';


export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/request-reset-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send reset password email');
      }

      setSuccess('Password reset link has been sent to your email');
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`container-fluid ${styles.loginContainer}`}>
    <div className={`${styles.row} row justify-content-center align-items-center h-100`}>
      <div className="col-11 col-sm-9 col-md-7 col-lg-4 col-xl-3">
        <div className={`${styles.card} card border-0 p-3 p-sm-4 shadow-lg`} style={{backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '20px'}}>
          <div className="text-center mb-3">
            <h2 className={`${styles.header} mt-2`} style={{fontSize: '22px'}}>Forgot Password</h2>
            <p className="text-muted mb-0">Enter your email address and we&apos;ll send you a link to reset your password.</p>
          </div>
          
          {error && (
                  <div className="alert alert-danger rounded-3" role="alert">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {error}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success rounded-3" role="alert">
                    <i className="bi bi-check-circle me-2"></i>
                    {success}
                  </div>
                )}

          <form onSubmit={handleSubmit} className="needs-validation" noValidate>
            <div className="mb-2">
              <label htmlFor="email" className={`${styles.label} form-label`} style={{fontSize: '14px'}}>Email address</label>
              <input 
                type="email" 
                className={`${styles.input} form-control rounded-4`} 
                style={{height: '42px', fontSize: '14px'}}
                id="email" 
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className={`${styles.submitbtn} btn btn-primary w-100 mb-2 py-2 fw-bold`}
              style={{height: '42px', fontSize: '14px'}}
            >
            {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
            )}
            </button>
            
            <div className="text-center mt-2">
              <span className={`${styles.secoundarytext}`} style={{fontSize: '13px'}}>Back to </span>
              <Link href="/login" className={`${styles.signupLink} text-decoration-none fw-bold`} style={{fontSize: '13px'}}>Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  );
} 