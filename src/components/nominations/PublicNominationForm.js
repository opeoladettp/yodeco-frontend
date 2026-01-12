import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import ImageUpload from '../content/ImageUpload';
import { getImageUrl } from '../../utils/imageUtils';
import './PublicNominationForm.css';

const PublicNominationForm = ({ 
  awardId, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    imageUrl: '',
    awardId: awardId || ''
  });
  const [award, setAward] = useState(null);
  const [nominationStatus, setNominationStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoadingAward, setIsLoadingAward] = useState(true);

  useEffect(() => {
    if (awardId) {
      fetchAwardAndStatus();
    }
  }, [awardId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAwardAndStatus = async () => {
    try {
      setIsLoadingAward(true);
      const response = await api.get(`/content/awards/${awardId}/nomination-status`);
      setAward(response.data.award);
      setNominationStatus(response.data.nominationStatus);
    } catch (error) {
      console.error('Error fetching award nomination status:', error);
      setErrors({ general: 'Failed to load award information' });
    } finally {
      setIsLoadingAward(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleImageUpload = (uploadResult) => {
    if (uploadResult) {
      setFormData(prev => ({
        ...prev,
        imageUrl: uploadResult.objectKey
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        imageUrl: ''
      }));
    }
  };

  const handleImageUploadError = (error) => {
    console.error('Image upload error:', error);
    setErrors(prev => ({
      ...prev,
      image: `Image upload failed: ${error}`
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nominee name is required';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Biography is required';
    } else if (formData.bio.trim().length < 50) {
      newErrors.bio = 'Biography must be at least 50 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const response = await api.post('/content/nominations', formData);
      onSubmit(response.data);
    } catch (error) {
      console.error('Error submitting nomination:', error);
      
      if (error.response?.data?.error?.code === 'DUPLICATE_NOMINATION') {
        setErrors({ 
          name: 'This person has already been nominated for this award' 
        });
      } else if (error.response?.data?.error?.code === 'NOMINATION_NOT_ALLOWED') {
        setErrors({ 
          general: error.response.data.error.message 
        });
      } else {
        setErrors({ 
          general: 'Failed to submit nomination. Please try again.' 
        });
      }
    }
  };

  if (isLoadingAward) {
    return (
      <div className="public-nomination-form">
        <div className="public-nomination-form__loading">
          Loading award information...
        </div>
      </div>
    );
  }

  if (!nominationStatus?.allowed) {
    return (
      <div className="public-nomination-form">
        <div className="public-nomination-form__error">
          <h3>Nomination Not Available</h3>
          <p>{nominationStatus?.reason}</p>
          {nominationStatus?.startDate && (
            <p>Nominations will open on: {new Date(nominationStatus.startDate).toLocaleDateString()}</p>
          )}
          {nominationStatus?.endDate && (
            <p>Nominations closed on: {new Date(nominationStatus.endDate).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="public-nomination-form">
      <div className="public-nomination-form__header">
        <h3>Nominate for: {award?.title}</h3>
        <p className="public-nomination-form__subtitle">
          Submit a nomination for consideration by the panel
        </p>
      </div>

      {errors.general && (
        <div className="public-nomination-form__error-banner">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="public-nomination-form__form">
        <div className="public-nomination-form__field">
          <label htmlFor="name" className="public-nomination-form__label">
            Nominee Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`public-nomination-form__input ${errors.name ? 'public-nomination-form__input--error' : ''}`}
            placeholder="Enter the full name of the person you're nominating"
            disabled={isSubmitting}
          />
          {errors.name && (
            <div className="public-nomination-form__error">{errors.name}</div>
          )}
        </div>

        <div className="public-nomination-form__field">
          <label htmlFor="bio" className="public-nomination-form__label">
            Why do they deserve this award? *
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            className={`public-nomination-form__textarea ${errors.bio ? 'public-nomination-form__textarea--error' : ''}`}
            placeholder="Describe their achievements, contributions, and why they deserve this award. Please provide specific examples and details (minimum 50 characters)."
            rows={8}
            disabled={isSubmitting}
          />
          <div className="public-nomination-form__help">
            {formData.bio.length}/2000 characters
            {formData.bio.length < 50 && ` (minimum 50 required)`}
          </div>
          {errors.bio && (
            <div className="public-nomination-form__error">{errors.bio}</div>
          )}
        </div>

        <div className="public-nomination-form__field">
          <label className="public-nomination-form__label">
            Nominee Photo (Optional)
          </label>
          <ImageUpload
            onUploadSuccess={handleImageUpload}
            onUploadError={handleImageUploadError}
            currentImageUrl={getImageUrl(formData.imageUrl)}
            disabled={isSubmitting}
            maxSizeBytes={5 * 1024 * 1024} // 5MB
            acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
          />
          <div className="public-nomination-form__help">
            Upload a photo of the nominee (optional but recommended)
          </div>
          {errors.image && (
            <div className="public-nomination-form__error">{errors.image}</div>
          )}
        </div>

        <div className="public-nomination-form__info">
          <h4>What happens next?</h4>
          <ul>
            <li>Your nomination will be reviewed by the panel</li>
            <li>If approved, the nominee will appear in the voting list</li>
            <li>You'll be able to track your nomination status in your profile</li>
            <li>All nominations are subject to verification</li>
          </ul>
        </div>

        <div className="public-nomination-form__actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="public-nomination-form__button public-nomination-form__button--secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !user}
            className="public-nomination-form__button public-nomination-form__button--primary"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Nomination'}
          </button>
        </div>

        {!user && (
          <div className="public-nomination-form__auth-notice">
            You must be signed in to submit a nomination
          </div>
        )}
      </form>
    </div>
  );
};

export default PublicNominationForm;