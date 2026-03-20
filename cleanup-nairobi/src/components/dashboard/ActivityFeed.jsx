import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { Clock, MapPin, Recycle, Truck, CheckCircle, AlertCircle } from 'lucide-react';

const ActivityFeed = ({ activities = [], className = '' }) => {
  const getActivityIcon = (type) => {
    const iconClasses = "w-4 h-4";
    switch (type) {
      case 'report_created':
        return <AlertCircle className={`${iconClasses} text-orange-500`} />;
      case 'report_assigned':
        return <Truck className={`${iconClasses} text-blue-500`} />;
      case 'report_completed':
        return <CheckCircle className={`${iconClasses} text-green-500`} />;
      case 'recycling_action':
        return <Recycle className={`${iconClasses} text-emerald-500`} />;
      default:
        return <Clock className={`${iconClasses} text-gray-500`} />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'report_created':
        return 'warning';
      case 'report_assigned':
        return 'secondary';
      case 'report_completed':
        return 'success';
      case 'recycling_action':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Sample data if no activities provided
  const sampleActivities = [
    {
      id: 1,
      type: 'report_created',
      title: 'New waste report submitted',
      description: 'Plastic waste reported at Uhuru Park',
      location: 'Uhuru Park, Nairobi',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      user: { name: 'John Doe', avatar: null }
    },
    {
      id: 2,
      type: 'report_assigned',
      title: 'Report assigned to driver',
      description: 'Collection scheduled for tomorrow morning',
      location: 'Westlands, Nairobi',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      user: { name: 'Admin', avatar: null }
    },
    {
      id: 3,
      type: 'report_completed',
      title: 'Waste collection completed',
      description: '25kg of mixed waste collected successfully',
      location: 'Karen, Nairobi',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      user: { name: 'Driver Mike', avatar: null }
    },
    {
      id: 4,
      type: 'recycling_action',
      title: 'Recycling milestone reached',
      description: 'Community recycled 500kg this month!',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      user: { name: 'System', avatar: null }
    }
  ];

  const displayActivities = activities.length > 0 ? activities : sampleActivities;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayActivities.map((activity) => (
          <div key={activity.id} className="flex gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                {getActivityIcon(activity.type)}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {activity.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                </div>
                <Badge variant={getActivityColor(activity.type)} size="sm">
                  {activity.type.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Avatar 
                    fallback={activity.user.name.charAt(0)} 
                    size="xs"
                    className="bg-gray-200"
                  />
                  <span>{activity.user.name}</span>
                </div>
                
                {activity.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{activity.location}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimeAgo(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="text-center pt-4">
          <button className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors duration-200">
            View All Activity
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;