"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './Forgot-password.module.css';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import Link from 'next/link';


export default function ResetPasswordPage({ params }) {
  const { uidb64, token } = useParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password/${uidb64}/${token}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reset password');
      }

      setSuccess('Password has been reset successfully');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
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
            <h2 className={`${styles.header} mt-2`} style={{fontSize: '22px'}}>Reset Password</h2>
            <p className="text-muted mb-0">Enter your new password below</p>
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
              <label htmlFor="email" className={`${styles.label} form-label`} style={{fontSize: '14px'}}>New Password</label>
              <div className="position-relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className={`${styles.input} form-control rounded-4 pe-5`}
                    style={{height: '42px', fontSize: '14px'}}
                    id="password" 
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y me-2"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ zIndex: 5, color: '#6c757d', padding: '4px' }}
                  >
                    <span className={`${styles.passwordToggleIcon} pb-1 px-1 rounded-3`}>{showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}</span>
                  </button>
              </div>
              
              <label htmlFor="email" className={`${styles.label} form-label`} style={{fontSize: '14px'}}>Confirm Password</label>
              <div className="position-relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    className={`${styles.input} form-control rounded-4 pe-5`}
                    style={{height: '42px', fontSize: '14px'}}
                    id="confirmPassword" 
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y me-2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ zIndex: 5, color: '#6c757d', padding: '4px' }}
                  >
                    <span className={`${styles.passwordToggleIcon} pb-1 px-1 rounded-3`}>{showConfirmPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}</span>
                  </button>
              </div>                           
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
                  Resetting...
                </>
              ) : (
                  'Reset Password'
              )}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  </div>
  );

}
