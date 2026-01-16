import React, { useState, useEffect } from 'react';
import { CategoryForm, AwardForm, NomineeForm } from '../components/content';
import { getImageUrl } from '../utils/imageUtils';
import api from '../services/api';
import './ContentManagementPage.css';

const ContentManagementPage = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [awards, setAwards] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState({
    categories: 1,
    awards: 1,
    nominees: 1
  });
  const [itemsPerPage] = useState(12); // Show 12 items per page
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Form states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [showNomineeForm, setShowNomineeForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [categoriesResponse, awardsResponse, nomineesResponse] = await Promise.all([
        api.get('/content/categories'),
        api.get('/content/awards'),
        api.get('/content/nominees')
      ]);

      setCategories(categoriesResponse.data.categories || []);
      setAwards(awardsResponse.data.awards || []);
      setNominees(nomineesResponse.data.nominees || []);
    } catch (error) {
      console.error('Error fetching content data:', error);
      setError(error.response?.data?.error?.message || 'Failed to load content data');
    } finally {
      setIsLoading(false);
    }
  };

  // Category handlers
  const handleCreateCategory = () => {
    setEditingItem(null);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingItem(category);
    setShowCategoryForm(true);
  };

  const handleCategorySubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/content/categories/${editingItem._id}`, formData);
      } else {
        await api.post('/content/categories', formData);
      }
      
      setShowCategoryForm(false);
      setEditingItem(null);
      await fetchAllData();
    } catch (error) {
      console.error('Error saving category:', error);
      alert(error.response?.data?.error?.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This will also delete all associated awards and nominees.')) {
      return;
    }

    try {
      console.log('Attempting to delete category:', categoryId);
      const response = await api.delete(`/content/categories/${categoryId}`);
      console.log('Delete category response:', response);
      await fetchAllData();
    } catch (error) {
      console.error('Error deleting category:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      alert(error.response?.data?.error?.message || 'Failed to delete category');
    }
  };

  // Award handlers
  const handleCreateAward = (categoryId = null) => {
    setEditingItem(null);
    setShowAwardForm(true);
  };

  const handleEditAward = (award) => {
    setEditingItem(award);
    setShowAwardForm(true);
  };

  const handleAwardSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/content/awards/${editingItem._id}`, formData);
      } else {
        await api.post('/content/awards', formData);
      }
      
      setShowAwardForm(false);
      setEditingItem(null);
      await fetchAllData();
    } catch (error) {
      console.error('Error saving award:', error);
      alert(error.response?.data?.error?.message || 'Failed to save award');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAward = async (awardId) => {
    if (!window.confirm('Are you sure you want to delete this award? This will also delete all associated nominees.')) {
      return;
    }

    try {
      console.log('Attempting to delete award:', awardId);
      const response = await api.delete(`/content/awards/${awardId}`);
      console.log('Delete award response:', response);
      await fetchAllData();
    } catch (error) {
      console.error('Error deleting award:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      alert(error.response?.data?.error?.message || 'Failed to delete award');
    }
  };

  // Nominee handlers
  const handleCreateNominee = (awardId = null) => {
    setEditingItem(null);
    setShowNomineeForm(true);
  };

  const handleEditNominee = (nominee) => {
    setEditingItem(nominee);
    setShowNomineeForm(true);
  };

  const handleNomineeSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/content/nominees/${editingItem._id}`, formData);
      } else {
        await api.post('/content/nominees', formData);
      }
      
      setShowNomineeForm(false);
      setEditingItem(null);
      await fetchAllData();
    } catch (error) {
      console.error('Error saving nominee:', error);
      alert(error.response?.data?.error?.message || 'Failed to save nominee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNominee = async (nomineeId) => {
    if (!window.confirm('Are you sure you want to delete this nominee?')) {
      return;
    }

    try {
      console.log('Attempting to delete nominee:', nomineeId);
      const response = await api.delete(`/content/nominees/${nomineeId}`);
      console.log('Delete nominee response:', response);
      await fetchAllData();
    } catch (error) {
      console.error('Error deleting nominee:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      alert(error.response?.data?.error?.message || 'Failed to delete nominee');
    }
  };

  const handleFormCancel = () => {
    setShowCategoryForm(false);
    setShowAwardForm(false);
    setShowNomineeForm(false);
    setEditingItem(null);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const getAwardName = (awardId) => {
    const award = awards.find(award => award._id === awardId);
    return award?.title || 'Unknown Award';
  };

  // Pagination helpers
  const filterItems = (items, searchTerm) => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item => {
      const searchableText = `${item.name || item.title || ''} ${item.description || item.criteria || item.bio || ''}`.toLowerCase();
      return searchableText.includes(term);
    });
  };

  const paginateItems = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = (itemsCount) => {
    return Math.ceil(itemsCount / itemsPerPage);
  };

  const handlePageChange = (tab, newPage) => {
    setCurrentPage(prev => ({ ...prev, [tab]: newPage }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm(''); // Clear search when changing tabs
  };

  // Get filtered and paginated items
  const getDisplayItems = (items, tab) => {
    const filtered = filterItems(items, searchTerm);
    const paginated = paginateItems(filtered, currentPage[tab]);
    return { items: paginated, total: filtered.length };
  };

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="content-management__pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="content-management__pagination-button"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Previous
        </button>

        <div className="content-management__pagination-pages">
          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="content-management__pagination-page"
                type="button"
              >
                1
              </button>
              {startPage > 2 && <span className="content-management__pagination-ellipsis">...</span>}
            </>
          )}

          {pages.map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`content-management__pagination-page ${page === currentPage ? 'content-management__pagination-page--active' : ''}`}
              type="button"
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="content-management__pagination-ellipsis">...</span>}
              <button
                onClick={() => onPageChange(totalPages)}
                className="content-management__pagination-page"
                type="button"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="content-management__pagination-button"
          type="button"
        >
          Next
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="content-management">
        <div className="content-management__loading">
          <div className="content-management__spinner"></div>
          <h2>Loading Content Management</h2>
          <p>Please wait while we load your content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-management">
        <div className="content-management__error">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h2>Error Loading Content</h2>
          <p>{error}</p>
          <button 
            onClick={fetchAllData}
            className="content-management__retry-button"
            type="button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-management">
      <div className="content-management__header">
        <div className="content-management__title-section">
          <h1>Content Management</h1>
          <p>Manage categories, awards, and nominees for the voting portal.</p>
        </div>
      </div>

      <div className="content-management__tabs">
        <div className="content-management__tabs-container">
          <button
            onClick={() => handleTabChange('categories')}
            className={`content-management__tab ${activeTab === 'categories' ? 'content-management__tab--active' : ''}`}
            type="button"
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => handleTabChange('awards')}
            className={`content-management__tab ${activeTab === 'awards' ? 'content-management__tab--active' : ''}`}
            type="button"
          >
            Awards ({awards.length})
          </button>
          <button
            onClick={() => handleTabChange('nominees')}
            className={`content-management__tab ${activeTab === 'nominees' ? 'content-management__tab--active' : ''}`}
            type="button"
          >
            Nominees ({nominees.length})
          </button>
        </div>
        
        <div className={`content-management__search ${isSearchOpen ? 'content-management__search--open' : ''}`}>
          <button
            className="content-management__search-toggle"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            type="button"
            title="Search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="content-management__search-icon">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(prev => ({ ...prev, [activeTab]: 1 })); // Reset to page 1 on search
            }}
            onBlur={() => {
              // Close search if empty when clicking outside
              if (!searchTerm) {
                setTimeout(() => setIsSearchOpen(false), 200);
              }
            }}
            className="content-management__search-input"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setIsSearchOpen(false);
              }}
              className="content-management__search-clear"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="content-management__content">
        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="content-management__tab-content">
            <div className="content-management__tab-header">
              <h2>Categories</h2>
              <button
                onClick={handleCreateCategory}
                className="content-management__create-button"
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Create Category
              </button>
            </div>

            {(() => {
              const { items: displayCategories, total } = getDisplayItems(categories, 'categories');
              const totalPages = getTotalPages(total);

              if (categories.length === 0) {
                return (
                  <div className="content-management__empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <h3>No Categories Yet</h3>
                    <p>Create your first category to organize awards and nominees.</p>
                    <button
                      onClick={handleCreateCategory}
                      className="content-management__empty-button"
                      type="button"
                    >
                      Create Category
                    </button>
                  </div>
                );
              }

              if (displayCategories.length === 0 && searchTerm) {
                return (
                  <div className="content-management__empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <h3>No Results Found</h3>
                    <p>No categories match your search "{searchTerm}"</p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="content-management__empty-button"
                      type="button"
                    >
                      Clear Search
                    </button>
                  </div>
                );
              }

              return (
                <>
                  <div className="content-management__results-info">
                    Showing {displayCategories.length} of {total} {total === 1 ? 'category' : 'categories'}
                  </div>
                  <div className="content-management__grid">
                    {displayCategories.map(category => (
                      <div key={category._id} className="content-management__card">
                        <div className="content-management__card-header">
                          <h3>{category.name}</h3>
                          <div className="content-management__card-actions">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="content-management__action-button"
                              type="button"
                              title="Edit category"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2"/>
                                <path d="M18.5 2.5a2.121 2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category._id)}
                              className="content-management__action-button content-management__action-button--danger"
                              type="button"
                              title="Delete category"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="content-management__card-description">{category.description}</p>
                        <div className="content-management__card-meta">
                          <span className="content-management__card-slug">/{category.slug}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination
                    currentPage={currentPage.categories}
                    totalPages={totalPages}
                    onPageChange={(page) => handlePageChange('categories', page)}
                  />
                </>
              );
            })()}
          </div>
        )}

        {/* Awards Tab */}
        {activeTab === 'awards' && (
          <div className="content-management__tab-content">
            <div className="content-management__tab-header">
              <h2>Awards</h2>
              <button
                onClick={handleCreateAward}
                className="content-management__create-button"
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Create Award
              </button>
            </div>

            {(() => {
              const { items: displayAwards, total } = getDisplayItems(awards, 'awards');
              const totalPages = getTotalPages(total);

              if (awards.length === 0) {
                return (
                  <div className="content-management__empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <h3>No Awards Yet</h3>
                    <p>Create awards within categories for nominees to compete for.</p>
                    <button
                      onClick={handleCreateAward}
                      className="content-management__empty-button"
                      type="button"
                    >
                      Create Award
                    </button>
                  </div>
                );
              }

              if (displayAwards.length === 0 && searchTerm) {
                return (
                  <div className="content-management__empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <h3>No Results Found</h3>
                    <p>No awards match your search "{searchTerm}"</p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="content-management__empty-button"
                      type="button"
                    >
                      Clear Search
                    </button>
                  </div>
                );
              }

              return (
                <>
                  <div className="content-management__results-info">
                    Showing {displayAwards.length} of {total} {total === 1 ? 'award' : 'awards'}
                  </div>
                  <div className="content-management__grid">
                    {displayAwards.map(award => (
                      <div key={award._id} className="content-management__card">
                        <div className="content-management__card-header">
                          <h3>{award.title}</h3>
                          <div className="content-management__card-actions">
                            <button
                              onClick={() => handleEditAward(award)}
                              className="content-management__action-button"
                              type="button"
                              title="Edit award"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteAward(award._id)}
                              className="content-management__action-button content-management__action-button--danger"
                              type="button"
                              title="Delete award"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="content-management__card-description">{award.criteria}</p>
                        <div className="content-management__card-meta">
                          <span className="content-management__card-category">
                            {getCategoryName(award.categoryId)}
                          </span>
                          <span className={`content-management__card-status ${award.isActive ? 'content-management__card-status--active' : 'content-management__card-status--inactive'}`}>
                            {award.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination
                    currentPage={currentPage.awards}
                    totalPages={totalPages}
                    onPageChange={(page) => handlePageChange('awards', page)}
                  />
                </>
              );
            })()}
          </div>
        )}

        {/* Nominees Tab */}
        {activeTab === 'nominees' && (
          <div className="content-management__tab-content">
            <div className="content-management__tab-header">
              <h2>Nominees</h2>
              <button
                onClick={handleCreateNominee}
                className="content-management__create-button"
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Create Nominee
              </button>
            </div>

            {(() => {
              const { items: displayNominees, total } = getDisplayItems(nominees, 'nominees');
              const totalPages = getTotalPages(total);

              if (nominees.length === 0) {
                return (
                  <div className="content-management__empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <h3>No Nominees Yet</h3>
                    <p>Add nominees to awards so users can vote for them.</p>
                    <button
                      onClick={handleCreateNominee}
                      className="content-management__empty-button"
                      type="button"
                    >
                      Create Nominee
                    </button>
                  </div>
                );
              }

              if (displayNominees.length === 0 && searchTerm) {
                return (
                  <div className="content-management__empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <h3>No Results Found</h3>
                    <p>No nominees match your search "{searchTerm}"</p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="content-management__empty-button"
                      type="button"
                    >
                      Clear Search
                    </button>
                  </div>
                );
              }

              return (
                <>
                  <div className="content-management__results-info">
                    Showing {displayNominees.length} of {total} {total === 1 ? 'nominee' : 'nominees'}
                  </div>
                  <div className="content-management__grid">
                    {displayNominees.map(nominee => (
                      <div key={nominee._id} className="content-management__card content-management__card--nominee">
                        <div className="content-management__nominee-image">
                          {nominee.imageUrl ? (
                            <img 
                              src={getImageUrl(nominee.imageUrl)} 
                              alt={nominee.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="content-management__nominee-placeholder" 
                            style={{ display: nominee.imageUrl ? 'none' : 'flex' }}
                          >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </div>
                        </div>
                        <div className="content-management__card-header">
                          <h3>{nominee.name}</h3>
                          <div className="content-management__card-actions">
                            <button
                              onClick={() => handleEditNominee(nominee)}
                              className="content-management__action-button"
                              type="button"
                              title="Edit nominee"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteNominee(nominee._id)}
                              className="content-management__action-button content-management__action-button--danger"
                              type="button"
                              title="Delete nominee"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="content-management__card-description">{nominee.bio}</p>
                        <div className="content-management__card-meta">
                          <span className="content-management__card-award">
                            {getAwardName(nominee.awardId)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination
                    currentPage={currentPage.nominees}
                    totalPages={totalPages}
                    onPageChange={(page) => handlePageChange('nominees', page)}
                  />
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Forms */}
      {showCategoryForm && (
        <div className="content-management__modal">
          <div className="content-management__modal-backdrop" onClick={handleFormCancel}></div>
          <div className="content-management__modal-content">
            <CategoryForm
              category={editingItem}
              onSubmit={handleCategorySubmit}
              onCancel={handleFormCancel}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {showAwardForm && (
        <div className="content-management__modal">
          <div className="content-management__modal-backdrop" onClick={handleFormCancel}></div>
          <div className="content-management__modal-content">
            <AwardForm
              award={editingItem}
              onSubmit={handleAwardSubmit}
              onCancel={handleFormCancel}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {showNomineeForm && (
        <div className="content-management__modal">
          <div className="content-management__modal-backdrop" onClick={handleFormCancel}></div>
          <div className="content-management__modal-content">
            <NomineeForm
              nominee={editingItem}
              onSubmit={handleNomineeSubmit}
              onCancel={handleFormCancel}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagementPage;