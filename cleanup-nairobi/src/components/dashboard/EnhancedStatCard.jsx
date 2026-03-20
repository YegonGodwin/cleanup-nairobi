import React from 'react';
import { Card, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const EnhancedStatCard = ({ 
  icon, 
  title, 
  value, 
  change, 
  trend = 'neutral',
  description,
  color = 'green',
  className = '',
  ...props 
}) => {
  const colorClasses = {
    green: {
      icon: 'bg-green-50 text-green-600 border-green-100',
      trend: 'text-green-600',
      badge: 'success'
    },
    blue: {
      icon: 'bg-blue-50 text-blue-600 border-blue-100',
      trend: 'text-blue-600',
      badge: 'secondary'
    },
    yellow: {
      icon: 'bg-yellow-50 text-yellow-600 border-yellow-100',
      trend: 'text-yellow-600',
      badge: 'warning'
    },
    red: {
      icon: 'bg-red-50 text-red-600 border-red-100',
      trend: 'text-red-600',
      badge: 'danger'
    },
    purple: {
      icon: 'bg-purple-50 text-purple-600 border-purple-100',
      trend: 'text-purple-600',
      badge: 'info'
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className={`group ${className}`} hover={true} {...props}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl border ${colorClasses[color].icon} group-hover:scale-110 transition-transform duration-200`}>
                {icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>

            {description && (
              <p className="text-sm text-gray-600 mb-3">{description}</p>
            )}

            {change && (
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                  {getTrendIcon()}
                  <span className="text-sm font-medium">{change}</span>
                </div>
                <span className="text-xs text-gray-500">vs last period</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedStatCard;