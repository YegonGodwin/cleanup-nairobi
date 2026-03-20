/**
 * Comprehensive API error handling utilities
 * Provides consistent error handling across all API calls with retry mechanisms,
 * user-friendly error messages, and proper logging for debugging and monitoring.
 */

// Error types for categorization
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// HTTP status code to error type mapping
const STATUS_CODE_MAP = {
  400: ERROR_TYPES.VALIDATION,
  401: ERROR_TYPES.AUTHENTICATION,
  403: ERROR_TYPES.AUTHORIZATION,
  404: ERROR_TYPES.NOT_FOUND,
  408: ERROR_TYPES.TIMEOUT,
  429: ERROR_TYPES.SERVER, // Rate limiting
  500: ERROR_TYPES.SERVER,
  502: ERROR_TYPES.NETWORK,
  503: ERROR_TYPES.SERVER,
  504: ERROR_TYPES.TIMEOUT
};

// User-friendly error messages
const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Network connection failed. Please check your internet connection and try again.',
  [ERROR_TYPES.AUTHENTICATION]: 'Your session has expired. Please log in again.',
  [ERROR_TYPES.AUTHORIZATION]: 'You do not have permission to perform this action.',
  [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
  [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_TYPES.SERVER]: 'Server error occurred. Please try again later.',
  [ERROR_TYPES.TIMEOUT]: 'Request timed out. Please try again.',
  [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // Base delay in milliseconds
  retryableErrors: [ERROR_TYPES.NETWORK, ERROR_TYPES.TIMEOUT, ERROR_TYPES.SERVER],
  exponentialBackoff: true
};

/**
 * Enhanced error class with additional context
 */
export class APIError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, statusCode = null, originalError = null, context = {}) {
    super(message);
    this.name = 'APIError';
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.userMessage = ERROR_MESSAGES[type] || message;
  }

  // Check if error is retryable
  isRetryable() {
    return RETRY_CONFIG.retryableErrors.includes(this.type);
  }

  // Get user-friendly message
  getUserMessage() {
    return this.userMessage;
  }

  // Get detailed error info for logging
  getLogInfo() {
    return {
      message: this.message,
      type: this.type,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
      originalError: this.originalError?.message
    };
  }
}

/**
 * Parse and categorize errors from API responses
 */
export const parseAPIError = (error, context = {}) => {
  // Network errors (fetch failures)
  if (!error.response && (error.code === 'NETWORK_ERROR' || error.name === 'TypeError')) {
    return new APIError(
      'Network connection failed',
      ERROR_TYPES.NETWORK,
      null,
      error,
      context
    );
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.code === 'TIMEOUT') {
    return new APIError(
      'Request timed out',
      ERROR_TYPES.TIMEOUT,
      null,
      error,
      context
    );
  }

  // HTTP errors with response
  if (error.response) {
    const statusCode = error.response.status;
    const errorType = STATUS_CODE_MAP[statusCode] || ERROR_TYPES.UNKNOWN;
    
    let message = error.message;
    
    // Try to extract message from response body
    if (error.response.data) {
      if (typeof error.response.data === 'string') {
        message = error.response.data;
      } else if (error.response.data.message) {
        message = error.response.data.message;
        
        // For validation errors, include field-specific errors
        if (errorType === ERROR_TYPES.VALIDATION && error.response.data.errors) {
          const fieldErrors = error.response.data.errors
            .map(err => `${err.field}: ${err.message}`)
            .join(', ');
          message = `${message}. ${fieldErrors}`;
        }
      } else if (error.response.data.error) {
        message = error.response.data.error;
      }
    }

    return new APIError(
      message,
      errorType,
      statusCode,
      error,
      { ...context, responseData: error.response.data }
    );
  }

  // Generic errors
  return new APIError(
    error.message || 'An unexpected error occurred',
    ERROR_TYPES.UNKNOWN,
    null,
    error,
    context
  );
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate retry delay with exponential backoff
 */
const getRetryDelay = (attempt, baseDelay = RETRY_CONFIG.retryDelay) => {
  if (!RETRY_CONFIG.exponentialBackoff) {
    return baseDelay;
  }
  return baseDelay * Math.pow(2, attempt - 1);
};

/**
 * Enhanced fetch wrapper with retry logic and comprehensive error handling
 */
export const apiRequest = async (url, options = {}, context = {}) => {
  const {
    maxRetries = RETRY_CONFIG.maxRetries,
    timeout = 30000, // 30 seconds default timeout
    onRetry = null,
    ...fetchOptions
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Make the request
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        error.response = {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        };
        throw error;
      }

      // Success - return response data
      const data = await response.json();
      return data;

    } catch (error) {
      const apiError = parseAPIError(error, { ...context, attempt, url });
      lastError = apiError;

      // Log error for monitoring
      logError(apiError);

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt > maxRetries || !apiError.isRetryable()) {
        throw apiError;
      }

      // Calculate delay and wait before retry
      const delay = getRetryDelay(attempt);
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(apiError, attempt, delay);
      }

      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Error logging utility
 */
export const logError = (error, additionalContext = {}) => {
  const logData = {
    ...error.getLogInfo(),
    ...additionalContext,
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('API Error:', logData);
  }

  // In production, you would send this to your logging service
  // Example: sendToLoggingService(logData);
};

/**
 * Create a toast notification for user feedback
 */
export const showErrorToast = (error, options = {}) => {
  const {
    duration = 5000,
    showRetry = false,
    onRetry = null
  } = options;

  // Import toast dynamically to avoid circular dependencies
  import('../components/ui/Toast').then(({ default: toast }) => {
    const toastOptions = {
      duration,
      showRetry,
      onRetry,
      description: error.type === ERROR_TYPES.NETWORK 
        ? 'Check your internet connection and try again.'
        : undefined
    };

    toast.error(error.getUserMessage(), toastOptions);
  }).catch(() => {
    // Fallback to console if toast import fails
    console.error('Toast Error:', error.getUserMessage());
  });

  // Log to console in development
  if (import.meta.env.DEV) {
    console.warn('API Error:', error.getLogInfo());
  }
};

/**
 * Higher-order function to wrap API calls with error handling
 */
export const withErrorHandling = (apiCall, options = {}) => {
  return async (...args) => {
    try {
      return await apiCall(...args);
    } catch (error) {
      const apiError = error instanceof APIError ? error : parseAPIError(error, options.context);
      
      // Show user feedback if enabled
      if (options.showToast !== false) {
        showErrorToast(apiError, options.toastOptions);
      }

      // Re-throw for component handling
      throw apiError;
    }
  };
};

/**
 * Utility to check if user is authenticated based on error
 */
export const isAuthenticationError = (error) => {
  return error instanceof APIError && error.type === ERROR_TYPES.AUTHENTICATION;
};

/**
 * Utility to handle authentication errors globally
 */
export const handleAuthenticationError = (error) => {
  if (isAuthenticationError(error)) {
    // Clear stored auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = '/login';
  }
};

/**
 * Create a retry function for failed requests
 */
export const createRetryFunction = (originalFunction, ...args) => {
  return () => originalFunction(...args);
};

export default {
  APIError,
  parseAPIError,
  apiRequest,
  withErrorHandling,
  logError,
  showErrorToast,
  isAuthenticationError,
  handleAuthenticationError,
  createRetryFunction,
  ERROR_TYPES,
  ERROR_MESSAGES
};