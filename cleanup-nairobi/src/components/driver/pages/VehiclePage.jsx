import React, { useState, useEffect } from 'react';
import { 
  Truck, Calendar, MapPin, Navigation, 
  AlertCircle, Shield, FileText, Activity 
} from 'lucide-react';
import { assignmentsAPI, driversAPI } from '../../../services/api';
import VehicleStatus from '../dashboard-components/VehicleStatus';
import LoadingDashboard from '../dashboard-components/LoadingDashboard';

const VehiclePage = () => {
  const [vehicle, setVehicle] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const [vehicleResponse, assignmentsResponse] = await Promise.all([
          driversAPI.getAssignedVehicle(),
          assignmentsAPI.getDriverTasks({ limit: 10 })
        ]);

        let vehicleData = vehicleResponse.data;
        if (Array.isArray(vehicleData)) {
          vehicleData = vehicleData[0] || null;
        }

        setVehicle(vehicleData);
        setAssignments(Array.isArray(assignmentsResponse.data) ? assignmentsResponse.data : []);
      } catch (err) {
        console.error('Error fetching vehicle:', err);
        setError('Failed to load vehicle information');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, []);

  if (loading) return <LoadingDashboard />;

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Truck className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Vehicle Assigned</h2>
          <p className="text-gray-500 mb-8">
            You haven't been assigned a vehicle yet. Please contact your fleet manager or administrator to get a vehicle assignment.
          </p>
        </div>
      </div>
    );
  }

  // Transform data for VehicleStatus component
  const vehicleStatusInfo = {
    model: vehicle?.type || 'Unknown Model', 
    plate: vehicle?.registration_number || 'N/A',
    status: vehicle?.status || 'Unknown',
    capacity: vehicle?.capacity ? `${vehicle.capacity} tons` : 'N/A', 
    lastMaintenance: vehicle?.updated_at ? new Date(vehicle.updated_at).toLocaleDateString() : 'N/A'
  };

  const recentUsage = assignments
    .slice()
    .sort((a, b) => new Date(b.updated_at || b.assigned_at) - new Date(a.updated_at || a.assigned_at))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Vehicle</h1>
          <p className="text-gray-500">Manage and monitor your assigned vehicle</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
          vehicle.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {vehicle.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Vehicle Status Card (Reused) */}
        <div className="lg:col-span-1">
          <VehicleStatus vehicleInfo={vehicleStatusInfo} />
        </div>

        {/* Details & Map Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Vehicle Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Purchase Date</p>
                    <p className="font-semibold">{vehicle.purchase_date ? new Date(vehicle.purchase_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Insurance Status</p>
                    <p className="font-semibold text-gray-700">{vehicle.insurance_status || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Location</p>
                    <p className="font-semibold">{vehicle.location || 'Unknown'}</p>
                    {vehicle.current_latitude && (
                      <p className="text-xs text-gray-400 mt-1">
                        Lat: {vehicle.current_latitude}, Long: {vehicle.current_longitude}
                      </p>
                    )}
                  </div>
                </div>

                {vehicle.notes && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Notes</p>
                      <p className="font-medium text-gray-700">{vehicle.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity/History Placeholder */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
             <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Recent Usage
            </h3>
            {recentUsage.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No recent activity logs available.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUsage.map((assignment) => {
                  const report = assignment.waste_reports || assignment.report_details || {};
                  return (
                    <div key={assignment.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                      <div>
                        <p className="font-medium text-gray-900">{report.location || 'Collection Point'}</p>
                        <p className="text-xs text-gray-500">
                          {assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                        {(assignment.status || 'pending').replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehiclePage;
