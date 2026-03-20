import React from 'react';
import { Truck, Fuel, Wrench, CheckCircle, AlertTriangle, Gauge, Settings, Zap } from 'lucide-react';

const VehicleStatus = ({ vehicleInfo }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'operational': return 'text-green-600 bg-green-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'operational': return <CheckCircle className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'offline': return <AlertTriangle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Vehicle Status</h3>
            <p className="text-sm text-gray-500">Real-time monitoring</p>
          </div>
        </div>
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold shadow-lg ${getStatusColor(vehicleInfo.status)}`}>
          {getStatusIcon(vehicleInfo.status)}
          <span>{vehicleInfo.status}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Vehicle Info Cards */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Vehicle Model</p>
                <p className="font-bold text-blue-900">{vehicleInfo.model}</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">License Plate</p>
                <p className="font-bold text-purple-900 text-lg tracking-wider">{vehicleInfo.plate}</p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Capacity & Fuel */}
        <div className="space-y-4">
          {/* Load Capacity */}
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2">
                <Gauge className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">Load Capacity</span>
              </div>
              <span className="text-lg font-bold text-emerald-900">{vehicleInfo.capacity}</span>
            </div>
            <div className="w-full bg-emerald-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: vehicleInfo.capacityPercentage || '0%' }} /* Use the calculated percentage */
              ></div>
            </div>
            <div className="flex justify-between text-xs text-emerald-600 mt-2">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Fuel Level - Only show if available */}
          {vehicleInfo.fuelLevel && (
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                  <Fuel className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-700">Fuel Level</span>
                </div>
                <span className="text-lg font-bold text-orange-900">{vehicleInfo.fuelLevel}</span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: vehicleInfo.fuelLevel }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-orange-600 mt-2">
                <span>Empty</span>
                <span>Half</span>
                <span>Full</span>
              </div>
            </div>
          )}
        </div>

        {/* Maintenance Info */}
        {vehicleInfo.lastMaintenance && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">Last Maintenance</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{vehicleInfo.lastMaintenance}</span>
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Next service in 15 days</span>
            </div>
          </div>
        )}

        {/* Enhanced Quick Actions */}
        <div className="space-y-3">
          <button className="w-full group flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            <div className="flex items-center space-x-3">
              <Wrench className="w-5 h-5" />
              <span className="font-semibold">Request Maintenance</span>
            </div>
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Zap className="w-4 h-4" />
            </div>
          </button>
          
          <button className="w-full group flex items-center justify-between bg-gradient-to-r from-gray-500 to-gray-600 text-white p-4 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5" />
              <span className="font-semibold">Vehicle Settings</span>
            </div>
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Settings className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleStatus;
