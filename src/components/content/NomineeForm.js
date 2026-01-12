import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../../utils/imageUtils';
import api from '../../services/api';
import ImageUpload from './ImageUpload';
import './NomineeForm.css';

const NomineeForm = ({ 
  nominee = null, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  preselectedAwardId = null 
}) => {
  const [formData, setFormData] = useState({
    name: nominee?.name || '',
    bio: nominee?.bio || '',
    imageUrl: nominee?.imageUrl || '',
    awardId: nominee?.awardId || preselectedAwardId || ''
  });
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableAwards, setAvailableAwards] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    fetchCategoriesAndAwards();
  }, []);

  useEffect(() => {
    // Update available awards when category changes
    if (selectedCategory) {
      const category = categories.find(cat => cat._id === selectedCategory);
      setAvailableAwards(category?.awards || []);
      
      // Clear award selection if it's not in the new category
      if (formData.awardId && !category?.awards?.find(award => award._id === formData.awardId)) {
        setFormData(prev => ({ ...prev, awardId: '' }));
      }
    } else {
      setAvailableAwards([]);
    }
  }, [selectedCategory, categories, formData.awardId]);

  useEffect(() => {
    // Set initial category based on preselected award or existing nominee
    if (formData.awardId && categories.length > 0) {
      const category = categories.find(cat => 
        cat.awards?.some(award => award._id === formData.awardId)
      );
      if (category) {
        setSelectedCategory(category._id);
      }
    }
  }, [formData.awardId, categories]);

  const fetchCategoriesAndAwards = async () => {
    try {
      const response = await api.get('/content/categories?include=awards');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories and awards:', error);
    } finally {
      setIsLoadingData(false);
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

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    // Clear award selection when category changes
    setFormData(prev => ({ ...prev, awardId: '' }));
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
    alert(`Image upload failed: ${error}`);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nominee name is required';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Biography is required';
    }

    if (!selectedCategory) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.awardId) {
      newErrors.awardId = 'Please select an award';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="nominee-form">
      <div className="nominee-form__header">
        <h3>{nominee ? 'Edit Nominee' : 'Create New Nominee'}</h3>
      </div>

      <form onSubmit={handleSubmit} className="nominee-form__form">
        <div className="nominee-form__field">
          <label htmlFor="category" className="nominee-form__label">
            Category *
          </label>
          {isLoadingData ? (
            <div className="nominee-form__loading">Loading categories...</div>
          ) : (
            <select
              id="category"
              name="category"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className={`nominee-form__select ${errors.category ? 'nominee-form__select--error' : ''}`}
              disabled={isSubmitting}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
          {errors.category && (
            <div className="nominee-form__error">{errors.category}</div>
          )}
        </div>

        <div className="nominee-form__field">
          <label htmlFor="awardId" className="nominee-form__label">
            Award *
          </label>
          <select
            id="awardId"
            name="awardId"
            value={formData.awardId}
            onChange={handleChange}
            className={`nominee-form__select ${errors.awardId ? 'nominee-form__select--error' : ''}`}
            disabled={isSubmitting || !selectedCategory || availableAwards.length === 0}
          >
            <option value="">
              {!selectedCategory 
                ? 'Select a category first' 
                : availableAwards.length === 0 
                  ? 'No awards available in this category'
                  : 'Select an award'
              }
            </option>
            {availableAwards.map(award => (
              <option key={award._id} value={award._id}>
                {award.title}
              </option>
            ))}
          </select>
          {errors.awardId && (
            <div className="nominee-form__error">{errors.awardId}</div>
          )}
        </div>

        <div className="nominee-form__field">
          <label htmlFor="name" className="nominee-form__label">
            Nominee Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`nominee-form__input ${errors.name ? 'nominee-form__input--error' : ''}`}
            placeholder="Enter nominee name"
            disabled={isSubmitting}
          />
          {errors.name && (
            <div className="nominee-form__error">{errors.name}</div>
          )}
        </div>

        <div className="nominee-form__field">
          <label htmlFor="bio" className="nominee-form__label">
            Biography *
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            className={`nominee-form__textarea ${errors.bio ? 'nominee-form__textarea--error' : ''}`}
            placeholder="Enter nominee biography and achievements"
            rows={6}
            disabled={isSubmitting}
          />
          <div className="nominee-form__help">
            Describe the nominee's background, achievements, and why they deserve this award
          </div>
          {errors.bio && (
            <div className="nominee-form__error">{errors.bio}</div>
          )}
        </div>

        <div className="nominee-form__field">
          <label className="nominee-form__label">
            Nominee Photo
          </label>
          <ImageUpload
            onUploadSuccess={handleImageUpload}
            onUploadError={handleImageUploadError}
            currentImageUrl={getImageUrl(formData.imageUrl)}
            disabled={isSubmitting}
            maxSizeBytes={5 * 1024 * 1024} // 5MB
            acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
          />
          <div className="nominee-form__help">
            Upload a high-quality photo of the nominee (optional but recommended)
          </div>
        </div>

        <div className="nominee-form__actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="nominee-form__button nominee-form__button--secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoadingData}
            className="nominee-form__button nominee-form__button--primary"
          >
            {isSubmitting ? 'Saving...' : (nominee ? 'Update Nominee' : 'Create Nominee')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NomineeForm;