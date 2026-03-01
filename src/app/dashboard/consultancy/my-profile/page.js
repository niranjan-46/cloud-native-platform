'use client';
import styles from './Profile.module.css';
import { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import ClipLoader from 'react-spinners/ClipLoader';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { ProfileContext } from '@/context/shared/Profile';
import { 
  FaBuilding, 
  FaGlobe, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaUsers, 
  FaIndustry,
  FaFileAlt,
  FaFileInvoiceDollar,
  FaIdCard,
  FaUserCircle,
  FaCamera,
  FaCheck,
  FaPencilAlt,
  FaDownload,
  FaUpload
} from 'react-icons/fa';

export default function Profile() {
  const router = useRouter();
  const { profileData, setProfileData } = useContext(ProfileContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState({
    name: '',
    consultancy_name: '',
    specialization: '',
    experience_years: '',
    consultancy_size: '',
    office_address: '',
    website: '',
    phone_number: '',
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
            router.push('/login');
            return;
          }
          throw new Error(errorData.detail || 'Failed to fetch profile data');
        }

        const data = await response.json();
        setProfileData(data);
        setEditedData({
          name: data.user.name || '',
          consultancy_name: data.profile.consultancy_name || '',
          specialization: data.profile.specialization || '',
          experience_years: data.profile.experience_years || '',
          consultancy_size: data.profile.consultancy_size || '',
          office_address: data.profile.office_address || '',
          website: data.profile.website || '',
          phone_number: data.profile.phone_number || '',
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

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

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
      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consultancy/profile/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          consultancy_name: editedData.consultancy_name,
          specialization: editedData.specialization,
          experience_years: editedData.experience_years || 0,          consultancy_size: editedData.consultancy_size,
          office_address: editedData.office_address,
          website: editedData.website,
          phone_number: editedData.phone_number
        })
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to update profile');
      }

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
        <div className={styles.coverImage}>
          <div className={styles.coverImageOverlay}>
            {isEditMode && (
              <label htmlFor="coverImageUpload" className={styles.coverImageUpload}>
                <FaCamera />
                <input
                  type="file"
                  id="coverImageUpload"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        </div>
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
                    <FaCamera />
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
            <h1 className="h2 mb-2">{(profileData.user.name).toUpperCase()}</h1>
          )}
          {isEditMode ? (
            <input
              type="text"
              name="specialization"
              value={editedData.specialization}
              onChange={handleInputChange}
              className="form-control mb-2"
              placeholder="Your specialization"
            />
          ) : (
            <div className="text-muted mb-2">
              {profileData.profile.specialization || 'No specialization available'}
            </div>
          )}
          <div className="d-flex align-items-center justify-content-center">
            <FaBuilding className="me-2" />
            {isEditMode ? (
              <input
                type="text"
                name="consultancy_name"
                value={editedData.consultancy_name}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Consultancy name"
              />
            ) : (
              <span>{profileData.profile.consultancy_name || 'Consultancy not specified'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Consultancy Information Section */}
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <div className={`${styles.sectionCard} mb-4`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Consultancy Information</h2>
          {!isEditMode && (
            <button className={styles.actionButton} onClick={handleEditToggle}>
              <FaPencilAlt />
              Edit Information
            </button>
          )}
        </div>
        {isEditMode ? (
          <div className={styles.companyInfoGrid}>
            <div className={styles.companyInfoItem}>
              <label className={styles.companyInfoLabel}>
                <FaIndustry />
                Specialization
              </label>
              <input
                type="text"
                name="specialization"
                value={editedData.specialization}
                onChange={handleInputChange}
                className={styles.companyInfoInput}
                placeholder="Enter specialization"
              />
            </div>
            <div className={styles.companyInfoItem}>
              <label className={styles.companyInfoLabel}>
                <FaUsers />
                Consultancy Size
              </label>
              <select
                name="consultancy_size"
                value={editedData.consultancy_size}
                onChange={handleInputChange}
                className={styles.companyInfoSelect}
              >
                <option value="">Select consultancy size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1001-5000">1001-5000 employees</option>
                <option value="5001+">5001+ employees</option>
              </select>
            </div>
            <div className={styles.companyInfoItem}>
              <label className={styles.companyInfoLabel}>
                <FaUsers />
                Experience (Years)
              </label>
              <input
                type="number"
                name="experience_years"
                value={editedData.experience_years}
                onChange={handleInputChange}
                className={styles.companyInfoInput}
                placeholder="Enter years of experience"
              />
            </div>
            <div className={`${styles.companyInfoItem} ${styles.companyInfoItem.fullWidth}`}>
              <label className={styles.companyInfoLabel}>
                <FaMapMarkerAlt />
                Office Address
              </label>
              <textarea
                name="office_address"
                value={editedData.office_address}
                onChange={handleInputChange}
                className={styles.companyInfoTextarea}
                placeholder="Enter office address"
              />
            </div>
            <div className={styles.companyInfoItem}>
              <label className={styles.companyInfoLabel}>
                <FaGlobe />
                Website URL
              </label>
              <input
                type="url"
                name="website"
                value={editedData.website}
                onChange={handleInputChange}
                className={styles.companyInfoInput}
                placeholder="Enter website URL"
              />
            </div>
            <div className={styles.companyInfoItem}>
              <label className={styles.companyInfoLabel}>
                <FaPhone />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone_number"
                value={editedData.phone_number}
                onChange={handleInputChange}
                className={styles.companyInfoInput}
                placeholder="Enter phone number"
              />
            </div>
          </div>
        ) : (
          <div className={styles.companyInfoGrid}>
            <div className={styles.companyInfoItem}>
              <div className={styles.companyInfoLabel}>
                <FaIndustry />
                Specialization
              </div>
              <p className={styles.companyInfoValue}>
                {profileData.profile.specialization || 'Not specified'}
              </p>
            </div>
            <div className={styles.companyInfoItem}>
              <div className={styles.companyInfoLabel}>
                <FaUsers />
                Consultancy Size
              </div>
              <p className={styles.companyInfoValue}>
                {profileData.profile.consultancy_size || 'Not specified'}
              </p>
            </div>
            <div className={styles.companyInfoItem}>
              <div className={styles.companyInfoLabel}>
                <FaUsers />
                Experience (Years)
              </div>
              <p className={styles.companyInfoValue}>
                {profileData.profile.experience_years || 'Not specified'}
              </p>
            </div>
            <div className={`${styles.companyInfoItem} ${styles.companyInfoItem.fullWidth}`}>
              <div className={styles.companyInfoLabel}>
                <FaMapMarkerAlt />
                Office Address
              </div>
              <p className={styles.companyInfoValue}>
                {profileData.profile.office_address || 'Not specified'}
              </p>
            </div>
            <div className={styles.companyInfoItem}>
              <div className={styles.companyInfoLabel}>
                <FaGlobe />
                Website
              </div>
              <p className={styles.companyInfoValue}>
                {profileData.profile.website ? (
                  <a href={profileData.profile.website} target="_blank" rel="noopener noreferrer">
                    {profileData.profile.website}
                  </a>
                ) : (
                  'Not specified'
                )}
              </p>
            </div>
            <div className={styles.companyInfoItem}>
              <div className={styles.companyInfoLabel}>
                <FaPhone />
                Phone Number
              </div>
              <p className={styles.companyInfoValue}>
                {profileData.profile.phone_number || 'Not specified'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className={`${styles.sectionCard} mb-4`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Consultancy Documents</h2>
        </div>
        <div className="row g-3">
          <div className="col-md-6">
            <div className={styles.documentCard}>
              <div className={styles.documentIcon}>
                <FaFileAlt />
              </div>
              <div className={styles.documentInfo}>
                <h3 className={styles.documentTitle}>MSME/Incorporation Certificate</h3>
                <p className={styles.documentStatus}>
                  {profileData.profile.msme_or_incorporation_certificate ? 'Uploaded' : 'Not uploaded'}
                </p>
              </div>
              {profileData.profile.msme_or_incorporation_certificate && (
                <a 
                  href={profileData.profile.msme_or_incorporation_certificate} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.documentAction}
                >
                  <FaDownload />
                  View
                </a>
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className={styles.documentCard}>
              <div className={styles.documentIcon}>
                <FaFileInvoiceDollar />
              </div>
              <div className={styles.documentInfo}>
                <h3 className={styles.documentTitle}>GSTIN Certificate</h3>
                <p className={styles.documentStatus}>
                  {profileData.profile.gstin_certificate ? 'Uploaded' : 'Not uploaded'}
                </p>
              </div>
              {profileData.profile.gstin_certificate && (
                <a 
                  href={profileData.profile.gstin_certificate} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.documentAction}
                >
                  <FaDownload />
                  View
                </a>
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className={styles.documentCard}>
              <div className={styles.documentIcon}>
                <FaIdCard />
              </div>
              <div className={styles.documentInfo}>
                <h3 className={styles.documentTitle}>PAN Card</h3>
                <p className={styles.documentStatus}>
                  {profileData.profile.pan_card ? 'Uploaded' : 'Not uploaded'}
                </p>
              </div>
              {profileData.profile.pan_card && (
                <a 
                  href={profileData.profile.pan_card} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.documentAction}
                >
                  <FaDownload />
                  View
                </a>
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className={styles.documentCard}>
              <div className={styles.documentIcon}>
                <FaUserCircle />
              </div>
              <div className={styles.documentInfo}>
                <h3 className={styles.documentTitle}>POC Document</h3>
                <p className={styles.documentStatus}>
                  {profileData.profile.poc_document ? 'Uploaded' : 'Not uploaded'}
                </p>
              </div>
              {profileData.profile.poc_document && (
                <a 
                  href={profileData.profile.poc_document} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.documentAction}
                >
                  <FaDownload />
                  View
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Application Status */}
      <div className={`${styles.sectionCard} mb-4`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Application Status</h2>
        </div>
        <div className={`${styles.statusBadge} ${styles.statusBadge[profileData.profile.application_status]}`}>
          <FaCheck />
          Status: {profileData.profile.application_status?.toUpperCase() || 'PENDING'}
        </div>
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
            {isEditMode ? <FaCheck /> : <FaPencilAlt />}
          </>
        )}
      </button>
    </div>
  );
}