import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { nigeriaStates, lgasByState, getWardsForLGA } from '../data/nigeriaLocations';
import './MemberRegistrationPage.css';

const MemberRegistrationPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    otherNames: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    country: 'Nigeria',
    state: '',
    lga: '',
    ward: '',
    profilePicture: null
  });

  const [availableLGAs, setAvailableLGAs] = useState([]);
  const [availableWards, setAvailableWards] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Handle cascading dropdowns
    if (name === 'state') {
      // Update LGAs when state changes
      const lgas = lgasByState[value] || [];
      setAvailableLGAs(lgas);
      setFormData(prev => ({
        ...prev,
        state: value,
        lga: '',
        ward: ''
      }));
      setAvailableWards([]);
    } else if (name === 'lga') {
      // Update wards when LGA changes
      const wards = getWardsForLGA(formData.state, value);
      setAvailableWards(wards);
      setFormData(prev => ({
        ...prev,
        lga: value,
        ward: ''
      }));
    }
    
    // Clear errors when user starts typing
    if (error) setError(null);
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
      
      setFormData(prev => ({
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 'country', 'state', 'lga'];
    const missingFields = requiredFields.filter(field => !formData[field] || !formData[field].toString().trim());
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Validate age (must be at least 16)
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 16) {
      setError('You must be at least 16 years old to register');
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
      submitData.append('firstName', formData.firstName.trim());
      submitData.append('lastName', formData.lastName.trim());
      submitData.append('otherNames', formData.otherNames.trim());
      submitData.append('email', formData.email.trim());
      submitData.append('phoneNumber', formData.phoneNumber.trim());
      submitData.append('dateOfBirth', formData.dateOfBirth);
      submitData.append('country', formData.country);
      submitData.append('state', formData.state);
      submitData.append('lga', formData.lga);
      submitData.append('ward', formData.ward || '');
      
      if (formData.profilePicture) {
        submitData.append('profilePicture', formData.profilePicture);
      }
      
      const response = await api.post('/members/register', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess({
        message: 'Registration successful!',
        member: response.data.member
      });
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        otherNames: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        country: 'Nigeria',
        state: '',
        lga: '',
        ward: '',
        profilePicture: null
      });
      setPreviewImage(null);
      setAvailableLGAs([]);
      setAvailableWards([]);
      
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewProfile = () => {
    if (success?.member?.id) {
      navigate(`/member/profile/${success.member.id}`);
    }
  };

  const handleNewRegistration = () => {
    setSuccess(null);
    setError(null);
  };

  if (success) {
    return (
      <div className="member-registration-page">
        <div className="registration-container">
          <div className="success-card">
            <div className="success-icon">✅</div>
            <h2>Registration Successful!</h2>
            <div className="member-details">
              <p><strong>Registration Number:</strong> {success.member.registrationNumber}</p>
              <p><strong>Name:</strong> {success.member.fullName}</p>
              <p><strong>Email:</strong> {success.member.email}</p>
            </div>
            <div className="success-actions">
              <button 
                onClick={handleViewProfile}
                className="btn btn-primary"
              >
                View Profile
              </button>
              <button 
                onClick={handleNewRegistration}
                className="btn btn-secondary"
              >
                Register Another Member
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="member-registration-page">
      <div className="registration-container">
        <div className="registration-header">
          <h1>YODECO Membership Registration</h1>
          <p>Join the Youth Democratic Coalition</p>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-section">
            <h3>Personal Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  maxLength={50}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name (Surname) *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  maxLength={50}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="otherNames">Other Names (Optional)</label>
              <input
                type="text"
                id="otherNames"
                name="otherNames"
                value={formData.otherNames}
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
                  value={formData.email}
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
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+234XXXXXXXXXX"
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
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
                required
                disabled={isSubmitting}
              />
              <small>You must be at least 16 years old to register</small>
            </div>

            <div className="form-group">
              <label htmlFor="profilePicture">Profile Picture (Optional)</label>
              <input
                type="file"
                id="profilePicture"
                name="profilePicture"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              <small>Maximum file size: 5MB. Supported formats: JPEG, PNG, JPG</small>
              
              {previewImage && (
                <div className="image-preview">
                  <img src={previewImage} alt="Profile preview" />
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Location Information</h3>
            
            <div className="form-group">
              <label htmlFor="country">Country *</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                readOnly
                className="readonly-field"
              />
              <small>All YODECO members are Nigerian citizens</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="state">State *</label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Select State</option>
                  {nigeriaStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="lga">Local Government Area (LGA) *</label>
                <select
                  id="lga"
                  name="lga"
                  value={formData.lga}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting || !formData.state}
                >
                  <option value="">Select LGA</option>
                  {availableLGAs.map(lga => (
                    <option key={lga} value={lga}>{lga}</option>
                  ))}
                </select>
                {!formData.state && <small>Please select a state first</small>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ward">Ward (Optional)</label>
              <select
                id="ward"
                name="ward"
                value={formData.ward}
                onChange={handleInputChange}
                disabled={isSubmitting || !formData.lga}
              >
                <option value="">Select Ward</option>
                {availableWards.map(ward => (
                  <option key={ward} value={ward}>{ward}</option>
                ))}
              </select>
              {!formData.lga && <small>Please select an LGA first</small>}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberRegistrationPage;