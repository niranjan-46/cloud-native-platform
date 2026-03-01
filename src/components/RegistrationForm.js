"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaBuilding, FaGraduationCap, FaBriefcase, FaEye, FaEyeSlash } from 'react-icons/fa';
import Link from 'next/link';

export default function RegistrationForm({ userType }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    password: '',
    re_password: '',
    user_type: userType,
    // Additional fields based on user type
    ...(userType === 'employer' && {
      company_name: '',
      industry: '',
      company_size: '',
      company_address: '',
      website_url: ''
    }),
    ...(userType === 'consultancy' && {
      consultancy_name: '',
      specialization: '',
      experience_years: '',
      office_address: '',
      website: ''
    }),
    ...(userType === 'candidate' && {
      education: '',
      experience_years: '',
      skills: '',
      resume_url: '',
      portfolio_website: ''
    })
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Register user
      const registerResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          password: formData.password,
          re_password: formData.re_password,
          user_type: formData.user_type
        }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        if(errorData.email){ setError(errorData.email); }
        if(errorData.password){ setError(errorData.password); }
        if(errorData.non_field_errors){ setError(errorData.non_field_errors); }
        if(errorData.name){ setError(errorData.name); }
        if(errorData.phone){ setError(errorData.phone); }
        if(errorData.re_password){ setError(errorData.re_password); }
        if(errorData.user_type){ setError(errorData.user_type); }

        throw new Error(errorData.detail || 'Registration failed');
      }

      const registerData = await registerResponse.json();

      // Login to get access token using JWT endpoint
      const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/jwt/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        if(errorData.email){ setError(errorData.email); }
        if(errorData.password){ setError(errorData.password); }
        if(errorData.non_field_errors){ setError(errorData.non_field_errors); }
        throw new Error('Login failed');
      }

      const { access, refresh } = await loginResponse.json();

      // Update profile based on user type
      const profileEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/${userType}/profile/`;
      const profileData = {
        ...(userType === 'employer' && {
          company_name: formData.company_name,
          industry: formData.industry,
          company_size: formData.company_size,
          company_address: formData.company_address,
          website_url: formData.website_url
        }),
        ...(userType === 'consultancy' && {
          consultancy_name: formData.consultancy_name,
          specialization: formData.specialization,
          experience_years: formData.experience_years,
          office_address: formData.office_address,
          website: formData.website
        }),
        ...(userType === 'candidate' && {
          education: formData.education,
          experience_years: formData.experience_years,
          skills: formData.skills,
          resume_url: formData.resume_url,
          portfolio_website: formData.portfolio_website
        })
      };

      const profileResponse = await fetch(profileEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access}`
        },
        body: JSON.stringify(profileData)
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        if(errorData.email){ setError(errorData.email); }
        if(errorData.password){ setError(errorData.password); }
        if(errorData.non_field_errors){ setError(errorData.non_field_errors); }
        if(errorData.name){ setError(errorData.name); }
        if(errorData.phone){ setError(errorData.phone); }
        if(errorData.re_password){ setError(errorData.re_password); }
        if(errorData.user_type){ setError(errorData.user_type); }
        if(errorData.company_name){ setError(errorData.company_name); }
        if(errorData.industry){ setError(errorData.industry); }
        if(errorData.company_size){ setError(errorData.company_size); }
        if(errorData.company_address){ setError(errorData.company_address); }
        if(errorData.website_url){ setError(errorData.website_url); }
        if(errorData.consultancy_name){ setError(errorData.consultancy_name); }
        if(errorData.specialization){ setError(errorData.specialization); }
        if(errorData.experience_years){ setError(errorData.experience_years); }
        if(errorData.office_address){ setError(errorData.office_address); }
        if(errorData.website){ setError(errorData.website); }
        if(errorData.education){ setError(errorData.education); }
        if(errorData.skills){ setError(errorData.skills); }
        if(errorData.resume_url){ setError(errorData.resume_url); }
        if(errorData.portfolio_website){ setError(errorData.portfolio_website); }
        
        throw new Error('Profile update failed');
      }

      // Store tokens and redirect
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      router.push(`/dashboard/${userType}`);
    } catch (err) {
      // setError(err.message);
      console.log("From Registration Error: ", err);
    } finally {
      setLoading(false);
    }
  };

  const renderCommonFields = () => (
    <div className="card mb-4">
      <div className="card-header bg-light">
        <h5 className="mb-0">Personal Information</h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">
              <FaUser className="me-2" />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">
              <FaEnvelope className="me-2" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">
              <FaPhone className="me-2" />
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPasswordFields = () => (
    <div className="card mb-4">
      <div className="card-header bg-light">
        <h5 className="mb-0">Security Information</h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">
              <FaLock className="me-2" />
              Password
            </label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-control"
                required
              />
              <button
                type="button"
                className="btn border-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">
              <FaLock className="me-2" />
              Confirm Password
            </label>
            <div className="input-group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="re_password"
                value={formData.re_password}
                onChange={handleChange}
                className="form-control"
                required
              />
              <button
                type="button"
                className="btn border-secondary"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmployerFields = () => (
    <div className="card mb-4">
      <div className="card-header bg-light">
        <h5 className="mb-0">Company Information</h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">
              <FaBuilding className="me-2" />
              Company Name
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Industry</label>
            <input
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Company Size</label>
            <select
              name="company_size"
              value={formData.company_size}
              onChange={handleChange}
              className="form-control"
              required
            >
              <option value="">Select Company Size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="500+">500+ employees</option>
            </select>
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Website URL</label>
            <input
              type="url"
              name="website_url"
              value={formData.website_url}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-12 mb-3">
            <label className="form-label">Company Address</label>
            <textarea
              name="company_address"
              value={formData.company_address}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderConsultancyFields = () => (
    <div className="card mb-4">
      <div className="card-header bg-light">
        <h5 className="mb-0">Consultancy Information</h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">
              <FaBuilding className="me-2" />
              Consultancy Name
            </label>
            <input
              type="text"
              name="consultancy_name"
              value={formData.consultancy_name}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Specialization</label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Years of Experience</label>
            <input
              type="number"
              name="experience_years"
              value={formData.experience_years}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-12 mb-3">
            <label className="form-label">Office Address</label>
            <textarea
              name="office_address"
              value={formData.office_address}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderCandidateFields = () => (
    <div className="card mb-4">
      <div className="card-header bg-light">
        <h5 className="mb-0">Professional Information</h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">
              <FaGraduationCap className="me-2" />
              Education
            </label>
            <input
              type="text"
              name="education"
              value={formData.education}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">
              <FaBriefcase className="me-2" />
              Years of Experience
            </label>
            <input
              type="number"
              name="experience_years"
              value={formData.experience_years}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Skills (comma separated)</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Resume URL</label>
            <input
              type="url"
              name="resume_url"
              value={formData.resume_url}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Portfolio Website</label>
            <input
              type="url"
              name="portfolio_website"
              value={formData.portfolio_website}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="needs-validation" noValidate>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {renderCommonFields()}
      {renderPasswordFields()}

      {userType === 'employer' && renderEmployerFields()}
      {userType === 'consultancy' && renderConsultancyFields()}
      {userType === 'candidate' && renderCandidateFields()}

      <div className="d-grid">
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Registering...
            </>
          ) : (
            'Register'
          )}
        </button>
        <Link href="/register" className="btn btn-secondary btn-lg mt-2">Back to Register</Link>
      </div>
    </form>
  );
} 