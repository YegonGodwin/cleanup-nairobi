import { useState } from 'react';
import { 
  MapPin, Clock, Calendar, AlertTriangle, CheckCircle, 
  Play, Navigation, Phone, Package,
  ChevronDown, ChevronUp
} from 'lucide-react';
import TaskActions from './TaskActions';

const TaskCard = ({ task, onTaskUpdate, onError }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get status color and icon
  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Completed'
        };
      case 'in_progress':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Play className="w-4 h-4" />,
          label: 'In Progress'
        };
      case 'accepted':
        return {
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Accepted'
        };
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="w-4 h-4" />,
          label: 'Pending'
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertTriangle className="w-4 h-4" />,
          label: 'Cancelled'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Clock className="w-4 h-4" />,
          label: 'Unknown'
        };
    }
  };

  // Get priority color and urgency indicator
  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'urgent':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          indicator: 'bg-red-500',
          label: 'Urgent',
          pulse: true
        };
      case 'high':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          indicator: 'bg-orange-500',
          label: 'High',
          pulse: false
        };
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          indicator: 'bg-yellow-500',
          label: 'Medium',
          pulse: false
        };
      case 'low':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          indicator: 'bg-green-500',
          label: 'Low',
          pulse: false
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          indicator: 'bg-gray-500',
          label: 'Normal',
          pulse: false
        };
    }
  };

  // Get waste type icon
  const getWasteTypeIcon = (wasteType) => {
    switch (wasteType) {
      case 'plastic': return '♻️';
      case 'organic': return '🍃';
      case 'metal': return '🔩';
      case 'glass': return '🥃';
      case 'paper': return '📄';
      case 'electronic': return '💻';
      case 'hazardous': return '☢️';
      default: return '🗑️';
    }
  };



  // Format date/time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate time since assignment
  const getTimeSinceAssignment = (assignedAt) => {
    if (!assignedAt) return '';
    const now = new Date();
    const assigned = new Date(assignedAt);
    const diffMs = now - assigned;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m ago`;
    }
    return `${diffMins}m ago`;
  };

  const statusConfig = getStatusConfig(task.status);
  const priorityConfig = getPriorityConfig(task.priority || 'medium');
  // Handle both possible data structures: waste_reports (from backend) and report_details (original format)
  const reportDetails = task.waste_reports || task.report_details || {};

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
      {/* Priority indicator bar */}
      {task.priority === 'urgent' && (
        <div className="h-1 bg-red-500 rounded-t-xl"></div>
      )}
      
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {/* Waste type icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-xl">
                {getWasteTypeIcon(reportDetails.waste_type)}
              </div>
            </div>

            {/* Task details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {reportDetails.location || 'Unknown Location'}
                </h3>
                
                {/* Status badge */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                  {statusConfig.icon}
                  <span className="ml-1">{statusConfig.label}</span>
                </span>
                
                {/* Priority badge with urgency indicator */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityConfig.color}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${priorityConfig.indicator} ${priorityConfig.pulse ? 'animate-pulse' : ''}`}></div>
                  {priorityConfig.label}
                </span>
              </div>

              {/* Location and basic info */}
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {reportDetails.location || 'Location not specified'}
                </span>
                <span className="flex items-center">
                  <Package className="w-4 h-4 mr-1" />
                  {reportDetails.waste_type || 'General waste'}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {getTimeSinceAssignment(task.assigned_at)}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-3 line-clamp-2">
                {reportDetails.description || 'No description provided'}
              </p>

              {/* Timeline indicators */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Assigned: {formatDateTime(task.assigned_at)}
                </span>
                {task.accepted_at && (
                  <span className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                    Accepted: {formatDateTime(task.accepted_at)}
                  </span>
                )}
                {task.started_at && (
                  <span className="flex items-center">
                    <Play className="w-4 h-4 mr-1 text-blue-500" />
                    Started: {formatDateTime(task.started_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 ml-4">
            {/* Task Actions Component */}
            <TaskActions 
              task={task} 
              onTaskUpdate={onTaskUpdate}
              onError={onError}
            />

            {/* Navigation button */}
            {reportDetails.latitude && reportDetails.longitude && (
              <button 
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${reportDetails.latitude},${reportDetails.longitude}`;
                  window.open(url, '_blank');
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Navigate to location"
              >
                <Navigation className="w-5 h-5" />
              </button>
            )}

            {/* Contact button (if reporter info available) */}
            {(reportDetails.user_name || (reportDetails.users && reportDetails.users.full_name)) && (
              <button
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title={`Contact ${reportDetails.user_name || (reportDetails.users && reportDetails.users.full_name) || 'User'}`}
              >
                <Phone className="w-5 h-5" />
              </button>
            )}

            {/* Expand/collapse button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Report details */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Report Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Report ID:</span>
                    <span className="font-mono text-gray-900">{task.report_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reported by:</span>
                    <span className="text-gray-900">{reportDetails.user_name || (reportDetails.users && reportDetails.users.full_name) || 'Anonymous'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Waste type:</span>
                    <span className="text-gray-900 capitalize">{reportDetails.waste_type || 'General'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submitted:</span>
                    <span className="text-gray-900">{formatDateTime(reportDetails.created_at)}</span>
                  </div>
                  {reportDetails.image_url && (
                    <div className="mt-3">
                      <span className="text-gray-500 text-sm">Attached image:</span>
                      <img 
                        src={reportDetails.image_url} 
                        alt="Waste report" 
                        className="mt-2 w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment details */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Assignment Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Assignment ID:</span>
                    <span className="font-mono text-gray-900">{task.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Priority:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${priorityConfig.color}`}>
                      {priorityConfig.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  {task.completion_notes && (
                    <div className="mt-3">
                      <span className="text-gray-500 text-sm">Completion notes:</span>
                      <p className="mt-1 text-gray-900 text-sm bg-gray-50 p-2 rounded">
                        {task.completion_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Full address */}
            {reportDetails.location && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Full Address</p>
                    <p className="text-sm text-gray-600">{reportDetails.location}</p>
                    {reportDetails.latitude && reportDetails.longitude && (
                      <p className="text-xs text-gray-500 mt-1">
                        Coordinates: {reportDetails.latitude}, {reportDetails.longitude}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;