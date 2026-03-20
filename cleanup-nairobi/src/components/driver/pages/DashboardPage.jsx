import React, { useState, useEffect } from 'react';
import { 
  Navigation, MapPin, Clock, CheckCircle, AlertTriangle, 
  TrendingUp, Route, Package, Users, Star, Fuel, Award,
  Zap, Target, Calendar, Activity, BarChart3, Sparkles,
  ChevronRight, Play, Pause, RotateCcw, ArrowUp, ArrowDown
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { assignmentsAPI, driversAPI } from '../../../services/api';
import DriverMap from '../dashboard-components/DriverMap';
import VehicleStatus from '../dashboard-components/VehicleStatus';
import Notifications from '../dashboard-components/Notifications';
import RecentActivity from '../dashboard-components/RecentActivity';
import FloatingActionButton from '../dashboard-components/FloatingActionButton';
import LoadingDashboard from '../dashboard-components/LoadingDashboard';

const DashboardPage = () => {
  const { user } = useAuth();
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [vehicle, setVehicle] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [animatedStats, setAnimatedStats] = useState({
    completedTasks: 0,
    efficiency: 0,
    distance: 0
  });

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live vehicle + assignments and keep assignments in sync.
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [vehicleResponse, assignmentsResponse] = await Promise.all([
          driversAPI.getAssignedVehicle(),
          assignmentsAPI.getDriverTasks({ limit: 20 })
        ]);
        setVehicle(vehicleResponse.data || null);
        const liveAssignments = Array.isArray(assignmentsResponse.data) ? assignmentsResponse.data : [];
        setAssignments(liveAssignments);
        const completed = liveAssignments.filter((a) => a.status === 'completed').length;
        const efficiency = liveAssignments.length > 0
          ? Math.round((completed / liveAssignments.length) * 100)
          : 0;
        setAnimatedStats({
          completedTasks: completed,
          efficiency,
          distance: 0
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    const poll = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(poll);
  }, []);

  const displayAssignments = assignments.map((assignment) => {
    const report = assignment.waste_reports || assignment.report_details || {};
    return {
      id: assignment.id,
      location: report.location || 'Unknown location',
      address: report.location || 'Address unavailable',
      priority: assignment.priority || report.priority || 'medium',
      estimatedTime: assignment.status === 'in_progress' ? 'In progress' : 'Pending',
      status: assignment.status || 'pending',
      reportedBy: report?.users?.full_name || report?.user_name || null,
      description: report.description || 'No description provided',
    };
  });

  const assignedCount = assignments.length;
  const completedCount = assignments.filter((a) => a.status === 'completed').length;
  const activeCount = assignments.filter((a) => ['pending', 'accepted', 'in_progress'].includes(a.status)).length;
  const cancelledCount = assignments.filter((a) => a.status === 'cancelled').length;
  const progressPercent = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;
  const mappedStopsCount = assignments.filter((assignment) => {
    const report = assignment.waste_reports || assignment.report_details || {};
    return report.latitude && report.longitude;
  }).length;

  const todayStats = {
    assignedTasks: assignedCount,
    completedTasks: completedCount,
    pendingTasks: activeCount,
    totalDistance: `${mappedStopsCount} mapped`,
    workingHours: 'N/A',
    efficiency: animatedStats.efficiency,
    cancellationRate: assignedCount > 0 ? Math.round((cancelledCount / assignedCount) * 100) : 0
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'accepted': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const vehicleInfo = vehicle ? {
    model: vehicle.type || 'Vehicle Type Unknown',
    plate: vehicle.registration_number || 'N/A',
    status: vehicle.status || 'Unknown',
    capacity: vehicle.capacity ? `${vehicle.capacity} tons` : 'N/A',
    capacityPercentage: vehicle.capacity ? '65%' : '0%', // Assuming 65% as a typical usage
    lastMaintenance: vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleDateString() : 'N/A'
  } : {
    model: 'No Vehicle Assigned',
    plate: 'N/A',
    status: 'Inactive',
    capacity: 'N/A',
    capacityPercentage: '0%',
    lastMaintenance: 'N/A'
  };

  // Show loading state
  if (isLoading) {
    return <LoadingDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <div className="space-y-8 p-6">
        {/* Enhanced Welcome Header with Glassmorphism */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 rounded-2xl shadow-2xl text-white">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 to-blue-600/90"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full translate-y-32 -translate-x-32 blur-2xl"></div>
          
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      Welcome back, {user?.full_name?.split(' ')[0] || 'Driver'}!
                    </h1>
                    <p className="text-blue-100 text-lg">
                      {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isOnDuty ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className="text-blue-100 font-medium">
                      {isOnDuty ? 'On Duty' : 'Off Duty'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-100">
                    <Target className="w-4 h-4" />
                    <span>{displayAssignments.length} tasks waiting</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-100">
                    <Award className="w-4 h-4" />
                    <span>{todayStats.completedTasks} completed</span>
                  </div>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center space-x-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20">
                  <div className="text-3xl font-bold mb-1">{animatedStats.efficiency}%</div>
                  <div className="text-sm text-blue-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Efficiency
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20">
                  <div className="text-3xl font-bold mb-1">{assignedCount}</div>
                  <div className="text-sm text-blue-100 flex items-center justify-center">
                    <Package className="w-4 h-4 mr-1 text-yellow-300" />
                    Assigned
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Action Button */}
            <div className="mt-6">
              <button 
                onClick={() => setIsOnDuty(!isOnDuty)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  isOnDuty 
                    ? 'bg-red-500/20 text-red-100 border border-red-400/30 hover:bg-red-500/30' 
                    : 'bg-green-500/20 text-green-100 border border-green-400/30 hover:bg-green-500/30'
                }`}
              >
                {isOnDuty ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{isOnDuty ? 'End Shift' : 'Start Shift'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards with Animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tasks Card */}
          <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <div className="flex items-center text-emerald-600 text-sm font-medium">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  {progressPercent}%
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Today's Tasks</p>
              <p className="text-3xl font-bold text-gray-900">
                {animatedStats.completedTasks}/{todayStats.assignedTasks}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {todayStats.pendingTasks} remaining
              </p>
            </div>
          </div>

          {/* Distance Card */}
          <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Route className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <div className="flex items-center text-blue-600 text-sm font-medium">
                  <Activity className="w-4 h-4 mr-1" />
                  Active
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Distance Covered</p>
              <p className="text-3xl font-bold text-gray-900">{todayStats.totalDistance}</p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>From live coordinates</span>
              </div>
            </div>
          </div>

          {/* Working Hours Card */}
          <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <div className="flex items-center text-purple-600 text-sm font-medium">
                  <Calendar className="w-4 h-4 mr-1" />
                  Today
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Working Hours</p>
              <p className="text-3xl font-bold text-gray-900">{todayStats.workingHours}</p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Captured when shift tracking is enabled</span>
              </div>
            </div>
          </div>

          {/* Efficiency Card */}
          <div className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <div className="flex items-center text-orange-600 text-sm font-medium">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Excellent
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Efficiency Score</p>
              <p className="text-3xl font-bold text-gray-900">{animatedStats.efficiency}%</p>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm" 
                  style={{ width: `${animatedStats.efficiency}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                Completion efficiency
              </p>
            </div>
          </div>
        </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Current Assignments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enhanced Current Assignments */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Current Assignments</h2>
                    <p className="text-sm text-gray-500">Priority tasks for today</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
                    {displayAssignments.length} Active
                  </span>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {displayAssignments.map((assignment) => (
                <div key={assignment.id} className="group relative bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  {/* Priority indicator */}
                  <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${
                    assignment.priority === 'urgent' ? 'bg-red-500' :
                    assignment.priority === 'high' ? 'bg-orange-500' :
                    assignment.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                          assignment.status === 'completed' ? 'bg-green-100' :
                          assignment.status === 'in_progress' ? 'bg-blue-100' :
                          assignment.status === 'accepted' ? 'bg-orange-100' : 'bg-gray-100'
                        }`}>
                          {getStatusIcon(assignment.status)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{assignment.location}</h3>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${getPriorityColor(assignment.priority)}`}>
                            {assignment.priority}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-3">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-600">{assignment.address}</p>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-4 leading-relaxed">{assignment.description}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{assignment.estimatedTime}</span>
                          </div>
                          {assignment.reportedBy && (
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4" />
                              <span>{assignment.reportedBy}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110 shadow-sm">
                        <Navigation className="w-5 h-5" />
                      </button>
                      <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2">
                        <Play className="w-4 h-4" />
                        <span>Start</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Progress indicator for in-progress tasks */}
                  {assignment.status === 'in_progress' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>65%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full w-2/3 transition-all duration-300"></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Map Component */}
          <DriverMap assignments={assignments} />
          
          {/* Recent Activity */}
          <RecentActivity assignments={assignments} />
        </div>

        {/* Right Column: Vehicle Status, Performance, etc. */}
        <div className="space-y-6">
          {/* Vehicle Status */}
          <VehicleStatus vehicleInfo={vehicleInfo} />

          {/* Enhanced Performance Metrics */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Performance</h3>
                <p className="text-sm text-gray-500">Your achievements</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Rating with stars */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-5 h-5 ${star <= Math.max(1, Math.round((progressPercent / 100) * 5)) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">Completion Score</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{progressPercent}%</div>
                  <div className="text-xs text-gray-500">Live</div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{assignedCount}</div>
                  <div className="text-xs text-gray-600">Total Tasks</div>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
                  <div className="text-xs text-gray-600">Active Now</div>
                </div>
              </div>

              {/* Achievement badges */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Completed tasks</span>
                  <span className="ml-auto font-semibold text-green-600">{completedCount}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">In-progress tasks</span>
                  <span className="ml-auto font-semibold text-blue-600">{assignments.filter((a) => a.status === 'in_progress').length}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">Cancellation rate</span>
                  <span className="ml-auto font-semibold text-purple-600">{todayStats.cancellationRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Quick Actions */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                <p className="text-sm text-gray-500">One-click shortcuts</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button className="w-full group flex items-center justify-between bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                <div className="flex items-center space-x-3">
                  <Navigation className="w-5 h-5" />
                  <span className="font-semibold">Start Navigation</span>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button className="w-full group flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Report Issue</span>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button className="w-full group flex items-center justify-between bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5" />
                  <span className="font-semibold">Mark Complete</span>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Notifications */}
          <Notifications />
        </div>
      </div>
      
      {/* Floating Action Button */}
      <FloatingActionButton />
      </div>
    </div>
  );
};

export default DashboardPage;
