"use client";
import styles from './professionalDetails.module.css';
import { useState, useEffect } from 'react';
import { FaUser, FaBuilding, FaKey, FaPhone, FaArrowLeft, FaExclamationCircle, FaCheckCircle, FaSpinner, FaBriefcase, FaMapMarkerAlt, FaGraduationCap, FaSchool, FaCalendar, FaStar, FaPlus, FaTrash } from 'react-icons/fa';
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
  const registrationData = Cookies.get('registrationData') ? JSON.parse(Cookies.get('registrationData')) : null;
  const [educationEntries, setEducationEntries] = useState([{
    education_type: '',
    school_name: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    grade: '',
  }]);
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  useEffect(() => {
    if(registrationData){
      console.log("registrationData education/ cookies: ", registrationData);
      fetchEducations();
    }
  }, []);

  const fetchEducations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/educations/`, {
        headers: {
          'Authorization': `Bearer ${registrationData.access}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        // Ensure all date fields are strings, not null
        const formattedData = data.map(entry => ({
          ...entry,
          start_date: entry.start_date || '',
          end_date: entry.end_date || '',
          education_type: entry.education_type || '',
          school_name: entry.school_name || '',
          degree: entry.degree || '',
          field_of_study: entry.field_of_study || '',
          grade: entry.grade || ''
        }));
        setEducationEntries(formattedData);
      } else {
        if (handleTokenExpiration(data, router)) {
          return;
        }
        setErrors({ ...errors, session: 'Failed to fetch education details' });
      }
    } catch (error) {
      console.error('Error fetching educations:', error);
      if (handleTokenExpiration(error, router)) {
        return;
      }
      setErrors({ ...errors, session: 'Failed to fetch education details' });
    }
  };

  const validateForm = () => {
    const currentEntry = educationEntries[currentEntryIndex];
    if (!currentEntry) return false;

    // Check if all required fields are filled
    if (!currentEntry.education_type || !currentEntry.school_name || 
        !currentEntry.degree || !currentEntry.field_of_study || 
        !currentEntry.start_date || !currentEntry.end_date || 
        !currentEntry.grade) {
      return false;
    }

    // Validate dates
    const startDate = new Date(currentEntry.start_date);
    const endDate = new Date(currentEntry.end_date);
    if (startDate > endDate) {
      setErrors({ ...errors, date: "End date must be after start date" });
      return false;
    }

    return true;
  };

  const handleAddEducation = () => {
    setEducationEntries([...educationEntries, {
      education_type: '',
      school_name: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      grade: '',
    }]);
    setCurrentEntryIndex(educationEntries.length);
  };

  const handleDeleteEducation = async (index) => {
    try {
      const entry = educationEntries[index];
      if (entry.id) {

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/educations/${entry.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${registrationData.access}`
          }
        });

        if (response.ok) {
          const updatedEntries = educationEntries.filter((_, i) => i !== index);
          setEducationEntries(updatedEntries);
          setCurrentEntryIndex(Math.min(currentEntryIndex, updatedEntries.length - 1));
        }
      } else {
        const updatedEntries = educationEntries.filter((_, i) => i !== index);
        setEducationEntries(updatedEntries);
        setCurrentEntryIndex(Math.min(currentEntryIndex, updatedEntries.length - 1));
      }
    } catch (error) {
      console.error('Error deleting education:', error);
    }
  };

  const handleFormChange = (field, value) => {
    const updatedEntries = [...educationEntries];
    updatedEntries[currentEntryIndex] = {
      ...updatedEntries[currentEntryIndex],
      [field]: value || '' // Ensure value is never null
    };
    setEducationEntries(updatedEntries);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/educations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${registrationData.access}`
        },
        body: JSON.stringify(educationEntries[currentEntryIndex])
      });

      const data = await response.json();

      if (response.ok) {
        // Update registration step
        const updatedData = { ...registrationData, reg_step: 5 };
        Cookies.set('registrationData', JSON.stringify(updatedData), {
          expires: 0.0208, // 30 minutes
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict'
        });
        router.push('/register/candidate/experience');
      } else {
        if (handleTokenExpiration(data, router)) {
          return;
        }
        setErrors({ ...errors, submit: 'Failed to save education details' });
      }
    } catch (error) {
      console.error('Error:', error);
      if (handleTokenExpiration(error, router)) {
        return;
      }
      setErrors({ ...errors, submit: 'Failed to save education details' });
    } finally {
      setIsLoading(false);
    }
  };

  function handleSkip(){
    if(registrationData){
      registrationData.reg_step = 5;
      Cookies.set('registrationData', JSON.stringify(registrationData), {
        expires: 0.0208, // 30 minutes
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
      });
    }
    router.push('/register/candidate/experience');
  }

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupCard}>
        <div className={`card-body p-4 p-md-5 ${styles.cardBody}`}>
          <div className={`${styles.pageIndicator} mb-4`}>
            <span className={styles.pageIndicatorText}>
              <span className={styles.currentPage}>Step 3</span>
              <span className={styles.totalPages}>/5</span>
            </span>
          </div>
          
          <h1 className={`card-title ${styles.title}`}>Creating Your <span className={styles.userType}>Candidate</span> Account</h1>
          
          <p className={`text-center mb-4 ${styles.loginPrompt}`}>
            Please fill the following Education details to create your account
          </p>

          <form onSubmit={handleSubmit}>
            {educationEntries.map((entry, index) => (
              <div key={index} className={index === currentEntryIndex ? '' : 'd-none'}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="text-muted mb-0">Education Entry {index + 1}</h4>
                  {educationEntries.length > 1 && (
                    <button
                      type="button"
                      className={`btn ${styles.deleteButton}`}
                      onClick={() => handleDeleteEducation(index)}
                    >
                      <FaTrash className="me-2" /> Delete
                    </button>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="education_type" className={`form-label ${styles.inputLabel}`}>Education Type</label>
                  <div className={styles.iconInputWrapper}>
                    <FaGraduationCap className={styles.inputIcon} />
                    <select 
                      id="education_type"
                      className={`form-select ${styles.formControl}`}
                      value={entry.education_type}
                      onChange={(e) => handleFormChange('education_type', e.target.value)}
                      required
                    >
                      <option value="" disabled>Select education type</option>
                      <option value="primary">Primary School</option>
                      <option value="secondary">Secondary School</option>
                      <option value="higher_secondary">Higher Secondary</option>
                      <option value="bachelors">Bachelors</option>
                      <option value="masters">Masters</option>
                      <option value="phd">PhD</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="school_name" className={`form-label ${styles.inputLabel}`}>School Name</label>
                  <div className={styles.iconInputWrapper}>
                    <FaSchool className={styles.inputIcon} />
                    <input 
                      type="text" 
                      className={`form-control ${styles.formControl}`} 
                      id="school_name" 
                      placeholder="Enter school name" 
                      value={entry.school_name}
                      onChange={(e) => handleFormChange('school_name', e.target.value)}
                      required
                    /> 
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="degree" className={`form-label ${styles.inputLabel}`}>Degree</label>
                  <div className={styles.iconInputWrapper}>
                    <FaGraduationCap className={styles.inputIcon} />
                    <input 
                      type="text" 
                      className={`form-control ${styles.formControl}`} 
                      id="degree" 
                      placeholder="Enter degree" 
                      value={entry.degree}
                      onChange={(e) => handleFormChange('degree', e.target.value)}
                      required
                    /> 
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="field_of_study" className={`form-label ${styles.inputLabel}`}>Field of Study</label>
                  <div className={styles.iconInputWrapper}>
                    <FaGraduationCap className={styles.inputIcon} />
                    <input 
                      type="text" 
                      className={`form-control ${styles.formControl}`} 
                      id="field_of_study" 
                      placeholder="Enter field of study" 
                      value={entry.field_of_study}
                      onChange={(e) => handleFormChange('field_of_study', e.target.value)}
                      required
                    /> 
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
                        required
                      /> 
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="grade" className={`form-label ${styles.inputLabel}`}>Grade</label>
                  <div className={styles.iconInputWrapper}>
                    <FaStar className={styles.inputIcon} />
                    <input 
                      type="text" 
                      className={`form-control ${styles.formControl}`} 
                      id="grade" 
                      placeholder="Enter grade" 
                      value={entry.grade}
                      onChange={(e) => handleFormChange('grade', e.target.value)}
                      required
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
                  onClick={handleAddEducation}
                >
                  <FaPlus className="me-2" /> Add Education
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
                {currentEntryIndex === educationEntries.length - 1 ? 'Next' : 'Save & Continue'}
              </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}