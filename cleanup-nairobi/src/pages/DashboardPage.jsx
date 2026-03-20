
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeSection from '../components/dashboard/WelcomeSection';
import EnhancedStatCard from '../components/dashboard/EnhancedStatCard';
import QuickActionCard from '../components/dashboard/QuickActionCard';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import NotificationCenter from '../components/dashboard/NotificationCenter';
import WasteBreakdownChart from '../components/dashboard/WasteBreakdownChart';
import MonthlyTrendChart from '../components/dashboard/MonthlyTrendChart';
import { reportsAPI } from '../services/api';
import { 
  Recycle, 
  Leaf, 
  Trophy, 
  Plus, 
  MapPin, 
  AlertTriangle,
  TrendingUp,
  Users,
  Target
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await reportsAPI.getDashboardStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const userData = stats || {
    wasteCollected: 0,
    recyclingActions: 0,
    communityRank: '-',
    communitySize: 0,
    impactScore: 0,
    reportsSubmitted: 0,
    completedCollections: 0
  };

  const quickActions = [
    {
      icon: <Plus className="w-8 h-8" />,
      title: "Report Waste",
      description: "Submit a new waste collection request in your area",
      color: "green",
      onClick: () => navigate('/dashboard/reports')
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Find Centers",
      description: "Locate nearby recycling and collection centers",
      color: "blue",
      onClick: () => console.log('Find centers')
    },
    {
      icon: <AlertTriangle className="w-8 h-8" />,
      title: "Emergency Report",
      description: "Report urgent environmental hazards or illegal dumping",
      color: "orange",
      onClick: () => console.log('Emergency report')
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-48 bg-gray-200 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Welcome Section */}
      <div className="mb-6">
        <WelcomeSection />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <EnhancedStatCard
          icon={<Leaf className="w-6 h-6" />}
          title="Waste Collected"
          value={`${userData.wasteCollected}kg`}
          change="+12%"
          trend="up"
          description="Personal contribution total"
          color="green"
        />
        <EnhancedStatCard
          icon={<Recycle className="w-6 h-6" />}
          title="Recycling Actions"
          value={userData.recyclingActions}
          change="+8%"
          trend="up"
          description="Items properly reported"
          color="blue"
        />
        <EnhancedStatCard
          icon={<Trophy className="w-6 h-6" />}
          title="Community Rank"
          value={`#${userData.communityRank}`}
          change="+2"
          trend="up"
          description={`Out of ${userData.communitySize} members`}
          color="yellow"
        />
        <EnhancedStatCard
          icon={<Target className="w-6 h-6" />}
          title="Impact Score"
          value={userData.impactScore}
          change="+5"
          trend="up"
          description="Environmental impact rating"
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={index}
              icon={action.icon}
              title={action.title}
              description={action.description}
              color={action.color}
              onClick={action.onClick}
            />
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        {/* Left Column - Charts and Metrics */}
        <div className="xl:col-span-3 space-y-6">
          {/* Goals and Achievements */}
          <MetricsOverview stats={userData} />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WasteBreakdownChart data={userData.wasteBreakdown} />
            <MonthlyTrendChart data={userData.monthlyTrends} />
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Plus className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-green-700">{userData.reportsSubmitted}</div>
                  <div className="text-xs text-gray-600">Reports Submitted</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Recycle className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-700">{userData.completedCollections}</div>
                  <div className="text-xs text-gray-600">Collections Done</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-purple-700">{userData.communitySize}</div>
                  <div className="text-xs text-gray-600">Community Size</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-orange-700">{userData.points}</div>
                  <div className="text-xs text-gray-600">Total Points</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Activity and Notifications */}
        <div className="xl:col-span-1 space-y-4">
          <NotificationCenter />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;