"use client";
import styles from './professionalDetails.module.css';
import { useState, useEffect } from 'react';
import { FaUser, FaBuilding, FaKey, FaPhone, FaArrowLeft, FaExclamationCircle, FaCheckCircle, FaSpinner, FaBriefcase, FaMapMarkerAlt, FaCity } from 'react-icons/fa';
import {FiEye, FiEyeOff, FiLink, FiUsers} from 'react-icons/fi';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Link from 'next/link';
import validatePhone from '@/utils/validatePhone';
import validateURL from '@/utils/validateURL';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { handleTokenExpiration } from '@/utils/authUtils';

export default function SignUpPage({ employer, consultancy, candidate, useremail }) {
  const router = useRouter();
  const registrationData = Cookies.get('registrationData') ? JSON.parse(Cookies.get('registrationData')) : null;
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    phone: '',
    website_url: '',
    serverError: '',
    portfolio_url: '',
  });
  const [formData, setFormData] = useState({
    company_name: '',
    phone: '',
    companySize: '',
    designation: '',
    website_url: '',
    gender: '',
    currentCity: '',
    preferredCity: '',
    portfolio_url: '',
  });

  // const [registrationData, setRegistrationData] = useState('');
  // useEffect(() => {
  //   const registrationData = JSON.parse(sessionStorage.getItem('registrationData'));
  //   if (registrationData) {
  //     setRegistrationData(registrationData);
  //     console.log("registrationData before removing from sessionStorage: ",registrationData);
  //   }
  // }, []);

  useEffect(() => {
    if (registrationData) {
      console.log("registrationData professionalDetails/ cookies: ",registrationData);
    }
  }, []);


  const validateForm = () => {
    if ( registrationData && registrationData.user_type === 'candidate') {
      // Required fields validation for candidates
      if (!formData.gender) return false;
      if (!formData.phone) return false;
      if (!formData.currentCity) return false;
      if (!formData.preferredCity) return false;

      // Phone validation
      const phoneError = validatePhone(formData.phone, selectedCountry);
      if (phoneError) return false;

      return true;
    } else {
      // Required fields validation for employer/consultancy
      if (!formData.company_name) return false;
      if (!formData.phone) return false;
      if (!formData.companySize) return false;
      if (!formData.designation) return false;

      // Phone validation
      const phoneError = validatePhone(formData.phone, selectedCountry);
      if (phoneError) return false;

      return true;
    }
  };

  const handlePhoneChange = (value) => {
    setFormData({ ...formData, phone: value });
    const phoneError = validatePhone(value, selectedCountry);
    setErrors({ ...errors, phone: phoneError });
    setIsPhoneValid(!phoneError);
  };

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    const phoneError = validatePhone(formData.phone, country);
    setErrors({ ...errors, phone: phoneError });
    setIsPhoneValid(!phoneError);
  };

  const handleWebsiteChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, website_url: value });
    if (value) {
      const urlError = validateURL(value);
      setErrors({ ...errors, website_url: urlError });
    } else {
      setErrors({ ...errors, website_url: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        const apiURL = `${process.env.NEXT_PUBLIC_API_URL}/api/${registrationData.user_type}/profile/`

        var profileResponse;
        if(registrationData.user_type === 'employer'){
          profileResponse = await fetch(apiURL, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${registrationData.access}`
            },
            body: JSON.stringify({
              company_name: formData.company_name,
              phone_number: formData.phone,
              company_size: formData.companySize,
              designation: formData.designation,
              website_url: formData.website_url
            })
          });
        }else if(registrationData.user_type === 'consultancy'){
          profileResponse = await fetch(apiURL, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${registrationData.access}`
            },
            body: JSON.stringify({
              consultancy_name: formData.company_name,
              phone_number: formData.phone,
              consultancy_size: formData.companySize,
              specialization: formData.designation,
              website: formData.website_url
            })
          });
        }else {
          profileResponse = await fetch(apiURL, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${registrationData.access}`
            },
            body: JSON.stringify({
              gender: formData.gender,
              phone_number: formData.phone,
              city: formData.currentCity,
              preferenced_city: formData.preferredCity,
              portfolio_website: formData.portfolio_url,
            })
          });
        }

        const data = await profileResponse.json();

        if (!profileResponse.ok) {
          if (handleTokenExpiration(data, router)) {
            return;
          }
          console.log(data.website_url);
          setErrors({ ...errors, website_url: data.website_url || data.portfolio_url});
          throw new Error('Failed to update profile');
        }

        if(registrationData){
          try{
            registrationData.reg_step = 4;
            Cookies.set('registrationData', JSON.stringify(registrationData), {
              expires: 0.0208, // 30 minutes
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'Strict'
            });
          }catch(err){
            console.error('Error in setting registrationData in cookies:', err);
          }
        }

        // Clear the registration data from session storage
        // sessionStorage.removeItem('registrationData');
        if(registrationData.user_type !== 'candidate'){
          router.push(`/register/${registrationData.user_type}/address`);
        }
        else{
          router.push(`/register/${registrationData.user_type}/education`);
        } 
      } catch (error) {
        console.error('Error:', error);
        if (handleTokenExpiration(error, router)) {
          return;
        }
        setErrors({ ...errors, serverError: error.message });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const validatePortfolioURL = (url) => {
    if (!url) return ""; // Skip validation if empty (since it's optional)
    
    // Basic URL regex (supports http/https/ftp)
    const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    
    if (!urlPattern.test(url)) {
      return "Please enter a valid URL (e.g., https://example.com)";
    }
    
    return ""; // No error
  };

  const handlePortfolioChange = (e) => {
    const { value } = e.target;
    setFormData({ ...formData, portfolio_url: value });
    
    // Validate on change (or use onBlur for validation after focus loss)
    setErrors({
      ...errors,
      portfolio_url: validatePortfolioURL(value),
    });
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupCard}>
        <div className={`card-body p-4 p-md-5 ${styles.cardBody}`}>
          {/* Page Indicator */}
          <div className={`${styles.pageIndicator} mb-4`}>
            <span className={styles.pageIndicatorText}>
              <span className={styles.currentPage}>Step 2</span>
              <span className={styles.totalPages}>/{registrationData && registrationData.user_type === "candidate" ? 5 : 4}</span>
            </span>
          </div>
          
          <h1 className={`card-title ${styles.title}`}>Creating Your <span className={styles.userType}>{employer ? 'Employer' : consultancy ? 'Consultancy' : 'Candidate'}</span> Account</h1>
          
          <p className={`text-center mb-4 ${styles.loginPrompt}`}>
              {employer || consultancy ? <span>Please fill professional details to create your account</span> : <span>Please fill additional details to create your account</span>}
          </p>


          <form onSubmit={handleSubmit}>
            {registrationData && registrationData.user_type !== 'candidate' && (
              <div className="mb-3">
                <label className={`form-label ${styles.inputLabel}`}>{employer ? 'COMPANY NAME' : consultancy ? 'CONSULTANCY NAME' : ''}</label>
                <div className={`input-group ${styles.otpGroup}`}>
                    <div className={styles.iconInputWrapper}>
                    <FaBuilding className={styles.inputIcon} />
                    <input 
                        type="text" 
                        className={`form-control rounded-end-0 ${styles.formControl}`}
                        placeholder="Enter company name" 
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        required
                    />
                    </div>
                </div>

              </div>
            )}

            {registrationData && registrationData.user_type === 'candidate' && (
              <div className="mb-3">
                <label className={`form-label ${styles.inputLabel}`}>GENDER</label>
                <div className={`input-group ${styles.otpGroup}`}>
                  <div className={`d-flex flex-wrap align-items-center gap-4 ${styles.radioGroup}`}>
                    {/* Male */}
                    <div className="form-check">
                      <input
                        className={`form-check-input ${styles.radioInput}`}
                        type="radio"
                        name="gender"
                        id="male"
                        value="male"
                        checked={formData.gender === 'male'}
                        onChange={() => setFormData({ ...formData, gender: 'male' })}
                      />
                      <label className={`form-check-label ${styles.radioLabel}`} htmlFor="male">
                        Male
                      </label>
                    </div>

                    {/* Female */}
                    <div className="form-check">
                      <input
                        className={`form-check-input ${styles.radioInput}`}
                        type="radio"
                        name="gender"
                        id="female"
                        value="female"
                        checked={formData.gender === 'female'}
                        onChange={() => setFormData({ ...formData, gender: 'female' })}
                      />
                      <label className={`form-check-label ${styles.radioLabel}`} htmlFor="female">
                        Female
                      </label>
                    </div>

                    {/* Non-Binary */}
                    <div className="form-check">
                      <input
                        className={`form-check-input ${styles.radioInput}`}
                        type="radio"
                        name="gender"
                        id="non-binary"
                        value="non-binary"
                        checked={formData.gender === 'non-binary'}
                        onChange={() => setFormData({ ...formData, gender: 'non-binary' })}
                      />
                      <label className={`form-check-label ${styles.radioLabel}`} htmlFor="non-binary">
                        Non-Binary
                      </label>
                    </div>

                    {/* Other */}
                    <div className="form-check">
                      <input
                        className={`form-check-input ${styles.radioInput}`}
                        type="radio"
                        name="gender"
                        id="other"
                        value="other"
                        checked={formData.gender === 'other'}
                        onChange={() => setFormData({ ...formData, gender: 'other' })}
                      />
                      <label className={`form-check-label ${styles.radioLabel}`} htmlFor="other">
                        Other
                      </label>
                    </div>


                  </div>
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className={`form-label ${styles.inputLabel}`}>PHONE NUMBER</label>
                  <div className={`${styles.phoneInputWrapper} ${errors.phone ? styles.phoneInputError : ''}`}>
                  <PhoneInput
                  international
                  defaultCountry="IN"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  onCountryChange={handleCountryChange}
                  className={`${styles.phoneInputContainer}`}
                  inputClassName={`${styles.phoneInputField}`}
                  countrySelectProps={{
                      className: styles.countrySelect,
                  }}
                  />
                  </div>
              {errors.phone && (
                  <div className={styles.errorMessage}>
                      <FaExclamationCircle className="me-2" />
                      {errors.phone}
                  </div>
              )}
            </div>

            {registrationData && registrationData.user_type !== 'candidate' && (
              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label htmlFor="firstName" className={`form-label ${styles.inputLabel}`}>{employer ? 'COMPANY SIZE' : consultancy ? 'CONSULTANCY SIZE' : ''}</label>
                  <div className={styles.iconInputWrapper}>
                    <FiUsers className={styles.inputIcon} />
                    <select 
                        id="companySize"
                        className={`form-select ${styles.formControl}`}
                        value={formData.companySize || ''}
                        onChange={(e) => setFormData({...formData, companySize: e.target.value})}
                    >
                        <option value="" disabled>Select company size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-100">51-100 employees</option>
                        <option value="101-200">101-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="501-1000">501-1000 employees</option>
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
                  <label htmlFor="lastName" className={`form-label ${styles.inputLabel}`}>DESIGNATION</label>
                  <div className={styles.iconInputWrapper}>
                    <FaBriefcase className={styles.inputIcon} />
                    <input 
                      type="text" 
                      className={`form-control ${styles.formControl}`} 
                      id="designation" 
                      placeholder="Designation" 
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            )} 

            {registrationData && registrationData.user_type === 'candidate' && (
              <div className="row mb-3">
              {/* Current City Selection (Dropdown) */}
              <div className="col-md-6 mb-3 mb-md-0">
                <label htmlFor="currentCity" className={`form-label ${styles.inputLabel}`}>CURRENT CITY</label>
                <div className={styles.iconInputWrapper}>
                  <FaCity className={styles.inputIcon} /> {/* Using city icon */}
                  <select 
                    id="currentCity"
                    className={`form-select ${styles.formControl}`}
                    value={formData.currentCity || ''}
                    onChange={(e) => setFormData({...formData, currentCity: e.target.value})}
                    required
                  >
                    <option value="" disabled>Select your city</option>
                    <option value="new-york">Hyderabad</option>
                    <option value="london">Chennai</option>
                    <option value="tokyo">Tokyo</option>
                    <option value="delhi">Delhi</option>
                    <option value="dubai">Dubai</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            
              {/* Preferred City Input (Text) */}
              <div className="col-md-6">
                <label htmlFor="preferredCity" className={`form-label ${styles.inputLabel}`}>PREFERRED CITY</label>
                <div className={styles.iconInputWrapper}>
                  <FaMapMarkerAlt className={styles.inputIcon} /> {/* Using location icon */}
                  <input 
                    type="text" 
                    className={`form-control ${styles.formControl}`} 
                    id="preferredCity" 
                    placeholder="Enter preferred city" 
                    value={formData.preferredCity}
                    onChange={(e) => setFormData({ ...formData, preferredCity: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
            )}

          {registrationData && registrationData.user_type !== 'candidate' && (
            <div className="mb-4">
              <label htmlFor="website_url" className={`form-label ${styles.inputLabel}`}>Website URL(optional)</label>
              <div className={`${styles.iconInputWrapper}`}>
                <FiLink className={styles.inputIcon} />
                <input 
                  type="text" 
                  className={`form-control ${styles.formControl} ${errors.website_url ? styles.inputError : ''}`}
                  id="website_url" 
                  placeholder="https://www.example.com" 
                  value={formData.website_url}
                  onChange={handleWebsiteChange}
                />
              </div>
              {errors.website_url && (
                  <div className={styles.errorMessage}>
                      <FaExclamationCircle className="me-2" />
                      {errors.website_url}
                  </div>
              )}
            </div>
          )}

          {registrationData && registrationData.user_type === 'candidate' && (
            <div className="mb-4">
              <label htmlFor="portfolio_url" className={`form-label ${styles.inputLabel}`}>
                Portfolio URL (optional)
              </label>
              <div className={styles.iconInputWrapper}>
                <FiLink className={styles.inputIcon} />
                <input
                  type="text"
                  className={`form-control ${styles.formControl} ${
                    errors.portfolio_url ? styles.inputError : ""
                  }`}
                  id="portfolio_url"
                  placeholder="https://www.yourportfolio.com"
                  value={formData.portfolio_url}
                  onChange={handlePortfolioChange}
                />
              </div>
              {errors.portfolio_url && (
                <div className={styles.errorMessage}>
                  <FaExclamationCircle className="me-2" />
                  {errors.portfolio_url}
                </div>
              )}
            </div>
          )}  

            <div className="d-flex justify-content-between align-items-center mt-4">
              <Link href="/register" type="button" className={`btn ${styles.backButton} d-none`}>
                <FaArrowLeft className="me-2" /> Back
              </Link>
              <button 
                  type="submit" 
                  className={`btn ms-auto ${styles.nextButton}`}
                  disabled={!validateForm() || isLoading}
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