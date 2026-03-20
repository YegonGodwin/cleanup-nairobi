import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Progress from '../ui/Progress';
import Badge from '../ui/Badge';
import { Target, TrendingUp, Users, Award, Recycle } from 'lucide-react';

const MetricsOverview = ({ stats = {}, className = '' }) => {
  // Default metrics if none provided
  const displayMetrics = {
    communityGoal: {
      target: 2000,
      current: 1650, // This could also come from API if global stats available
      unit: 'kg',
      period: 'this month'
    },
    personalGoal: {
      target: 50,
      current: stats.wasteCollected || 0,
      unit: 'kg',
      period: 'total'
    },
    communityRank: {
      position: stats.communityRank || '-',
      total: stats.communitySize || 0,
      change: '+2'
    },
    impactScore: {
      score: stats.impactScore || 0,
      maxScore: 1000,
      level: stats.impactScore > 500 ? 'Eco Champion' : (stats.impactScore > 100 ? 'Nature Guardian' : 'Cleanup Rookie')
    }
  };

  const getCommunityProgress = () => {
    return (displayMetrics.communityGoal.current / displayMetrics.communityGoal.target) * 100;
  };

  const getPersonalProgress = () => {
    return Math.min((displayMetrics.personalGoal.current / displayMetrics.personalGoal.target) * 100, 100);
  };

  const getImpactProgress = () => {
    return Math.min((displayMetrics.impactScore.score / displayMetrics.impactScore.maxScore) * 100, 100);
  };

  const getRankBadgeVariant = () => {
    if (typeof displayMetrics.communityRank.position === 'number') {
      if (displayMetrics.communityRank.position <= 3) return 'success';
      if (displayMetrics.communityRank.position <= 10) return 'primary';
    }
    return 'secondary';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-gray-600" />
          Goals & Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Community Goal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Community Goal</h4>
              <p className="text-sm text-gray-600">
                {displayMetrics.communityGoal.current}{displayMetrics.communityGoal.unit} of {displayMetrics.communityGoal.target}{displayMetrics.communityGoal.unit} {displayMetrics.communityGoal.period}
              </p>
            </div>
            <Badge variant="primary" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Community
            </Badge>
          </div>
          <Progress 
            value={getCommunityProgress()} 
            variant="gradient"
            showLabel={true}
            label="Community Progress"
          />
        </div>

        {/* Personal Goal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Personal Goal</h4>
              <p className="text-sm text-gray-600">
                {displayMetrics.personalGoal.current}{displayMetrics.personalGoal.unit} of {displayMetrics.personalGoal.target}{displayMetrics.personalGoal.unit} {displayMetrics.personalGoal.period}
              </p>
            </div>
            <Badge variant="success">
              {Math.round(getPersonalProgress())}%
            </Badge>
          </div>
          <Progress 
            value={getPersonalProgress()} 
            variant="success"
            size="lg"
          />
        </div>

        {/* Community Rank */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Community Rank</h4>
              <p className="text-sm text-gray-600">
                #{displayMetrics.communityRank.position} of {displayMetrics.communityRank.total} members
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={getRankBadgeVariant()} size="lg">
              #{displayMetrics.communityRank.position}
            </Badge>
            <p className="text-xs text-green-600 mt-1 font-medium">
              {displayMetrics.communityRank.change} this week
            </p>
          </div>
        </div>

        {/* Impact Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <div>
                <h4 className="font-medium text-gray-900">Impact Score</h4>
                <p className="text-sm text-gray-600">{displayMetrics.impactScore.level}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {displayMetrics.impactScore.score}
              </div>
              <div className="text-xs text-gray-500">
                /{displayMetrics.impactScore.maxScore}
              </div>
            </div>
          </div>
          <Progress 
            value={getImpactProgress()} 
            variant="warning"
            size="lg"
          />
        </div>

        {/* Achievement Badges */}
        <div className="pt-4 border-t border-gray-100">
          <h5 className="font-medium text-gray-900 mb-3">Recent Achievements</h5>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success" className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              First Report
            </Badge>
            <Badge variant="primary" className="flex items-center gap-1">
              <Recycle className="w-3 h-3" />
              Recycling Hero
            </Badge>
            <Badge variant="warning" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Community Helper
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsOverview;