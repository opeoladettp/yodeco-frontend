import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../../utils/imageUtils';
import api from '../../services/api';
import './VotingHistory.css';

const VotingHistory = ({ isVisible = false, onClose }) => {
  const [votes, setVotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isVisible) {
      fetchVotingHistory();
    }
  }, [isVisible]);

  const fetchVotingHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/votes/my-history');
      setVotes(response.data.votes || []);
    } catch (error) {
      console.error('Error fetching voting history:', error);
      setError(error.response?.data?.error?.message || 'Failed to load voting history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="voting-history">
      <div className="voting-history__backdrop" onClick={onClose}></div>
      
      <div className="voting-history__modal">
        <div className="voting-history__header">
          <h2 className="voting-history__title">Your Voting History</h2>
          <button 
            className="voting-history__close"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="voting-history__content">
          {isLoading ? (
            <div className="voting-history__loading">
              <div className="voting-history__spinner"></div>
              <p>Loading your voting history...</p>
            </div>
          ) : error ? (
            <div className="voting-history__error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3>Error Loading History</h3>
              <p>{error}</p>
              <button 
                onClick={fetchVotingHistory}
                className="voting-history__retry-button"
                type="button"
              >
                Try Again
              </button>
            </div>
          ) : votes.length === 0 ? (
            <div className="voting-history__empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
                  fill="currentColor"
                />
              </svg>
              <h3>No Votes Yet</h3>
              <p>You haven't cast any votes yet. Start voting to see your history here.</p>
            </div>
          ) : (
            <div className="voting-history__list">
              {votes.map((vote, index) => (
                <div key={vote._id || index} className="voting-history__item">
                  <div className="voting-history__item-image">
                    {vote.nominee?.imageUrl ? (
                      <img 
                        src={getImageUrl(vote.nominee.imageUrl)} 
                        alt={vote.nominee.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="voting-history__item-placeholder" 
                      style={{ display: vote.nominee?.imageUrl ? 'none' : 'flex' }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="voting-history__item-content">
                    <div className="voting-history__item-main">
                      <h4 className="voting-history__item-nominee">
                        {vote.nominee?.name || 'Unknown Nominee'}
                      </h4>
                      <div className="voting-history__item-award">
                        {vote.award?.title || 'Unknown Award'}
                      </div>
                    </div>
                    
                    <div className="voting-history__item-meta">
                      <div className="voting-history__item-date">
                        {formatDate(vote.timestamp)}
                      </div>
                      {vote.biometricVerified && (
                        <div className="voting-history__item-verified">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"
                              fill="currentColor"
                            />
                            <path
                              d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"
                              fill="white"
                            />
                          </svg>
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="voting-history__footer">
          <p className="voting-history__footer-text">
            Showing {votes.length} vote{votes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VotingHistory;