import React from 'react';
import { 
  Clock, CheckCircle, MapPin, Truck, Package, 
  ArrowRight, XCircle
} from 'lucide-react';

const RecentActivity = ({ assignments = [] }) => {
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Now';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getEventConfig = (eventType) => {
    switch (eventType) {
      case 'completed':
        return { title: 'Task Completed', icon: CheckCircle, color: 'emerald', status: 'completed' };
      case 'started':
        return { title: 'Task Started', icon: Truck, color: 'blue', status: 'in_progress' };
      case 'accepted':
        return { title: 'Task Accepted', icon: CheckCircle, color: 'blue', status: 'accepted' };
      case 'cancelled':
        return { title: 'Task Cancelled', icon: XCircle, color: 'orange', status: 'cancelled' };
      default:
        return { title: 'Task Assigned', icon: Package, color: 'purple', status: 'pending' };
    }
  };

  const activities = assignments
    .flatMap((assignment) => {
      const report = assignment?.waste_reports || assignment?.report_details || {};
      const location = report.location || 'Unknown location';
      const items = [];

      if (assignment.assigned_at) {
        items.push({
          id: `${assignment.id}-assigned`,
          ...getEventConfig('assigned'),
          location,
          timeRaw: assignment.assigned_at,
          time: formatRelativeTime(assignment.assigned_at),
        });
      }
      if (assignment.accepted_at) {
        items.push({
          id: `${assignment.id}-accepted`,
          ...getEventConfig('accepted'),
          location,
          timeRaw: assignment.accepted_at,
          time: formatRelativeTime(assignment.accepted_at),
        });
      }
      if (assignment.started_at) {
        items.push({
          id: `${assignment.id}-started`,
          ...getEventConfig('started'),
          location,
          timeRaw: assignment.started_at,
          time: formatRelativeTime(assignment.started_at),
        });
      }
      if (assignment.completed_at) {
        items.push({
          id: `${assignment.id}-completed`,
          ...getEventConfig('completed'),
          location,
          timeRaw: assignment.completed_at,
          time: formatRelativeTime(assignment.completed_at),
        });
      }
      if (assignment.cancelled_at) {
        items.push({
          id: `${assignment.id}-cancelled`,
          ...getEventConfig('cancelled'),
          location,
          timeRaw: assignment.cancelled_at,
          time: formatRelativeTime(assignment.cancelled_at),
        });
      }

      return items;
    })
    .sort((a, b) => new Date(b.timeRaw) - new Date(a.timeRaw))
    .slice(0, 10);

  const getColorClasses = (color) => {
    const colors = {
      emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      orange: 'bg-orange-100 text-orange-600 border-orange-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200'
    };
    return colors[color] || colors.blue;
  };

  const getGradientClasses = (color) => {
    const gradients = {
      emerald: 'from-emerald-500 to-emerald-600',
      blue: 'from-blue-500 to-blue-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600'
    };
    return gradients[color] || gradients.blue;
  };

  const today = new Date();
  const todayTasks = assignments.filter((assignment) => {
    if (!assignment.assigned_at) return false;
    return new Date(assignment.assigned_at).toDateString() === today.toDateString();
  }).length;
  const completedTasks = assignments.filter((assignment) => assignment.status === 'completed').length;
  const inProgressTasks = assignments.filter((assignment) => assignment.status === 'in_progress').length;

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <p className="text-sm text-gray-500">Your latest actions</p>
          </div>
        </div>
        <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1">
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto">
        {activities.length === 0 && (
          <div className="p-4 rounded-xl bg-white/50 border border-white/30 text-sm text-gray-600">
            No recent assignment activity yet.
          </div>
        )}
        {activities.map((activity, index) => {
          const IconComponent = activity.icon;
          
          return (
            <div key={activity.id} className="group relative">
              {/* Timeline line */}
              {index < activities.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-gradient-to-b from-gray-300 to-transparent"></div>
              )}
              
              <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/50 border border-white/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br ${getGradientClasses(activity.color)}`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{activity.title}</h4>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {activity.time}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <p className="text-sm text-gray-600">{activity.location}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getColorClasses(activity.color)}`}>
                      {activity.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary stats */}
      <div className="mt-6 pt-6 border-t border-white/20">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{todayTasks}</div>
            <div className="text-xs text-gray-500">Tasks Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{completedTasks}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
            <div className="text-xs text-gray-500">In Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
