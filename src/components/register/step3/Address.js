"use client";
import styles from './address.module.css';
import { useState, useEffect } from 'react';
import { FaUser, FaBuilding, FaKey, FaPhone, FaArrowLeft, FaExclamationCircle, FaCheckCircle, FaSpinner, FaBriefcase, FaMapMarkerAlt, FaCity, FaGlobeAmericas, FaMap, FaEnvelope, FaLandmark } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { handleTokenExpiration } from '@/utils/authUtils';

export default function SignUpPage({ employer, consultancy, candidate, useremail }) {
  const router = useRouter();
  const [registrationData, setRegistrationData] = useState(null);
  const [formData, setFormData] = useState({
    street_address: '',
    locality: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isClient, setIsClient] = useState(false);

  // Add function to check if all fields are filled
  const isFormValid = () => {
    return (
      formData.street_address.trim() !== '' &&
      formData.locality.trim() !== '' &&
      formData.city.trim() !== '' &&
      formData.state.trim() !== '' &&
      formData.country.trim() !== '' &&
      formData.pincode.trim() !== ''
    );
  };

  useEffect(() => {
    setIsClient(true);
    const data = Cookies.get('registrationData') ? JSON.parse(Cookies.get('registrationData')) : null;
    setRegistrationData(data);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!registrationData) {
      setErrors({ ...errors, serverError: 'Registration data not found. Please start the registration process again.' });
      return;
    }

    // Validate all fields
    const newErrors = {};
    if (!formData.street_address.trim()) newErrors.street_address = 'Street address is required';
    if (!formData.locality.trim()) newErrors.locality = 'Locality is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Combine address fields into a single string
      const fullAddress = `${formData.street_address}, ${formData.locality}, ${formData.city}, ${formData.state}, ${formData.country} - ${formData.pincode}`;

      // Update employer profile with address details
      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${registrationData.user_type || 'candidate'}/profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${registrationData.access}`
        },
        body: JSON.stringify({
          [registrationData.user_type === 'employer' ? 'company_address' : 'office_address']: fullAddress
        })
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        if (handleTokenExpiration(errorData, router)) {
          return;
        }
        throw new Error('Failed to update profile');
      }

      const data = await profileResponse.json();
      
      if (registrationData) {
        try {
          const updatedData = { ...registrationData, reg_step: 5 };
          Cookies.set('registrationData', JSON.stringify(updatedData), {
            expires: 0.0208, // 30 minutes
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
          });
        } catch(err) {
          console.error('Error in setting registrationData in cookies:', err);
        }
      }
      router.push(`/register/${registrationData.user_type || 'candidate'}/documents-upload`);

    } catch (error) {
      console.error('Error:', error);
      if (handleTokenExpiration(error, router)) {
        return;
      }
      setErrors({ ...errors, serverError: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) {
    return null; // or a loading spinner
  }

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupCard}>
        <div className={`card-body p-4 p-md-5 ${styles.cardBody}`}>

          <div className={`${styles.pageIndicator} mb-4`}>
            <span className={styles.pageIndicatorText}>
              <span className={styles.currentPage}>Step 3</span>
              <span className={styles.totalPages}>/4</span>
            </span>
          </div>

          <h1 className={`card-title ${styles.title}`}>
            Creating Your <span className={styles.userType}>
              {registrationData?.user_type || ''}
            </span> Account
          </h1>

          <p className={`text-center mb-4 ${styles.loginPrompt}`}>
            {employer || consultancy ? 
              <span>Please fill your company address details to create your account</span> :
              <span>Please fill your address details to create your account</span>}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className={`form-label ${styles.inputLabel}`}>STREET ADDRESS</label>
              <div className={`input-group ${styles.otpGroup}`}>
                <div className={styles.iconInputWrapper}>
                  <FaMapMarkerAlt className={styles.inputIcon} />
                  <input 
                    type="text" 
                    className={`form-control rounded-end-0 ${styles.formControl}`}
                    placeholder="Enter street address" 
                    value={formData.street_address}
                    onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                    required
                  />
                </div>
              </div>
              {errors.street_address && <div className="text-danger">{errors.street_address}</div>}
            </div>

            <div className="mb-3">
              <label className={`form-label ${styles.inputLabel}`}>LOCALITY</label>
              <div className={`input-group ${styles.otpGroup}`}>
                <div className={styles.iconInputWrapper}>
                  <FaLandmark className={styles.inputIcon} />
                  <input 
                    type="text" 
                    className={`form-control rounded-end-0 ${styles.formControl}`}
                    placeholder="Enter locality" 
                    value={formData.locality}
                    onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                    required
                  />
                </div>
              </div>
              {errors.locality && <div className="text-danger">{errors.locality}</div>}
            </div>

            <div className="mb-4">
              <label htmlFor="city" className={`form-label ${styles.inputLabel}`}>CITY</label>
              <div className={styles.iconInputWrapper}>
                <FaCity className={styles.inputIcon} />
                <input 
                  type="text" 
                  className={`form-control ${styles.formControl}`}
                  id="city" 
                  placeholder="City" 
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              {errors.city && <div className="text-danger">{errors.city}</div>}
            </div>

            <div className="mb-4">
              <label htmlFor="state" className={`form-label ${styles.inputLabel}`}>STATE</label>
              <div className={styles.iconInputWrapper}>
                <FaMap className={styles.inputIcon} />
                <input 
                  type="text" 
                  className={`form-control ${styles.formControl}`}
                  id="state" 
                  placeholder="State" 
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              {errors.state && <div className="text-danger">{errors.state}</div>}
            </div>

            <div className="row mb-3">
              <div className="col-md-6 mb-3 mb-md-0">
                <label htmlFor="country" className={`form-label ${styles.inputLabel}`}>COUNTRY</label>
                <div className={styles.iconInputWrapper}>
                  <FaGlobeAmericas className={styles.inputIcon} />
                  <select 
                    id="country"
                    className={`form-select ${styles.formControl}`}
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  >
                    <option value="" disabled>Select country</option>
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>
                {errors.country && <div className="text-danger">{errors.country}</div>}
              </div>

              <div className="col-md-6">
                <label htmlFor="pincode" className={`form-label ${styles.inputLabel}`}>PINCODE</label>
                <div className={styles.iconInputWrapper}>
                  <FaEnvelope className={styles.inputIcon} />
                  <input 
                    type="text" 
                    className={`form-control ${styles.formControl}`} 
                    id="pincode" 
                    placeholder="Pincode" 
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    required
                  />
                </div>
                {errors.pincode && <div className="text-danger">{errors.pincode}</div>}
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-4">
              <Link href="/register" className={`btn ${styles.backButton} d-none`}>
                <FaArrowLeft className="me-2" /> Back
              </Link>
              <button 
                type="submit" 
                className={`btn ms-auto ${styles.nextButton}`}
                disabled={isLoading || !isFormValid()}
              >
                {isLoading ? <FaSpinner className={styles.spinner} /> : 'Next'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}