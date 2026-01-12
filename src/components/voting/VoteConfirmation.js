import React, { useState } from 'react';
import { getImageUrl } from '../../utils/imageUtils';
import './VoteConfirmation.css';

const VoteConfirmation = ({ 
  nominee, 
  award, 
  onConfirm, 
  onCancel, 
  isVisible = false,
  isSubmitting = false 
}) => {
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!hasConfirmed) {
      setHasConfirmed(true);
      return;
    }
    
    onConfirm && onConfirm();
  };

  const handleCancel = () => {
    setHasConfirmed(false);
    onCancel && onCancel();
  };

  if (!isVisible || !nominee || !award) {
    return null;
  }

  return (
    <div className="vote-confirmation">
      <div className="vote-confirmation__backdrop" onClick={handleCancel}></div>
      
      <div className="vote-confirmation__modal">
        <div className="vote-confirmation__header">
          <h2 className="vote-confirmation__title">
            {hasConfirmed ? 'Submit Your Vote' : 'Confirm Your Vote'}
          </h2>
          <button 
            className="vote-confirmation__close"
            onClick={handleCancel}
            disabled={isSubmitting}
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

        <div className="vote-confirmation__content">
          {isSubmitting ? (
            <div className="vote-confirmation__submitting">
              <div className="vote-confirmation__spinner"></div>
              <h3>Submitting Your Vote</h3>
              <p>Please wait while we process your vote...</p>
            </div>
          ) : (
            <>
              <div className="vote-confirmation__nominee">
                <div className="vote-confirmation__nominee-image">
                  {nominee.imageUrl ? (
                    <img 
                      src={getImageUrl(nominee.imageUrl)} 
                      alt={nominee.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="vote-confirmation__nominee-placeholder" style={{ display: nominee.imageUrl ? 'none' : 'flex' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </div>
                
                <div className="vote-confirmation__nominee-info">
                  <h3 className="vote-confirmation__nominee-name">{nominee.name}</h3>
                  {nominee.bio && (
                    <p className="vote-confirmation__nominee-bio">{nominee.bio}</p>
                  )}
                </div>
              </div>

              <div className="vote-confirmation__award">
                <div className="vote-confirmation__award-label">Award Category</div>
                <div className="vote-confirmation__award-title">{award.title}</div>
                {award.criteria && (
                  <div className="vote-confirmation__award-criteria">{award.criteria}</div>
                )}
              </div>

              {!hasConfirmed ? (
                <div className="vote-confirmation__warning">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"
                      fill="currentColor"
                    />
                  </svg>
                  <div>
                    <h4>Important Notice</h4>
                    <p>
                      Once submitted, your vote cannot be changed. Please review your selection carefully.
                      You can only vote once per award category.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="vote-confirmation__final-check">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <h4>Ready to Submit</h4>
                    <p>
                      Your vote for <strong>{nominee.name}</strong> in the <strong>{award.title}</strong> category 
                      will be submitted. This action cannot be undone.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!isSubmitting && (
          <div className="vote-confirmation__actions">
            <button
              onClick={handleCancel}
              className="vote-confirmation__button vote-confirmation__button--secondary"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="vote-confirmation__button vote-confirmation__button--primary"
              type="button"
            >
              {hasConfirmed ? 'Submit Vote' : 'Confirm Selection'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoteConfirmation;