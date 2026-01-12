import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

// WebAuthn utility functions for biometric verification

/**
 * Check if WebAuthn is supported in the current browser
 * @returns {boolean} True if WebAuthn is supported
 */
export const isWebAuthnSupported = () => {
  return !!(navigator.credentials && navigator.credentials.create && navigator.credentials.get);
};

/**
 * Check if platform authenticator (Face ID, Windows Hello, etc.) is available
 * @returns {Promise<boolean>} True if platform authenticator is available
 */
export const isPlatformAuthenticatorAvailable = async () => {
  if (!isWebAuthnSupported()) {
    return false;
  }
  
  try {
    // eslint-disable-next-line no-undef
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error('Error checking platform authenticator availability:', error);
    return false;
  }
};

/**
 * Register a new WebAuthn credential for the current user
 * @param {string} apiBaseUrl - Base URL for API calls
 * @returns {Promise<{success: boolean, message: string, error?: string}>}
 */
export const registerWebAuthn = async (apiBaseUrl = '/api') => {
  try {
    // Check if WebAuthn is supported
    if (!isWebAuthnSupported()) {
      return {
        success: false,
        message: 'WebAuthn is not supported in this browser',
        error: 'WEBAUTHN_NOT_SUPPORTED'
      };
    }

    // Check if platform authenticator is available
    const platformAvailable = await isPlatformAuthenticatorAvailable();
    if (!platformAvailable) {
      return {
        success: false,
        message: 'Platform authenticator (Face ID, Windows Hello, etc.) is not available',
        error: 'PLATFORM_AUTHENTICATOR_NOT_AVAILABLE'
      };
    }

    // Get registration options from server
    const optionsResponse = await fetch(`${apiBaseUrl}/webauthn/register/options`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!optionsResponse.ok) {
      const errorData = await optionsResponse.json();
      return {
        success: false,
        message: errorData.error?.message || 'Failed to get registration options',
        error: errorData.error?.code || 'REGISTRATION_OPTIONS_ERROR'
      };
    }

    const options = await optionsResponse.json();

    // Start WebAuthn registration
    const registrationResponse = await startRegistration(options, {
      useAutoRegister: false // Disable auto-register for better Windows Hello compatibility
    });

    // Send registration response to server for verification
    const verificationResponse = await fetch(`${apiBaseUrl}/webauthn/register/verify`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationResponse)
    });

    if (!verificationResponse.ok) {
      const errorData = await verificationResponse.json();
      return {
        success: false,
        message: errorData.error?.message || 'Registration verification failed',
        error: errorData.error?.code || 'REGISTRATION_VERIFICATION_ERROR'
      };
    }

    const verificationResult = await verificationResponse.json();

    return {
      success: verificationResult.verified,
      message: verificationResult.message || 'WebAuthn credential registered successfully'
    };

  } catch (error) {
    console.error('WebAuthn registration error:', error);
    
    // Handle specific WebAuthn errors
    if (error.name === 'NotAllowedError') {
      return {
        success: false,
        message: 'Windows Hello registration was canceled, timed out, or not allowed. Please try again and:\n• Make sure Windows Hello is enabled in Windows Settings\n• Click "Yes" when Windows prompts appear\n• Complete the biometric scan when prompted\n• Try refreshing the page if the issue persists',
        error: 'NOT_ALLOWED_ERROR'
      };
    } else if (error.name === 'NotSupportedError') {
      return {
        success: false,
        message: 'WebAuthn is not supported on this device',
        error: 'WEBAUTHN_NOT_SUPPORTED'
      };
    } else if (error.name === 'SecurityError') {
      return {
        success: false,
        message: 'Security error: Please ensure you\'re using HTTPS or localhost',
        error: 'SECURITY_ERROR'
      };
    } else if (error.name === 'InvalidStateError') {
      return {
        success: false,
        message: 'A credential with this ID already exists. Please try authenticating instead.',
        error: 'CREDENTIAL_EXISTS'
      };
    } else if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'Registration was aborted. Please try again.',
        error: 'ABORTED'
      };
    }

    return {
      success: false,
      message: 'An unexpected error occurred during registration',
      error: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Authenticate using WebAuthn for biometric verification
 * @param {string} apiBaseUrl - Base URL for API calls
 * @returns {Promise<{success: boolean, message: string, error?: string}>}
 */
export const authenticateWebAuthn = async (apiBaseUrl = '/api') => {
  try {
    // Check if WebAuthn is supported
    if (!isWebAuthnSupported()) {
      return {
        success: false,
        message: 'WebAuthn is not supported in this browser',
        error: 'WEBAUTHN_NOT_SUPPORTED'
      };
    }

    // Get authentication options from server
    const optionsResponse = await fetch(`${apiBaseUrl}/webauthn/authenticate/options`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!optionsResponse.ok) {
      const errorData = await optionsResponse.json();
      return {
        success: false,
        message: errorData.error?.message || 'Failed to get authentication options',
        error: errorData.error?.code || 'AUTHENTICATION_OPTIONS_ERROR'
      };
    }

    const options = await optionsResponse.json();

    // Start WebAuthn authentication
    const authenticationResponse = await startAuthentication(options, {
      useAutoRegister: false // Disable auto-register for better Windows Hello compatibility
    });

    // Send authentication response to server for verification
    const verificationResponse = await fetch(`${apiBaseUrl}/webauthn/authenticate/verify`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(authenticationResponse)
    });

    if (!verificationResponse.ok) {
      const errorData = await verificationResponse.json();
      return {
        success: false,
        message: errorData.error?.message || 'Authentication verification failed',
        error: errorData.error?.code || 'AUTHENTICATION_VERIFICATION_ERROR'
      };
    }

    const verificationResult = await verificationResponse.json();

    return {
      success: verificationResult.verified,
      message: verificationResult.message || 'WebAuthn authentication successful'
    };

  } catch (error) {
    console.error('WebAuthn authentication error:', error);
    
    // Handle specific WebAuthn errors
    if (error.name === 'NotAllowedError') {
      return {
        success: false,
        message: 'Windows Hello authentication was cancelled, timed out, or not allowed. Please try again and complete the biometric verification when prompted.',
        error: 'AUTHENTICATION_CANCELLED'
      };
    } else if (error.name === 'NotSupportedError') {
      return {
        success: false,
        message: 'WebAuthn is not supported on this device',
        error: 'WEBAUTHN_NOT_SUPPORTED'
      };
    } else if (error.name === 'SecurityError') {
      return {
        success: false,
        message: 'Security error during authentication',
        error: 'SECURITY_ERROR'
      };
    } else if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'Authentication was aborted. Please try again.',
        error: 'ABORTED'
      };
    }

    return {
      success: false,
      message: 'An unexpected error occurred during authentication',
      error: 'UNKNOWN_ERROR'
    };
  }
};

