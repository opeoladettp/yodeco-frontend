import axios from 'axios';
import { verifyBiometricForVoting } from '../utils/webauthn';

// Error types for better error handling
export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  CLIENT_ERROR: 'CLIENT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BIOMETRIC_ERROR: 'BIOMETRIC_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};

// Enhanced error class for API errors
export class APIError extends Error {
  constructor(message, type, statusCode, code, details = {}, retryable = false) {
    super(message);
    this.name = 'APIError';
    this.type = type;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.retryable = retryable;
    this.timestamp = new Date().toISOString();
  }

  static fromResponse(error) {
    if (!error.response) {
      // Network error
      return new APIError(
        'Network connection failed',
        ERROR_TYPES.NETWORK_ERROR,
        0,
        'NETWORK_ERROR',
        { originalError: error.message },
        true
      );
    }

    const { status, data } = error.response;
    const errorData = data?.error || {};

    let type = ERROR_TYPES.SERVER_ERROR;
    if (status >= 400 && status < 500) {
      type = ERROR_TYPES.CLIENT_ERROR;
      if (status === 401) type = ERROR_TYPES.AUTHENTICATION_ERROR;
      if (status === 403) type = ERROR_TYPES.AUTHORIZATION_ERROR;
      if (status === 400) type = ERROR_TYPES.VALIDATION_ERROR;
      if (status === 428) type = ERROR_TYPES.BIOMETRIC_ERROR;
      if (status === 429) type = ERROR_TYPES.RATE_LIMIT_ERROR;
    } else if (status >= 500) {
      type = ERROR_TYPES.SERVER_ERROR;
      if (status === 503) type = ERROR_TYPES.SERVICE_UNAVAILABLE;
    }

    return new APIError(
      errorData.message || `Request failed with status ${status}`,
      type,
      status,
      errorData.code || 'UNKNOWN_ERROR',
      {
        ...errorData.details,
        errorId: errorData.errorId,
        userAction: errorData.userAction,
        fallbackInfo: errorData.fallbackInfo
      },
      errorData.retryable || false
    );
  }
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // Base delay in ms
  retryableErrors: [
    ERROR_TYPES.NETWORK_ERROR,
    ERROR_TYPES.TIMEOUT_ERROR,
    ERROR_TYPES.SERVICE_UNAVAILABLE,
    ERROR_TYPES.RATE_LIMIT_ERROR
  ]
};

// Create axios instance with default configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://your-ec2-domain.com/api' : '/api'),
  timeout: 30000, // Increased timeout for better reliability
  withCredentials: true, // Include cookies for authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // REMOVED: X-Request-ID header to avoid CORS preflight issues with Railway proxy
    // config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add Authorization header if token exists in localStorage (fallback for cross-subdomain issues)
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Adding Authorization header from localStorage');
    }
    
    // Add timestamp
    config.metadata = { startTime: Date.now() };
    
    return config;
  },
  (error) => {
    return Promise.reject(APIError.fromResponse(error));
  }
);

