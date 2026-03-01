'use client';
import styles from './Apply-job.module.css';
import Image from 'next/image';
import { FiBookmark, FiMapPin, FiBriefcase, FiCalendar, FiUsers, FiDollarSign, FiGlobe, FiMail } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { FaCheckCircle } from 'react-icons/fa';



export default function ApplyJobPage() {
  const params = useParams();
  const {id} = params;
  const router = useRouter();
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${id}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch job details');
      const data = await response.json();
      const savedJob = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saved-jobs/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });

      const appliedJob = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/applications/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });
      const savedJobData = await savedJob.json();
      const appliedJobData = await appliedJob.json();
      savedJobData.forEach(job => {
        if (job.job === parseInt(id)) {
          setSaved(true);
        }
      });
      appliedJobData.forEach(job => {
        if (job.job === parseInt(id)) {
          setApplied(true);
        }
      });

      setJobData(data);
    } catch (error) {
      toast.error('Error loading job details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(id);
    fetchJobDetails();
  }, [id]);

  const handleApply = async () => {
    try {
      setApplying(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${id}/apply/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        },
      });
      
      if (!response.ok) throw new Error('Failed to apply for job');
      setApplied(true);
      toast.success('Successfully applied for the job!');
    } catch (error) {
      toast.error('Error applying for job');
      console.error(error);
    } finally {
      setApplying(false);
    }
  };

  const handleSave = async (id) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saved-jobs/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Cookies.get('access_token')}`
      },
      body: JSON.stringify({ job: id })
    });

    if (!response.ok) {
      toast.error('Error saving job');
      console.error(response);
      return;
    }
    setSaved(!saved);

    toast.success(saved ? 'Job removed from saved jobs' : 'Job saved successfully');
  };

  if (loading) {
    return (
      <div className="container py-5 d-flex justify-content-center align-items-center min-vh-100">
        <div className={`spinner-border text-primary ${styles.loadingSpinner}`} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="container py-5 text-center">
        <h3>Job not found</h3>
        <button className="btn btn-primary mt-3" onClick={() => router.back()}>Go Back</button>
      </div>
    );
  }

  return (
    <div className={`container py-5 ${styles.applyJobBg}`}>
      {/* Job Card */}
      <div className={`card mb-4 shadow-sm border-0 rounded-4 ${styles.jobCard}`}>
        <div className="row g-0 align-items-center p-4">
          <div className="col-md-2 d-flex justify-content-center align-items-center">
            <div className="bg-light rounded-3 d-flex justify-content-center align-items-center" style={{width: 70, height: 70}}>
                <Image src={jobData.company_logo || '/Dashboards/default_company.svg'} alt={jobData.company_name} width={50} height={50} className='rounded-3' />
            </div>
          </div>
          <div className="col-md-7">
            <h5 className={styles.jobTitle}>{jobData.title}</h5>
            <div className={styles.companyName}>{jobData.company_name}</div>
            <div className={styles.jobMeta}>
              <span className={styles.jobMetaItem}><FiMapPin />{jobData.location}</span>
              <span className={styles.jobMetaItem}><FiBriefcase />{jobData.experience_level}</span>
              <span className={styles.jobMetaItem}><FiCalendar />Posted {new Date(jobData.created_at).toLocaleDateString()}</span>
              <span className={styles.jobMetaItem}><FiUsers />{jobData.vacancies} Vacancies</span>
            </div>
          </div>
          <div className={`${styles.buttonContainer} col-md-3 d-flex flex-column align-items-end gap-2`}>
            <button 
              className={`btn px-4 mb-2 ${applied ? 'btn-success' : 'btn-primary'}`} 
              onClick={handleApply}
              disabled={applying || applied}
            >
              {applying ? 'Applying...' : applied ? <><FaCheckCircle /> Applied</> : 'Apply Now'}
            </button>
            <button 
              className={`btn ${saved ? 'btn-success' : 'btn-outline-secondary'} px-4`}
              onClick={() => handleSave(jobData.id)}
              disabled={applying || saved}
            >
              <FiBookmark /> {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="row">
        <div className="col-lg-8">
          {/* Requirements */}
          <div className={`card p-4 mb-4 border-0 rounded-4 ${styles.sectionCard}`}>
            <h5 className={styles.sectionHeader}>Requirements</h5>
            <div className="text-secondary" style={{textAlign: 'justify'}}>
              {jobData.requirements.split('\n\n').map((req, index) => (
                <p key={index} className="mb-2">{req}</p>
              ))}
            </div>
          </div>

          {/* Responsibilities */}
          <div className={`card p-4 mb-4 border-0 rounded-4 ${styles.sectionCard}`}>
            <h5 className={styles.sectionHeader}>Responsibilities</h5>
            <div className="text-secondary" style={{textAlign: 'justify'}}>
              {jobData.responsibilities.split('\n\n').map((resp, index) => (
                <p key={index} className="mb-2">{resp}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Job Overview */}
        <div className="col-lg-4">
          <div className={`card p-4 border-0 rounded-4 ${styles.sectionCard}`}>
            <h5 className={styles.sectionHeader}>Job Overview</h5>
            <div className="d-flex flex-column gap-3">
              <div className={styles.overviewItem}>
                <div className="d-flex align-items-center">
                  <FiDollarSign className={`me-2 ${styles.overviewItemIcon}`} />
                  <div>
                    <div className={styles.overviewItemLabel}>Salary Range</div>
                    <div className={styles.overviewItemValue}>
                      {jobData.currency} {jobData.min_salary} - {jobData.max_salary} ({jobData.salary_type})
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.overviewItem}>
                <div className="d-flex align-items-center">
                  <FiBriefcase className={`me-2 ${styles.overviewItemIcon}`} />
                  <div>
                    <div className={styles.overviewItemLabel}>Job Type</div>
                    <div className={styles.overviewItemValue}>{jobData.job_type}</div>
                  </div>
                </div>
              </div>
              <div className={styles.overviewItem}>
                <div className="d-flex align-items-center">
                  <FiMapPin className={`me-2 ${styles.overviewItemIcon}`} />
                  <div>
                    <div className={styles.overviewItemLabel}>Work Mode</div>
                    <div className={styles.overviewItemValue}>{jobData.work_mode}</div>
                  </div>
                </div>
              </div>
              <div className={styles.overviewItem}>
                <div className="d-flex align-items-center">
                  <FiGlobe className={`me-2 ${styles.overviewItemIcon}`} />
                  <div>
                    <div className={styles.overviewItemLabel}>Company Website</div>
                    <a href={jobData.company_website} target="_blank" rel="noopener noreferrer" className={styles.overviewItemValue}>
                      {(jobData.company_website).substring(0, 20)}...
                    </a>
                  </div>
                </div>
              </div>
              <div className={styles.overviewItem}>
                <div className="d-flex align-items-center">
                  <FiMail className={`me-2 ${styles.overviewItemIcon}`} />
                  <div>
                    <div className={styles.overviewItemLabel}>Contact Email</div>
                    <a href={`mailto:${jobData.company_email}`} className={styles.overviewItemValue}>
                      {(jobData.company_email).substring(0, 20)}...
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
