import React from 'react';

const TopPerformingZones = ({ zones = [] }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Top Performing Zones</h3>
      {zones.length === 0 ? (
        <p className="text-sm text-gray-500">No zone performance data available.</p>
      ) : (
        <div className="space-y-3">
          {zones.map((zone, idx) => (
            <div key={zone.name} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">{idx + 1}. {zone.name}</span>
              <span className="text-xs text-emerald-600 font-semibold">{zone.rate}% completion</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopPerformingZones;
