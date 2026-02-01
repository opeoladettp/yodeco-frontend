import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUtils';
import './PendingNominations.css';

const PendingNominations = () => {
  const { user } = useAuth();
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [selectedAward, setSelectedAward] = useState('');
  const [awards, setAwards] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedNomination, setSelectedNomination] = useState(null);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchAwards();
    fetchPendingNominations();
  }, [pagination.page, selectedAward]);

  const fetchAwards = async () => {
    try {
      const response = await api.get('/content/awards?limit=1000');
      setAwards(response.data.awards || []);
    } catch (error) {
      console.error('Error fetching awards:', error);
    }
  };

  const fetchPendingNominations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (selectedAward) {
        params.append('awardId', selectedAward);
      }

      const response = await api.get(`/content/nominations/pending?${params}`);
      setNominations(response.data.nominations || []);
      setPagination(response.data.pagination || pagination);
      setError(null);
    } catch (error) {
      console.error('Error fetching pending nominations:', error);
      setError('Failed to load pending nominations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (nomination) => {
    setSelectedNomination(nomination);
    setDisplayOrder(0);
    setShowApprovalModal(true);
  };

  const handleReject = (nomination) => {
    setSelectedNomination(nomination);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const confirmApproval = async () => {
    if (!selectedNomination) return;

    try {
      setProcessingId(selectedNomination._id);
      await api.post(`/content/nominations/${selectedNomination._id}/approve`, {
        displayOrder: displayOrder || 0
      });
      
      setShowApprovalModal(false);
      setSelectedNomination(null);
      setDisplayOrder(0);
      await fetchPendingNominations();
    } catch (error) {
      console.error('Error approving nomination:', error);
      alert(error.response?.data?.error?.message || 'Failed to approve nomination');
    } finally {
      setProcessingId(null);
    }
  };

  const confirmRejection = async () => {
    if (!selectedNomination || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessingId(selectedNomination._id);
      await api.post(`/content/nominations/${selectedNomination._id}/reject`, {
        reason: rejectionReason.trim()
      });
      
      setShowRejectionModal(false);
      setSelectedNomination(null);
      setRejectionReason('');
      await fetchPendingNominations();
    } catch (error) {
      console.error('Error rejecting nomination:', error);
      alert(error.response?.data?.error?.message || 'Failed to reject nomination');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const closeModals = () => {
    setShowApprovalModal(false);
    setShowRejectionModal(false);
    setSelectedNomination(null);
    setDisplayOrder(0);
    setRejectionReason('');
  };

  if (loading) {
    return (
      <div className="pending-nominations">
        <div className="pending-nominations__loading">
          <div className="pending-nominations__spinner"></div>
          <h3>Loading Pending Nominations</h3>
          <p>Please wait while we fetch the nominations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pending-nominations">
        <div className="pending-nominations__error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <h3>Error Loading Nominations</h3>
          <p>{error}</p>
          <button 
            onClick={fetchPendingNominations}
            className="pending-nominations__retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pending-nominations">
      <div className="pending-nominations__header">
        <div className="pending-nominations__title-section">
          <h2>Pending Nominations</h2>
          <p>Review and approve or reject public nominations submitted by users.</p>
        </div>

        <div className="pending-nominations__filters">
          <select
            value={selectedAward}
            onChange={(e) => {
              setSelectedAward(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="pending-nominations__filter-select"
          >
            <option value="">All Awards</option>
            {awards.map(award => (
              <option key={award._id} value={award._id}>
                {award.title} ({award.category?.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {nominations.length === 0 ? (
        <div className="pending-nominations__empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <h3>No Pending Nominations</h3>
          <p>
            {selectedAward 
              ? 'No pending nominations for the selected award.' 
              : 'All nominations have been reviewed. Great job!'
            }
          </p>
          {selectedAward && (
            <button
              onClick={() => setSelectedAward('')}
              className="pending-nominations__clear-filter"
            >
              View All Awards
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="pending-nominations__stats">
            <div className="pending-nominations__stat">
              <span className="pending-nominations__stat-number">{pagination.total}</span>
              <span className="pending-nominations__stat-label">
                {pagination.total === 1 ? 'Nomination' : 'Nominations'} Pending
              </span>
            </div>
          </div>

          <div className="pending-nominations__list">
            {nominations.map((nomination) => (
              <div key={nomination._id} className="pending-nominations__card">
                <div className="pending-nominations__card-header">
                  <div className="pending-nominations__nominee-info">
                    {nomination.imageUrl ? (
                      <img 
                        src={getImageUrl(nomination.imageUrl)}
                        alt={nomination.name}
                        className="pending-nominations__nominee-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="pending-nominations__nominee-placeholder"
                      style={{ display: nomination.imageUrl ? 'none' : 'flex' }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    
                    <div className="pending-nominations__nominee-details">
                      <h3 className="pending-nominations__nominee-name">
                        {nomination.name}
                      </h3>
                      <p className="pending-nominations__award-title">
                        {nomination.award?.title}
                      </p>
                      <p className="pending-nominations__category">
                        {nomination.award?.category?.name}
                      </p>
                    </div>
                  </div>

                  <div className="pending-nominations__actions">
                    <button
                      onClick={() => handleApprove(nomination)}
                      disabled={processingId === nomination._id}
                      className="pending-nominations__action-button pending-nominations__action-button--approve"
                      title="Approve nomination"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(nomination)}
                      disabled={processingId === nomination._id}
                      className="pending-nominations__action-button pending-nominations__action-button--reject"
                      title="Reject nomination"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>

                <div className="pending-nominations__card-body">
                  <div className="pending-nominations__bio">
                    <h4>Nomination Reason:</h4>
                    <p>{nomination.bio}</p>
                  </div>

                  <div className="pending-nominations__metadata">
                    <div className="pending-nominations__meta-item">
                      <strong>Nominated by:</strong> {nomination.nominatedBy?.name || 'Unknown'}
                    </div>
                    <div className="pending-nominations__meta-item">
                      <strong>Submitted:</strong> {formatDate(nomination.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pending-nominations__pagination">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="pending-nominations__page-button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Previous
              </button>
              
              <span className="pending-nominations__page-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="pending-nominations__page-button"
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

      {/* Approval Modal */}
      {showApprovalModal && selectedNomination && (
        <div className="pending-nominations__modal">
          <div className="pending-nominations__modal-backdrop" onClick={closeModals}></div>
          <div className="pending-nominations__modal-content">
            <div className="pending-nominations__modal-header">
              <h3>Approve Nomination</h3>
              <button 
                onClick={closeModals}
                className="pending-nominations__modal-close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
            
            <div className="pending-nominations__modal-body">
              <p>
                Are you sure you want to approve <strong>{selectedNomination.name}</strong> 
                for <strong>{selectedNomination.award?.title}</strong>?
              </p>
              
              <div className="pending-nominations__form-group">
                <label htmlFor="displayOrder">Display Order (optional):</label>
                <input
                  id="displayOrder"
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  className="pending-nominations__input"
                />
                <small>Lower numbers appear first in the voting list</small>
              </div>
            </div>
            
            <div className="pending-nominations__modal-actions">
              <button 
                onClick={closeModals}
                className="pending-nominations__modal-button pending-nominations__modal-button--secondary"
              >
                Cancel
              </button>
              <button 
                onClick={confirmApproval}
                disabled={processingId === selectedNomination._id}
                className="pending-nominations__modal-button pending-nominations__modal-button--approve"
              >
                {processingId === selectedNomination._id ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedNomination && (
        <div className="pending-nominations__modal">
          <div className="pending-nominations__modal-backdrop" onClick={closeModals}></div>
          <div className="pending-nominations__modal-content">
            <div className="pending-nominations__modal-header">
              <h3>Reject Nomination</h3>
              <button 
                onClick={closeModals}
                className="pending-nominations__modal-close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
            
            <div className="pending-nominations__modal-body">
              <p>
                Please provide a reason for rejecting <strong>{selectedNomination.name}</strong> 
                for <strong>{selectedNomination.award?.title}</strong>:
              </p>
              
              <div className="pending-nominations__form-group">
                <label htmlFor="rejectionReason">Rejection Reason:</label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please explain why this nomination is being rejected..."
                  rows="4"
                  className="pending-nominations__textarea"
                  required
                />
              </div>
            </div>
            
            <div className="pending-nominations__modal-actions">
              <button 
                onClick={closeModals}
                className="pending-nominations__modal-button pending-nominations__modal-button--secondary"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRejection}
                disabled={processingId === selectedNomination._id || !rejectionReason.trim()}
                className="pending-nominations__modal-button pending-nominations__modal-button--reject"
              >
                {processingId === selectedNomination._id ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingNominations;