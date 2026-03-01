'use client'
import React, { useState, useEffect, useCallback } from 'react';
import styles from './Documents-upload.module.css';
import { useRouter } from 'next/navigation';
import { FaFileUpload, FaSpinner } from 'react-icons/fa';
import Cookies from 'js-cookie';

const DocumentsUpload = () => {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const regData = Cookies.get('registrationData') ? JSON.parse(Cookies.get('registrationData')) : null;

  useEffect(() => {
    if (regData && regData.email) {
      setEmail(regData.email);
      console.log("registrationData documentsUpload/ cookies: ", regData);
    }
  }, []);

  const validateFile = (file) => {
    const allowedTypes = ['pdf', 'doc', 'docx'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(fileExtension)) {
      return 'Only PDF and Word documents are allowed';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    if (file.size === 0) {
      return 'File appears to be corrupted or empty';
    }

    return null;
  };

  const handleFileChange = (file) => {
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setError('');
    setFile(file);
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  }, []);

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    handleFileChange(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload-documents/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${regData.access}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload resume');
      }

      if(regData){
        regData.reg_step = 7;
        Cookies.set('registrationData', JSON.stringify(regData), {
          expires: 0.0208, // 30 minutes
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict'
        });
      }
      router.push('/register/candidate/application-status');
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload resume. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container + ' ' + styles.fadeIn}>
        <div className={styles.stepIndicator}>Step 5/5</div>
        <h1 className={styles.title}>Upload Your Resume</h1>
        <p className={styles.subtitle}>
          Please upload your resume in PDF or Word format (max 10MB)
        </p>

        <div 
          className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${file ? styles.hasFile : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="resume-upload"
            accept=".pdf,.doc,.docx"
            onChange={handleFileInput}
            className={styles.fileInput}
          />
          <label htmlFor="resume-upload" className={styles.dropZoneLabel}>
            <FaFileUpload className={styles.uploadIcon} />
            {file ? (
              <span className={styles.fileName}>{file.name}</span>
            ) : (
              <>
                <span className={styles.dropText}>Drag & drop your resume here</span>
                <span className={styles.orText}>or</span>
                <span className={styles.browseText}>Browse Files</span>
              </>
            )}
          </label>
        </div>

        {error && (
          <div className={styles.errorMessage}>{error}</div>
        )}

        <div className={styles.buttonRow}>
          <button 
            className={styles.backBtn} 
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Back
          </button>
          <button 
            className={styles.nextBtn} 
            disabled={!file || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className={styles.spinner} /> Uploading...
              </>
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentsUpload; 