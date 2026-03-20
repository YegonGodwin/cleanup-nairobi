import React, { useEffect, useMemo, useState } from 'react';
import { Route, MapPin, Navigation, Clock, Fuel, AlertTriangle, XCircle } from 'lucide-react';
import { assignmentsAPI } from '../../../services/api';

const RoutesPage = () => {
  const [activeRoute, setActiveRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchRoutes = async () => {
    try {
      setError(null);
      const response = await assignmentsAPI.getDriverTasks({ limit: 50 });
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.message || 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
    const poll = setInterval(fetchRoutes, 30000);
    return () => clearInterval(poll);
  }, []);

  const routes = useMemo(() => {
    return tasks.map((task) => {
      const report = task.waste_reports || task.report_details || {};
      const status = task.status === 'in_progress'
        ? 'active'
        : task.status === 'completed'
          ? 'completed'
          : task.status === 'cancelled'
            ? 'cancelled'
            : 'scheduled';
      const priority = task.priority || report.priority || 'medium';

      return {
        id: task.id,
        status,
        taskStatus: task.status,
        priority,
        name: report.location || 'Assigned Route',
        totalStops: 1,
        completedStops: task.status === 'completed' ? 1 : 0,
        estimatedTime: task.status === 'in_progress' ? 'In Progress' : 'Pending Start',
        distance: report.latitude && report.longitude ? 'Mapped' : 'Not Mapped',
        fuelConsumption: 'N/A',
        assignedAt: task.assigned_at,
        stops: [
          {
            id: task.report_id || task.id,
            name: report.location || 'Collection Point',
            address: report.location || 'Address unavailable',
            status: task.status === 'completed' ? 'completed' : task.status === 'in_progress' ? 'current' : 'pending',
            time: task.assigned_at ? new Date(task.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
          }
        ]
      };
    });
  }, [tasks]);

  const handleRouteAction = async (route) => {
    try {
      setActionLoadingId(route.id);
      if (route.taskStatus === 'pending') {
        await assignmentsAPI.accept(route.id);
      } else if (route.taskStatus === 'accepted') {
        await assignmentsAPI.start(route.id);
      }
      await fetchRoutes();
    } catch (err) {
      setError(err.message || 'Failed to update route');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStopStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'current': return 'bg-blue-500';
      case 'pending': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">Loading live routes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Route className="w-7 h-7 mr-3 text-emerald-600" />
              My Routes
            </h1>
            <p className="text-gray-600 mt-1">Navigate your assigned collection routes efficiently</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Today's Routes</div>
            <div className="text-2xl font-bold text-gray-900">{routes.length}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {routes.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-600">No assigned routes right now.</p>
        </div>
      )}

      {/* Routes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {routes.map((route) => (
          <div key={route.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Route Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{route.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(route.status)}`}>
                      {route.status === 'active' && <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>}
                      {route.status}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(route.priority)}`}>
                      {route.priority}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {route.completedStops}/{route.totalStops} stops
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {route.estimatedTime}
                    </div>
                    <div className="flex items-center">
                      <Route className="w-4 h-4 mr-1" />
                      {route.distance}
                    </div>
                    <div className="flex items-center">
                      <Fuel className="w-4 h-4 mr-1" />
                      {route.fuelConsumption}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((route.completedStops / route.totalStops) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(route.completedStops / route.totalStops) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Actions */}
            <div className="p-6 bg-gray-50">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveRoute(activeRoute === route.id ? null : route.id)}
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                >
                  {activeRoute === route.id ? 'Hide Details' : 'View Details'}
                </button>
                <div className="flex space-x-2">
                  {(route.taskStatus === 'pending' || route.taskStatus === 'accepted') ? (
                    <button
                      onClick={() => handleRouteAction(route)}
                      disabled={actionLoadingId === route.id}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 disabled:opacity-60"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>
                        {actionLoadingId === route.id
                          ? 'Updating...'
                          : route.taskStatus === 'pending'
                            ? 'Accept Route'
                            : 'Start Route'}
                      </span>
                    </button>
                  ) : route.status === 'active' ? (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                      <Navigation className="w-4 h-4" />
                      <span>Continue</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Route Details (Expandable) */}
            {activeRoute === route.id && (
              <div className="border-t border-gray-200 p-6">
                <h4 className="font-medium text-gray-900 mb-4">Route Stops</h4>
                <div className="space-y-3">
                  {route.stops.map((stop, index) => (
                    <div key={stop.id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${getStopStatusColor(stop.status)}`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{stop.name}</p>
                            <p className="text-xs text-gray-500">{stop.address}</p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {stop.time}
                          </div>
                        </div>
                      </div>
                      {stop.status === 'current' && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Current
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Route Optimization Tip */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-emerald-800 mb-1">Route Optimization Tip</h3>
            <p className="text-sm text-emerald-700">
              Route cards now reflect your live assignments and auto-refresh every 30 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutesPage;
