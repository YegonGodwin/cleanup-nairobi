import { useState, useEffect } from 'react';
import { WifiOff, Wifi, Clock } from 'lucide-react';
import { useOnlineStatus, useOfflineQueue } from '../../utils/offlineHandler';

/**
 * Offline status indicator component
 * Shows connection status and queued requests count
 */
const OfflineIndicator = ({ className = '' }) => {
  const isOnline = useOnlineStatus();
  const { queueSize, processQueue } = useOfflineQueue();
  const [showDetails, setShowDetails] = useState(false);

  // Auto-hide after coming back online
  useEffect(() => {
    if (isOnline && queueSize === 0) {
      const timer = setTimeout(() => setShowDetails(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, queueSize]);

  if (isOnline && queueSize === 0) {
    return null; // Don't show when online and no queue
  }

  const handleClick = () => {
    if (isOnline && queueSize > 0) {
      processQueue();
    } else {
      setShowDetails(!showDetails);
    }
  };

  return (
    <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
      <div
        onClick={handleClick}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg cursor-pointer transition-all duration-300
          ${isOnline 
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200' 
            : 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200'
          }
        `}
      >
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        
        <span className="text-sm font-medium">
          {isOnline ? 'Back Online' : 'Offline'}
        </span>

        {queueSize > 0 && (
          <>
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {queueSize} queued
            </span>
          </>
        )}
      </div>

      {showDetails && (
        <div className="mt-2 p-3 bg-white rounded-lg shadow-lg border max-w-xs">
          <div className="text-sm text-gray-700">
            {isOnline ? (
              <div>
                <p className="font-medium text-green-700 mb-1">Connection restored!</p>
                {queueSize > 0 ? (
                  <p>Click above to process {queueSize} queued requests.</p>
                ) : (
                  <p>All queued requests have been processed.</p>
                )}
              </div>
            ) : (
              <div>
                <p className="font-medium text-red-700 mb-1">No internet connection</p>
                <p>Your actions will be saved and processed when you reconnect.</p>
                {queueSize > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {queueSize} actions waiting to be processed.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;