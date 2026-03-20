
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CollectionTrendsChart = ({ data = [], loading = false }) => {
  const chartData = Array.isArray(data) && data.length > 0 ? data : [{ name: 'No Data', waste: 0 }];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Collection Trends</h3>
        {loading && <p className="text-sm text-gray-500 mb-2">Loading trends...</p>}
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="waste" stroke="#10b981" activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};

export default CollectionTrendsChart;
