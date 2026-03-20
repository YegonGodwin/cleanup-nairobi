/**
 * Tests for API error handling utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  APIError,
  parseAPIError,
  apiRequest,
  withErrorHandling,
  ERROR_TYPES,
  ERROR_MESSAGES
} from '../apiErrorHandler';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock console methods
const consoleMock = {
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
};
global.console = { ...console, ...consoleMock };

describe('APIError', () => {
  it('should create an APIError with correct properties', () => {
    const error = new APIError('Test error', ERROR_TYPES.NETWORK, 500);
    
    expect(error.message).toBe('Test error');
    expect(error.type).toBe(ERROR_TYPES.NETWORK);
    expect(error.statusCode).toBe(500);
    expect(error.userMessage).toBe(ERROR_MESSAGES[ERROR_TYPES.NETWORK]);
    expect(error.timestamp).toBeDefined();
  });

  it('should determine if error is retryable', () => {
    const retryableError = new APIError('Network error', ERROR_TYPES.NETWORK);
    const nonRetryableError = new APIError('Auth error', ERROR_TYPES.AUTHENTICATION);
    
    expect(retryableError.isRetryable()).toBe(true);
    expect(nonRetryableError.isRetryable()).toBe(false);
  });

  it('should provide user-friendly messages', () => {
    const error = new APIError('Technical error', ERROR_TYPES.SERVER);
    
    expect(error.getUserMessage()).toBe(ERROR_MESSAGES[ERROR_TYPES.SERVER]);
  });

  it('should provide detailed log info', () => {
    const error = new APIError('Test error', ERROR_TYPES.VALIDATION, 400, null, { field: 'email' });
    const logInfo = error.getLogInfo();
    
    expect(logInfo).toHaveProperty('message', 'Test error');
    expect(logInfo).toHaveProperty('type', ERROR_TYPES.VALIDATION);
    expect(logInfo).toHaveProperty('statusCode', 400);
    expect(logInfo).toHaveProperty('context', { field: 'email' });
    expect(logInfo).toHaveProperty('timestamp');
  });
});

describe('parseAPIError', () => {
  it('should parse network errors correctly', () => {
    const networkError = new Error('Network error');
    networkError.name = 'TypeError';
    
    const apiError = parseAPIError(networkError);
    
    expect(apiError.type).toBe(ERROR_TYPES.NETWORK);
    expect(apiError.message).toBe('Network connection failed');
  });

  it('should parse timeout errors correctly', () => {
    const timeoutError = new Error('Timeout');
    timeoutError.name = 'AbortError';
    
    const apiError = parseAPIError(timeoutError);
    
    expect(apiError.type).toBe(ERROR_TYPES.TIMEOUT);
    expect(apiError.message).toBe('Request timed out');
  });

  it('should parse HTTP errors correctly', () => {
    const httpError = new Error('Validation failed');
    httpError.response = {
      status: 400,
      data: { message: 'Invalid input' }
    };
    
    const apiError = parseAPIError(httpError);
    
    expect(apiError.type).toBe(ERROR_TYPES.VALIDATION);
    expect(apiError.statusCode).toBe(400);
    expect(apiError.message).toBe('Invalid input');
  });

  it('should handle unknown errors', () => {
    const unknownError = new Error('Unknown error');
    
    const apiError = parseAPIError(unknownError);
    
    expect(apiError.type).toBe(ERROR_TYPES.UNKNOWN);
    expect(apiError.message).toBe('Unknown error');
  });
});

describe('apiRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should make successful requests', async () => {
    const mockResponse = { data: 'test' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await apiRequest('http://test.com', { method: 'GET' });
    
    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith('http://test.com', expect.objectContaining({
      method: 'GET',
      signal: expect.any(AbortSignal)
    }));
  });

  it('should handle HTTP errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ message: 'Resource not found' })
    });

    await expect(apiRequest('http://test.com')).rejects.toThrow(APIError);
  });

  it('should retry on retryable errors', async () => {
    // First call fails, second succeeds
    fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'success' })
      });

    const result = await apiRequest('http://test.com', { maxRetries: 1 });
    
    expect(result).toEqual({ data: 'success' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should handle timeout', async () => {
    vi.useFakeTimers();
    
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 35000))
    );

    const requestPromise = apiRequest('http://test.com', { timeout: 1000 });
    
    vi.advanceTimersByTime(1000);
    
    await expect(requestPromise).rejects.toThrow();
    
    vi.useRealTimers();
  });
});

describe('withErrorHandling', () => {
  it('should wrap API calls with error handling', async () => {
    const mockApiCall = vi.fn().mockResolvedValue({ data: 'success' });
    const wrappedCall = withErrorHandling(mockApiCall);
    
    const result = await wrappedCall('arg1', 'arg2');
    
    expect(result).toEqual({ data: 'success' });
    expect(mockApiCall).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should handle errors in wrapped calls', async () => {
    const mockApiCall = vi.fn().mockRejectedValue(new Error('API error'));
    const wrappedCall = withErrorHandling(mockApiCall);
    
    await expect(wrappedCall()).rejects.toThrow(APIError);
  });
});

describe('Error Messages', () => {
  it('should have user-friendly messages for all error types', () => {
    Object.values(ERROR_TYPES).forEach(errorType => {
      expect(ERROR_MESSAGES[errorType]).toBeDefined();
      expect(typeof ERROR_MESSAGES[errorType]).toBe('string');
      expect(ERROR_MESSAGES[errorType].length).toBeGreaterThan(0);
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete error flow', async () => {
    // Mock a failed API call
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    const mockApiCall = async () => {
      return apiRequest('http://test.com', { maxRetries: 0 });
    };
    
    const wrappedCall = withErrorHandling(mockApiCall, { showToast: false });
    
    await expect(wrappedCall()).rejects.toThrow(APIError);
    
    // Verify error was logged
    expect(consoleMock.error).toHaveBeenCalled();
  });
});