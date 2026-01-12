import React, { useState } from 'react';
import './CategoryForm.css';

const CategoryForm = ({ 
  category = null, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    slug: category?.slug || ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from name
    if (name === 'name' && !category) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({
        ...prev,
        slug
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
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
    <div className="category-form">
      <div className="category-form__header">
        <h3>{category ? 'Edit Category' : 'Create New Category'}</h3>
      </div>

      <form onSubmit={handleSubmit} className="category-form__form">
        <div className="category-form__field">
          <label htmlFor="name" className="category-form__label">
            Category Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`category-form__input ${errors.name ? 'category-form__input--error' : ''}`}
            placeholder="Enter category name"
            disabled={isSubmitting}
          />
          {errors.name && (
            <div className="category-form__error">{errors.name}</div>
          )}
        </div>

        <div className="category-form__field">
          <label htmlFor="description" className="category-form__label">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`category-form__textarea ${errors.description ? 'category-form__textarea--error' : ''}`}
            placeholder="Enter category description"
            rows={4}
            disabled={isSubmitting}
          />
          {errors.description && (
            <div className="category-form__error">{errors.description}</div>
          )}
        </div>

        <div className="category-form__field">
          <label htmlFor="slug" className="category-form__label">
            URL Slug *
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            className={`category-form__input ${errors.slug ? 'category-form__input--error' : ''}`}
            placeholder="category-url-slug"
            disabled={isSubmitting}
          />
          <div className="category-form__help">
            Used in URLs. Only lowercase letters, numbers, and hyphens allowed.
          </div>
          {errors.slug && (
            <div className="category-form__error">{errors.slug}</div>
          )}
        </div>

        <div className="category-form__actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="category-form__button category-form__button--secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="category-form__button category-form__button--primary"
          >
            {isSubmitting ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;