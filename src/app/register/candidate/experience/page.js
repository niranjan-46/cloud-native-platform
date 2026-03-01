"use client";
import styles from './experience.module.css';
import { useState, useEffect } from 'react';
import { FaUser, FaBuilding, FaKey, FaPhone, FaArrowLeft, FaExclamationCircle, FaCheckCircle, FaSpinner, FaBriefcase, FaMapMarkerAlt, FaCity, FaGraduationCap, FaSchool, FaCalendar, FaStar, FaPlus, FaTrash, FaBriefcase as FaJob } from 'react-icons/fa';
import {FiEye, FiEyeOff, FiLink, FiUsers} from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { handleTokenExpiration } from '@/utils/authUtils';

export default function SignUpPage({ employer, consultancy, candidate, useremail }) {
  const registrationData = Cookies.get('registrationData') ? JSON.parse(Cookies.get('registrationData')) : null;
  const [experienceEntries, setExperienceEntries] = useState([]);
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    date: '',
    submit: '',
    session: '',
  });
  const router = useRouter();

  useEffect(() => {
    // const registrationData = JSON.parse(sessionStorage.getItem('registrationData'));
    // if (registrationData) {
    //   setRegistrationData(registrationData);
    //   fetchExperiences();
    // }
    if(registrationData){
      console.log("registrationData experience/ cookies: ", registrationData);
    }
  }, []);

  const fetchExperiences = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/experiences/`, {
        headers: {
          'Authorization': `Bearer ${registrationData.access}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setExperienceEntries(data);
      } else {
        if (handleTokenExpiration(data, router)) {
          return;
        }
        setErrors({ ...errors, session: 'Failed to fetch experiences' });
      }
    } catch (error) {
      console.error('Error fetching experiences:', error);
      if (handleTokenExpiration(error, router)) {
        return;
      }
      setErrors({ ...errors, session: 'Failed to fetch experiences' });
    }
  };

  const validateForm = () => {
    const currentEntry = experienceEntries[currentEntryIndex];
    if (!currentEntry) return false;

    // Check if all required fields are filled
    if (!currentEntry.company_name || !currentEntry.designation || 
        !currentEntry.job_type || !currentEntry.location || 
        !currentEntry.start_date || !currentEntry.job_description) {
      return false;
    }

    // Validate dates if not currently working
    if (!currentEntry.currently_working && currentEntry.end_date) {
      const startDate = new Date(currentEntry.start_date);
      const endDate = new Date(currentEntry.end_date);
      if (startDate > endDate) {
        setErrors({ ...errors, date: "End date must be after start date" });
        return false;
      }
    }

    return true;
  };

  const handleAddExperience = () => {
    setExperienceEntries([...experienceEntries, {
      company_name: '',
      designation: '',
      job_type: '',
      location: '',
      currently_working: false,
      job_description: '',
      start_date: '',
      end_date: '',
    }]);
    setCurrentEntryIndex(experienceEntries.length);
  };

  const handleDeleteExperience = async (index) => {
    try {
      const entry = experienceEntries[index];
      if (entry.id) {

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/experiences/${entry.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${registrationData.access}`
          }
        });

        if (response.ok) {
          const updatedEntries = experienceEntries.filter((_, i) => i !== index);
          setExperienceEntries(updatedEntries);
          setCurrentEntryIndex(Math.min(currentEntryIndex, updatedEntries.length - 1));
        }
      } else {
        const updatedEntries = experienceEntries.filter((_, i) => i !== index);
        setExperienceEntries(updatedEntries);
        setCurrentEntryIndex(Math.min(currentEntryIndex, updatedEntries.length - 1));
      }
    } catch (error) {
      console.error('Error deleting experience:', error);
    }
  };

  const handleFormChange = (field, value) => {
    const updatedEntries = [...experienceEntries];
    updatedEntries[currentEntryIndex] = {
      ...updatedEntries[currentEntryIndex],
      [field]: value,
      // If currently_working is checked, set end_date to null
      ...(field === 'currently_working' && value ? { end_date: null } : {})
    };
    setExperienceEntries(updatedEntries);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/experiences/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${registrationData.access}`
        },
        body: JSON.stringify(experienceEntries[currentEntryIndex])
      });

      const data = await response.json();

      if (response.ok) {
        // Update registration step
        const updatedData = { ...registrationData, reg_step: 6 };
        Cookies.set('registrationData', JSON.stringify(updatedData), {
          expires: 0.0208, // 30 minutes
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict'
        });
        router.push('/register/candidate/documents-upload');
      } else {
        if (handleTokenExpiration(data, router)) {
          return;
        }
        setErrors({ ...errors, submit: 'Failed to save experience' });
      }
    } catch (error) {
      console.error('Error:', error);
      if (handleTokenExpiration(error, router)) {
        return;
      }
      setErrors({ ...errors, submit: 'Failed to save experience' });
    } finally {
      setIsLoading(false);
    }
  };

  function handleSkip(){
    if(registrationData){
      registrationData.reg_step = 6;
      Cookies.set('registrationData', JSON.stringify(registrationData), {
        expires: 0.0208, // 30 minutes
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
      });
    }
    router.push('/register/candidate/documents-upload');
  }

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupCard}>
        <div className={`card-body p-4 p-md-5 ${styles.cardBody}`}>
          <div className={`${styles.pageIndicator} mb-4`}>
            <span className={styles.pageIndicatorText}>
              <span className={styles.currentPage}>Step 4</span>
              <span className={styles.totalPages}>/5</span>
            </span>
          </div>
          
          <h1 className={`card-title ${styles.title}`}>Creating Your <span className={styles.userType}>Candidate</span> Account</h1>
          
          <p className={`text-center mb-4 ${styles.loginPrompt}`}>
            Please fill the following Experience details to create your account
          </p>

          <p className={`text-center mb-4 ${styles.errorMessage}`}>
            {errors.submit && (
             <> <span className={styles.errorIcon}><FaExclamationCircle /></span> {errors.submit}</>
            )}
          </p>

          <form onSubmit={handleSubmit}>
            {experienceEntries.map((entry, index) => (
              <div key={index} className={index === currentEntryIndex ? '' : 'd-none'}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="text-muted mb-0">Experience Entry {index + 1}</h4>
                  {experienceEntries.length > 1 && (
                    <button
                      type="button"
                      className={`btn ${styles.deleteButton}`}
                      onClick={() => handleDeleteExperience(index)}
                    >
                      <FaTrash className="me-2" /> Delete
                    </button>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="company_name" className={`form-label ${styles.inputLabel}`}>Company Name</label>
                  <div className={styles.iconInputWrapper}>
                    <FaBuilding className={styles.inputIcon} />
                    <input 
                      type="text" 
                      className={`form-control ${styles.formControl}`} 
                      id="company_name" 
                      placeholder="Enter company name" 
                      value={entry.company_name}
                      onChange={(e) => handleFormChange('company_name', e.target.value)}
                      required
                    /> 
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="designation" className={`form-label ${styles.inputLabel}`}>Designation</label>
                  <div className={styles.iconInputWrapper}>
                    <FaBriefcase className={styles.inputIcon} />
                    <input 
                      type="text" 
                      className={`form-control ${styles.formControl}`} 
                      id="designation" 
                      placeholder="Enter your designation" 
                      value={entry.designation}
                      onChange={(e) => handleFormChange('designation', e.target.value)}
                      required
                    /> 
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="job_type" className={`form-label ${styles.inputLabel}`}>Job Type</label>
                  <div className={styles.iconInputWrapper}>
                    <FaJob className={styles.inputIcon} />
                    <select 
                      id="job_type"
                      className={`form-select ${styles.formControl}`}
                      value={entry.job_type}
                      onChange={(e) => handleFormChange('job_type', e.target.value)}
                      required
                    >
                      <option value="" disabled>Select job type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="location" className={`form-label ${styles.inputLabel}`}>Location</label>
                  <div className={styles.iconInputWrapper}>
                    <FaMapMarkerAlt className={styles.inputIcon} />
                    <input 
                      type="text" 
                      className={`form-control ${styles.formControl}`} 
                      id="location" 
                      placeholder="Enter job location" 
                      value={entry.location}
                      onChange={(e) => handleFormChange('location', e.target.value)}
                      required
                    /> 
                  </div>
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="currently_working"
                      checked={entry.currently_working}
                      onChange={(e) => handleFormChange('currently_working', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="currently_working">
                      I am currently working here
                    </label>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="start_date" className={`form-label ${styles.inputLabel}`}>Start Date</label>
                    <div className={styles.iconInputWrapper}>
                      <FaCalendar className={styles.inputIcon} />
                      <input 
                        type="date" 
                        className={`form-control ${styles.formControl}`} 
                        id="start_date" 
                        placeholder="Enter start date" 
                        value={entry.start_date || ''}
                        onChange={(e) => handleFormChange('start_date', e.target.value)}
                        required
                      /> 
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="end_date" className={`form-label ${styles.inputLabel}`}>End Date</label>
                    <div className={styles.iconInputWrapper}>
                      <FaCalendar className={styles.inputIcon} />
                      <input 
                        type="date" 
                        className={`form-control ${styles.formControl}`} 
                        id="end_date" 
                        placeholder="Enter end date" 
                        value={entry.end_date || ''}
                        onChange={(e) => handleFormChange('end_date', e.target.value)}
                        disabled={entry.currently_working}
                        required={!entry.currently_working}
                      /> 
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="job_description" className={`form-label ${styles.inputLabel}`}>Job Description</label>
                  <div className={styles.iconInputWrapper}>
                    <FaBriefcase className={styles.inputIcon} />
                    <textarea 
                      className={`form-control ${styles.formControl}`} 
                      id="job_description" 
                      placeholder="Enter job description" 
                      value={entry.job_description}
                      onChange={(e) => handleFormChange('job_description', e.target.value)}
                      required
                      rows="4"
                      style={{ height: 'auto', paddingTop: '12px' }}
                    /> 
                  </div>
                </div>

                {errors.date && (
                  <div className="alert alert-danger mt-2">
                    {errors.date}
                  </div>
                )}
              </div>
            ))}

            <div className="d-flex justify-content-between align-items-center mt-4 row">
              <div className="d-flex gap-2 col mt-2">
                <button 
                  type="button" 
                  className={`btn ${styles.skipButton}`}
                  onClick={handleSkip}
                >
                  Skip
                </button>
                <button 
                  type="button" 
                  className={`btn ${styles.addButton}`}
                  onClick={handleAddExperience}
                >
                  <FaPlus className="me-2" /> Add Experience
                </button>
              </div>

              <div className={`col mt-2`}>
                <button 
                  type="submit" 
                  className={`btn ${styles.nextButton}`}
                  disabled={!validateForm() || isLoading}
                >
                  {isLoading ? (
                    <FaSpinner className="fa-spin me-2" />
                  ) : null}
                  {currentEntryIndex === experienceEntries.length - 1 ? 'Next' : 'Save & Continue'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}