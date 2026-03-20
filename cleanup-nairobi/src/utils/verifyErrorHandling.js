/**
 * Simple verification script for error handling functionality
 * Run this in the browser console to test error handling
 */

import { APIError, parseAPIError, apiRequest, ERROR_TYPES } from './apiErrorHandler.js';

export const verifyErrorHandling = () => {
  console.log('🧪 Testing API Error Handling System...\n');

  // Test 1: APIError creation
  console.log('1. Testing APIError creation...');
  try {
    const error = new APIError('Test error', ERROR_TYPES.NETWORK, 500);
    console.log('✅ APIError created successfully');
    console.log('   - Message:', error.message);
    console.log('   - Type:', error.type);
    console.log('   - User Message:', error.getUserMessage());
    console.log('   - Is Retryable:', error.isRetryable());
  } catch (e) {
    console.error('❌ APIError creation failed:', e);
  }

  // Test 2: Error parsing
  console.log('\n2. Testing error parsing...');
  try {
    const networkError = new Error('Network failed');
    networkError.name = 'TypeError';
    
    const parsedError = parseAPIError(networkError);
    console.log('✅ Network error parsed successfully');
    console.log('   - Type:', parsedError.type);
    console.log('   - Message:', parsedError.message);
    
    const httpError = new Error('HTTP error');
    httpError.response = { status: 404, data: { message: 'Not found' } };
    
    const parsedHttpError = parseAPIError(httpError);
    console.log('✅ HTTP error parsed successfully');
    console.log('   - Type:', parsedHttpError.type);
    console.log('   - Status Code:', parsedHttpError.statusCode);
  } catch (e) {
    console.error('❌ Error parsing failed:', e);
  }

  // Test 3: API request with mock
  console.log('\n3. Testing API request...');
  
  // Mock a successful request
  const originalFetch = window.fetch;
  window.fetch = async (url, options) => {
    if (url.includes('success')) {
      return {
        ok: true,
        json: async () => ({ data: 'success' })
      };
    } else if (url.includes('error')) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad request' })
      };
    } else {
      throw new Error('Network error');
    }
  };

  // Test successful request
  apiRequest('http://test.com/success')
    .then(result => {
      console.log('✅ Successful API request');
      console.log('   - Result:', result);
    })
    .catch(error => {
      console.error('❌ Successful request failed:', error);
    });

  // Test error request
  apiRequest('http://test.com/error')
    .then(result => {
      console.error('❌ Error request should have failed');
    })
    .catch(error => {
      console.log('✅ Error request handled correctly');
      console.log('   - Error type:', error.type);
      console.log('   - User message:', error.getUserMessage());
    });

  // Test network error
  apiRequest('http://test.com/network-fail', { maxRetries: 0 })
    .then(result => {
      console.error('❌ Network error request should have failed');
    })
    .catch(error => {
      console.log('✅ Network error handled correctly');
      console.log('   - Error type:', error.type);
      console.log('   - Is retryable:', error.isRetryable());
    });

  // Restore original fetch
  setTimeout(() => {
    window.fetch = originalFetch;
  }, 1000);

  // Test 4: Error types coverage
  console.log('\n4. Testing error types coverage...');
  const errorTypes = Object.values(ERROR_TYPES);
  console.log('✅ Error types defined:', errorTypes.length);
  errorTypes.forEach(type => {
    console.log(`   - ${type}`);
  });

  console.log('\n🎉 Error handling verification complete!');
  console.log('Check the console for any ❌ failures that need attention.');
};

// Auto-run if in development
if (import.meta.env.DEV) {
  console.log('Error handling verification available. Run verifyErrorHandling() to test.');
}

export default verifyErrorHandling;