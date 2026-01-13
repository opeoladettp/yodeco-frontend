import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoginButton } from '../auth';
import './Navigation.css';

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const canAccessPanelFeatures = () => {
    return user && (user.role === 'Panelist' || user.role === 'System_Admin');
  };

  const canAccessAdminFeatures = () => {
    return user && user.role === 'System_Admin';
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    closeDrawer();
    await logout();
  };

  return (
    <>
      <nav className="navigation">
        <div className="navigation__container">
          <div className="navigation__brand">
            <Link to="/" className="navigation__brand-link">
              <div className="navigation__logo">
                <img 
                  src="/assets/images/yodeco-logo.png"
                  alt="YODECO Logo" 
                  className="navigation__logo-image"
                  onError={(e) => {
                    console.log('Logo failed to load, showing fallback. Attempted URL:', e.target.src);
                    e.target.style.display = 'none';
                    const fallback = e.target.parentNode.querySelector('.navigation__logo-fallback');
                    if (fallback) {
                      fallback.style.display = 'inline-block';
                    }
                  }}
                  onLoad={(e) => {
                    console.log('Logo loaded successfully from:', e.target.src);
                    const fallback = e.target.parentNode.querySelector('.navigation__logo-fallback');
                    if (fallback) {
                      fallback.style.display = 'none';
                    }
                    e.target.style.display = 'block';
                  }}
                />
                <div className="navigation__logo-fallback" style={{ display: 'none' }}>
                  YODECO
                </div>
              </div>
              <span className="navigation__brand-text">YODECO</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="navigation__center navigation__center--desktop">
            <div className="navigation__public-menu">
              <a 
                href="https://yodeco.ng" 
                target="_blank" 
                rel="noopener noreferrer"
                className="navigation__public-link"
              >
                YODECO Website
              </a>
              <Link 
                to="/member/register" 
                className="navigation__public-link"
              >
                Membership Registration
              </Link>
            </div>
          </div>

          {/* Mobile Menu Dropdown for Public Links */}
          <div className="navigation__center navigation__center--mobile">
            <div className="navigation__mobile-dropdown">
              <button
                onClick={toggleMobileMenu}
                className="navigation__mobile-menu-button"
                type="button"
                aria-label="Open menu"
              >
                Menu
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  className={`navigation__dropdown-arrow ${isMobileMenuOpen ? 'navigation__dropdown-arrow--open' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              
              {isMobileMenuOpen && (
                <>
                  <div 
                    className="navigation__mobile-dropdown-overlay"
                    onClick={closeMobileMenu}
                  />
                  <div className="navigation__mobile-dropdown-menu">
                    <a 
                      href="https://yodeco.ng" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="navigation__mobile-dropdown-link"
                      onClick={closeMobileMenu}
                    >
                      YODECO Website
                    </a>
                    <Link 
                      to="/member/register" 
                      className="navigation__mobile-dropdown-link"
                      onClick={closeMobileMenu}
                    >
                      Membership Registration
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="navigation__right">
            {!isAuthenticated && (
              <div className="navigation__auth">
                <LoginButton size="small" />
              </div>
            )}
            
            {isAuthenticated && (
              <button
                onClick={toggleDrawer}
                className="navigation__menu-button"
                type="button"
                aria-label="Open navigation menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Side Drawer */}
      {isAuthenticated && (
        <>
          <div 
            className={`navigation__overlay ${isDrawerOpen ? 'navigation__overlay--visible' : ''}`}
            onClick={closeDrawer}
          />
          <div className={`navigation__drawer ${isDrawerOpen ? 'navigation__drawer--open' : ''}`}>
            <div className="navigation__drawer-header">
              <div className="navigation__drawer-logo">
                <img 
                  src="/assets/images/yodeco-logo.png"
                  alt="YODECO Logo" 
                  className="navigation__drawer-logo-image"
                  onError={(e) => {
                    console.log('Drawer logo failed to load, showing fallback. Attempted URL:', e.target.src);
                    e.target.style.display = 'none';
                    const fallback = e.target.parentNode.querySelector('.navigation__drawer-logo-fallback');
                    if (fallback) {
                      fallback.style.display = 'inline-block';
                    }
                  }}
                  onLoad={(e) => {
                    console.log('Drawer logo loaded successfully from:', e.target.src);
                    const fallback = e.target.parentNode.querySelector('.navigation__drawer-logo-fallback');
                    if (fallback) {
                      fallback.style.display = 'none';
                    }
                    e.target.style.display = 'block';
                  }}
                />
                <div className="navigation__drawer-logo-fallback" style={{ display: 'none' }}>
                  YODECO
                </div>
                <span className="navigation__drawer-title">YODECO</span>
              </div>
              <button
                onClick={closeDrawer}
                className="navigation__drawer-close"
                type="button"
                aria-label="Close navigation menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="navigation__drawer-content">
              {/* User Profile Section at Top */}
              <div className="navigation__drawer-profile-top">
                <div className="navigation__drawer-profile-header">
                  <div className="navigation__drawer-profile-avatar">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="navigation__drawer-profile-info">
                    <div className="navigation__drawer-profile-name">{user?.name || 'Unknown User'}</div>
                    <div className="navigation__drawer-profile-email">{user?.email}</div>
                  </div>
                </div>
                
                <div className="navigation__drawer-profile-details">
                  <div className="navigation__drawer-profile-role">
                    <div className="navigation__drawer-profile-label">Role</div>
                    <div className={`navigation__drawer-profile-badge ${user?.role === 'System_Admin' ? 'navigation__drawer-profile-badge--admin' : user?.role === 'Panelist' ? 'navigation__drawer-profile-badge--panelist' : 'navigation__drawer-profile-badge--user'}`}>
                      {user?.role === 'System_Admin' ? 'Administrator' : user?.role === 'Panelist' ? 'Panelist' : 'User'}
                    </div>
                  </div>

                  {user?.lastLogin && (
                    <div className="navigation__drawer-profile-section">
                      <div className="navigation__drawer-profile-label">Last Login</div>
                      <div className="navigation__drawer-profile-value">
                        {new Date(user.lastLogin).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Spacer to push navigation down */}
              <div className="navigation__drawer-spacer"></div>

              {/* Navigation Section - Positioned close to footer */}
              <div className="navigation__drawer-nav-section">
                <h3 className="navigation__drawer-nav-heading">Navigation</h3>
                <div className="navigation__drawer-links">
                  <Link 
                    to="/" 
                    className={`navigation__drawer-link ${isActive('/') ? 'navigation__drawer-link--active' : ''}`}
                    onClick={closeDrawer}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4M9 11V9a3 3 0 0 1 6 0v2M9 11h6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Vote
                  </Link>

                  {canAccessPanelFeatures() && (
                    <Link 
                      to="/manage" 
                      className={`navigation__drawer-link ${isActive('/manage') ? 'navigation__drawer-link--active' : ''}`}
                      onClick={closeDrawer}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Manage Content
                    </Link>
                  )}

                  {canAccessAdminFeatures() && (
                    <Link 
                      to="/admin" 
                      className={`navigation__drawer-link ${isActive('/admin') ? 'navigation__drawer-link--active' : ''}`}
                      onClick={closeDrawer}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Admin Dashboard
                    </Link>
                  )}
                </div>
                
                <h3 className="navigation__drawer-nav-heading">YODECO Membership</h3>
                <div className="navigation__drawer-links">
                  <Link 
                    to="/member/register" 
                    className={`navigation__drawer-link ${isActive('/member/register') ? 'navigation__drawer-link--active' : ''}`}
                    onClick={closeDrawer}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                      <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2"/>
                      <line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Register as Member
                  </Link>

                  {canAccessAdminFeatures() && (
                    <Link 
                      to="/admin/members" 
                      className={`navigation__drawer-link ${isActive('/admin/members') ? 'navigation__drawer-link--active' : ''}`}
                      onClick={closeDrawer}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Manage Members
                    </Link>
                  )}
                </div>
              </div>
              
              {/* Sign Out Button at Bottom */}
              <div className="navigation__drawer-footer">
                <button
                  onClick={handleLogout}
                  className="navigation__drawer-logout-button"
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <path 
                      fill="currentColor" 
                      d="M2 2.75C2 1.784 2.784 1 3.75 1h2.5a.75.75 0 010 1.5h-2.5a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h2.5a.75.75 0 010 1.5h-2.5A1.75 1.75 0 012 13.25V2.75zm10.44 4.5l-1.97-1.97a.75.75 0 10-1.06 1.06L10.69 7.5H6.75a.75.75 0 000 1.5h3.94l-1.22 1.22a.75.75 0 101.06 1.06l2.5-2.5a.75.75 0 000-1.06l-2.5-2.5z"
                    />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navigation;