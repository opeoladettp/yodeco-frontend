import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './AdminMembersPage.css';

const AdminMembersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    includeInactive: false,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Modal states
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        includeInactive: filters.includeInactive.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      
      const response = await api.get(`/members?${params}`);
      
      setMembers(response.data.members);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
      
    } catch (error) {
      console.error('Error fetching members:', error);
      setError(error.response?.data?.error?.message || 'Failed to load members');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, filters.search, filters.includeInactive, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    if (user?.role === 'System_Admin') {
      fetchMembers();
    }
  }, [user, fetchMembers]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMembers();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleViewMember = (member) => {
    navigate(`/admin/members/${member.id}`);
  };

  const handleEditMember = (member) => {
    navigate(`/admin/members/${member.id}/edit`);
  };

  const handleDeleteMember = (member) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
    setDeleteReason('');
  };

  const handleRestoreMember = async (member) => {
    try {
      setError(null);
      await api.post(`/members/${member.id}/restore`);
      setSuccess(`Member ${member.fullName} restored successfully`);
      fetchMembers();
    } catch (error) {
      console.error('Error restoring member:', error);
      setError(error.response?.data?.error?.message || 'Failed to restore member');
    }
  };

  const confirmDelete = async () => {
    if (!selectedMember || !deleteReason.trim()) {
      setError('Please provide a reason for deletion');
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      
      await api.delete(`/members/${selectedMember.id}`, {
        data: { reason: deleteReason.trim() }
      });
      
      setSuccess(`Member ${selectedMember.fullName} deleted successfully`);
      setShowDeleteModal(false);
      setSelectedMember(null);
      setDeleteReason('');
      fetchMembers();
      
    } catch (error) {
      console.error('Error deleting member:', error);
      setError(error.response?.data?.error?.message || 'Failed to delete member');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedMember(null);
    setDeleteReason('');
    setError(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (user?.role !== 'System_Admin') {
    return (
      <div className="admin-members-page">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>Only System Administrators can access member management.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-members-page">
      <div className="members-container">
        <div className="members-header">
          <h1>Member Management</h1>
          <p>Manage YODECO member registrations and profiles</p>
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

        {/* Filters and Search */}
        <div className="members-filters">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-group">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by name, email, or registration number..."
                className="search-input"
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </div>
          </form>

          <div className="filter-controls">
            <div className="filter-group">
              <label>
                <input
                  type="checkbox"
                  name="includeInactive"
                  checked={filters.includeInactive}
                  onChange={handleFilterChange}
                />
                Include deleted members
              </label>
            </div>

            <div className="filter-group">
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
              >
                <option value="createdAt">Registration Date</option>
                <option value="firstName">First Name</option>
                <option value="lastName">Last Name</option>
                <option value="email">Email</option>
                <option value="registrationNumber">Registration Number</option>
              </select>
            </div>

            <div className="filter-group">
              <select
                name="sortOrder"
                value={filters.sortOrder}
                onChange={handleFilterChange}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="members-content">
          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="empty-state">
              <h3>No Members Found</h3>
              <p>
                {filters.search 
                  ? 'No members match your search criteria.' 
                  : 'No members have been registered yet.'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="members-stats">
                <p>
                  Showing {members.length} of {pagination.total} members
                  {filters.search && ` matching "${filters.search}"`}
                </p>
              </div>

              <div className="members-grid">
                {members.map(member => (
                  <div key={member.id} className={`member-card ${!member.isActive ? 'inactive' : ''}`}>
                    <div className="member-avatar">
                      {(member.profilePicture?.url && member.profilePicture.url.trim() !== '') ? (
                        <>
                          <img 
                            src={member.profilePicture.url} 
                            alt={member.fullName}
                            onError={(e) => {
                              console.error('Profile picture failed to load:', member.profilePicture.url);
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="avatar-placeholder" style={{ display: 'none' }}>
                            {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                          </div>
                        </>
                      ) : (
                        <div className="avatar-placeholder">
                          {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="member-info">
                      <h3>{member.fullName}</h3>
                      <p className="registration-number">{member.registrationNumber}</p>
                      <p className="member-email">{member.email}</p>
                      <p className="member-phone">{member.phoneNumber}</p>
                      <p className="member-age">Age: {member.age}</p>
                      
                      <div className="member-meta">
                        <span className={`status ${member.isActive ? 'active' : 'inactive'}`}>
                          {member.isActive ? 'Active' : 'Deleted'}
                        </span>
                        <span className="registration-date">
                          Registered: {formatDate(member.createdAt)}
                        </span>
                        {!member.isActive && member.deletedAt && (
                          <span className="deletion-date">
                            Deleted: {formatDate(member.deletedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="member-actions">
                      <button
                        onClick={() => handleViewMember(member)}
                        className="btn btn-sm btn-secondary"
                      >
                        View
                      </button>
                      
                      {member.isActive ? (
                        <>
                          <button
                            onClick={() => handleEditMember(member)}
                            className="btn btn-sm btn-primary"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member)}
                            className="btn btn-sm btn-danger"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRestoreMember(member)}
                          className="btn btn-sm btn-success"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>
                  
                  <div className="page-info">
                    Page {pagination.page} of {pagination.pages}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="btn btn-secondary"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Delete Member</h3>
              <button onClick={cancelDelete} className="modal-close">×</button>
            </div>
            
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>{selectedMember?.fullName}</strong>?
              </p>
              <p>
                Registration Number: <strong>{selectedMember?.registrationNumber}</strong>
              </p>
              
              <div className="form-group">
                <label htmlFor="deleteReason">Reason for deletion *</label>
                <textarea
                  id="deleteReason"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Please provide a reason for deleting this member..."
                  rows={3}
                  maxLength={500}
                  required
                  disabled={isDeleting}
                />
                <small>{deleteReason.length}/500 characters</small>
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                onClick={cancelDelete}
                className="btn btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn btn-danger"
                disabled={isDeleting || !deleteReason.trim()}
              >
                {isDeleting ? 'Deleting...' : 'Delete Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMembersPage;