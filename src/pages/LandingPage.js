import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-hero">
          <h1>Welcome to YODECO</h1>
          <p className="landing-subtitle">Youth Democratic Coalition</p>
          <p className="landing-description">
            The Youth Democratic Coalition (YODECO) is a youth-driven political and civic movement 
            founded on a simple but powerful principle: ALL for ONE, ONE for ALL. We exist to mobilize, 
            educate, and empower young Nigerians to stand together in defense of democracy, justice, 
            and the future of our Motherland.
          </p>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4M9 11V9a3 3 0 0 1 6 0v2M9 11h6" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3>Voting Portal</h3>
            <p>Participate in YODECO award voting and recognition programs to celebrate excellence in our democratic movement.</p>
            {isAuthenticated ? (
              <Link to="/" className="btn btn-primary">
                Start Voting
              </Link>
            ) : (
              <p className="auth-note">Sign in to access voting</p>
            )}
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2"/>
                <line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3>Member Registration</h3>
            <p>Become an official YODECO member and get your unique registration number.</p>
            <Link to="/member/register" className="btn btn-secondary">
              Register Now
            </Link>
          </div>
        </div>

        <div className="landing-stats">
          <div className="stat-item">
            <h4>Unity</h4>
            <p>ALL for ONE, ONE for ALL - Building solidarity among Nigerian youth</p>
          </div>
          <div className="stat-item">
            <h4>Democracy</h4>
            <p>Defending democratic values and promoting civic engagement</p>
          </div>
          <div className="stat-item">
            <h4>Empowerment</h4>
            <p>Mobilizing and educating young Nigerians for national rebirth</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;