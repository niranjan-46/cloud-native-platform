'use client'
import React, { useState, useEffect } from 'react';
import styles from './Documents-upload.module.css';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const documentFields = [
  { 
    label: 'MSME or Incorporation Certificate', 
    key: 'msme_or_incorporation_certificate',
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Must be a clear scan or original digital file'
  },
  { 
    label: 'GSTIN Certificate', 
    key: 'gstin_certificate',
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Ensure complete visibility of GST number and firm name'
  },
  { 
    label: 'PAN Card', 
    key: 'pan_card',
    allowedTypes: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'PAN number and name must be clearly visible'
  },
  { 
    label: 'POC Document', 
    key: 'poc_document',
    allowedTypes: ['pdf', 'docx', 'jpg', 'jpeg', 'png'],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Should be a valid supporting or ID document'
  },
];

const DocumentsUpload = () => {
  const router = useRouter();
  const regData = Cookies.get('registrationData') ? JSON.parse(Cookies.get('registrationData')) : null;
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    // Get email from session storage
    // const regData = JSON.parse(sessionStorage.getItem('registrationData'));
    console.log("regData documentsUpload/ cookies: ", regData);
    if (regData && regData.email) {
      setEmail(regData.email);
    }
  }, []);

  const validateFile = (file, field) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    // Check if file type is allowed
    if (!field.allowedTypes.includes(fileExtension)) {
      return `Only ${field.allowedTypes.join(', ').toUpperCase()} files are allowed`;
    }

    // Check file size
    if (file.size > field.maxSize) {
      return `File size must be less than 10MB`;
    }

    // Check if file is readable
    if (file.size === 0) {
      return 'File appears to be corrupted or empty';
    }

    return null;
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validateFile(file, field);
    if (validationError) {
      setErrors(prev => ({ ...prev, [field.key]: validationError }));
      setFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[field.key];
        return newFiles;
      });
      return;
    }

    // Clear any existing error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field.key];
      return newErrors;
    });
    
    setFiles(prev => ({ ...prev, [field.key]: file }));
  };

  // Check form validity whenever files or errors change
  useEffect(() => {
    const allFilesSelected = documentFields.every(field => files[field.key]);
    const noErrors = Object.keys(errors).length === 0;
    const allFilesValid = documentFields.every(field => {
      const file = files[field.key];
      if (!file) return false;
      const validationError = validateFile(file, field);
      return !validationError;
    });

    console.log('Validation State:', {
      allFilesSelected,
      noErrors,
      allFilesValid,
      files: Object.keys(files),
      errors: Object.keys(errors),
      isFormValid: allFilesSelected && noErrors && allFilesValid
    });

    setIsFormValid(allFilesSelected && noErrors && allFilesValid);
  }, [files, errors]);

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();      
      // Append all files with meaningful names
      Object.entries(files).forEach(([key, file]) => {
        const field = documentFields.find(f => f.key === key);
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const fileName = `${key.replace(/_/g, '-')}.${fileExtension}`;
        formData.append(key, file, fileName);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload-documents/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${regData.access}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit documents');
      }

      if(regData){
        try{
          regData.reg_step = 6;
          Cookies.set('registrationData', JSON.stringify(regData), {
            expires: 0.0208, // 30 minutes
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
          });
        }catch(err){
          console.error('Error in setting registrationData in cookies:', err);
        }
      }

      router.push(`/register/${regData.user_type}/application-status`);
    } catch (error) {
      console.error('Submission error:', error);
      setErrors(prev => ({ ...prev, submit: 'Failed to submit documents. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className={styles.container + ' ' + styles.fadeIn}>
        <div className={styles.stepIndicator}>Step 4/4</div>
        <h1 className={styles.title}>Upload below Mentioned Documents</h1>
        <p className={styles.subtitle}>
          Please upload mention document to verify our team
        </p>
        <div className={styles.formSection}>
          {documentFields.map((field) => (
            <div className={styles.row} key={field.key}>
              <span className={styles.label}>{field.label}</span>
              <div className={styles.fieldInfo}>
                <p className={styles.description}>{field.description}</p>
                <p className={styles.allowedTypes}>
                  Allowed formats: {field.allowedTypes.join(', ').toUpperCase()}
                </p>
              </div>
              <label
                className={styles.uploadBtn +
                  (files[field.key] ? ' ' + styles.uploaded : '') +
                  (errors[field.key] ? ' ' + styles.error : '')}
                tabIndex={0}
                title={`Allowed file types: ${field.allowedTypes.join(', ').toUpperCase()}`}
              >
                <input
                  type="file"
                  accept={field.allowedTypes.map(type => `.${type}`).join(',')}
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(e, field)}
                  disabled={isSubmitting}
                />
                <span className={styles.uploadIcon}>
                  {files[field.key] ? (
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="10" fill="#22c55e"/>
                      <path d="M6 10.5l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 14V6M10 6L6 10M10 6l4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="3" y="14" width="14" height="3" rx="1.5" fill="#fff"/>
                    </svg>
                  )}
                </span>
                {files[field.key] ? 'Selected' : 'Select File'}
              </label>
              {files[field.key] && (
                <span className={styles.fileName}>{files[field.key].name}</span>
              )}
              {errors[field.key] && (
                <span className={styles.error}>{errors[field.key]}</span>
              )}
            </div>
          ))}
        </div>
        {errors.submit && (
          <div className={styles.errorMessage}>{errors.submit}</div>
        )}
        <div className={styles.buttonRow}>
          <button 
            className={`${styles.backBtn} d-none `} 
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Back
          </button>
          <button 
            className={styles.nextBtn} 
            disabled={!isFormValid || isSubmitting}
            onClick={handleSubmit}
            style={{ 
              opacity: isFormValid ? 1 : 0.5,
              cursor: isFormValid ? 'pointer' : 'not-allowed'
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentsUpload; 