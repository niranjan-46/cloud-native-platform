'use client';
import styles from './Profile.module.css';
import { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import ClipLoader from 'react-spinners/ClipLoader';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { ProfileContext } from '@/context/shared/Profile';


export default function Profile() {
  const router = useRouter();
  const { profileData, setProfileData } = useContext(ProfileContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState({
    name: '',
    bio: '',
    city: '',
    about: '',
    skills: '',
    education: [],
    experience: []
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get/profile/`, {
          headers: {
            'Authorization': `Bearer ${Cookies.get('access_token')}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.code === 'token_not_valid') {
            Cookies.remove('access_token');
            Cookies.remove('refresh_token');
            Cookies.remove('user_type');
            router.push('/login');
            return;
          }
          throw new Error(errorData.detail || 'Failed to fetch profile data');
        }

        const data = await response.json();
        setProfileData(data);
        setEditedData({
          name: data.user.name || '',
          bio: data.profile.bio || '',
          city: data.profile.city || '',
          about: data.profile.about || '',
          skills: data.profile.skills || '',
          education: data.education || [],
          experience: data.experience || []
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);


  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const formatEducationType = (type) => {
    const types = {
      'secondary': 'Secondary School',
      'bachelors': 'Bachelor\'s Degree',
      'masters': 'Master\'s Degree',
      'phd': 'PhD',
      'other': 'Other'
    };
    return types[type] || type;
  };

  // Function to get company logo URL
  const getCompanyLogo = (companyName) => {
    if (!companyName) return '/Dashboards/default_company.svg';
    // External logo providers are unreliable and cause 404/DNS errors in UI logs.
    // Keep a stable local fallback for profile timeline cards.
    return ['/Dashboards/default_company.svg'];
  };

  // Function to get school logo URL
  const getSchoolLogo = (schoolName) => {
    if (!schoolName) return '/Dashboards/default_company.svg';
    return ['/Dashboards/default_company.svg'];
  };

  // Custom image component with better error handling and multiple fallbacks
  const LogoImage = ({ src, alt, width, height, defaultSrc }) => {
    const [imgSrc, setImgSrc] = useState(Array.isArray(src) ? src[0] : src);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleError = () => {
      if (Array.isArray(src)) {
        const nextIndex = currentIndex + 1;
        if (nextIndex < src.length) {
          setCurrentIndex(nextIndex);
          setImgSrc(src[nextIndex]);
        } else {
          setImgSrc(defaultSrc);
        }
      } else {
        setImgSrc(defaultSrc);
      }
    };

    return (
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        onError={handleError}
        className="rounded"
        style={{ 
          objectFit: 'contain',
          backgroundColor: 'white',
          padding: '4px'
        }}
      />
    );
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, JPG, PNG, GIF, or WebP image.');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileImageUpload = async () => {
    if (!selectedImage) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('profile_image', selectedImage);

    try {
      console.log('Uploading image to:', `${process.env.NEXT_PUBLIC_API_URL}/api/update-profile-image/`);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/update-profile-image/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile image');
      }

      const data = await response.json();
      console.log('Image upload response:', data);
      
      setProfileData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          profile_image: data.profile_image
        }
      }));

      setSelectedImage(null);
      setImagePreview(null);
      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error('Failed to upload profile image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEducationChange = (index, field, value) => {
    setEditedData(prev => {
      const newEducation = [...prev.education];
      newEducation[index] = {
        ...newEducation[index],
        [field]: value
      };
      return {
        ...prev,
        education: newEducation
      };
    });
  };

  const handleExperienceChange = (index, field, value) => {
    setEditedData(prev => {
      const newExperience = [...prev.experience];
      newExperience[index] = {
        ...newExperience[index],
        [field]: value
      };
      return {
        ...prev,
        experience: newExperience
      };
    });
  };

  const handleAddEducation = () => {
    setEditedData(prev => ({
      ...prev,
      education: [...prev.education, {
        school_name: '',
        degree: '',
        education_type: '',
        field_of_study: '',
        grade: '',
        start_date: '',
        end_date: ''
      }]
    }));
  };

  const handleAddExperience = () => {
    setEditedData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        company_name: '',
        designation: '',
        start_date: '',
        end_date: '',
        currently_working: false,
        location: '',
        job_description: ''
      }]
    }));
  };

  const handleDeleteEducation = async (index) => {
    try {
      const education = editedData.education[index];
      
      // If the education entry has an ID, delete it from the database
      if (education.id) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/educations/${education.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${Cookies.get('access_token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete education entry');
        }
      }

      // Update the local state
      setEditedData(prev => ({
        ...prev,
        education: prev.education.filter((_, i) => i !== index)
      }));

      toast.success('Education entry deleted successfully');
    } catch (error) {
      console.error('Error deleting education:', error);
      toast.error('Failed to delete education entry');
    }
  };

  const handleDeleteExperience = async (index) => {
    try {
      const experience = editedData.experience[index];
      
      // If the experience entry has an ID, delete it from the database
      if (experience.id) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/experiences/${experience.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${Cookies.get('access_token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete experience entry');
        }
      }

      // Update the local state
      setEditedData(prev => ({
        ...prev,
        experience: prev.experience.filter((_, i) => i !== index)
      }));

      toast.success('Experience entry deleted successfully');
    } catch (error) {
      console.error('Error deleting experience:', error);
      toast.error('Failed to delete experience entry');
    }
  };

  const handleUpdate = async () => {
    console.log('Updated Profile Data:', editedData);
    try {
      setIsUpdating(true);

      // Update user information
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/update-user/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editedData.name
        })
      });

      if (!userResponse.ok) {
        throw new Error('Failed to update user information');
      }

      // Update profile information
      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/candidate/profile/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bio: editedData.bio,
          city: editedData.city,
          about: editedData.about,
          skills: editedData.skills
        })
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to update profile');
      }

      // Update education entries
      const educationPromises = editedData.education.map(async (edu) => {
        const method = edu.id ? 'PATCH' : 'POST';
        const url = edu.id 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/educations/${edu.id}/`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/educations/`;

        return fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${Cookies.get('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            education_type: edu.education_type,
            school_name: edu.school_name,
            degree: edu.degree,
            field_of_study: edu.field_of_study,
            start_date: edu.start_date,
            end_date: edu.end_date,
            grade: edu.grade
          })
        });
      });

      // Update experience entries
      const experiencePromises = editedData.experience.map(async (exp) => {
        const method = exp.id ? 'PATCH' : 'POST';
        const url = exp.id 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/experiences/${exp.id}/`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/experiences/`;

        return fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${Cookies.get('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            company_name: exp.company_name,
            designation: exp.designation,
            location: exp.location,
            currently_working: exp.currently_working,
            job_description: exp.job_description,
            start_date: exp.start_date,
            end_date: exp.currently_working ? null : exp.end_date
          })
        });
      });

      // Wait for all updates to complete
      await Promise.all([...educationPromises, ...experiencePromises]);

      // Refresh profile data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get/profile/`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch updated profile');
      }

      const data = await response.json();
      setProfileData(data);
      setIsEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a PDF or Word document.');
      return;
    }

    try {
      setUploadingResume(true);
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('email', profileData.user.email);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload-documents/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload resume');
      }

      const data = await response.json();
      
      // Update profile data with new resume URL
      setProfileData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          resume: data.resume
        }
      }));

      toast.success('Resume uploaded successfully');
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast.error('Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  if (loading) {
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
    <div className="container pb-5">
      {/* Profile Header */}
      <div className={`${styles.profileHeader} position-relative mb-5`}>
        <div className={styles.coverImage}></div>
        <div className={styles.profileImageWrapper}>
          <div className={styles.profileImage}>
            {!isEditMode ? (
              <Image 
                src={profileData.profile.profile_image || `https://robohash.org/${profileData.user.name}.png?set=set3`} 
                alt="Profile" 
                width={180} 
                height={180} 
                className="rounded-circle"
                style={{ 
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%'
                }}
              />
            ) : (
              <div className="position-relative w-100 h-100">
                <div className="position-relative w-100 h-100">
                  <Image 
                    src={imagePreview || profileData.profile.profile_image || `https://robohash.org/${profileData.user.name}.png?set=set3`} 
                    alt="Profile" 
                    width={180} 
                    height={180} 
                    className="rounded-circle"
                    style={{ 
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                      opacity: uploadingImage ? 0.5 : 1
                    }}
                  />
                  {uploadingImage && (
                    <div className="position-absolute top-50 start-50 translate-middle">
                      <ClipLoader color="#0d6efd" size={30} />
                    </div>
                  )}
                </div>
                <div className={styles.profileImageUpload}>
                  <label htmlFor="profileImageUpload" className={styles.uploadButton}>
                    <i className="bi bi-camera-fill"></i>
                  </label>
                  <input
                    type="file"
                    id="profileImageUpload"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                </div>
                {selectedImage && (
                  <button
                    className={`btn btn-primary btn-sm position-absolute bottom-0 start-50 translate-middle-x mb-2 ${styles.updatePhotoButton}`}
                    onClick={handleProfileImageUpload}
                    disabled={uploadingImage}
                    style={{
                      zIndex: 2,
                      minWidth: '150px'
                    }}
                  >
                    {uploadingImage ? (
                      <>
                        <ClipLoader color="#ffffff" size={12} className="me-2" />
                        Uploading...
                      </>
                    ) : (
                      'Update Profile Photo'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={`${styles.profileInfo} text-center`}>
          {isEditMode ? (
            <input
              type="text"
              name="name"
              value={editedData.name}
              onChange={handleInputChange}
              className="form-control mb-2"
              placeholder="Your name"
            />
          ) : (
          <h1 className="h2 mb-2">{profileData.user.name}</h1>
          )}
          {isEditMode ? (
            <input
              type="text"
              name="bio"
              value={editedData.bio}
              onChange={handleInputChange}
              className="form-control mb-2"
              placeholder="Your bio"
            />
          ) : (
          <div className="text-muted mb-2">
            {profileData.profile.bio || 'No bio available'}
          </div>
          )}
          <div className="d-flex align-items-center justify-content-center">
            <i className="bi bi-geo-alt me-2"></i>
            {isEditMode ? (
              <input
                type="text"
                name="city"
                value={editedData.city}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Your city"
              />
            ) : (
            <span>{profileData.profile.city || 'Location not specified'}</span>
            )}
          </div>
        </div>
      </div>

      {/* About Section */}
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <div className="bg-white rounded-4 p-4 mb-4">
        <h2 className="h4 mb-3">About</h2>
        {isEditMode ? (
          <textarea
            name="about"
            value={editedData.about}
            onChange={handleInputChange}
            className="form-control"
            rows="4"
            placeholder="Tell us about yourself"
          />
        ) : (
        <p className={styles.aboutText}>
          {profileData.profile.about || 'No about information available'}
        </p>
        )}
      </div>

      {/* Experience and Education Row */}
      <div className="row g-4 mb-4">
        {/* Experience Section */}
        <div className="col-md-6">
          <div className="bg-white rounded-4 p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h4 mb-0">Experience</h2>
              {isEditMode && (
                <button 
                  className={styles.addSkillButton}
                  onClick={handleAddExperience}
                >
                  + Add Experience
                </button>
              )}
            </div>
            {isEditMode ? (
              <div className="d-flex flex-column gap-3">
                {editedData.experience.map((exp, index) => (
                  <div key={index} className="border rounded p-3 position-relative">
                    <button
                      className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                      onClick={() => handleDeleteExperience(index)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                    <div className="mb-3">
                      <label className="form-label">Company Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={exp.company_name}
                        onChange={(e) => handleExperienceChange(index, 'company_name', e.target.value)}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Designation</label>
                      <input
                        type="text"
                        className="form-control"
                        value={exp.designation}
                        onChange={(e) => handleExperienceChange(index, 'designation', e.target.value)}
                        placeholder="Enter your designation"
                      />
                    </div>
                    <div className="row mb-3">
                      <div className="col">
                        <label className="form-label">Start Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={exp.start_date}
                          onChange={(e) => handleExperienceChange(index, 'start_date', e.target.value)}
                        />
                      </div>
                      <div className="col">
                        <label className="form-label">End Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={exp.end_date}
                          onChange={(e) => handleExperienceChange(index, 'end_date', e.target.value)}
                          disabled={exp.currently_working}
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`currentlyWorking${index}`}
                          checked={exp.currently_working}
                          onChange={(e) => handleExperienceChange(index, 'currently_working', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor={`currentlyWorking${index}`}>
                          Currently Working
                        </label>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        className="form-control"
                        value={exp.location}
                        onChange={(e) => handleExperienceChange(index, 'location', e.target.value)}
                        placeholder="Enter job location"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Job Description</label>
                      <textarea
                        className="form-control"
                        value={exp.job_description}
                        onChange={(e) => handleExperienceChange(index, 'job_description', e.target.value)}
                        placeholder="Enter job description"
                        rows="3"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              profileData.experience.filter(exp => exp.company_name).length > 0 ? (
              profileData.experience.filter(exp => exp.company_name).map((exp, index) => (
                <div key={index} className="mb-3">
                  <div className="d-flex">
                    <div className={styles.companyLogo}>
                      <LogoImage 
                        src={getCompanyLogo(exp.company_name)} 
                        alt={exp.company_name} 
                        width={50} 
                        height={50} 
                        defaultSrc="/Dashboards/default_company.svg"
                      />
                    </div>
                    <div className="ms-3">
                      <h3 className="h5 mb-1">{exp.designation || 'No designation specified'}</h3>
                      <div className="text-muted">{exp.company_name}</div>
                      <div className="text-muted small">
                        {formatDate(exp.start_date)} - {exp.currently_working ? 'Present' : formatDate(exp.end_date)}
                        {exp.location && ` • ${exp.location}`}
                      </div>
                      {exp.job_description && (
                        <div className="mt-2 small">{exp.job_description}</div>
                      )}
                    </div>
                  </div>
                  {index < profileData.experience.length - 1 && <hr className="my-3" />}
                </div>
              ))
            ) : (
              <p className="text-muted">No experience information available</p>
              )
            )}
          </div>
        </div>

        {/* Education Section */}
        <div className="col-md-6">
          <div className="bg-white rounded-4 p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h4 mb-0">Qualification</h2>
              {isEditMode && (
                <button 
                  className={styles.addSkillButton}
                  onClick={handleAddEducation}
                >
                  + Add Education
                </button>
              )}
            </div>
            {isEditMode ? (
              <div className="d-flex flex-column gap-3">
                {editedData.education.map((edu, index) => (
                  <div key={index} className="border rounded p-3 position-relative">
                    <button
                      className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                      onClick={() => handleDeleteEducation(index)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                    <div className="mb-3">
                      <label className="form-label">School Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={edu.school_name}
                        onChange={(e) => handleEducationChange(index, 'school_name', e.target.value)}
                        placeholder="Enter school name"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Degree</label>
                      <input
                        type="text"
                        className="form-control"
                        value={edu.degree}
                        onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                        placeholder="Enter degree"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Education Type</label>
                      <select
                        className="form-select"
                        value={edu.education_type}
                        onChange={(e) => handleEducationChange(index, 'education_type', e.target.value)}
                      >
                        <option value="">Select type</option>
                        <option value="primary">Primary School</option>
                        <option value="secondary">Secondary School</option>
                        <option value="higher_secondary">Higher Secondary</option>
                        <option value="bachelors">Bachelor&apos;s Degree</option>
                        <option value="masters">Master&apos;s Degree</option>
                        <option value="phd">PhD</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Field of Study</label>
                      <input
                        type="text"
                        className="form-control"
                        value={edu.field_of_study}
                        onChange={(e) => handleEducationChange(index, 'field_of_study', e.target.value)}
                        placeholder="Enter field of study"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Grade/GPA</label>
                      <input
                        type="text"
                        className="form-control"
                        value={edu.grade}
                        onChange={(e) => handleEducationChange(index, 'grade', e.target.value)}
                        placeholder="Enter grade or GPA"
                      />
                    </div>
                    <div className="row">
                      <div className="col">
                        <label className="form-label">Start Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={edu.start_date}
                          onChange={(e) => handleEducationChange(index, 'start_date', e.target.value)}
                        />
                      </div>
                      <div className="col">
                        <label className="form-label">End Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={edu.end_date}
                          onChange={(e) => handleEducationChange(index, 'end_date', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              profileData.education.filter(edu => edu.school_name).length > 0 ? (
              profileData.education.filter(edu => edu.school_name).map((edu, index) => (
                <div key={index} className="mb-3">
                  <div className="d-flex">
                    <div className={styles.institutionLogo}>
                      <LogoImage 
                        src={getSchoolLogo(edu.school_name)} 
                        alt={edu.school_name} 
                        width={50} 
                        height={50} 
                        defaultSrc="/Dashboards/default_company.svg"
                      />
                    </div>
                    <div className="ms-3">
                      <h3 className="h5 mb-1">{edu.degree || 'No degree specified'}</h3>
                      <div className="text-muted">{edu.school_name}</div>
                      <div className="text-muted small">
                        {formatEducationType(edu.education_type)}
                        {edu.field_of_study && ` • ${edu.field_of_study}`}
                        {edu.grade && ` • GPA: ${edu.grade}`}
                      </div>
                      <div className="text-muted small">
                        {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                      </div>
                    </div>
                  </div>
                  {index < profileData.education.length - 1 && <hr className="my-3" />}
                </div>
              ))
            ) : (
              <p className="text-muted">No education information available</p>
              )
            )}
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="bg-white rounded-4 p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 mb-0">Skills</h2>
          {!isEditMode && <button className={styles.addSkillButton} onClick={handleEditToggle}>+ Add Skills</button>}
        </div>
        {isEditMode ? (
          <textarea
            name="skills"
            value={editedData.skills}
            onChange={handleInputChange}
            className="form-control"
            rows="3"
            placeholder="Enter your skills (space-separated)"
          />
        ) : (
        <div className={styles.skillsContainer}>
          {profileData.profile.skills ? (
            profileData.profile.skills.split(',').map((skill, index) => (
              <span key={index} className={styles.skillBadge}>
                {skill}
              </span>
            ))
          ) : (
            <p className="text-muted">No skills listed</p>
          )}
        </div>
        )}
      </div>

      {/* Resume Section */}
      <div className="bg-white rounded-4 p-4 mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 mb-0">Resume</h2>
          {!isEditMode && profileData.profile.resume && (
            <a 
              href={profileData.profile.resume} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`${styles.addSkillButton} text-decoration-none`} 
            >
              <i className="bi bi-download me-2"></i>
              Download
            </a>
          )}
        </div>
        {isEditMode ? (
          <div className="d-flex align-items-center gap-3">
            {profileData.profile.resume && (
              <div className="d-flex align-items-center">
                <i className="bi bi-file-earmark-pdf text-danger me-2"></i>
                <span className="text-muted">Current Resume</span>
              </div>
            )}
            <div className="position-relative">
              <input
                type="file"
                id="resumeUpload"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="d-none"
                disabled={uploadingResume}
              />
              <label 
                htmlFor="resumeUpload" 
                className={styles.addSkillButton}
                style={{ 
                  cursor: uploadingResume ? 'not-allowed' : 'pointer',
                  opacity: uploadingResume ? 0.7 : 1
                }}
              >
                {uploadingResume ? (
                  <>
                    <ClipLoader color="#212529" size={12} className="me-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="bi bi-upload me-2"></i>
                    {profileData.profile.resume ? 'Change Resume' : 'Upload Resume'}
                  </>
                )}
              </label>
            </div>
          </div>
        ) : (
          <div>
            {profileData.profile.resume ? (
              <div className="d-flex align-items-center">
                <i className="bi bi-file-earmark-pdf text-danger me-2"></i>
                <span className="text-muted">Resume uploaded</span>
              </div>
            ) : (
              <p className="text-muted">No resume uploaded</p>
            )}
          </div>
        )}
      </div>

      {/* Floating Edit/Update Button */}
      <button 
        className={styles.floatingEditButton}
        onClick={isEditMode ? handleUpdate : handleEditToggle}
        disabled={isUpdating}
      >
        {isUpdating ? (
          <>
            <span>Updating...</span>
            <ClipLoader color="#ffffff" size={12} className="ms-2" />
          </>
        ) : (
          <>
            <span>{isEditMode ? 'Update' : 'Edit'}</span>
            <i className={`bi ${isEditMode ? 'bi-check-lg' : 'bi-pencil-square'} ms-2`}></i>
          </>
        )}
      </button>
    </div>
  );
}
