import { useState } from 'react';
import { FaEye, FaEdit, FaTrash, FaUserPlus, FaTruck, FaCheck, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { useErrorHandler } from '../../components/ErrorBoundary';

const ReportsTable = ({ 
  reports, 
  loading, 
  error, 
  selectedReports, 
  onSelectAll, 
  onSelectReport, 
  onSort, 
  sort,
  onAssignDriver,
  onViewReport,
  onEditReport,
  onDeleteReport 
}) => {
  const [assigningReportId, setAssigningReportId] = useState(null);
  const { handleError } = useErrorHandler();

  const handleAssignClick = (reportId) => {
    try {
      setAssigningReportId(reportId);
      onAssignDriver(reportId);
    } catch (error) {
      handleError(error, { context: 'assign_driver', reportId });
      setAssigningReportId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FaClock },
      'assigned': { bg: 'bg-blue-100', text: 'text-blue-800', icon: FaTruck },
      'in_progress': { bg: 'bg-orange-100', text: 'text-orange-800', icon: FaClock },
      'completed': { bg: 'bg-green-100', text: 'text-green-800', icon: FaCheck },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: FaTrash }
    };

    const config = statusConfig[status] || statusConfig['pending'];
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="mr-1" size={10} />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getWasteTypeBadge = (wasteType) => {
    const typeConfig = {
      'plastic': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'organic': { bg: 'bg-green-100', text: 'text-green-800' },
      'paper': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'metal': { bg: 'bg-gray-100', text: 'text-gray-800' },
      'glass': { bg: 'bg-purple-100', text: 'text-purple-800' },
      'electronic': { bg: 'bg-red-100', text: 'text-red-800' },
      'mixed': { bg: 'bg-indigo-100', text: 'text-indigo-800' }
    };

    const config = typeConfig[wasteType] || typeConfig['mixed'];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {wasteType.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-lg shadow">
        <div className="text-center py-8">
          <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg font-medium text-red-600">Error loading reports</p>
          <p className="mt-2 text-gray-600">
            {error.getUserMessage ? error.getUserMessage() : error}
          </p>
          {error.isRetryable && error.isRetryable() && (
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow">
        <div className="text-center py-8 text-gray-500">
          <FaTrash className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium">No reports found</p>
          <p className="mt-2">Try adjusting your filters or search criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  onChange={onSelectAll}
                  checked={selectedReports.length === reports.length && reports.length > 0}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('id')}
              >
                Report ID {sort.field === 'id' && (sort.order === 'asc' ? '▲' : '▼')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('location')}
              >
                Location {sort.field === 'location' && (sort.order === 'asc' ? '▲' : '▼')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reporter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Waste Type
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('status')}
              >
                Status {sort.field === 'status' && (sort.order === 'asc' ? '▲' : '▼')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned Driver
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('created_at')}
              >
                Created {sort.field === 'created_at' && (sort.order === 'asc' ? '▲' : '▼')}
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report) => (
              <tr 
                key={report.id} 
                className={`${selectedReports.includes(report.id) ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedReports.includes(report.id)}
                    onChange={() => onSelectReport(report.id)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {report.id?.substring(0, 8)}...
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="max-w-xs truncate" title={report.location}>
                    {report.location}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <img 
                        className="h-8 w-8 rounded-full" 
                        src={report.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(report.users?.full_name || 'User')}&background=random`}
                        alt={report.users?.full_name || 'User'}
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {report.users?.full_name || 'Unknown User'}
                      </div>
                      {report.users?.phone && (
                        <div className="text-xs text-gray-500">
                          {report.users.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getWasteTypeBadge(report.waste_type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getStatusBadge(report.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {report.driver_assignments && report.driver_assignments.length > 0 && report.driver_assignments[0].drivers ? (
                    <div className="flex items-center">
                      <FaTruck className="text-blue-500 mr-2" size={12} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.driver_assignments[0].drivers.full_name}
                        </div>
                        {report.driver_assignments[0].drivers.vehicle_number && (
                          <div className="text-xs text-gray-500">
                            {report.driver_assignments[0].drivers.vehicle_number}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(report.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => onViewReport(report.id)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="View Report"
                    >
                      <FaEye size={14} />
                    </button>
                    
                    {report.status === 'pending' && (
                      <button 
                        onClick={() => handleAssignClick(report.id)}
                        disabled={assigningReportId === report.id}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 disabled:opacity-50"
                        title="Assign Driver"
                      >
                        <FaUserPlus size={14} />
                      </button>
                    )}
                    
                    <button 
                      onClick={() => onEditReport(report.id)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                      title="Edit Report"
                    >
                      <FaEdit size={14} />
                    </button>
                    
                    <button 
                      onClick={() => onDeleteReport(report.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                      title="Delete Report"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsTable;