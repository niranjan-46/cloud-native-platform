"use client";
import styles from './page.module.css';
import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaKey, FaShieldAlt, FaArrowLeft, FaExclamationCircle, FaCheckCircle, FaSpinner,FaSignInAlt } from 'react-icons/fa';
import {FiEye, FiEyeOff} from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { storeRegistrationCredentials } from '@/utils/storeRegistrationCookies';
import Cookies from 'js-cookie';



export default function SignUpPage({ employer, consultancy, candidate }) {
    const router = useRouter();
    const google_reg_user = JSON.parse(Cookies.get('google_reg_user') || 'null');
    useEffect(() => {
        if (google_reg_user) {
            console.log("google_reg_user: ", google_reg_user);
        }
    }, []);
    
    const [showPassword, setShowPassword] = useState(false);
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [isOtpValid, setIsOtpValid] = useState(false);
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [errors, setErrors] = useState({
        email: '',
        otp: '',
        password: '',
    });
    const [status, setStatus] = useState({
        email: '',
        otp: '',
    });
    
    const [formData, setFormData] = useState({
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      re_password: '',
      user_type: employer ? 'employer' : (consultancy ? 'consultancy' : 'candidate'),
      otp: '',
    });

    // Resend timer effect
    useEffect(() => {
        let timer;
        if (resendTimer > 0) {
            timer = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendTimer]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }
        if(!candidate){
            if (email.toLowerCase().endsWith('@gmail.com')) {
                return 'Gmail addresses are not allowed';
            }
        }
        return '';
    };

    const validateOTP = (otp) => {
        const otpRegex = /^\d{6}$/;
        if (!otpRegex.test(otp)) {
            return 'OTP must be a 6-digit number';
        }
        if (parseInt(otp) <= 0) {
            return 'OTP must be a positive number';
        }
        return '';
    };

    const validatePassword = (password) => {
        const errors = [];
        
        // Minimum length check
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        
        // Numeric check
        if (/^\d+$/.test(password)) {
            errors.push('Password cannot be entirely numeric');
        }
        
        // Complexity check
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
        if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
        if (!hasNumbers) errors.push('Password must contain at least one number');
        if (!hasSpecialChar) errors.push('Password must contain at least one special character');
        
        return errors;
    };

    const handleEmailChange = (e) => {
        const email = e.target.value;
        setFormData({ ...formData, email });
        const emailError = validateEmail(email);
        setErrors({ ...errors, email: emailError });
        setIsEmailValid(!emailError);
    };

    const handleOtpChange = (e) => {
        const otp = e.target.value;
        setFormData({ ...formData, otp });
        const otpError = validateOTP(otp);
        setErrors({ ...errors, otp: otpError });
        setIsOtpValid(!otpError);
    };

    const handlePasswordChange = (e) => {
        const password = e.target.value;
        setFormData({ ...formData, password });
        const passwordErrors = validatePassword(password);
        setErrors({ ...errors, password: passwordErrors.join(', ') });
        setIsPasswordValid(passwordErrors.length === 0);
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        const emailError = validateEmail(formData.email);
        if (emailError) {
            setErrors({ ...errors, email: emailError });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/send-otp/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: formData.email }),
            });

            const data = await response.json();
            
            if (response.ok) {
                setStatus({ ...status, email: 'OTP sent successfully' });
                setIsOtpSent(true);
                setResendTimer(300); // 5 minutes in seconds
            } else {
                if(data.email === 'user with this email already exists.' ){
                    setErrors({ ...errors, email: 'User with this email already exists.' });
                }else{
                    setErrors({ ...errors, email: data.error || 'Failed to send OTP' });
                }
            }
        } catch (error) {
            setErrors({ ...errors, email: 'Failed to send OTP. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpVerify = async () => {
        const otpError = validateOTP(formData.otp);
        if (otpError) {
            setErrors({ ...errors, otp: otpError });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verify-otp/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp: formData.otp
                }),
            });

            const data = await response.json();
            
            if (response.ok) {
                setStatus({ ...status, otp: 'Email verified successfully' });
                setIsEmailVerified(true);
                setResendTimer(0);
            } else {
                setErrors({ ...errors, otp: data.message || 'Invalid OTP' });
            }
        } catch (error) {
            setErrors({ ...errors, otp: 'Failed to verify OTP. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if(google_reg_user){
            // setFormData({ ...formData, email: google_reg_user.email, first_name: google_reg_user.given_name, last_name: google_reg_user.family_name });
            handleEmailChange({ target: { value: google_reg_user.email } });
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate all fields before submission
        const emailError = validateEmail(formData.email);
        const otpError = validateOTP(formData.otp);
        const passwordErrors = validatePassword(formData.password);
        
        if (emailError || otpError || passwordErrors.length > 0) {
            setErrors({
                email: emailError,
                otp: otpError,
                password: passwordErrors.join(', ')
            });
            return;
        }

        if (!isEmailVerified) {
            setErrors({ ...errors, otp: 'Please verify your email first' });
            return;
        }

        setIsLoading(true);
        try {
            if(google_reg_user && formData.first_name === '' && formData.last_name === ''){
                formData.first_name = google_reg_user.given_name;
                formData.last_name = google_reg_user.family_name;
            }
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    name: `${formData.first_name} ${formData.last_name}`,
                    password: formData.password,
                    re_password: formData.password,
                    phone: "0000000000",
                    user_type: formData.user_type
                }),
            });

            const data = await response.json();
            
            if (response.ok) {
                // data.password = formData.password;
                // sessionStorage.setItem('registrationData', JSON.stringify(data));
                

                const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/jwt/create/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password }),
                });
                const loginData = await loginRes.json();

                if (loginRes.ok) {
                    const getUserProfile = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users/me/`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${loginData.access}` },
                    });
                    const userProfile = await getUserProfile.json();


                    try {
                      const registrationData = {
                        email: formData.email,
                        access: loginData.access,
                        name: `${formData.first_name} ${formData.last_name}`,
                        user_type: formData.user_type,
                        reg_step: userProfile.registration_step,
                        reg_user_id: userProfile.id,
                        reg_completed_steps: userProfile.completed_steps
                      };
                    
                      Cookies.set('registrationData', JSON.stringify(registrationData), {
                        expires: 0.0208, // 30 minutes
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'Strict'
                      });
                    } catch (err) {
                      console.error('Cookie set failed:', err);
                      setErrors({ ...errors, email: 'Unable to store registration data. Please try again.' });
                      return;
                    }
                    
                      
                        if (formData.user_type === 'employer') {
                          router.push('/register/employer/professional-details');
                        } else if (formData.user_type === 'consultancy') {
                          router.push('/register/consultancy/professional-details');
                        } else {
                          router.push('/register/candidate/additional-details');
                        }
                      

                    // data.reg_step = userProfile.registration_step;
                    // data.reg_user_id = userProfile.id;
                    // data.reg_completed_steps = userProfile.completed_steps;

                    // // Store registration data in cookies
                    // Cookies.set('registrationData', JSON.stringify(data), {
                    //     maxAge: 30 * 60,
                    //     secure: process.env.NODE_ENV === 'production',
                    //     sameSite: 'Strict'
                    // });


                    // // storeRegistrationCredentials({
                    // //     reg_email: formData.email, 
                    // //     reg_password: formData.password, 
                    // //     reg_user_type: formData.user_type, 
                    // //     reg_access_token: loginData.access, 
                    // //     reg_step: userProfile.registration_step, 
                    // //     reg_user_id: userProfile.id, 
                    // //     reg_completed_steps: userProfile.completed_steps
                    // // });
                    
                    
                }
            } else {
                // Handle registration errors
                if (data.email) {
                    setErrors({ ...errors, email: data.email[0] });

                } else if (data.password) {
                    setErrors({ ...errors, password: data.password[0] });
                } else {
                    setErrors({ ...errors, email: 'Registration failed. Please try again.' });
                }
            }
        } catch (error) {
            setErrors({ ...errors, email: 'Failed to register. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };


  return (
      <div className={styles.signupContainer}>
        <div className={styles.signupCard}>
          <div className={`card-body p-4 p-md-5 ${styles.cardBody}`}>
            {/* Page Indicator */}
            <div className={`${styles.pageIndicator} mb-4`}>
              <span className={styles.pageIndicatorText}>
                <span className={styles.currentPage}>Step 1</span>
                <span className={styles.totalPages}>/{candidate ? 5 : 4}</span>
              </span>
            </div>
            
            <h1 className={`card-title ${styles.title}`}>Create Your <span className={styles.userType}>{employer ? 'Employer' : consultancy ? 'Consultancy' : 'Candidate'}</span> Account</h1>
            
            <p className={`text-center mb-4 ${styles.loginPrompt}`}>
              Already a member? <Link href="/login" className={styles.loginLink}>Sign in</Link>
            </p>

            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label htmlFor="firstName" className={`form-label ${styles.inputLabel}`}>FIRST NAME</label>
                  <div className={styles.iconInputWrapper}>
                    <FaUser className={styles.inputIcon} />
                    <input 
                      type="text" 
                      className={`form-control ${styles.formControl}`} 
                      id="firstName" 
                      placeholder="First Name" 
                    //   value={formData.first_name}
                      defaultValue={google_reg_user ? google_reg_user.given_name : ''}

                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label htmlFor="lastName" className={`form-label ${styles.inputLabel}`}>LAST NAME</label>
                  <div className={styles.iconInputWrapper}>
                    <FaUser className={styles.inputIcon} />
                    <input 
                      type="text" 
                      className={`form-control ${styles.formControl}`} 
                      id="lastName" 
                      placeholder="Last Name" 
                    //   value={formData.last_name}
                      defaultValue={google_reg_user ? google_reg_user.family_name : ''}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className={`form-label ${styles.inputLabel}`}>EMAIL</label>
                <div className={`input-group ${styles.otpGroup}`}>
                    <div className={styles.iconInputWrapper}>
                    <FaEnvelope className={styles.inputIcon} />
                    <input 
                        type="email" 
                        className={`form-control rounded-end-0 ${styles.formControl}`}
                        placeholder="Enter mail address" 
                        // value={formData.email}
                        defaultValue={google_reg_user ? google_reg_user.email : ''}
                        onChange={handleEmailChange}
                        disabled={isEmailVerified || isOtpSent || isLoading || resendTimer > 0}
                        required
                    />
                    </div>
                    <button 
                        className={`btn ${styles.otpButton}`} 
                        type="submit" 
                        onClick={handleEmailSubmit}
                        disabled={!isEmailValid || isEmailVerified || isOtpSent || isLoading || resendTimer > 0}
                    >
                        {isLoading ? (
                            <FaSpinner className="fa-spin me-2" />
                        ) : null}
                        {resendTimer > 0 ? `Resend in ${formatTime(resendTimer)}` : 'Send OTP'}
                    </button>
                </div>
                {errors.email && (
                    <div className={styles.errorMessage}>
                        <FaExclamationCircle className={styles.errorIcon} />
                        {errors.email}
                        {(errors.email === "user with this email already exists.") || (errors.email === "Email already exists")? (
                        <Link href="/login" className='text-success'><FaSignInAlt className='me-1'/>login</Link>
                        ) : ''}
                    </div>
                )}
                {status.email && (
                    <div className={styles.successMessage}>
                        <FaCheckCircle className={styles.successIcon} />
                        {status.email}
                    </div>
                )}
                

              </div>

              <div className="mb-3">
                <label className={`form-label ${styles.inputLabel}`}>VERIFY OTP</label>
                <div className={`input-group ${styles.otpGroup}`}>
                    <div className={styles.iconInputWrapper}>
                    <FaShieldAlt className={styles.inputIcon} />
                    <input 
                        type="text" 
                        className={`form-control rounded-end-0 ${styles.formControl}`}
                        placeholder="Enter 6 digit OTP sent to your email" 
                        value={formData.otp}
                        onChange={handleOtpChange}
                        maxLength={6}
                        disabled={isEmailVerified}
                    />
                    </div>
                    <button 
                        className={`btn ${styles.otpButton}`} 
                        type="button" 
                        onClick={handleOtpVerify}
                        disabled={!isOtpValid || isEmailVerified || isLoading}
                    >
                        {isLoading ? (
                            <FaSpinner className="fa-spin me-2" />
                        ) : null}
                        Verify
                    </button>
                </div>
                {errors.otp && (
                    <div className={styles.errorMessage}>
                        <FaExclamationCircle className={styles.errorIcon} />
                        {errors.otp}
                    </div>
                )}
                {status.otp && (
                    <div className={styles.successMessage}>
                        <FaCheckCircle className={styles.successIcon} />
                        {status.otp}
                    </div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="password" className={`form-label ${styles.inputLabel}`}>PASSWORD</label>
                <div className={styles.iconInputWrapper}>
                  <FaKey className={styles.inputIcon} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className={`form-control ${styles.formControl}`}
                    id="password" 
                    placeholder="Password" 
                    value={formData.password}
                    onChange={handlePasswordChange}
                    required
                  />
                  <span className={styles.passwordToggle}>
                    {showPassword ? (
                      <FiEye className={styles.inputIcon} onClick={() => setShowPassword(!showPassword)} />
                    ) : (
                      <FiEyeOff className={styles.inputIcon} onClick={() => setShowPassword(!showPassword)} />
                    )}
                  </span>
                </div>
                {errors.password && (
                    <div className={styles.errorMessage}>
                        <FaExclamationCircle className={styles.errorIcon} />
                        {errors.password}
                    </div>
                )}
              </div>

              <div className="d-flex justify-content-between align-items-center mt-4">
                <Link href="/register" type="button" className={`btn ${styles.backButton}`}>
                  <FaArrowLeft className="me-2" /> Back
                </Link>
                <button 
                    type="submit" 
                    className={`btn ${styles.nextButton}`}
                    disabled={!isEmailValid || !isOtpValid || !isPasswordValid || !isEmailVerified || isLoading}
                >
                    {isLoading ? (
                        <FaSpinner className="fa-spin me-2" />
                    ) : null}
                    Next
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  );
}