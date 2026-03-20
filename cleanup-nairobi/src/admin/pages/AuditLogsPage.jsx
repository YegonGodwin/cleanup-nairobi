import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import LogDetailModal from '../components/LogDetailModal';

const AuditLogsPage = () => {
  const [selectedLog, setSelectedLog] = useState(null);

  const logs = [
    {
      id: 1,
      timestamp: '2025-11-08 10:30:15',
      admin: { name: 'Admin User', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
      action: 'UPDATE',
      entityType: 'User',
      entityId: 'usr_123',
      details: '{ "role": "Manager" }',
      ipAddress: '192.168.1.100',
      beforeState: { role: 'Citizen' },
      afterState: { role: 'Manager' },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...',
    },
    {
      id: 2,
      timestamp: '2025-11-08 10:25:45',
      admin: { name: 'Admin User', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
      action: 'CREATE',
      entityType: 'Vehicle',
      entityId: 'vhc_456',
      details: '{ "registrationNumber": "KDE 101E" }',
      ipAddress: '192.168.1.100',
      beforeState: {},
      afterState: { registrationNumber: 'KDE 101E', type: 'Truck' },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...',
    },
  ];

  const handleViewDetails = (log) => {
    setSelectedLog(log);
  };

  const handleCloseModal = () => {
    setSelectedLog(null);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-200 text-green-800';
      case 'UPDATE':
        return 'bg-blue-200 text-blue-800';
      case 'DELETE':
        return 'bg-red-200 text-red-800';
      case 'LOGIN':
      case 'LOGOUT':
        return 'bg-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Audit Logs</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Filters will go here */}
            <p className="text-gray-500">Filters coming soon.</p>
          </div>
          <button className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800 self-start md:self-center">
            Export Logs (CSV)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Timestamp</th>
                <th className="p-3 text-left">Admin User</th>
                <th className="p-3 text-left">Action</th>
                <th className="p-3 text-left">Entity</th>
                <th className="p-3 text-left">Details</th>
                <th className="p-3 text-left">IP Address</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="p-3">{log.timestamp}</td>
                  <td className="p-3 flex items-center">
                    <img
                      src={log.admin.avatar}
                      alt={log.admin.name}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                    <span className="font-medium">{log.admin.name}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-sm font-semibold ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3">
                    <div>{log.entityType}</div>
                    <div className="text-xs text-gray-500">{log.entityId}</div>
                  </td>
                  <td className="p-3">
                    <code className="text-sm bg-gray-100 p-1 rounded">{log.details}</code>
                  </td>
                  <td className="p-3">{log.ipAddress}</td>
                  <td className="p-3">
                    <button onClick={() => handleViewDetails(log)} className="p-2 rounded-full hover:bg-gray-200">
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination will go here */}
      </div>
      <LogDetailModal log={selectedLog} onClose={handleCloseModal} />
    </div>
  );
};

export default AuditLogsPage;