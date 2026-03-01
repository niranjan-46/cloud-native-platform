'use client'
import { FiBriefcase, FiMapPin, FiClock, FiAward, FiFileText, FiUserCheck, FiDollarSign, FiCalendar, FiUsers, FiGlobe, FiMail, FiTag } from 'react-icons/fi';
import styles from './page.module.css';
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { ClipLoader } from 'react-spinners';
import { toast } from 'react-toastify';
import { Country, State, City } from "country-state-city";
import { BiCity } from 'react-icons/bi';
import { FaCity, FaGlobeAmericas } from 'react-icons/fa';
import { PlanContext } from '@/context/shared/Plan';
import CheckPlanUsage from "@/components/shared/CheckPlanUsage";
import Plans from '@/components/employer/models/plans/Plans';



export default function PostJob() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    company_website: '',
    company_email: '',
    company_logo: '',
    location: '',
    work_mode: 'hybrid',
    job_type: 'full-time',
    experience_level: 'senior',
    industry: 'Technology',
    min_salary: '',
    max_salary: '',
    currency: 'INR',
    salary_type: 'yearly',
    bid_budget: 1,
    bid_candidates: 1,
    description: '',
    requirements: '',
    responsibilities: '',
    skills_required: '',
    deadline: '',
    vacancies: 1
  });
  CheckPlanUsage({type: 'job'});
  const {userSubscription, setUserSubscription} = useContext(PlanContext);
  const isPlanUsage = !!(
    userSubscription &&
    userSubscription.has_subscription &&
    parseInt(userSubscription.job_limit) > 0
  );
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

useEffect(() => {
  setStates(State.getStatesOfCountry('IN'));
}, []);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get/profile/`, {
          headers: {
            'Authorization': `Bearer ${Cookies.get('access_token')}`
          }
        });

        if (!response.ok) {
          toast.error('Failed to fetch company data');
          throw new Error('Failed to fetch company data');
        }

        const fetchedUserData = await response.json();
        
        setFormData(prev => ({
          ...prev,
          company_name: fetchedUserData.profile.company_name || '',
          company_website: fetchedUserData.profile.website_url || '',
          company_email: fetchedUserData.user.email || '',
          company_logo: fetchedUserData.profile.profile_image || ''
        }));
      } catch (error) {
        toast.error('Failed to load company information. Please try again.');
        setError('Failed to load company information. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  useEffect(() => {
    let timer;
    if (success) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/dashboard/employer/posted-jobs');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [success, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseInt(formData.min_salary) > parseInt(formData.max_salary)) {
      toast.error('Minimum salary cannot be greater than maximum salary');
      return;
    }else if(parseInt(formData.min_salary) < 0 || parseInt(formData.max_salary) < 0){
      toast.error('Salary cannot be negative');
      return;
    }else if(formData.min_salary === '' || formData.max_salary === ''){
      toast.error('Salary cannot be empty');
      return;
    }else if(parseInt(formData.min_salary) === 0 || parseInt(formData.max_salary) === 0){
      toast.error('Salary cannot be zero');
      return;
    }else if(formData.min_salary === null || formData.max_salary === null){
      toast.error('Salary cannot be null');
      return;
    }else if(formData.min_salary === undefined || formData.max_salary === undefined){
      toast.error('Salary cannot be undefined');
      return;
    }
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        },
        body: JSON.stringify(formData),
      });


      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || errorData.detail || `HTTP error! status: ${response.status}`);
        throw new Error(errorData?.message || errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUserSubscription(prev => ({
        ...prev,
        job_limit: parseInt(prev.job_limit) - 1
      }));
      
      toast.success('Job posted successfully!');
      setSuccess(true);
      setCountdown(5);
    } catch (error) {
      setError(error.message || 'Failed to post job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setFormData(prev => ({
      ...prev,
      location: "", // clear city when state changes
      state: selectedState,
    }));
    setCities(City.getCitiesOfState('IN', selectedState));
  };
  
  const handleCityChange = (e) => {
    setFormData(prev => ({
      ...prev,
      location: e.target.value,
    }));
  };

  return (
    <>
    <div className="container py-3">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <form onSubmit={handleSubmit} className={`${styles.card} shadow-sm p-4 p-md-5`}>
            {error && (
              <div className="alert alert-danger mb-4" role="alert">
                {error}
              </div>
            )}
            
            {success && (
              <div className="alert alert-success mb-4 d-flex align-items-center" role="alert">
                <div className="me-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                  </svg>
                </div>
                <div>
                  Job posted successfully! Redirecting to posted jobs in {countdown} seconds...
                </div>
              </div>
            )}

            <div className="mb-4">
              <h2 className={`${styles.heading} fw-bold mb-0`}>Post a Job</h2>
            </div>

            <div className="row gx-3">
              <div className="col-md-6 mb-4">
                <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                  <FiBriefcase /> Job Title
                </label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`${styles.input} form-control`} 
                  placeholder="Senior Python Developer" 
                  required
                />
              </div>
              <div className="col-md-6 mb-4">
                <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                  <FiBriefcase /> Company Name
                </label>
                <input 
                  type="text" 
                  name="company_name"
                  value={formData.company_name}
                  className={`${styles.input} form-control bg-light`} 
                  readOnly
                />
              </div>
            </div>

            <div className="row gx-3">
              <div className="col-md-6 mb-4">
                <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                  <FiGlobe /> Company Website
                </label>
                <input 
                  type="url" 
                  name="company_website"
                  value={formData.company_website}
                  className={`${styles.input} form-control bg-light`} 
                  readOnly
                />
              </div>
              <div className="col-md-6 mb-4">
                <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                  <FiMail /> Company Email
                </label>
                <input 
                  type="email" 
                  name="company_email"
                  value={formData.company_email}
                  className={`${styles.input} form-control bg-light`} 
                  readOnly
                />
              </div>
            </div>

            <div className="col mb-4">
              <div className="row">
                  <div className="col">
                    <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                      <FaGlobeAmericas /> State
                    </label>
                    <select
                    className={`${styles.input} form-select`}
                    value={formData.state || ""}
                    onChange={handleStateChange}
                    required
                    >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state.isoCode} value={state.isoCode}>
                        {state.name}
                      </option>
                    ))}
                    </select>
                  </div>


                  <div className="col">
                      <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                        <FaCity /> City
                      </label>
                    <select
                      className={`${styles.input} form-select`}
                      value={formData.location || ""}
                      onChange={handleCityChange}
                      required
                      disabled={!formData.state}
                    >
                      <option value="">Select City</option>
                      {cities.map((city) => (
                        <option key={city.name} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>

              </div>
            </div>


            <div className="row gx-3">
              <div className="col-md-6 mb-4">
                <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                  <FiClock /> Job Type
                </label>
                <select 
                  name="job_type"
                  value={formData.job_type}
                  onChange={handleChange}
                  className={`${styles.input} form-select`}
                  required
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                  <option value="temporary">Temporary</option>
                </select>
              </div>
              <div className="col-md-6 mb-4">
                <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                  <FiUsers /> Experience Level
                </label>
                <select 
                  name="experience_level"
                  value={formData.experience_level}
                  onChange={handleChange}
                  className={`${styles.input} form-select`}
                  required
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="director">Director</option>
                  <option value="executive">Executive</option>
                  <option value="lead">Lead</option>
                  <option value="manager">Manager</option>
                  <option value="intern">Intern</option>
                </select>
              </div>
            </div>

            <div className="row gx-3">
              <div className="col-md-6 mb-4">
                <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                  <FiTag /> Industry
                </label>
                <input 
                  type="text" 
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className={`${styles.input} form-control`} 
                  placeholder="Technology" 
                  required
                />
              </div>
              <div className="col-md-6 mb-4">
                <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                  <FiTag /> Skills Required
                </label>
                <input 
                  type="text" 
                  name="skills_required"
                  value={formData.skills_required}
                  onChange={handleChange}
                  className={`${styles.input} form-control`} 
                  placeholder="Python,Django,PostgreSQL,AWS" 
                  required
                />
              </div>
            </div>

            <div className="row gx-3">
              <div className="col-md-6 mb-4">
                <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                ₹ Salary Range
                </label>
                <div className="d-flex gap-2">
                  <input 
                    type="number" 
                    name="min_salary"
                    value={formData.min_salary}
                    onChange={handleChange}
                    className={`${styles.input} form-control`} 
                    placeholder="Min Salary" 
                    required
                  />
                  <input 
                    type="number" 
                    name="max_salary"
                    value={formData.max_salary}
                    onChange={handleChange}
                    className={`${styles.input} form-control`} 
                    placeholder="Max Salary" 
                    required
                  />
                </div>
              </div>
              <div className="col-md-6 mb-4">
                <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                  <FiDollarSign /> Salary Type
                </label>
                <select 
                  name="salary_type"
                  value={formData.salary_type}
                  onChange={handleChange}
                  className={`${styles.input} form-select`}
                  required
                >
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
            </div>

            {/* bid budget */}
            <div className="row gx-3">
              <div className="col-md-6 mb-4">
                <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                ₹ Bid Budget
                </label>
                <div className="d-flex gap-2">
                  <input 
                    type="number" 
                    name="bid_budget"
                    value={formData.bid_budget}
                    onChange={handleChange}
                    className={`${styles.input} form-control`} 
                    placeholder="Total Bid budget" 
                    required
                  />
                </div>
              </div>
              <div className="col-md-6 mb-4">
                <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                  <FiUsers /> No of candidate required
                </label>
                <input
                  type="number"
                  name="bid_candidates"
                  value={formData.bid_candidates}
                  onChange={handleChange}
                  className={`${styles.input} form-select`}
                  placeholder="Total required candidates" 
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                <FiFileText /> Job Description
              </label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`${styles.textarea} form-control`} 
                rows={5}
                placeholder="We are looking for an experienced Python developer..."
                required
              ></textarea>
            </div>

            <div className="mb-4">
              <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                <FiUserCheck /> Requirements
              </label>
              <textarea 
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                className={`${styles.textarea} form-control`} 
                rows={5}
                placeholder="5+ years of Python experience..."
                required
              ></textarea>
            </div>

            <div className="mb-4">
              <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                <FiFileText /> Responsibilities
              </label>
              <textarea 
                name="responsibilities"
                value={formData.responsibilities}
                onChange={handleChange}
                className={`${styles.textarea} form-control`} 
                rows={5}
                placeholder="Develop and maintain backend services..."
                required
              ></textarea>
            </div>

            <div className="row gx-3">
              <div className="col-md-6 mb-4">
                <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                  <FiCalendar /> Application Deadline
                </label>
                <input 
                  type="date" 
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className={`${styles.input} form-control`} 
                  required
                />
              </div>
              <div className="col-md-6 mb-4">
                <label className={`${styles.label} form-label d-flex align-items-center gap-2`}>
                  <FiUsers /> Number of Vacancies
                </label>
                <input 
                  type="number" 
                  name="vacancies"
                  value={formData.vacancies}
                  onChange={handleChange}
                  className={`${styles.input} form-control`} 
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="d-grid gap-2 mt-5">
              <button 
                type={(isPlanUsage ? 'submit' : 'button')} 
                disabled={isSubmitting || success || isLoading}
                className={`${styles.submitbtn} btn rounded-3 py-3 fw-bold position-relative`}
                onClick={() => {
                  if (!isPlanUsage) {
                    setIsPlansModalOpen(true);
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <ClipLoader 
                      color="#ffffff" 
                      size={20} 
                      className="me-2"
                    />
                    Loading...
                  </>
                ) : isSubmitting ? (
                  <>
                    <ClipLoader 
                      color="#ffffff" 
                      size={20} 
                      className="me-2"
                    />
                    Posting...
                  </>
                ) : success ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-check-circle me-2" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                      <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                    </svg>
                    Posted Successfully
                  </>
                ) : (
                  isPlanUsage ? 'Post Job' : 'Upgrade Plan'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <Plans 
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        userType={'employer'}
        currentPlanId={0}
      />
    </>
  );
}