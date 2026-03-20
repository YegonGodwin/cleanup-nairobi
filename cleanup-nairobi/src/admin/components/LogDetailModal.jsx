
import React from 'react';
import { X } from 'lucide-react';
import ReactJson from '@microlink/react-json-view';

const LogDetailModal = ({ log, onClose }) => {
  if (!log) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Log Details</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p><strong>Timestamp:</strong> {log.timestamp}</p>
          <p><strong>Admin User:</strong> {log.admin.name}</p>
          <p><strong>Action:</strong> {log.action}</p>
          <p><strong>Entity:</strong> {log.entityType} ({log.entityId})</p>
          <p><strong>IP Address:</strong> {log.ipAddress}</p>
          <p><strong>User Agent:</strong> {log.userAgent || 'N/A'}</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-bold mb-2">Before State</h4>
              <ReactJson src={log.beforeState || {}} name={false} collapsed={true} />
            </div>
            <div>
              <h4 className="font-bold mb-2">After State</h4>
              <ReactJson src={log.afterState || {}} name={false} collapsed={true} />
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 text-right">
          <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogDetailModal;
