"use client";

import React from 'react';
import { FaSearch, FaMapMarkerAlt, FaClock, FaBriefcase, FaFilter, FaCheckCircle } from 'react-icons/fa';
import { FiBookmark } from 'react-icons/fi';
import styles from './Jobs.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import ClipLoader from 'react-spinners/ClipLoader';
import { toast } from 'react-toastify';
import { City } from 'country-state-city';
import { getDummyJobs, normalizeJobs } from '@/utils/jobsData';


const Jobs = () => {
  const router = useRouter();
  const [selectLocation, setSelectLocation] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    experience: '',
    location: '',
    postedDate: '',
    jobType: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {

    const indianCities = City.getCitiesOfCountry("IN");
    const locations = indianCities.map(city => city.name);
    const uniqueLocations = [...new Set(locations)];
    setSelectLocation(uniqueLocations);

    const fetchJobs = async () => {
      setLoading(true);
      try {
        const accessToken = Cookies.get('access_token');
        const authHeaders = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs`,{
          method: 'GET',
          headers: authHeaders
        });

        const jobsPayload = await response.json();
        if (!response.ok) {
          throw new Error(jobsPayload?.message || 'Failed to fetch jobs');
        }

        let savedJobsData = [];
        let appliedJobsData = [];
        if (accessToken) {
          const [savedJobsResponse, appliedJobsResponse] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saved-jobs/`, {
              method: 'GET',
              headers: authHeaders,
            }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/`, {
              method: 'GET',
              headers: {
                ...authHeaders,
                'Content-Type': 'application/json',
              },
            }),
          ]);

          if (savedJobsResponse.ok) {
            const payload = await savedJobsResponse.json();
            if (Array.isArray(payload)) {
              savedJobsData = payload;
            }
          }
          if (appliedJobsResponse.ok) {
            const payload = await appliedJobsResponse.json();
            if (Array.isArray(payload)) {
              appliedJobsData = payload;
            }
          }
        }

        const normalizedJobs = normalizeJobs(jobsPayload).map((job) => ({
          ...job,
          isSaved: savedJobsData.some((savedJob) => savedJob.job === job.id),
          isApplied: appliedJobsData.some((appliedJob) => appliedJob.job === job.id),
        }));

        setJobs(normalizedJobs);
        setFilteredJobs(normalizedJobs);
        setError(null);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        const fallbackJobs = getDummyJobs();
        setJobs(fallbackJobs);
        setFilteredJobs(fallbackJobs);
        setError(null);
        toast.info('Live jobs unavailable. Showing sample jobs.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilters && !event.target.closest(`.${styles.filterSection}`)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const applyFilters = () => {
    let result = [...jobs];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.company_name.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query)
      );
    }

    if (filters.experience) {
      result = result.filter(job => job.experience_level === filters.experience);
    }

    if (filters.location) {
      result = result.filter(job => job.location.toLowerCase() === filters.location.toLowerCase());
    }

    if (filters.jobType) {
      result = result.filter(job => job.job_type === filters.jobType);
    }

    if (filters.postedDate) {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.postedDate) {
        case '24h':
          filterDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '15d':
          filterDate.setDate(now.getDate() - 15);
          break;
        case '30d':
          filterDate.setDate(now.getDate() - 30);
          break;
        default:
          break;
      }
      
      result = result.filter(job => new Date(job.created_at) >= filterDate);
    }

    setFilteredJobs(result);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, searchQuery, jobs]);

  const handleSaveJob = async (jobId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saved-jobs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        'Authorization': `Bearer ${Cookies.get('access_token')}`
      },
      body: JSON.stringify({
        job: jobId
      })
    });
    const data = await response.json();

    if (!response.ok) {
      toast.error('Failed to save job');
      throw new Error('Failed to save job');
    }
    
    // Update the isSaved state for the specific job
    setJobs(prevJobs => prevJobs.map(job => 
      job.id === jobId ? { ...job, isSaved: true } : job
    ));
    setFilteredJobs(prevJobs => prevJobs.map(job => 
      job.id === jobId ? { ...job, isSaved: true } : job
    ));
    
    toast.success('Job saved successfully');
  } catch (error) {
    console.error('Error saving job:', error);
    toast.error('Failed to save job');
  }
};


  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };


  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <ClipLoader color="#0d6efd" size={50} />
          <p className="mt-3 text-black">Fetching content, please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <h2 className="text-red-600 text-xl font-semibold mb-2">Error Loading Profile</h2>
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className={styles.jobsContainer}>
      <div className={styles.filterSection}>
        <div className={`${styles.searchBar}`}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search jobs, companies, or keywords..."
            value={searchQuery}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>
        
        <button 
          className={styles.filtersButton}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter className={styles.filtersButtonIcon} /> Filters
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

      <div className={styles.jobsGrid}>
        {filteredJobs.length === 0 ? (
          <div className="alert alert-info w-100">
            No jobs matched your search/filters.
          </div>
        ) : (
          filteredJobs.map((job) => (
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
                <h4 className={styles.title}>{job.title}</h4>
                <p className={styles.companyName}>{job.company_name}</p>
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
              <span className={styles.tag}>
                <FaClock className={styles.tagIcon} />
                {formatDate(job.created_at)}
              </span>
            </div>
            <div className={styles.jobActions}>
              <button className={`${job.isSaved ? styles.saveButtonSaved : styles.saveButton}`}
                onClick={() => handleSaveJob(job.id)}
                disabled={job.isSaved}
              >
                <FiBookmark className={styles.saveIcon} /> {job.isSaved ? 'Saved' : 'Save'}
              </button>
              <Link href={`/dashboard/candidate/apply-job/${job.id}`}
                 className={`${job.isApplied ? `${styles.applyButtonApplied} ` : styles.applyButton} btn`}
                 disabled={job.isApplied}
                 aria-disabled={job.isApplied}
                >
                  {job.isApplied ? <><FaCheckCircle /> Applied</> : 'Apply Now'}
              </Link>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
};

export default Jobs;
