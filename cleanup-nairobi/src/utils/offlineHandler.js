/**
 * Offline handling utilities for better user experience
 * Provides offline detection, queue management, and sync capabilities
 */

// Queue for storing failed requests when offline
let offlineQueue = [];
let isOnline = navigator.onLine;
let onlineListeners = [];
let offlineListeners = [];

// Add event listeners for online/offline status
window.addEventListener('online', () => {
  isOnline = true;
  onlineListeners.forEach(listener => listener());
  processOfflineQueue();
});

window.addEventListener('offline', () => {
  isOnline = false;
  offlineListeners.forEach(listener => listener());
});

/**
 * Check if the browser is currently online
 */
export const getOnlineStatus = () => isOnline;

/**
 * Add listener for online status changes
 */
export const addOnlineListener = (listener) => {
  onlineListeners.push(listener);
  return () => {
    onlineListeners = onlineListeners.filter(l => l !== listener);
  };
};

/**
 * Add listener for offline status changes
 */
export const addOfflineListener = (listener) => {
  offlineListeners.push(listener);
  return () => {
    offlineListeners = offlineListeners.filter(l => l !== listener);
  };
};

/**
 * Add a failed request to the offline queue
 */
export const addToOfflineQueue = (request) => {
  const queueItem = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    ...request
  };
  
  offlineQueue.push(queueItem);
  
  // Limit queue size to prevent memory issues
  if (offlineQueue.length > 50) {
    offlineQueue = offlineQueue.slice(-50);
  }
  
  // Store in localStorage for persistence
  try {
    localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
  } catch (error) {
    console.warn('Failed to store offline queue:', error);
  }
  
  return queueItem.id;
};

/**
 * Remove item from offline queue
 */
export const removeFromOfflineQueue = (id) => {
  offlineQueue = offlineQueue.filter(item => item.id !== id);
  
  try {
    localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
  } catch (error) {
    console.warn('Failed to update offline queue:', error);
  }
};

/**
 * Get current offline queue
 */
export const getOfflineQueue = () => [...offlineQueue];

/**
 * Clear offline queue
 */
export const clearOfflineQueue = () => {
  offlineQueue = [];
  try {
    localStorage.removeItem('offlineQueue');
  } catch (error) {
    console.warn('Failed to clear offline queue:', error);
  }
};

/**
 * Load offline queue from localStorage on app start
 */
export const loadOfflineQueue = () => {
  try {
    const stored = localStorage.getItem('offlineQueue');
    if (stored) {
      offlineQueue = JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load offline queue:', error);
    offlineQueue = [];
  }
};

/**
 * Process offline queue when coming back online
 */
export const processOfflineQueue = async () => {
  if (!isOnline || offlineQueue.length === 0) {
    return;
  }

  // Show notification about processing queued requests
  import('../components/ui/Toast').then(({ default: toast }) => {
    toast.info(`Processing ${offlineQueue.length} queued requests...`);
  });

  const queue = [...offlineQueue];
  let successCount = 0;
  let failureCount = 0;

  for (const item of queue) {
    try {
      // Retry the request
      if (item.retryFunction) {
        await item.retryFunction();
        removeFromOfflineQueue(item.id);
        successCount++;
      }
    } catch (error) {
      console.warn('Failed to process offline queue item:', error);
      failureCount++;
      
      // Remove old items (older than 24 hours)
      const itemAge = Date.now() - new Date(item.timestamp).getTime();
      if (itemAge > 24 * 60 * 60 * 1000) {
        removeFromOfflineQueue(item.id);
      }
    }
  }

  // Show completion notification
  if (successCount > 0 || failureCount > 0) {
    import('../components/ui/Toast').then(({ default: toast }) => {
      if (successCount > 0 && failureCount === 0) {
        toast.success(`Successfully processed ${successCount} queued requests`);
      } else if (successCount > 0 && failureCount > 0) {
        toast.warning(`Processed ${successCount} requests, ${failureCount} failed`);
      } else if (failureCount > 0) {
        toast.error(`Failed to process ${failureCount} queued requests`);
      }
    });
  }
};

/**
 * React hook for online status
 */
export const useOnlineStatus = () => {
  const [online, setOnline] = useState(isOnline);

  useEffect(() => {
    const removeOnlineListener = addOnlineListener(() => setOnline(true));
    const removeOfflineListener = addOfflineListener(() => setOnline(false));

    return () => {
      removeOnlineListener();
      removeOfflineListener();
    };
  }, []);

  return online;
};

/**
 * React hook for offline queue management
 */
export const useOfflineQueue = () => {
  const [queue, setQueue] = useState(getOfflineQueue());

  useEffect(() => {
    const updateQueue = () => setQueue(getOfflineQueue());
    
    const removeOnlineListener = addOnlineListener(updateQueue);
    const removeOfflineListener = addOfflineListener(updateQueue);

    // Update queue periodically
    const interval = setInterval(updateQueue, 5000);

    return () => {
      removeOnlineListener();
      removeOfflineListener();
      clearInterval(interval);
    };
  }, []);

  return {
    queue,
    queueSize: queue.length,
    clearQueue: clearOfflineQueue,
    processQueue: processOfflineQueue
  };
};

/**
 * Enhanced fetch wrapper with offline support
 */
export const offlineAwareFetch = async (url, options = {}) => {
  // If offline, add to queue and throw error
  if (!isOnline) {
    const queueItem = {
      url,
      options,
      retryFunction: () => fetch(url, options)
    };
    
    addToOfflineQueue(queueItem);
    
    const error = new Error('You are currently offline. This request will be processed when you reconnect.');
    error.code = 'OFFLINE';
    throw error;
  }

  // If online, make the request normally
  return fetch(url, options);
};

/**
 * React hook for online status
 */
import { useState, useEffect } from 'react';

// Initialize offline queue on module load
loadOfflineQueue();

export default {
  getOnlineStatus,
  addOnlineListener,
  addOfflineListener,
  addToOfflineQueue,
  removeFromOfflineQueue,
  getOfflineQueue,
  clearOfflineQueue,
  processOfflineQueue,
  offlineAwareFetch,
  useOnlineStatus,
  useOfflineQueue
};