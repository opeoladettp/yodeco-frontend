import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './UserProfile.css';

const UserProfile = ({ showDropdown = true }) => {
  const { user, logout, isLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
  };

  const toggleDropdown = () => {
    if (showDropdown) {
      setIsDropdownOpen(!isDropdownOpen);
    }
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
        return 'user-profile__role-badge--admin';
      case 'Panelist':
        return 'user-profile__role-badge--panelist';
      case 'User':
      default:
        return 'user-profile__role-badge--user';
    }
  };

  return (
    <div className="user-profile">
      <div 
        className={`user-profile__trigger ${showDropdown ? 'user-profile__trigger--clickable' : ''}`}
        onClick={toggleDropdown}
        role={showDropdown ? 'button' : 'presentation'}
        tabIndex={showDropdown ? 0 : -1}
        onKeyDown={(e) => {
          if (showDropdown && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            toggleDropdown();
          }
        }}
      >
        <div className="user-profile__avatar">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="user-profile__info">
          <div className="user-profile__name">{user.name || 'Unknown User'}</div>
          <div className={`user-profile__role-badge ${getRoleBadgeClass(user.role)}`}>
            {getRoleDisplayName(user.role)}
          </div>
        </div>
        {showDropdown && (
          <svg 
            className={`user-profile__dropdown-icon ${isDropdownOpen ? 'user-profile__dropdown-icon--open' : ''}`}
            width="16" 
            height="16" 
            viewBox="0 0 16 16"
          >
            <path 
              fill="currentColor" 
              d="M4.427 9.573l3.396-3.396a.25.25 0 01.354 0l3.396 3.396a.25.25 0 01-.177.427H4.604a.25.25 0 01-.177-.427z"
            />
          </svg>
        )}
      </div>

      {showDropdown && isDropdownOpen && (
        <div className="user-profile__dropdown">
          <div className="user-profile__dropdown-header">
            <div className="user-profile__dropdown-name">{user.name}</div>
            <div className="user-profile__dropdown-email">{user.email}</div>
          </div>
          
          <div className="user-profile__dropdown-divider"></div>
          
          <div className="user-profile__dropdown-section">
            <div className="user-profile__dropdown-label">Role</div>
            <div className={`user-profile__role-badge ${getRoleBadgeClass(user.role)}`}>
              {getRoleDisplayName(user.role)}
            </div>
          </div>

          {user.lastLogin && (
            <div className="user-profile__dropdown-section">
              <div className="user-profile__dropdown-label">Last Login</div>
              <div className="user-profile__dropdown-value">
                {new Date(user.lastLogin).toLocaleString()}
              </div>
            </div>
          )}
          
          <div className="user-profile__dropdown-divider"></div>
          
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="user-profile__logout-button"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" className="user-profile__logout-icon">
              <path 
                fill="currentColor" 
                d="M2 2.75C2 1.784 2.784 1 3.75 1h2.5a.75.75 0 010 1.5h-2.5a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h2.5a.75.75 0 010 1.5h-2.5A1.75 1.75 0 012 13.25V2.75zm10.44 4.5l-1.97-1.97a.75.75 0 10-1.06 1.06L10.69 7.5H6.75a.75.75 0 000 1.5h3.94l-1.22 1.22a.75.75 0 101.06 1.06l2.5-2.5a.75.75 0 000-1.06l-2.5-2.5z"
              />
            </svg>
            {isLoading ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;