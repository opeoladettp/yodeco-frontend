import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginButton from './LoginButton';
import './ProtectedRoute.css';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  fallback = null,
  showLoginPrompt = true 
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="protected-route__loading">
        <div className="protected-route__spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    if (fallback) {
      return fallback;
    }

    if (showLoginPrompt) {
      return (
        <div className="protected-route__login-prompt">
          <div className="protected-route__login-card">
            <h2>Authentication Required</h2>
            <p>Please sign in to access this page.</p>
            <LoginButton size="large" />
          </div>
        </div>
      );
    }

    return null;
  }

  // Check role requirements
  if (requiredRole) {
    const hasRequiredRole = checkUserRole(user.role, requiredRole);
    
    if (!hasRequiredRole) {
      return (
        <div className="protected-route__access-denied">
          <div className="protected-route__access-card">
            <div className="protected-route__access-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  fill="#f44336"
                />
              </svg>
            </div>
            <h2>Access Denied</h2>
            <p>
              You don't have permission to access this page. 
              Required role: <strong>{getRoleDisplayName(requiredRole)}</strong>
            </p>
            <p>
              Your current role: <strong>{getRoleDisplayName(user.role)}</strong>
            </p>
            <button 
              onClick={() => window.history.back()} 
              className="protected-route__back-button"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required role
  return children;
};

// Helper function to check if user has required role
const checkUserRole = (userRole, requiredRole) => {
  // Define role hierarchy
  const roleHierarchy = {
    'User': 1,
    'Panelist': 2,
    'System_Admin': 3
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
};

// Helper function to get display name for role
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

export default ProtectedRoute;