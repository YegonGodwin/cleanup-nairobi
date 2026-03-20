import React from 'react';

const ZoneComparison = ({ data = [] }) => {
  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Zone Comparison</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No zone data available.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((zone) => (
            <div key={zone.name} className="flex items-center justify-between border-b pb-2">
              <span className="font-medium text-gray-800">{zone.name}</span>
              <span className="text-sm text-gray-500">
                {zone.completed}/{zone.total} completed ({zone.rate}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ZoneComparison;