// Track if we're currently refreshing to avoid multiple refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor with enhanced error handling and token refresh
api.interceptors.response.use(
  (response) => {
    // Log successful requests in development
    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const apiError = APIError.fromResponse(error);
    
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      const duration = error.config?.metadata ? Date.now() - error.config.metadata.startTime : 0;
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${apiError.statusCode} (${duration}ms)`, apiError);
    }

    // Handle token expiration and refresh
    if (apiError.statusCode === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      if (isRefreshing) {
        // If already refreshing, queue this request
        console.log('⏳ Token refresh in progress, queuing request...');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Access token expired, attempting to refresh...');
        
        // Try to refresh the token using axios directly (not the api instance)
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const { accessToken, user } = refreshResponse.data;
        
        if (accessToken) {
          // Store new access token
          localStorage.setItem('accessToken', accessToken);
          console.log('✅ Token refreshed successfully');
          console.log('👤 User:', user?.name || 'Unknown');
          
          // Update the authorization header
          api.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
          originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;
          
          // Process queued requests
          processQueue(null, accessToken);
          
          // Retry the original request
          return api(originalRequest);
        } else {
          throw new Error('No access token in refresh response');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError.response?.data || refreshError.message);
        processQueue(refreshError, null);
        
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        
        // Dispatch logout event for AuthContext to handle
        window.dispatchEvent(new CustomEvent('auth:logout', { 
          detail: { reason: 'TOKEN_REFRESH_FAILED' } 
        }));
        
        return Promise.reject(apiError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle specific error scenarios
    await handleSpecificErrors(apiError, error.config);
    
    return Promise.reject(apiError);
  }
);

// Handle specific error scenarios
const handleSpecificErrors = async (apiError, config) => {
  switch (apiError.type) {
    case ERROR_TYPES.AUTHENTICATION_ERROR:
      console.warn('Authentication failed - user may need to sign in again');
      // Could dispatch logout action or show login modal
      break;
      
    case ERROR_TYPES.AUTHORIZATION_ERROR:
      console.warn('Access denied - insufficient permissions');
      // Could show permission denied message
      break;
      
    case ERROR_TYPES.BIOMETRIC_ERROR:
      console.warn('Biometric verification required or failed');
      // Could trigger biometric verification flow
      break;
      
    case ERROR_TYPES.RATE_LIMIT_ERROR:
      console.warn(`Rate limit exceeded. Retry after: ${apiError.details.retryAfter || 60}s`);
      break;
      
    case ERROR_TYPES.SERVICE_UNAVAILABLE:
      console.warn('Service temporarily unavailable');
      break;
      
    default:
      break;
  }
};

// Retry mechanism for failed requests
const retryRequest = async (requestFn, config = RETRY_CONFIG) => {
  let lastError;
  
  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if error is not retryable
      if (!error.retryable || !config.retryableErrors.includes(error.type)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt > config.maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = config.retryDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.1 * delay; // Add jitter to prevent thundering herd
      const totalDelay = delay + jitter;
      
      console.log(`Retrying request in ${Math.round(totalDelay)}ms (attempt ${attempt}/${config.maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw lastError;
};

/**
 * Enhanced API wrapper for vote submission with biometric verification
 * @param {Object} voteData - Vote data (awardId, nomineeId)
 * @returns {Promise} API response
 */
export const submitVoteWithBiometric = async (voteData) => {
  try {
    // First, perform biometric verification
    const biometricResult = await verifyBiometricForVoting();
    
    if (!biometricResult.success) {
      throw new APIError(
        biometricResult.message || 'Biometric verification failed',
        ERROR_TYPES.BIOMETRIC_ERROR,
        403,
        'BIOMETRIC_VERIFICATION_FAILED',
        { biometricResult },
        true
      );
    }

    // Submit vote with biometric verification header and retry logic
    const response = await retryRequest(async () => {
      // Generate unique idempotency key for this vote attempt
      const idempotencyKey = `vote_biometric_${voteData.awardId}_${voteData.nomineeId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return await api.post('/votes', voteData, {
        headers: {
          'Biometric-Verified': 'true', // Changed from X-Biometric-Verified to avoid CORS preflight
          'Idempotency-Key': idempotencyKey
        }
      });
    });

    return response;
  } catch (error) {
    console.error('Vote submission with biometric verification failed:', error);
    throw error;
  }
};

/**
 * Check if biometric verification is required for voting
 * @returns {Promise<boolean>} True if biometric verification is required
 */
export const isBiometricVerificationRequired = async () => {
  try {
    // Make a test request to see if biometric verification is required
    await api.get('/votes/my-history');
    return false; // If successful, no biometric verification required
  } catch (error) {
    if (error.type === ERROR_TYPES.BIOMETRIC_ERROR && 
        error.code === 'BIOMETRIC_REGISTRATION_REQUIRED') {
      return true;
    }
    return false;
  }
};

/**
 * Generic API request wrapper with error handling and retry logic
 * @param {Function} requestFn - Function that makes the API request
 * @param {Object} options - Options for retry and error handling
 * @returns {Promise} API response
 */
export const apiRequest = async (requestFn, options = {}) => {
  const config = { ...RETRY_CONFIG, ...options };
  
  try {
    if (config.retry !== false) {
      return await retryRequest(requestFn, config);
    } else {
      return await requestFn();
    }
  } catch (error) {
    // Add additional context if needed
    if (options.context) {
      error.context = options.context;
    }
    
    throw error;
  }
};

/**
 * Get user-friendly error message from API error
 * @param {APIError} error - API error object
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (!(error instanceof APIError)) {
    return 'An unexpected error occurred. Please try again.';
  }

  // Return user action if available
  if (error.details.userAction) {
    return error.details.userAction;
  }

  // Return custom messages based on error type
  switch (error.type) {
    case ERROR_TYPES.NETWORK_ERROR:
      return 'Network connection failed. Please check your internet connection and try again.';
    
    case ERROR_TYPES.TIMEOUT_ERROR:
      return 'Request timed out. Please try again.';
    
    case ERROR_TYPES.AUTHENTICATION_ERROR:
      return 'Please sign in to continue.';
    
    case ERROR_TYPES.AUTHORIZATION_ERROR:
      return 'You do not have permission to perform this action.';
    
    case ERROR_TYPES.VALIDATION_ERROR:
      return 'Please check your input and try again.';
    
    case ERROR_TYPES.BIOMETRIC_ERROR:
      return 'Biometric verification is required. Please complete verification to continue.';
    
    case ERROR_TYPES.RATE_LIMIT_ERROR:
      return `Too many requests. Please wait ${error.details.retryAfter || 60} seconds before trying again.`;
    
    case ERROR_TYPES.SERVICE_UNAVAILABLE:
      return 'Service is temporarily unavailable. Please try again in a few moments.';
    
    default:
      return error.message || 'An error occurred. Please try again.';
  }
};

/**
 * Check if an error is retryable
 * @param {APIError} error - API error object
 * @returns {boolean} True if error is retryable
 */
export const isRetryableError = (error) => {
  return error instanceof APIError && error.retryable;
};

export default api;