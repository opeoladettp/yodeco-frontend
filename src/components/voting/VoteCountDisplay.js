import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './VoteCountDisplay.css';

const VoteCountDisplay = ({ 
  categories = [],
  refreshInterval = 30000, // 30 seconds
  showPercentages = true,
  showNumbers = true 
}) => {
  const [voteCounts, setVoteCounts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [collapsedAwards, setCollapsedAwards] = useState({});

  useEffect(() => {
    if (categories.length > 0) {
      fetchAllVoteCounts();
      
      // Set up polling for real-time updates
      const interval = setInterval(fetchAllVoteCounts, refreshInterval);
      
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, refreshInterval]);

  const fetchAllVoteCounts = async () => {
    if (categories.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch vote counts for all awards
      const allVoteCounts = {};
      
      for (const category of categories) {
        for (const award of category.awards || []) {
          try {
            const response = await api.get(`/votes/counts/${award._id}`);
            const countsData = response.data.counts || [];
            
            console.log(`Vote counts for award ${award.title}:`, countsData);
            
            // Convert the counts array to a nomineeId -> count mapping
            countsData.forEach(countItem => {
              if (countItem.nominee && countItem.nominee.id) {
                allVoteCounts[countItem.nominee.id] = countItem.voteCount || 0;
              }
            });
          } catch (awardError) {
            console.warn(`Failed to fetch votes for award ${award._id}:`, awardError);
          }
        }
      }
      
      console.log('All vote counts:', allVoteCounts);
      setVoteCounts(allVoteCounts);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching vote counts:', error);
      setError(error.response?.data?.error?.message || 'Failed to load vote counts');
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalVotes = () => {
    return Object.values(voteCounts).reduce((sum, count) => sum + count, 0);
  };

  const getVoteCount = (nomineeId) => {
    return voteCounts[nomineeId] || 0;
  };

  const getVotePercentage = (nomineeId) => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return Math.round((getVoteCount(nomineeId) / total) * 100);
  };

  const toggleCategoryCollapse = (categoryId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleAwardCollapse = (awardId) => {
    setCollapsedAwards(prev => ({
      ...prev,
      [awardId]: !prev[awardId]
    }));
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    
    const now = new Date();
    const diffMs = now - lastUpdated;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffSeconds < 60) {
      return `Updated ${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `Updated ${diffMinutes}m ago`;
    } else {
      return `Updated at ${lastUpdated.toLocaleTimeString()}`;
    }
  };

  const totalVotes = getTotalVotes();

  return (
    <div className="vote-count-display">
      <div className="vote-count-display__header">
        <h3 className="vote-count-display__title">Live Vote Counts</h3>
        <div className="vote-count-display__meta">
          {isLoading && (
            <div className="vote-count-display__loading">
              <div className="vote-count-display__spinner"></div>
              <span>Updating...</span>
            </div>
          )}
          {!isLoading && lastUpdated && (
            <div className="vote-count-display__last-updated">
              {formatLastUpdated()}
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="vote-count-display__error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>{error}</span>
          <button 
            onClick={fetchAllVoteCounts}
            className="vote-count-display__retry"
            type="button"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="vote-count-display__summary">
            <div className="vote-count-display__total">
              <span className="vote-count-display__total-number">{totalVotes}</span>
              <span className="vote-count-display__total-label">
                Total Vote{totalVotes !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="vote-count-display__list">
            {categories.map(category => (
              <div key={category._id} className="vote-count-display__category">
                <div 
                  className="vote-count-display__category-header"
                  onClick={() => toggleCategoryCollapse(category._id)}
                >
                  <h4 className="vote-count-display__category-title">{category.name}</h4>
                  <svg 
                    className={`vote-count-display__collapse-icon ${collapsedCategories[category._id] ? 'vote-count-display__collapse-icon--collapsed' : ''}`}
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none"
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                
                {!collapsedCategories[category._id] && (
                  <div className="vote-count-display__category-content">
                    {category.awards?.map(award => (
                      <div key={award._id} className="vote-count-display__award">
                        <div 
                          className="vote-count-display__award-header"
                          onClick={() => toggleAwardCollapse(award._id)}
                        >
                          <h5 className="vote-count-display__award-title">{award.title}</h5>
                          <svg 
                            className={`vote-count-display__collapse-icon ${collapsedAwards[award._id] ? 'vote-count-display__collapse-icon--collapsed' : ''}`}
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="none"
                          >
                            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>

                        {!collapsedAwards[award._id] && award.nominees && (
                          <div className="vote-count-display__nominees">
                            {[...award.nominees].sort((a, b) => {
                              const countA = getVoteCount(a._id);
                              const countB = getVoteCount(b._id);
                              return countB - countA; // Sort by vote count descending
                            }).map((nominee, index) => {
                              const voteCount = getVoteCount(nominee._id);
                              const percentage = getVotePercentage(nominee._id);
                              const isLeading = index === 0 && voteCount > 0;

                              return (
                                <div 
                                  key={nominee._id} 
                                  className={`vote-count-display__item ${isLeading ? 'vote-count-display__item--leading' : ''}`}
                                >
                                  <div className="vote-count-display__nominee">
                                    <div className="vote-count-display__rank">
                                      {index + 1}
                                    </div>
                                    <div className="vote-count-display__nominee-name">
                                      {nominee.name}
                                    </div>
                                    {isLeading && (
                                      <div className="vote-count-display__leading-badge">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                          <path
                                            d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
                                            fill="currentColor"
                                          />
                                        </svg>
                                        Leading
                                      </div>
                                    )}
                                  </div>

                                  <div className="vote-count-display__stats">
                                    {showNumbers && (
                                      <div className="vote-count-display__count">
                                        {voteCount} vote{voteCount !== 1 ? 's' : ''}
                                      </div>
                                    )}
                                    {showPercentages && totalVotes > 0 && (
                                      <div className="vote-count-display__percentage">
                                        {percentage}%
                                      </div>
                                    )}
                                  </div>

                                  {showPercentages && totalVotes > 0 && (
                                    <div className="vote-count-display__bar">
                                      <div 
                                        className="vote-count-display__bar-fill"
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="vote-count-display__empty">
              <p>No categories available.</p>
            </div>
          )}
        </>
      )}

      <div className="vote-count-display__footer">
        <button 
          onClick={fetchAllVoteCounts}
          disabled={isLoading}
          className="vote-count-display__refresh"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M1 4v6h6M23 20v-6h-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

export default VoteCountDisplay;