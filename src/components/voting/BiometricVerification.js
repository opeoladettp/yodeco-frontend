import React, { useState, useEffect } from 'react';
import { 
  isPlatformAuthenticatorAvailable, 
  authenticateWebAuthn, 
  registerWebAuthn,
  getBrowserCompatibility 
} from '../../utils/webauthn';
import './BiometricVerification.css';

const BiometricVerification = ({ 
  onVerificationSuccess, 
  onVerificationFailure, 
  onCancel,
  isVisible = false,
  title = "Biometric Verification Required",
  message = "Please verify your identity using Face ID, Windows Hello, or your device's biometric authentication."
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [browserInfo, setBrowserInfo] = useState(null);

  useEffect(() => {
    if (isVisible) {
      checkBiometricAvailability();
    }
  }, [isVisible]);

  const checkBiometricAvailability = async () => {
    try {
      const available = await isPlatformAuthenticatorAvailable();
      setIsAvailable(available);
      
      const compatibility = getBrowserCompatibility();
      setBrowserInfo(compatibility);
      
      if (!available) {
        setError('Biometric authentication is not available on this device');
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setError('Failed to check biometric authentication availability');
    }
  };

  const handleVerify = async () => {
    if (!isAvailable) {
      setError('Biometric authentication is not available');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const result = await authenticateWebAuthn();
      
      if (result.success) {
        onVerificationSuccess && onVerificationSuccess(result);
      } else {
        // Check if user needs to register first
        if (result.error === 'NO_CREDENTIALS' || 
            result.error === 'AUTHENTICATION_OPTIONS_ERROR' || 
            result.error === 'AUTHENTICATION_VERIFICATION_ERROR' ||
            result.message?.includes('No WebAuthn credentials registered')) {
          setNeedsRegistration(true);
          setError('You need to register your biometric credentials first');
        } else {
          setError(result.message || 'Biometric verification failed');
          onVerificationFailure && onVerificationFailure(result);
        }
      }
    } catch (error) {
      console.error('Biometric verification error:', error);
      setError('An unexpected error occurred during verification');
      onVerificationFailure && onVerificationFailure({ 
        success: false, 
        error: 'UNEXPECTED_ERROR',
        message: error.message 
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegister = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      const result = await registerWebAuthn();
      
      if (result.success) {
        setNeedsRegistration(false);
        setError(null);
        // After successful registration, automatically try verification
        setTimeout(() => {
          handleVerify();
        }, 1000);
      } else {
        if (result.error === 'NOT_ALLOWED_ERROR') {
          setError('Biometric registration was canceled or timed out. Please try again and follow your device\'s prompts.');
        } else if (result.error === 'WEBAUTHN_NOT_SUPPORTED') {
          setError('WebAuthn is not supported on this device or browser. Please use a supported device.');
        } else {
          setError(result.message || 'Biometric registration failed');
        }
      }
    } catch (error) {
      console.error('Biometric registration error:', error);
      if (error.name === 'NotAllowedError') {
        setError('Windows Hello registration was canceled or timed out. Please try again and make sure to:\n• Click "Yes" when Windows Hello prompts appear\n• Complete the biometric scan when prompted\n• Ensure Windows Hello is set up in Windows Settings');
      } else if (error.name === 'InvalidStateError') {
        setError('A biometric credential already exists. Please try authenticating instead of registering.');
        setNeedsRegistration(false);
      } else if (error.name === 'NotSupportedError') {
        setError('Windows Hello or biometric authentication is not supported on this device.');
      } else {
        setError('An unexpected error occurred during registration');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    setNeedsRegistration(false);
    onCancel && onCancel();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="biometric-verification">
      <div className="biometric-verification__backdrop" onClick={handleCancel}></div>
      
      <div className="biometric-verification__modal">
        {/* Hidden input for WebAuthn browser detection */}
        <input 
          type="text" 
          autoComplete="webauthn" 
          style={{ 
            position: 'absolute', 
            left: '-9999px', 
            width: '1px', 
            height: '1px', 
            opacity: 0 
          }}
          tabIndex={-1}
          aria-hidden="true"
        />
        
        <div className="biometric-verification__header">
          <h2 className="biometric-verification__title">{title}</h2>
          <button 
            className="biometric-verification__close"
            onClick={handleCancel}
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

        <div className="biometric-verification__content">
          <div className="biometric-verification__icon">
            {isVerifying ? (
              <div className="biometric-verification__spinner"></div>
            ) : (
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 1C8.96 1 6.21 2.65 4.84 5.18C3.47 7.71 3.47 10.79 4.84 13.32C6.21 15.85 8.96 17.5 12 17.5C15.04 17.5 17.79 15.85 19.16 13.32C20.53 10.79 20.53 7.71 19.16 5.18C17.79 2.65 15.04 1 12 1ZM12 15C10.34 15 9 13.66 9 12C9 10.34 10.34 9 12 9C13.66 9 15 10.34 15 12C15 13.66 13.66 15 12 15Z"
                  fill="currentColor"
                />
                <path
                  d="M12 19C7.59 19 4 15.41 4 11C4 6.59 7.59 3 12 3C16.41 3 20 6.59 20 11C20 15.41 16.41 19 12 19ZM12 5C8.69 5 6 7.69 6 11C6 14.31 8.69 17 12 17C15.31 17 18 14.31 18 11C18 7.69 15.31 5 12 5Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </div>

          <p className="biometric-verification__message">
            {isVerifying 
              ? (needsRegistration ? 'Registering biometric credentials...' : 'Verifying your identity...')
              : message
            }
          </p>

          {error && (
            <div className="biometric-verification__error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {!isAvailable && browserInfo && (
            <div className="biometric-verification__compatibility">
              <h4>Browser Compatibility</h4>
              <p><strong>Browser:</strong> {browserInfo.browserInfo}</p>
              {browserInfo.recommendations.length > 0 && (
                <div>
                  <p><strong>Recommendations:</strong></p>
                  <ul>
                    {browserInfo.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="biometric-verification__actions">
          {needsRegistration ? (
            <>
              <button
                onClick={handleRegister}
                disabled={isVerifying || !isAvailable}
                className="biometric-verification__button biometric-verification__button--primary"
                type="button"
              >
                {isVerifying ? 'Registering...' : 'Register Biometrics'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isVerifying}
                className="biometric-verification__button biometric-verification__button--secondary"
                type="button"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleVerify}
                disabled={isVerifying || !isAvailable}
                className="biometric-verification__button biometric-verification__button--primary"
                type="button"
              >
                {isVerifying ? 'Verifying...' : 'Verify Identity'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isVerifying}
                className="biometric-verification__button biometric-verification__button--secondary"
                type="button"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BiometricVerification;