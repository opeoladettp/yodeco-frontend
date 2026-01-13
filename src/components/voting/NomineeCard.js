import React, { useState } from 'react';
import { getImageUrl } from '../../utils/imageUtils';
import './NomineeCard.css';

const NomineeCard = ({ 
  nominee, 
  award, 
  isSelected = false, 
  onSelect, 
  disabled = false,
  voteCount = null,
  showVoteCount = false 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleSelect = () => {
    console.log('NomineeCard clicked:', {
      nominee: nominee.name,
      award: award?.title,
      disabled,
      onSelect: !!onSelect
    });
    
    if (!disabled && onSelect) {
      console.log('Calling onSelect with:', nominee.name, award?.title);
      onSelect(nominee, award);
    } else {
      console.log('Click ignored - disabled:', disabled, 'onSelect:', !!onSelect);
    }
  };

  const imageUrl = getImageUrl(nominee.imageUrl);
  
  console.log('NomineeCard image debug:', {
    originalUrl: nominee.imageUrl,
    processedUrl: imageUrl,
    nomineeName: nominee.name
  });

  return (
    <div 
      className={`nominee-card ${isSelected ? 'nominee-card--selected' : ''} ${disabled ? 'nominee-card--disabled' : ''}`}
      onClick={handleSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={onSelect ? 'button' : 'presentation'}
      tabIndex={onSelect && !disabled ? 0 : -1}
      onKeyDown={(e) => {
        if (onSelect && !disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleSelect();
        }
      }}
    >
      <div className="nominee-card__image-container">
        {imageUrl && !imageError ? (
          <>
            {imageLoading && (
              <div className="nominee-card__image-placeholder">
                <div className="nominee-card__image-spinner"></div>
              </div>
            )}
            <img 
              src={imageUrl}
              alt={nominee.name}
              className={`nominee-card__image-loader ${imageLoading ? 'nominee-card__image-loader--loading' : ''}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: 'none' }}
            />
            <div 
              className={`nominee-card__image ${imageLoading ? 'nominee-card__image--loading' : ''}`}
              style={{
                backgroundImage: imageLoading ? 'none' : `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%), url(${imageUrl})`
              }}
            />
          </>
        ) : (
          <div className="nominee-card__image-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                fill="currentColor"
              />
            </svg>
          </div>
        )}
        
        {showVoteCount && voteCount !== null && (
          <div className="nominee-card__vote-count">
            <span className="nominee-card__vote-number">{voteCount}</span>
            <span className="nominee-card__vote-label">
              {voteCount === 1 ? 'vote' : 'votes'}
            </span>
          </div>
        )}

        {onSelect && (
          <div className="nominee-card__select-indicator">
            {isSelected ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="var(--yodeco-primary)"/>
                <path
                  d="M9 12l2 2 4-4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <div className="nominee-card__select-circle"></div>
            )}
          </div>
        )}
      </div>

      <div className="nominee-card__content">
        <h3 className="nominee-card__name">{nominee.name}</h3>
        
        {nominee.bio && (
          <p className="nominee-card__bio">{nominee.bio}</p>
        )}
        
        {award && (
          <div className="nominee-card__award">
            <span className="nominee-card__award-title">{award.title}</span>
          </div>
        )}
      </div>

      {/* Hover overlay for Netflix-style interaction */}
      <div className={`nominee-card__overlay ${isHovered ? 'nominee-card__overlay--visible' : ''}`}>
        <div className="nominee-card__overlay-content">
          <h4 className="nominee-card__overlay-name">{nominee.name}</h4>
          {nominee.bio && (
            <p className="nominee-card__overlay-bio">{nominee.bio}</p>
          )}
          {onSelect && !disabled && (
            <button className="nominee-card__vote-button" onClick={handleSelect}>
              {isSelected ? 'Selected' : 'Vote Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NomineeCard;