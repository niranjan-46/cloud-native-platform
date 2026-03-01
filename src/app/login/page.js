"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaBuilding, FaHandshake, FaUserTie, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from './Login.module.css';
import Image from 'next/image';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import Cookies from 'js-cookie';



export default function Login() {
  const router = useRouter();
  const [userType, setUserType] = useState('employer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting login with API URL:', process.env.NEXT_PUBLIC_API_URL);
      
      const authResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/jwt/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        console.error('Login failed:', errorData);
        throw new Error(errorData.detail || "Authentication failed");
      }

      const authData = await authResponse.json();
      console.log('Login successful, received tokens');

      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users/me/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authData.access}`,
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        console.error('Profile fetch failed:', errorData);
        throw new Error("Failed to fetch user profile");
      }

      const profileData = await profileResponse.json();
      console.log('Profile fetched successfully:', profileData);

      const userProfile = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get/profile/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authData.access}`,
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });
      const userProfileData = await userProfile.json();
      console.log('userProfileData', userProfileData.profile.application_status);

      if((!profileData.completed_steps) || (userProfileData.profile.application_status !== "approved")){
        try {
          const registrationData = {
            email: email,
            access: authData.access,
            user_type: profileData.user_type,
            reg_step: profileData.registration_step,
            reg_user_id: profileData.id,
            reg_completed_steps: profileData.completed_steps,
            reg_application_status: userProfileData.profile.application_status
          };
        
          Cookies.set('registrationData', JSON.stringify(registrationData), {
            expires: 0.0208, // 30 minutes
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
          });
          
          
    const reg_stepMap = {
      employer: [
        '/register',
        '/register/employer',
        '/register/employer/professional-details',
        '/register/employer/address',
        '/register/employer/documents-upload',
        '/register/employer/application-status',
      ],
      consultancy: [
        '/register',
        '/register/consultancy',
        '/register/consultancy/professional-details',
        '/register/consultancy/address',
        '/register/consultancy/documents-upload',
        '/register/consultancy/application-status',
      ],
      candidate: [
        '/register',
        '/register/candidate',
        '/register/candidate/additional-details',
        '/register/candidate/education',
        '/register/candidate/experience',
        '/register/candidate/documents-upload',
        '/register/candidate/application-status',
      ],
    };
          console.log(`${reg_stepMap[profileData.user_type][profileData.registration_step-1]}`);
          router.push(`${reg_stepMap[profileData.user_type][profileData.registration_step-1]}`);
        } catch (err) {
          console.error('Cookie set failed:', err);
          setError('Unable to store registration data. Please try again.' );
          return;
        }
      }else{
        Cookies.set('access_token', authData.access, {
          expires: 1,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict',
          path: '/'
        });
        Cookies.set('refresh_token', authData.refresh, {
          expires: 1,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict',
          path: '/'
        });
        Cookies.set('user_type', profileData.user_type, {
          expires: 1,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict',
          path: '/'
        });
        Cookies.set('email', profileData.email, {
          expires: 1,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict',
          path: '/'
        });
        // document.cookie = `access_token=${authData.access}; path=/; max-age=3600`;
        // document.cookie = `refresh_token=${authData.refresh}; path=/; max-age=604800`;
        // document.cookie = `user_type=${profileData.user_type}; path=/; max-age=3600`;
        router.push(`/dashboard/${profileData.user_type}`);
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.message.includes('Failed to fetch')) {
        setError("Unable to connect to the server. Please check your internet connection and try again.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`container-fluid ${styles.loginContainer}`}>
      <div className={`${styles.row} row justify-content-center align-items-center h-100`}>
        <div className="col-11 col-sm-9 col-md-7 col-lg-4 col-xl-3">
          <div className={`${styles.card} card border-0 p-3 p-sm-4 shadow-lg`} style={{backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '20px'}}>
            <div className="text-center mb-3">
              <h2 className={`${styles.header} mt-2`} style={{fontSize: '22px'}}>Sign In</h2>
            </div>
            
            {error && (
              <div className="d-inline-flex align-items-center gap-1 ps-2 pe-3 py-1 mb-2 bg-danger-100 text-danger rounded-pill">
                <span className="bg-danger rounded-circle" style={{width: '6px', height: '6px'}}></span>
                <small className="fw-medium">{error}</small>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label htmlFor="email" className={`${styles.label} form-label`} style={{fontSize: '14px'}}>Email</label>
                <input 
                  type="email" 
                  className={`${styles.input} form-control rounded-4`} 
                  style={{height: '42px', fontSize: '14px'}}
                  id="email" 
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-2 position-relative">
                <label htmlFor="password" className={`${styles.label} form-label`} style={{fontSize: '14px'}}>Password</label>
                <div className="position-relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className={`${styles.input} form-control rounded-4 pe-5`}
                    style={{height: '42px', fontSize: '14px'}}
                    id="password" 
                    placeholder="********"
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
                
                <div className="d-flex justify-content-between mt-2">
                  <div className="form-check">
                    <input 
                      type="checkbox" 
                      className="form-check-input" 
                      id="rememberMe"
                      style={{marginTop: '0.2rem'}}
                    />
                    <label className={`${styles.secoundarytext} form-check-label`} style={{fontSize: '13px'}} htmlFor="rememberMe">Remember me</label>
                  </div>
                  <Link href="/forgot-password" className={`${styles.forgetPassword} text-decoration-none`} style={{fontSize: '13px'}}>Forgot Password?</Link>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                className={`${styles.submitbtn} btn btn-primary w-100 mb-2 py-2 fw-bold`}
                style={{height: '42px', fontSize: '14px'}}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            
              <div className="d-flex align-items-center justify-content-center my-2">
                <hr className="flex-grow-1" style={{borderColor: '#dee2e6'}} />
                <span className={`${styles.secoundarytext} px-2`} style={{fontSize: '13px'}}>or continue with</span>
                <hr className="flex-grow-1" style={{borderColor: '#dee2e6'}} />
              </div>
              
              <GoogleLoginButton />
              
              <div className="text-center mt-2">
                <span className={`${styles.secoundarytext}`} style={{fontSize: '13px'}}>Don&apos;t have an account? </span>
                <Link href="/register" className={`${styles.signupLink} text-decoration-none fw-bold`} style={{fontSize: '13px'}}>Sign up</Link>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
