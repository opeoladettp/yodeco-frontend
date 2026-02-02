import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isPromoting, setIsPromoting] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (roleFilter !== 'all') {
        params.append('role', roleFilter);
      }

      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data.users || []);
      setPagination(response.data.pagination || pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      
      let errorMessage = 'Failed to load users';
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to view users.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please sign in again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoteUser = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to promote this user to ${newRole}?`)) {
      return;
    }

    setIsPromoting(prev => ({ ...prev, [userId]: true }));

    try {
      await api.put(`/admin/users/${userId}/promote`, { newRole });
      await fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error promoting user:', error);
      alert(error.response?.data?.error?.message || 'Failed to promote user');
    } finally {
      setIsPromoting(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'System_Admin':
        return 'Administrator';
      case 'Panelist':
        return 'Panelist';
      case 'User':
      default:
        return 'User';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'System_Admin':
        return 'user-management__role-badge--admin';
      case 'Panelist':
        return 'user-management__role-badge--panelist';
      case 'User':
      default:
        return 'user-management__role-badge--user';
    }
  };

  const getAvailablePromotions = (currentRole) => {
    switch (currentRole) {
      case 'User':
        return ['Panelist', 'System_Admin'];
      case 'Panelist':
        return ['System_Admin'];
      case 'System_Admin':
      default:
        return [];
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="user-management">
        <div className="user-management__loading">
          <div className="user-management__spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management">
        <div className="user-management__error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>Error Loading Users</h3>
          <p>{error}</p>
          <button 
            onClick={fetchUsers}
            className="user-management__retry-button"
            type="button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management__header">
        <h2>User Management</h2>
        <div className="user-management__stats">
          <div className="user-management__stat">
            <span className="user-management__stat-number">{pagination.total}</span>
            <span className="user-management__stat-label">Total Users</span>
          </div>
        </div>
      </div>

      <div className="user-management__filters">
        <div className="user-management__search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="user-management__search-icon">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="user-management__search-input"
          />
        </div>

        <select
          value={roleFilter}
          onChange={handleRoleFilterChange}
          className="user-management__role-filter"
        >
          <option value="all">All Roles</option>
          <option value="User">Users</option>
          <option value="Panelist">Panelists</option>
          <option value="System_Admin">Administrators</option>
        </select>
      </div>

      {users.length === 0 ? (
        <div className="user-management__empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <h3>No Users Found</h3>
          <p>
            {searchTerm || roleFilter !== 'all' 
              ? 'No users match your current filters.' 
              : 'No users have registered yet.'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="user-management__table-container">
            <table className="user-management__table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Last Login</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className="user-management__row">
                    <td className="user-management__user-cell">
                      <div className="user-management__user-info">
                        <div className="user-management__user-avatar">
                          {user.name && user.name.length > 0 ? user.name.charAt(0).toUpperCase() : (user.email && user.email.length > 0 ? user.email.charAt(0).toUpperCase() : 'U')}
                        </div>
                        <div className="user-management__user-details">
                          <div className="user-management__user-name">
                            {user.name || user.email || 'Unknown User'}
                          </div>
                          <div className="user-management__user-email">
                            {user.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`user-management__role-badge ${getRoleBadgeClass(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="user-management__date-cell">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="user-management__date-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="user-management__actions-cell">
                      {getAvailablePromotions(user.role).length > 0 ? (
                        <div className="user-management__promotion-dropdown">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handlePromoteUser(user._id, e.target.value);
                                e.target.value = ''; // Reset selection
                              }
                            }}
                            disabled={isPromoting[user._id]}
                            className="user-management__promote-select"
                            defaultValue=""
                          >
                            <option value="" disabled>
                              {isPromoting[user._id] ? 'Promoting...' : 'Promote to...'}
                            </option>
                            {getAvailablePromotions(user.role).map(role => (
                              <option key={role} value={role}>
                                {getRoleDisplayName(role)}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span className="user-management__no-actions">
                          Highest role
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="user-management__pagination">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="user-management__page-button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Previous
              </button>
              
              <span className="user-management__page-info">
                Page {pagination.page} of {pagination.pages} ({pagination.total} users)
              </span>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="user-management__page-button"
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserManagement;