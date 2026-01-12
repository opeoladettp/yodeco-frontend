import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUtils';
import './MyNominations.css';

const MyNominations = () => {
  const { user } = useAuth();
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    if (user) {
      fetchMyNominations();
    }
  }, [user, pagination.page]);

  const fetchMyNominations = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/content/nominations/my?page=${pagination.page}&limit=${pagination.limit}`);
      setNominations(response.data.nominations);
      setPagination(response.data.pagination);
      setError(null);
    } catch (error) {
      console.error('Error fetching nominations:', error);
      setError('Failed to load your nominations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        className: 'my-nominations__status--pending',
        text: 'Pending Review',
        icon: '⏳'
      },
      approved: {
        className: 'my-nominations__status--approved',
        text: 'Approved',
        icon: '✅'
      },
      rejected: {
        className: 'my-nominations__status--rejected',
        text: 'Rejected',
        icon: '❌'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`my-nominations__status ${config.className}`}>
        <span className="my-nominations__status-icon">{config.icon}</span>
        {config.text}
      </span>
    );
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

  if (!user) {
    return (
      <div className="my-nominations">
        <div className="my-nominations__auth-required">
          Please sign in to view your nominations
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="my-nominations">
        <div className="my-nominations__loading">
          Loading your nominations...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-nominations">
        <div className="my-nominations__error">
          {error}
          <button 
            onClick={fetchMyNominations}
            className="my-nominations__retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-nominations">
      <div className="my-nominations__header">
        <h2>My Nominations</h2>
        <p className="my-nominations__subtitle">
          Track the status of your submitted nominations
        </p>
      </div>

      {nominations.length === 0 ? (
        <div className="my-nominations__empty">
          <div className="my-nominations__empty-icon">📝</div>
          <h3>No nominations yet</h3>
          <p>You haven't submitted any nominations. Find awards that are open for public nomination and submit your first nomination!</p>
        </div>
      ) : (
        <>
          <div className="my-nominations__list">
            {nominations.map((nomination) => (
              <div key={nomination._id} className="my-nominations__card">
                <div className="my-nominations__card-header">
                  <div className="my-nominations__nominee-info">
                    {nomination.imageUrl && (
                      <img 
                        src={getImageUrl(nomination.imageUrl)}
                        alt={nomination.name}
                        className="my-nominations__nominee-image"
                      />
                    )}
                    <div className="my-nominations__nominee-details">
                      <h3 className="my-nominations__nominee-name">
                        {nomination.name}
                      </h3>
                      <p className="my-nominations__award-title">
                        {nomination.award?.title}
                      </p>
                      <p className="my-nominations__category">
                        {nomination.award?.category?.name}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(nomination.approvalStatus)}
                </div>

                <div className="my-nominations__card-body">
                  <div className="my-nominations__bio">
                    <h4>Your nomination reason:</h4>
                    <p>{nomination.bio}</p>
                  </div>

                  <div className="my-nominations__metadata">
                    <div className="my-nominations__date">
                      <strong>Submitted:</strong> {formatDate(nomination.createdAt)}
                    </div>
                    
                    {nomination.approvedAt && (
                      <div className="my-nominations__date">
                        <strong>
                          {nomination.approvalStatus === 'approved' ? 'Approved:' : 'Rejected:'}
                        </strong> {formatDate(nomination.approvedAt)}
                      </div>
                    )}

                    {nomination.rejectionReason && (
                      <div className="my-nominations__rejection-reason">
                        <strong>Rejection reason:</strong>
                        <p>{nomination.rejectionReason}</p>
                      </div>
                    )}

                    {nomination.approver && (
                      <div className="my-nominations__approver">
                        <strong>Reviewed by:</strong> {nomination.approver.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="my-nominations__pagination">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="my-nominations__page-button"
              >
                Previous
              </button>
              
              <span className="my-nominations__page-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="my-nominations__page-button"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyNominations;