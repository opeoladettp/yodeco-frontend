import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import './MemberProfilePage.css';

const MemberProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [member, setMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    otherNames: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    profilePicture: null
  });

  const [previewImage, setPreviewImage] = useState(null);

  // Check if this is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin/members/');
  const isEditRoute = location.pathname.endsWith('/edit');

  useEffect(() => {
    fetchMemberProfile();
    
    // Auto-enable edit mode for admin edit routes
    if (isEditRoute) {
      setIsEditing(true);
    }
  }, [id, isEditRoute]);

  const fetchMemberProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`/members/profile/${id}`);
      const memberData = response.data.member;
      
      setMember(memberData);
      setEditData({
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        otherNames: memberData.otherNames || '',
        email: memberData.email,
        phoneNumber: memberData.phoneNumber,
        dateOfBirth: memberData.dateOfBirth.split('T')[0], // Format for date input
        profilePicture: null
      });
      
    } catch (error) {
      console.error('Error fetching member profile:', error);
      setError(error.response?.data?.error?.message || 'Failed to load member profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPEG, PNG, and JPG images are allowed');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile picture must be less than 5MB');
        return;
      }
      
      setEditData(prev => ({
        ...prev,
        profilePicture: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
    setPreviewImage(null);
  };

  const handleCancelEdit = () => {
    if (isAdminRoute) {
      // For admin routes, go back to admin members page
      navigate('/admin/members');
    } else {
      // For regular routes, just cancel editing
      setIsEditing(false);
      setError(null);
      setSuccess(null);
      setPreviewImage(null);
      
      // Reset edit data to original member data
      setEditData({
        firstName: member.firstName,
        lastName: member.lastName,
        otherNames: member.otherNames || '',
        email: member.email,
        phoneNumber: member.phoneNumber,
        dateOfBirth: member.dateOfBirth.split('T')[0],
        profilePicture: null
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth'];
    const missingFields = requiredFields.filter(field => !editData[field].trim());
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Validate age
    const birthDate = new Date(editData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 16) {
      setError('Age must be at least 16 years');
      return;
    }
    
    if (age > 120) {
      setError('Please enter a valid date of birth');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('firstName', editData.firstName.trim());
      submitData.append('lastName', editData.lastName.trim());
      submitData.append('otherNames', editData.otherNames.trim());
      submitData.append('email', editData.email.trim());
      submitData.append('phoneNumber', editData.phoneNumber.trim());
      submitData.append('dateOfBirth', editData.dateOfBirth);
      
      if (editData.profilePicture) {
        submitData.append('profilePicture', editData.profilePicture);
      }
      
      const response = await api.put(`/members/profile/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMember(response.data.member);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setPreviewImage(null);
      
    } catch (error) {
      console.error('Update error:', error);
      setError(error.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="member-profile-page">
        <div className="profile-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !member) {
    return (
      <div className="member-profile-page">
        <div className="profile-container">
          <div className="error-card">
            <h2>Profile Not Found</h2>
            <p>{error}</p>
            <button 
              onClick={() => navigate(isAdminRoute ? '/admin/members' : '/')} 
              className="btn btn-primary"
            >
              {isAdminRoute ? 'Back to Members' : 'Go Home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="member-profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-picture">
            {(previewImage || (member.profilePicture?.url && member.profilePicture.url.trim() !== '')) ? (
              <>
                <img 
                  src={previewImage || member.profilePicture.url} 
                  alt={`${member.fullName}'s profile`}
                  onError={(e) => {
                    console.error('Profile picture failed to load:', member.profilePicture.url);
                    e.target.style.display = 'none';
                  }}
                />
                <div className="profile-placeholder" style={{ display: 'none' }}>
                  {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                </div>
              </>
            ) : (
              <div className="profile-placeholder">
                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="profile-info">
            <h1>{member.fullName}</h1>
            <p className="registration-number">{member.registrationNumber}</p>
            <p className="member-since">Member since {formatDate(member.createdAt)}</p>
          </div>
          
          <div className="profile-actions">
            {!isEditing ? (
              <button onClick={handleEdit} className="btn btn-primary">
                Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button 
                  onClick={handleCancelEdit} 
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  {isAdminRoute ? 'Back to Members' : 'Cancel'}
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {success && (
          <div className="success-banner">
            {success}
          </div>
        )}

        <div className="profile-content">
          {isEditing ? (
            <form onSubmit={handleSave} className="edit-form">
              <div className="form-section">
                <h3>Personal Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={editData.firstName}
                      onChange={handleInputChange}
                      maxLength={50}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={editData.lastName}
                      onChange={handleInputChange}
                      maxLength={50}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="otherNames">Other Names</label>
                  <input
                    type="text"
                    id="otherNames"
                    name="otherNames"
                    value={editData.otherNames}
                    onChange={handleInputChange}
                    maxLength={100}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Contact Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={editData.email}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phoneNumber">Phone Number *</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={editData.phoneNumber}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Additional Details</h3>
                
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth *</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={editData.dateOfBirth}
                    onChange={handleInputChange}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="profilePicture">Update Profile Picture</label>
                  <input
                    type="file"
                    id="profilePicture"
                    name="profilePicture"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                  />
                  <small>Maximum file size: 5MB. Supported formats: JPEG, PNG, JPG</small>
                </div>
              </div>
            </form>
          ) : (
            <div className="profile-details">
              <div className="detail-section">
                <h3>Personal Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>First Name</label>
                    <span>{member.firstName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Last Name</label>
                    <span>{member.lastName}</span>
                  </div>
                  {member.otherNames && (
                    <div className="detail-item">
                      <label>Other Names</label>
                      <span>{member.otherNames}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <label>Age</label>
                    <span>{member.age} years old</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Contact Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Email Address</label>
                    <span>{member.email}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone Number</label>
                    <span>{member.phoneNumber}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Membership Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Registration Number</label>
                    <span className="registration-number">{member.registrationNumber}</span>
                  </div>
                  <div className="detail-item">
                    <label>Date of Birth</label>
                    <span>{formatDate(member.dateOfBirth)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Registration Date</label>
                    <span>{formatDate(member.createdAt)}</span>
                  </div>
                  {member.updatedAt !== member.createdAt && (
                    <div className="detail-item">
                      <label>Last Updated</label>
                      <span>{formatDate(member.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="profile-footer">
          {isEditing ? (
            <button 
              onClick={handleSave} 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          ) : (
            <button 
              onClick={() => navigate(isAdminRoute ? '/admin/members' : '/')} 
              className="btn btn-secondary"
            >
              {isAdminRoute ? 'Back to Members' : 'Back to Home'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberProfilePage;