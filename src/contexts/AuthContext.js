import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount and handle OAuth callback
  useEffect(() => {
    handleOAuthCallback();
    
    // Listen for logout events from API service
    const handleLogoutEvent = (event) => {
      console.log('🚪 Logout event received:', event.detail);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    };
    
    window.addEventListener('auth:logout', handleLogoutEvent);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, []);

  const handleOAuthCallback = async () => {
    // Check if this is an OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const loginStatus = urlParams.get('login');
    const tokenFromUrl = urlParams.get('token');
    
    if (loginStatus === 'success') {
      console.log('🔄 OAuth callback detected, checking authentication status...');
      
      // Clear the URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // If we have a token in URL, store it and use it
      if (tokenFromUrl) {
        console.log('🎯 Token received from OAuth callback, storing locally');
        localStorage.setItem('accessToken', tokenFromUrl);
      }
      
      // Check authentication status after OAuth callback
      await checkAuthStatus();
    } else {
      // Regular authentication check
      await checkAuthStatus();
    }
  };

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      console.log('🔍 Checking authentication status...');
      console.log('API URL:', process.env.REACT_APP_API_URL);
      console.log('Current URL:', window.location.href);
      
      const response = await api.get('/auth/me');
      dispatch({ 
        type: AUTH_ACTIONS.LOGIN_SUCCESS, 
        payload: response.data.user 
      });
      console.log('✅ Authentication successful:', response.data.user);
    } catch (error) {
      console.log('❌ Authentication failed:', error.response?.data || error.message);
      console.log('Error status:', error.response?.status);
      console.log('Error headers:', error.response?.headers);
      dispatch({ 
        type: AUTH_ACTIONS.LOGIN_FAILURE, 
        payload: null 
      });
    }
  };

  const login = () => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    // Build OAuth URL carefully to avoid double slashes
    const baseUrl = process.env.REACT_APP_API_URL || '/api';
    
    // Get current URL to pass as redirect parameter
    const currentUrl = window.location.origin; // e.g., https://www.yodeco.duckdns.org
    const oauthUrl = `${baseUrl.replace(/\/$/, '')}/auth/google?redirect_origin=${encodeURIComponent(currentUrl)}`; // Remove trailing slash if exists
    
    console.log('🔍 Frontend OAuth Debug:');
    console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    console.log('Base URL (cleaned):', baseUrl.replace(/\/$/, ''));
    console.log('Current URL origin:', currentUrl);
    console.log('Final OAuth URL:', oauthUrl);
    
    // Redirect to Google OAuth endpoint
    window.location.href = oauthUrl;
  };

  const logout = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      await api.post('/auth/logout');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    logout,
    clearError,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;