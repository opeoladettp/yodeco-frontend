import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AwardForm.css';

const AwardForm = ({ 
  award = null, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  preselectedCategoryId = null 
}) => {
  const [formData, setFormData] = useState({
    title: award?.title || '',
    criteria: award?.criteria || '',
    categoryId: award?.categoryId || preselectedCategoryId || '',
    isActive: award?.isActive !== undefined ? award.isActive : true,
    allowPublicNomination: award?.allowPublicNomination || false,
    nominationStartDate: award?.nominationStartDate ? 
      new Date(award.nominationStartDate).toISOString().slice(0, 16) : '',
    nominationEndDate: award?.nominationEndDate ? 
      new Date(award.nominationEndDate).toISOString().slice(0, 16) : '',
    votingStartDate: award?.votingStartDate ? 
      new Date(award.votingStartDate).toISOString().slice(0, 16) : '',
    votingEndDate: award?.votingEndDate ? 
      new Date(award.votingEndDate).toISOString().slice(0, 16) : ''
  });
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/content/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user selects a date
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    // Auto-close the picker by blurring the input after a short delay
    // This allows the user to see the selected value before closing
    setTimeout(() => {
      if (e.target && typeof e.target.blur === 'function') {
        e.target.blur();
      }
    }, 100);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Award title is required';
    }

    if (!formData.criteria.trim()) {
      newErrors.criteria = 'Award criteria is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }

    // Validate nomination dates if public nomination is enabled
    if (formData.allowPublicNomination) {
      if (formData.nominationStartDate && formData.nominationEndDate) {
        const startDate = new Date(formData.nominationStartDate);
        const endDate = new Date(formData.nominationEndDate);
        
        if (startDate >= endDate) {
          newErrors.nominationEndDate = 'Nomination end date must be after start date';
        }
      }
    }

    // Validate voting dates
    if (formData.votingStartDate && formData.votingEndDate) {
      const startDate = new Date(formData.votingStartDate);
      const endDate = new Date(formData.votingEndDate);
      
      if (startDate >= endDate) {
        newErrors.votingEndDate = 'Voting end date must be after start date';
      }
    }

    // Validate that nomination period ends before voting starts
    if (formData.nominationEndDate && formData.votingStartDate) {
      const nomEndDate = new Date(formData.nominationEndDate);
      const voteStartDate = new Date(formData.votingStartDate);
      
      if (nomEndDate > voteStartDate) {
        newErrors.votingStartDate = 'Voting must start after nomination period ends';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Convert date strings to Date objects for submission
    const submissionData = {
      ...formData,
      nominationStartDate: formData.nominationStartDate ? new Date(formData.nominationStartDate) : null,
      nominationEndDate: formData.nominationEndDate ? new Date(formData.nominationEndDate) : null,
      votingStartDate: formData.votingStartDate ? new Date(formData.votingStartDate) : null,
      votingEndDate: formData.votingEndDate ? new Date(formData.votingEndDate) : null
    };

    onSubmit(submissionData);
  };

  return (
    <div className="award-form">
      <div className="award-form__header">
        <h3>{award ? 'Edit Award' : 'Create New Award'}</h3>
      </div>

      <form onSubmit={handleSubmit} className="award-form__form">
        <div className="award-form__field">
          <label htmlFor="categoryId" className="award-form__label">
            Category *
          </label>
          {isLoadingCategories ? (
            <div className="award-form__loading">Loading categories...</div>
          ) : (
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className={`award-form__select ${errors.categoryId ? 'award-form__select--error' : ''}`}
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
          {errors.categoryId && (
            <div className="award-form__error">{errors.categoryId}</div>
          )}
        </div>

        <div className="award-form__field">
          <label htmlFor="title" className="award-form__label">
            Award Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`award-form__input ${errors.title ? 'award-form__input--error' : ''}`}
            placeholder="Enter award title"
            disabled={isSubmitting}
          />
          {errors.title && (
            <div className="award-form__error">{errors.title}</div>
          )}
        </div>

        <div className="award-form__field">
          <label htmlFor="criteria" className="award-form__label">
            Award Criteria *
          </label>
          <textarea
            id="criteria"
            name="criteria"
            value={formData.criteria}
            onChange={handleChange}
            className={`award-form__textarea ${errors.criteria ? 'award-form__textarea--error' : ''}`}
            placeholder="Describe the criteria for this award"
            rows={4}
            disabled={isSubmitting}
          />
          <div className="award-form__help">
            Explain what qualifies someone for this award
          </div>
          {errors.criteria && (
            <div className="award-form__error">{errors.criteria}</div>
          )}
        </div>

        {/* Public Nomination Settings */}
        <div className="award-form__section">
          <h4 className="award-form__section-title">Public Nomination Settings</h4>
          
          <div className="award-form__field">
            <label className="award-form__checkbox-label">
              <input
                type="checkbox"
                name="allowPublicNomination"
                checked={formData.allowPublicNomination}
                onChange={handleChange}
                className="award-form__checkbox"
                disabled={isSubmitting}
              />
              <span className="award-form__checkbox-text">
                Allow Public Nominations
              </span>
            </label>
            <div className="award-form__help">
              Enable users to nominate people for this award (requires panelist approval)
            </div>
          </div>

          {formData.allowPublicNomination && (
            <>
              <div className="award-form__field-group">
                <div className="award-form__field">
                  <label htmlFor="nominationStartDate" className="award-form__label">
                    Nomination Start Date
                  </label>
                  <input
                    type="datetime-local"
                    id="nominationStartDate"
                    name="nominationStartDate"
                    value={formData.nominationStartDate}
                    onChange={handleDateTimeChange}
                    className={`award-form__input ${errors.nominationStartDate ? 'award-form__input--error' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.nominationStartDate && (
                    <div className="award-form__error">{errors.nominationStartDate}</div>
                  )}
                </div>

                <div className="award-form__field">
                  <label htmlFor="nominationEndDate" className="award-form__label">
                    Nomination End Date
                  </label>
                  <input
                    type="datetime-local"
                    id="nominationEndDate"
                    name="nominationEndDate"
                    value={formData.nominationEndDate}
                    onChange={handleDateTimeChange}
                    className={`award-form__input ${errors.nominationEndDate ? 'award-form__input--error' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.nominationEndDate && (
                    <div className="award-form__error">{errors.nominationEndDate}</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Voting Period Settings */}
        <div className="award-form__section">
          <h4 className="award-form__section-title">Voting Period Settings</h4>
          
          <div className="award-form__field-group">
            <div className="award-form__field">
              <label htmlFor="votingStartDate" className="award-form__label">
                Voting Start Date
              </label>
              <input
                type="datetime-local"
                id="votingStartDate"
                name="votingStartDate"
                value={formData.votingStartDate}
                onChange={handleDateTimeChange}
                className={`award-form__input ${errors.votingStartDate ? 'award-form__input--error' : ''}`}
                disabled={isSubmitting}
              />
              <div className="award-form__help">
                When voting opens for this award (optional)
              </div>
              {errors.votingStartDate && (
                <div className="award-form__error">{errors.votingStartDate}</div>
              )}
            </div>

            <div className="award-form__field">
              <label htmlFor="votingEndDate" className="award-form__label">
                Voting End Date
              </label>
              <input
                type="datetime-local"
                id="votingEndDate"
                name="votingEndDate"
                value={formData.votingEndDate}
                onChange={handleDateTimeChange}
                className={`award-form__input ${errors.votingEndDate ? 'award-form__input--error' : ''}`}
                disabled={isSubmitting}
              />
              <div className="award-form__help">
                When voting closes for this award (optional)
              </div>
              {errors.votingEndDate && (
                <div className="award-form__error">{errors.votingEndDate}</div>
              )}
            </div>
          </div>
        </div>

        <div className="award-form__field">
          <label className="award-form__checkbox-label">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="award-form__checkbox"
              disabled={isSubmitting}
            />
            <span className="award-form__checkbox-text">
              Active (available for voting)
            </span>
          </label>
          <div className="award-form__help">
            Inactive awards won't be shown to voters
          </div>
        </div>

        <div className="award-form__actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="award-form__button award-form__button--secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoadingCategories}
            className="award-form__button award-form__button--primary"
          >
            {isSubmitting ? 'Saving...' : (award ? 'Update Award' : 'Create Award')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AwardForm;