/**
 * Check if user has registered WebAuthn credentials
 * @param {string} apiBaseUrl - Base URL for API calls
 * @returns {Promise<boolean>} True if user has registered credentials
 */
export const hasWebAuthnCredentials = async (apiBaseUrl = '/api') => {
  try {
    const response = await fetch(`${apiBaseUrl}/webauthn/register/options`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // If we get options successfully, user can register (may or may not have existing credentials)
    // If we get an error about existing credentials, user has credentials
    // This is a simple check - in production you might want a dedicated endpoint
    return response.ok;
  } catch (error) {
    console.error('Error checking WebAuthn credentials:', error);
    return false;
  }
};

/**
 * Perform biometric verification for voting
 * This is a convenience function that combines authentication with vote preparation
 * @param {string} apiBaseUrl - Base URL for API calls
 * @returns {Promise<{success: boolean, message: string, verificationToken?: string, error?: string}>}
 */
export const verifyBiometricForVoting = async (apiBaseUrl = '/api') => {
  try {
    // First check if user has credentials
    const platformAvailable = await isPlatformAuthenticatorAvailable();
    if (!platformAvailable) {
      return {
        success: false,
        message: 'Biometric authentication is not available on this device',
        error: 'BIOMETRIC_NOT_AVAILABLE'
      };
    }

    // Perform WebAuthn authentication
    const authResult = await authenticateWebAuthn(apiBaseUrl);
    
    if (!authResult.success) {
      return authResult;
    }

    // In a real implementation, the server would return a temporary verification token
    // For now, we'll return a success indicator
    return {
      success: true,
      message: 'Biometric verification successful',
      verificationToken: 'verified' // This would be a real token in production
    };

  } catch (error) {
    console.error('Biometric verification error:', error);
    return {
      success: false,
      message: 'Failed to verify biometric authentication',
      error: 'VERIFICATION_ERROR'
    };
  }
};

/**
 * Handle browser compatibility and provide fallback information
 * @returns {Object} Compatibility information and fallback options
 */
export const getBrowserCompatibility = () => {
  const isSupported = isWebAuthnSupported();
  const userAgent = navigator.userAgent;
  
  let browserInfo = 'Unknown browser';
  let recommendations = [];

  if (userAgent.includes('Chrome')) {
    browserInfo = 'Google Chrome';
    if (!isSupported) {
      recommendations.push('Update to Chrome 67 or later for WebAuthn support');
    }
  } else if (userAgent.includes('Firefox')) {
    browserInfo = 'Mozilla Firefox';
    if (!isSupported) {
      recommendations.push('Update to Firefox 60 or later for WebAuthn support');
    }
  } else if (userAgent.includes('Safari')) {
    browserInfo = 'Safari';
    if (!isSupported) {
      recommendations.push('Update to Safari 14 or later for WebAuthn support');
    }
  } else if (userAgent.includes('Edge')) {
    browserInfo = 'Microsoft Edge';
    if (!isSupported) {
      recommendations.push('Update to Edge 18 or later for WebAuthn support');
    }
  }

  if (!isSupported) {
    recommendations.push('Consider using a modern browser that supports WebAuthn');
    recommendations.push('Ensure your device has biometric capabilities (Face ID, Windows Hello, etc.)');
  }

  return {
    isSupported,
    browserInfo,
    recommendations,
    fallbackOptions: isSupported ? [] : [
      'Use a different device with biometric capabilities',
      'Contact system administrator for alternative authentication methods'
    ]
  };
};