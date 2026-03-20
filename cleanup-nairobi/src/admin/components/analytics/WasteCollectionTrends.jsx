import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const WasteCollectionTrends = ({ data = [] }) => {
  const chartData = Array.isArray(data) && data.length > 0
    ? data
    : [{ name: 'No Data', total: 0, completed: 0, pending: 0 }];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Waste Collection Trends</h3>
      <div className="h-64">
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total" />
            <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
            <Line type="monotone" dataKey="pending" stroke="#f59e0b" name="Pending" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WasteCollectionTrends;
