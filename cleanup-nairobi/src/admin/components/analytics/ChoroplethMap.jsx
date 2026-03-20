import React from 'react';

const ChoroplethMap = ({ zones = [] }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Zone Intensity Map</h3>
      {zones.length === 0 ? (
        <p className="text-sm text-gray-500">No zone intensity data available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {zones.map((zone) => (
            <div key={zone.name} className="p-3 border rounded-md bg-gray-50">
              <p className="font-medium text-gray-800">{zone.name}</p>
              <p className="text-xs text-gray-500">Total Reports: {zone.total}</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, zone.total * 5)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChoroplethMap;
