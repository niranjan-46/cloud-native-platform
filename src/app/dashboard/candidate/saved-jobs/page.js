"use client";

import React, { useEffect, useState } from 'react';
import { FaSearch, FaMapMarkerAlt, FaClock, FaBriefcase, FaFilter, FaCheckCircle } from 'react-icons/fa';
import { FiBookmark } from 'react-icons/fi';
import styles from './Saved.module.css';
import Image from 'next/image';
import Link from 'next/link';
import Cookies from 'js-cookie';
import ClipLoader from 'react-spinners/ClipLoader';
import { toast } from 'react-toastify';
import { City } from 'country-state-city';




const SavedJobs = () => {
  const [selectLocation, setSelectLocation] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [rawSavedJobs, setRawSavedJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    experience: '',
    location: '',
    postedDate: '',
    jobType: ''
  });



  useEffect(() => {
    const indianCities = City.getCitiesOfCountry("IN");
    const locations = indianCities.map(city => city.name);
    const uniqueLocations = [...new Set(locations)];
    setSelectLocation(uniqueLocations);

    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saved-jobs/`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved jobs');
      }
      
      const data = await response.json();
      setRawSavedJobs(data);

      const alljobs = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });

      const appliedJobs = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });

      const alljobsdata = await alljobs.json();
      const appliedJobsData = await appliedJobs.json();
      const savedjobs = alljobsdata.filter(job => 
        data.some(savedJob => savedJob.job === job.id)
      );
      savedjobs.forEach(job => {
        appliedJobsData.forEach(appliedJob => {
          if (appliedJob.job === job.id) {
            job.isApplied = true;
          }
        });
      });
      console.log(savedjobs);
      
      setSavedJobs(savedjobs);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load saved jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsaveJob = async (jobId) => {
    console.log(savedJobs);
    const Id = rawSavedJobs.find(job => job.job === jobId)?.id;
    console.log(Id);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saved-jobs/${Id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to unsave job');
      }

      setSavedJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      toast.success('Job removed from saved jobs');
    } catch (err) {
      toast.error('Failed to remove job from saved jobs');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Add click outside handler for filters
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilters && !event.target.closest(`.${styles.filterSection}`)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <ClipLoader color="#2BA4FA" size={50} />
        <p>Loading saved jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Error Loading Saved Jobs</h3>
        <p>{error}</p>
        <button onClick={fetchSavedJobs} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.jobsContainer}>
      <div className={styles.filterSection}>
        <button 
          className={styles.filtersButton}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter className={styles.filtersButtonIcon} />
          Filters
        </button>
        
        <div className={`${styles.filters} ${showFilters ? styles.show : ''}`}>
          <div className={styles.filterItem}>
            <FaBriefcase />
            <select 
              value={filters.experience}
              onChange={(e) => handleFilterChange('experience', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="" disabled>Experience Level</option>
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="executive">Executive Level</option>
            </select>
          </div>

          <div className={styles.filterItem}>
            <FaMapMarkerAlt />
            <select 
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="" disabled>Location</option>
              {selectLocation.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <FaClock />
            <select 
              value={filters.postedDate}
              onChange={(e) => handleFilterChange('postedDate', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="" disabled>Posted Date</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="15d">Last 15 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <div className={styles.filterItem}>
            <FaBriefcase />
            <select 
              value={filters.jobType}
              onChange={(e) => handleFilterChange('jobType', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="" disabled>Job Type</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="remote">Remote</option>
            </select>
          </div>
          <button className={`${styles.resetButton} btn btn-primary`} onClick={() => setFilters({
            experience: '',
            location: '',
            postedDate: '',
            jobType: ''
          })}>Reset Filters</button>
        </div>
      </div>

      <div className={styles.headerSection}>
        <h4>Saved Jobs ({savedJobs.length})</h4>
        {savedJobs.length === 0 && (
          <div className={styles.emptyState}>
            <FiBookmark className={styles.emptyIcon} />
            <p>No saved jobs yet</p>
            <Link href="/dashboard/candidate/jobs">
              <button className={styles.browseButton}>Browse Jobs</button>
            </Link>
          </div>
        )}
      </div>

      <div className={styles.jobsGrid}>
        {savedJobs.map((job) => (
          <div key={job.id} className={styles.jobCard}>
            <div className={styles.jobHeader}>
              <div className={styles.companyLogo}>
                <Image
                  src={job.company_logo || '/Dashboards/default_company.svg'}
                  alt={`${job.company_name} logo`}
                  width={60}
                  height={60}
                  className={styles.logoImage}
                  onError={(e) => {
                    e.target.src = '/Dashboards/default_company.svg';
                  }}
                />
              </div>
              <div className={styles.jobTitle}>
                <h4>{job.title}</h4>
                <p>{job.company_name}</p>
                <p className={styles.location}>
                  <FaMapMarkerAlt className={styles.locationIcon} />
                  {job.location}
                </p>
              </div>
            </div>
            <p className={styles.jobDescription}>
              {job.description?.length > 150 
                ? `${job.description.substring(0, 150)}...` 
                : job.description}
            </p>
            <div className={styles.jobTags}>
              <span className={styles.tag}>{job.job_type}</span>
              <span className={styles.tag}>{job.experience_level}</span>
              <span className={styles.tag}>{job.work_mode}</span>
            </div>
            <div className={styles.jobActions}>
              <button 
                className={styles.saveButton}
                onClick={() => handleUnsaveJob(job.id)}
              >
                <FiBookmark className={styles.saveIcon} /> Remove
              </button>
              <Link href={`/dashboard/candidate/apply-job/${job.id}`}>
                <button 
                className={`${job.isApplied ? `${styles.applyButtonApplied} btn-success` : styles.applyButton} btn`}
                disabled={job.isApplied}
                >
                  {job.isApplied ? <><FaCheckCircle /> Applied</> : 'Apply Now'}
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedJobs;