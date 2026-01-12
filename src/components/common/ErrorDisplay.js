import React from 'react';
import { APIError, ERROR_TYPES, getErrorMessage, isRetryableError } from '../../services/api';
import './ErrorDisplay.css';

const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onDismiss, 
  showDetails = false,
  className = '',
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  if (!error) return null;

  const isAPIError = error instanceof APIError;
  const errorMessage = isAPIError ? getErrorMessage(error) : error.message || 'An unexpected error occurred';
  const canRetry = isAPIError && isRetryableError(error);
  
  // Determine error severity and styling
  const getErrorSeverity = () => {
    if (!isAPIError) return 'error';
    
    switch (error.type) {
      case ERROR_TYPES.NETWORK_ERROR:
      case ERROR_TYPES.SERVICE_UNAVAILABLE:
        return 'warning';
      case ERROR_TYPES.AUTHENTICATION_ERROR:
      case ERROR_TYPES.AUTHORIZATION_ERROR:
        return 'error';
      case ERROR_TYPES.VALIDATION_ERROR:
      case ERROR_TYPES.CLIENT_ERROR:
        return 'info';
      case ERROR_TYPES.BIOMETRIC_ERROR:
        return 'warning';
      case ERROR_TYPES.RATE_LIMIT_ERROR:
        return 'warning';
      default:
        return 'error';
    }
  };

  const severity = getErrorSeverity();
  
  // Get appropriate icon
  const getIcon = () => {
    switch (severity) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'error':
      default:
        return '❌';
    }
  };

  // Get retry delay if available
  const getRetryDelay = () => {
    if (isAPIError && error.details.retryAfter) {
      return error.details.retryAfter;
    }
    return null;
  };

  const retryDelay = getRetryDelay();

  return (
    <div className={`error-display error-display-${severity} error-display-${size} ${className}`}>
      <div className="error-display-content">
        <div className="error-display-header">
          <span className="error-display-icon">{getIcon()}</span>
          <div className="error-display-message">
            {errorMessage}
          </div>
        </div>

        {/* Additional error information */}
        {isAPIError && error.details.fallbackInfo && (
          <div className="error-display-fallback-info">
            <small>{error.details.fallbackInfo}</small>
          </div>
        )}

        {/* Retry delay information */}
        {retryDelay && (
          <div className="error-display-retry-info">
            <small>Please wait {retryDelay} seconds before retrying</small>
          </div>
        )}

        {/* Action buttons */}
        <div className="error-display-actions">
          {canRetry && onRetry && (
            <button 
              className="error-display-button error-display-button-primary"
              onClick={onRetry}
            >
              Try Again
            </button>
          )}
          
          {onDismiss && (
            <button 
              className="error-display-button error-display-button-secondary"
              onClick={onDismiss}
            >
              Dismiss
            </button>
          )}
        </div>

        {/* Error details for development or when requested */}
        {showDetails && isAPIError && (
          <details className="error-display-details">
            <summary>Error Details</summary>
            <div className="error-display-details-content">
              <div><strong>Type:</strong> {error.type}</div>
              <div><strong>Code:</strong> {error.code}</div>
              <div><strong>Status:</strong> {error.statusCode}</div>
              {error.details.errorId && (
                <div><strong>Error ID:</strong> {error.details.errorId}</div>
              )}
              <div><strong>Retryable:</strong> {error.retryable ? 'Yes' : 'No'}</div>
              <div><strong>Timestamp:</strong> {error.timestamp}</div>
              
              {Object.keys(error.details).length > 0 && (
                <div>
                  <strong>Details:</strong>
                  <pre>{JSON.stringify(error.details, null, 2)}</pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

// Hook for managing error state
export const useErrorState = () => {
  const [error, setError] = React.useState(null);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleError = React.useCallback((error) => {
    console.error('Error handled by useErrorState:', error);
    setError(error);
    setIsRetrying(false);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
    setIsRetrying(false);
  }, []);

  const retryOperation = React.useCallback(async (operation) => {
    if (!operation || isRetrying) return;
    
    setIsRetrying(true);
    try {
      const result = await operation();
      clearError();
      return result;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, handleError, clearError]);

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retryOperation
  };
};

// Higher-order component for error handling
export const withErrorHandling = (Component) => {
  return function WrappedComponent(props) {
    const errorState = useErrorState();
    
    return (
      <div>
        {errorState.error && (
          <ErrorDisplay
            error={errorState.error}
            onRetry={props.onRetry ? () => errorState.retryOperation(props.onRetry) : null}
            onDismiss={errorState.clearError}
            showDetails={process.env.NODE_ENV === 'development'}
          />
        )}
        <Component {...props} {...errorState} />
      </div>
    );
  };
};

export default ErrorDisplay;