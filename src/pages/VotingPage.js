import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Enable this to check authentication
import { 
  NomineeCard, 
  VoteConfirmation, 
  VotingHistory, 
  VoteCountDisplay 
} from '../components/voting';
import { PublicNominationForm } from '../components/nominations';
import api from '../services/api';
import './VotingPage.css';

const VotingPage = () => {
  const { isAuthenticated } = useAuth(); // Enable authentication check
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedAward, setSelectedAward] = useState(null);
  const [selectedNominee, setSelectedNominee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [collapsedAwards, setCollapsedAwards] = useState({});
  
  // Modal states
  const [showVoteConfirmation, setShowVoteConfirmation] = useState(false);
  const [showVotingHistory, setShowVotingHistory] = useState(false);
  const [showNominationForm, setShowNominationForm] = useState(false);
  const [selectedAwardForNomination, setSelectedAwardForNomination] = useState(null);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [isSubmittingNomination, setIsSubmittingNomination] = useState(false);
  const [voteCounts, setVoteCounts] = useState({});

  useEffect(() => {
    fetchVotingData();
    fetchVoteCounts();
  }, []);

  const fetchVotingData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch categories with awards and nominees
      const [categoriesResponse, votesResponse] = await Promise.all([
        api.get('/content/categories?include=awards,nominees'),
        api.get('/votes/my-history').catch(() => ({ data: { votes: [] } })) // Don't fail if no votes
      ]);

      setCategories(categoriesResponse.data.categories || []);
      
      // Debug: Log award data to check nomination fields
      console.log('🔍 Award data received:', categoriesResponse.data.categories?.[0]?.awards?.[0]);
      
      // Create a map of user votes by award ID
      const votesMap = {};
      (votesResponse.data.votes || []).forEach(vote => {
        votesMap[vote.awardId] = vote;
      });
      setUserVotes(votesMap);

      // Don't auto-select anything - let user choose via filters
    } catch (error) {
      console.error('Error fetching voting data:', error);
      setError(error.response?.data?.error?.message || 'Failed to load voting data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVoteCounts = async () => {
    try {
      const response = await api.get('/votes/counts');
      const counts = {};
      
      // Create a map of vote counts by nominee ID
      response.data.voteCounts?.forEach(item => {
        counts[item.nomineeId] = item.count;
      });
      
      setVoteCounts(counts);
      console.log('📊 Vote counts loaded:', counts);
    } catch (error) {
      console.error('Error fetching vote counts:', error);
      // Don't fail the page if vote counts can't be loaded
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    // Clear award selection when category changes to avoid conflicts
    setSelectedAward(null);
    setSelectedNominee(null);
  };

  const handleAwardSelect = (award) => {
    setSelectedAward(award);
    // Clear category selection when award is selected to allow cross-category award filtering
    setSelectedCategory(null);
    setSelectedNominee(null);
  };

  const handleNomineeSelect = (nominee, award) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      alert('Please sign in to vote.');
      return;
    }
    
    // Check if user has already voted for this award
    if (userVotes[award._id]) {
      alert('You have already voted for this award category.');
      return;
    }

    setSelectedNominee(nominee);
    setSelectedAward(award);
    
    // Show vote confirmation directly (no biometric verification)
    setShowVoteConfirmation(true);
  };

  const handleVoteConfirm = async () => {
    setShowVoteConfirmation(false);
    setIsSubmittingVote(true);

    try {
      const voteData = {
        awardId: selectedAward._id,
        nomineeId: selectedNominee._id
      };

      // Generate unique idempotency key for this vote attempt
      const idempotencyKey = `vote_${selectedAward._id}_${selectedNominee._id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Submit vote without biometric verification
      await api.post('/votes', voteData, {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      });
      
      // Update user votes
      setUserVotes(prev => ({
        ...prev,
        [selectedAward._id]: {
          awardId: selectedAward._id,
          nomineeId: selectedNominee._id,
          nominee: selectedNominee,
          award: selectedAward,
          timestamp: new Date().toISOString()
        }
      }));

      // Refresh vote counts to show updated numbers
      fetchVoteCounts();

      // Reset selection
      setSelectedNominee(null);
      setSelectedAward(null);
      
      // Show success message
      alert('Your vote has been successfully submitted!');
      
    } catch (error) {
      console.error('Vote submission error:', error);
      
      // Extract error details
      const errorData = error.response?.data?.error;
      const errorCode = errorData?.code;
      const errorMessage = errorData?.message;
      
      // Provide specific error messages based on error code
      let userMessage = 'Failed to submit vote. Please try again.';
      
      if (errorCode === 'VOTING_NOT_STARTED') {
        const startDate = errorData?.details?.votingStartDate;
        userMessage = startDate 
          ? `Voting has not started yet. Voting begins on ${new Date(startDate).toLocaleDateString()}.`
          : 'Voting has not started yet for this award.';
      } else if (errorCode === 'VOTING_ENDED') {
        const endDate = errorData?.details?.votingEndDate;
        userMessage = endDate
          ? `Voting has ended. Voting closed on ${new Date(endDate).toLocaleDateString()}.`
          : 'Voting has ended for this award.';
      } else if (errorCode === 'VOTING_NOT_ACTIVE') {
        userMessage = 'Voting is not currently active for this award.';
      } else if (errorCode === 'DUPLICATE_VOTE') {
        userMessage = 'You have already voted for this award category.';
      } else if (errorCode === 'AWARD_NOT_FOUND' || errorCode === 'NOMINEE_NOT_FOUND') {
        userMessage = 'The selected award or nominee could not be found.';
      } else if (errorMessage) {
        userMessage = errorMessage;
      }
      
      alert(userMessage);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleModalCancel = () => {
    setShowVoteConfirmation(false);
    setSelectedNominee(null);
    setSelectedAward(null);
  };

  // Nomination handlers
  const handleNominateClick = (award) => {
    if (!isAuthenticated) {
      alert('Please sign in to submit nominations');
      return;
    }
    
    setSelectedAwardForNomination(award);
    setShowNominationForm(true);
  };

  const handleNominationSubmit = async (nominationData) => {
    try {
      setIsSubmittingNomination(true);
      await api.post('/content/nominations', nominationData);
      
      setShowNominationForm(false);
      setSelectedAwardForNomination(null);
      
      alert('Nomination submitted successfully! It will be reviewed by the panel.');
      
      // Optionally refresh the data to show updated nominees
      fetchVotingData();
      
    } catch (error) {
      console.error('Nomination submission error:', error);
      
      if (error.response?.data?.error?.code === 'DUPLICATE_NOMINATION') {
        alert('This person has already been nominated for this award.');
      } else if (error.response?.data?.error?.code === 'NOMINATION_NOT_ALLOWED') {
        alert(error.response.data.error.message);
      } else {
        alert('Failed to submit nomination. Please try again.');
      }
    } finally {
      setIsSubmittingNomination(false);
    }
  };

  const handleNominationCancel = () => {
    setShowNominationForm(false);
    setSelectedAwardForNomination(null);
  };

  const hasUserVoted = (awardId) => {
    const voted = !!userVotes[awardId];
    return voted;
  };

  const getUserVoteForAward = (awardId) => {
    return userVotes[awardId];
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

  if (isLoading) {
    return (
      <div className="voting-page">
        <div className="voting-page__loading">
          <div className="voting-page__spinner"></div>
          <h2>Loading Voting Portal</h2>
          <p>Please wait while we load the categories and nominees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="voting-page">
        <div className="voting-page__error">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h2>Error Loading Voting Portal</h2>
          <p>{error}</p>
          <button 
            onClick={fetchVotingData}
            className="voting-page__retry-button"
            type="button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-page">
      <div className="voting-page__header">
        <div className="voting-page__header-content">
          <div className="voting-page__title-section">
            <h1>Voting Portal</h1>
            <p>Cast your votes for nominees in each award category. You can vote once per category.</p>
          </div>
          
          <div className="voting-page__actions">
            <button
              onClick={() => setShowVotingHistory(true)}
              className="voting-page__history-button"
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Voting History
            </button>
          </div>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="voting-page__empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
              fill="currentColor"
            />
          </svg>
          <h2>No Categories Available</h2>
          <p>There are currently no voting categories available. Please check back later.</p>
        </div>
      ) : (
        <div className="voting-page__content">
          <div className="voting-page__main">
            {/* Filter Row */}
            <div className="voting-page__filters">
              <div className="voting-page__filter-group">
                <label className="voting-page__filter-label">Category:</label>
                <select 
                  value={selectedCategory?._id || ''} 
                  onChange={(e) => {
                    if (e.target.value === '') {
                      handleCategorySelect(null);
                    } else {
                      const category = categories.find(cat => cat._id === e.target.value);
                      handleCategorySelect(category);
                    }
                  }}
                  className="voting-page__filter-select"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="voting-page__filter-group">
                <label className="voting-page__filter-label">Award:</label>
                <select 
                  value={selectedAward?._id || ''} 
                  onChange={(e) => {
                    if (e.target.value === '') {
                      handleAwardSelect(null);
                    } else {
                      // Find award across all categories
                      let foundAward = null;
                      for (const category of categories) {
                        const award = category.awards?.find(award => award._id === e.target.value);
                        if (award) {
                          foundAward = award;
                          break;
                        }
                      }
                      if (foundAward) {
                        handleAwardSelect(foundAward);
                      }
                    }
                  }}
                  className="voting-page__filter-select"
                >
                  <option value="">All Awards</option>
                  {categories.map(category => 
                    category.awards?.map(award => (
                      <option key={award._id} value={award._id}>
                        {category.name} - {award.title}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* All Nominees Display */}
            <div className="voting-page__all-nominees">
              {categories
                .filter(category => {
                  // If a category is selected, only show that category
                  if (selectedCategory) {
                    return category._id === selectedCategory._id;
                  }
                  // If no category is selected but an award is selected, only show categories that contain that award
                  if (selectedAward) {
                    return category.awards?.some(award => award._id === selectedAward._id);
                  }
                  // Otherwise show all categories
                  return true;
                })
                .map(category => (
                <div key={category._id} className="voting-page__category-section">
                  <div 
                    className="voting-page__category-header"
                    onClick={() => toggleCategoryCollapse(category._id)}
                  >
                    <h2 className="voting-page__category-title">{category.name}</h2>
                    <svg 
                      className={`voting-page__collapse-icon ${collapsedCategories[category._id] ? 'voting-page__collapse-icon--collapsed' : ''}`}
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none"
                    >
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  
                  {!collapsedCategories[category._id] && category.awards
                    ?.filter(award => {
                      // If an award is selected, only show that award
                      if (selectedAward) {
                        return award._id === selectedAward._id;
                      }
                      // Otherwise show all awards
                      return true;
                    })
                    .map(award => (
                    <div key={award._id} className="voting-page__award-section">
                      <div 
                        className="voting-page__award-header-collapsible"
                        onClick={() => toggleAwardCollapse(award._id)}
                      >
                        <div className="voting-page__award-header">
                          <div className="voting-page__award-info">
                            <h3>{award.title}</h3>
                            {award.criteria && (
                              <p className="voting-page__award-criteria">{award.criteria}</p>
                            )}
                            {hasUserVoted(award._id) && (
                              <div className="voting-page__voted-notice">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                  <path
                                    d="M20 6L9 17l-5-5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                You have already voted in this category
                              </div>
                            )}
                          </div>
                          
                          {/* Nomination button */}
                          {award.allowPublicNomination && (
                            <button
                              className="voting-page__nominate-button"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent award collapse
                                handleNominateClick(award);
                              }}
                              disabled={!isAuthenticated}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                              Nominate Someone
                            </button>
                          )}
                        </div>
                        <svg 
                          className={`voting-page__collapse-icon ${collapsedAwards[award._id] ? 'voting-page__collapse-icon--collapsed' : ''}`}
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none"
                        >
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>

                      {!collapsedAwards[award._id] && (
                        <>
                          {award.nominees && award.nominees.length > 0 ? (
                            <div className="voting-page__nominee-grid">
                              {award.nominees.map(nominee => {
                                const canVote = isAuthenticated && !hasUserVoted(award._id);
                                const nomineeVoteCount = voteCounts[nominee._id] || 0;
                                
                                return (
                                  <NomineeCard
                                    key={nominee._id}
                                    nominee={nominee}
                                    award={award}
                                    onSelect={canVote ? handleNomineeSelect : null}
                                    disabled={!canVote}
                                    isSelected={getUserVoteForAward(award._id)?.nomineeId === nominee._id}
                                    voteCount={nomineeVoteCount}
                                    showVoteCount={true}
                                  />
                                );
                              })}
                            </div>
                          ) : (
                            <div className="voting-page__no-nominees">
                              <p>No nominees available for this award yet.</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Vote Count Sidebar */}
          <div className="voting-page__vote-sidebar">
            <VoteCountDisplay 
              categories={categories}
              showPercentages={true}
              showNumbers={true}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <VoteConfirmation
        isVisible={showVoteConfirmation}
        nominee={selectedNominee}
        award={selectedAward}
        onConfirm={handleVoteConfirm}
        onCancel={handleModalCancel}
        isSubmitting={isSubmittingVote}
      />

      <VotingHistory
        isVisible={showVotingHistory}
        onClose={() => setShowVotingHistory(false)}
      />

      {/* Nomination Modal */}
      {showNominationForm && selectedAwardForNomination && (
        <div 
          className="voting-page__modal-overlay"
          onClick={(e) => {
            // Close modal if clicking on the overlay (outside the modal content)
            if (e.target === e.currentTarget) {
              handleNominationCancel();
            }
          }}
        >
          <div className="voting-page__modal-content">
            <PublicNominationForm
              awardId={selectedAwardForNomination._id}
              onSubmit={handleNominationSubmit}
              onCancel={handleNominationCancel}
              isSubmitting={isSubmittingNomination}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingPage;