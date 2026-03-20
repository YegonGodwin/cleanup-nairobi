import React from 'react';
import { Card, CardContent } from '../ui/card';
import { FaMapMarkerAlt, FaClock, FaTruck, FaUser, FaEye } from 'react-icons/fa';

const ReportCard = ({ report, onClick }) => {
  // Safety check for report object
  if (!report || typeof report !== 'object') {
    return (
      <Card className="cursor-pointer border-l-4 border-l-red-500">
        <CardContent className="p-4">
          <p className="text-red-600">Invalid report data</p>
        </CardContent>
      </Card>
    );
  }

  // Status color mapping
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      assigned: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Capitalize waste type
  const formatWasteType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Truncate description
  const truncateDescription = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-green-500"
      onClick={() => onClick && onClick(report)}
    >
      <CardContent className="p-4">
        {/* Header with status */}
        <div className="flex justify-between items-start mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status || 'unknown')}`}>
            {(report.status || 'unknown').replace('_', ' ').toUpperCase()}
          </span>
          <span className="text-xs text-gray-500">
            #{report.id?.slice(-8) || 'N/A'}
          </span>
        </div>

        {/* Waste type */}
        <div className="mb-2">
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
            {formatWasteType(report.waste_type || 'unknown')}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 mb-3">
          <FaMapMarkerAlt className="text-gray-400 mt-1 flex-shrink-0" size={12} />
          <p className="text-sm text-gray-700 line-clamp-2">
            {report.location || 'Location not specified'}
          </p>
        </div>

        {/* Description */}
        <div className="mb-3">
          <p className="text-sm text-gray-600 line-clamp-3">
            {truncateDescription(report.description || 'No description provided')}
          </p>
        </div> 
       {/* Image preview if available */}
        {report.image_url && (
          <div className="mb-3">
            <img
              src={report.image_url}
              alt="Waste report"
              className="w-full h-32 object-cover rounded-md"
            />
          </div>
        )}

        {/* Driver assignment info */}
        {report.assigned_driver && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 rounded-md">
            <FaTruck className="text-blue-500" size={12} />
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-800">
                Assigned to: {report.assigned_driver.full_name}
              </p>
              {report.assigned_driver.vehicle_number && (
                <p className="text-xs text-blue-600">
                  Vehicle: {report.assigned_driver.vehicle_number}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer with timestamp and action */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FaClock size={10} />
            <span>{formatDate(report.created_at || new Date().toISOString())}</span>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700">
            <FaEye size={10} />
            <span>View Details</span>
          </div>
        </div>

        {/* Status progression indicator */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <div className="flex space-x-1">
              {['pending', 'assigned', 'in_progress', 'completed'].map((status, index) => {
                const isActive = ['pending', 'assigned', 'in_progress', 'completed'].indexOf(report.status) >= index;
                const isCurrent = report.status === status;
                
                return (
                  <div
                    key={status}
                    className={`w-2 h-2 rounded-full ${
                      isCurrent 
                        ? 'bg-green-500' 
                        : isActive 
                          ? 'bg-green-300' 
                          : 'bg-gray-200'
                    }`}
                    title={status.replace('_', ' ')}
                  />
                );
              })}
            </div>
            
            {/* Last updated */}
            {report.updated_at && report.updated_at !== report.created_at && (
              <span className="text-gray-400">
                Updated {formatDate(report.updated_at)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCard;