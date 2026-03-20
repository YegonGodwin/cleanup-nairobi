import { useState, useCallback, useRef } from 'react';
import { APIError, createRetryFunction, showErrorToast } from '../utils/apiErrorHandler';

/**
 * Custom hook for managing API call states with comprehensive error handling
 * Provides loading states, error handling, retry mechanisms, and user feedback
 */
export const useApiState = (options = {}) => {
  const {
    showToast = true,
    retryable = true,
    onError = null,
    onSuccess = null,
    initialData = null
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Keep track of the last API call for retry functionality
  const lastApiCall = useRef(null);
  const lastApiArgs = useRef(null);

  // Execute API call with error handling
  const execute = useCallback(async (apiCall, ...args) => {
    // Store for retry functionality
    lastApiCall.current = apiCall;
    lastApiArgs.current = args;

    setLoading(true);
    setError(null);

    try {
      const result = await apiCall(...args);
      setData(result);
      setError(null);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const apiError = err instanceof APIError ? err : new APIError(err.message);
      setError(apiError);
      setData(null);

      // Show toast notification if enabled
      if (showToast) {
        const toastOptions = {
          showRetry: retryable && apiError.isRetryable(),
          onRetry: retryable ? () => retry() : null
        };
        showErrorToast(apiError, toastOptions);
      }

      // Call error callback if provided
      if (onError) {
        onError(apiError);
      }

      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [showToast, retryable, onError, onSuccess]);

  // Retry the last API call
  const retry = useCallback(async () => {
    if (!lastApiCall.current) {
      throw new Error('No API call to retry');
    }

    setRetryCount(prev => prev + 1);
    return execute(lastApiCall.current, ...lastApiArgs.current);
  }, [execute]);

  // Reset state
  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
    setRetryCount(0);
    lastApiCall.current = null;
    lastApiArgs.current = null;
  }, [initialData]);

  // Check if retry is available
  const canRetry = Boolean(lastApiCall.current && error?.isRetryable());

  return {
    data,
    loading,
    error,
    retryCount,
    execute,
    retry,
    reset,
    canRetry,
    // Convenience methods
    isError: Boolean(error),
    isSuccess: Boolean(data && !error),
    isEmpty: !data && !loading && !error
  };
};

/**
 * Hook for managing multiple API states (useful for forms with multiple endpoints)
 */
export const useMultipleApiStates = (stateConfigs = {}) => {
  const states = {};
  
  Object.keys(stateConfigs).forEach(key => {
    states[key] = useApiState(stateConfigs[key]);
  });

  // Global loading state
  const isAnyLoading = Object.values(states).some(state => state.loading);
  
  // Global error state
  const hasAnyError = Object.values(states).some(state => state.error);
  
  // Reset all states
  const resetAll = useCallback(() => {
    Object.values(states).forEach(state => state.reset());
  }, [states]);

  return {
    states,
    isAnyLoading,
    hasAnyError,
    resetAll
  };
};

/**
 * Hook specifically for form submissions with validation and error handling
 */
export const useFormSubmission = (options = {}) => {
  const {
    onSuccess = null,
    onError = null,
    resetOnSuccess = false,
    showSuccessToast = true,
    successMessage = 'Operation completed successfully'
  } = options;

  const apiState = useApiState({
    showToast: true,
    retryable: true,
    onSuccess: (result) => {
      if (showSuccessToast) {
        import('../components/ui/Toast').then(({ default: toast }) => {
          toast.success(successMessage);
        });
      }
      
      if (resetOnSuccess) {
        apiState.reset();
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
    },
    onError
  });

  // Submit form with validation
  const submit = useCallback(async (apiCall, formData, validationFn = null) => {
    // Run validation if provided
    if (validationFn) {
      const validationError = validationFn(formData);
      if (validationError) {
        const error = new APIError(validationError, 'VALIDATION_ERROR');
        apiState.setError(error);
        throw error;
      }
    }

    return apiState.execute(apiCall, formData);
  }, [apiState]);

  return {
    ...apiState,
    submit
  };
};

/**
 * Hook for paginated data with error handling
 */
export const usePaginatedApi = (apiCall, options = {}) => {
  const {
    pageSize = 10,
    initialPage = 1,
    ...apiOptions
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const apiState = useApiState({
    ...apiOptions,
    onSuccess: (result) => {
      if (result.pagination) {
        setTotalPages(result.pagination.totalPages || 0);
        setTotalItems(result.pagination.totalItems || 0);
      }
      
      if (apiOptions.onSuccess) {
        apiOptions.onSuccess(result);
      }
    }
  });

  // Load page
  const loadPage = useCallback(async (page = currentPage) => {
    const params = {
      page,
      limit: pageSize
    };
    
    const result = await apiState.execute(apiCall, params);
    setCurrentPage(page);
    return result;
  }, [apiCall, currentPage, pageSize, apiState]);

  // Navigation methods
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      return loadPage(currentPage + 1);
    }
  }, [currentPage, totalPages, loadPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      return loadPage(currentPage - 1);
    }
  }, [currentPage, loadPage]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      return loadPage(page);
    }
  }, [totalPages, loadPage]);

  // Initial load
  const refresh = useCallback(() => {
    return loadPage(currentPage);
  }, [loadPage, currentPage]);

  return {
    ...apiState,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    loadPage,
    nextPage,
    prevPage,
    goToPage,
    refresh,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

export default useApiState;