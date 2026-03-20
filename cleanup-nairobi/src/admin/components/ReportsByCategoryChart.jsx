
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#059669', '#d1fae5', '#6ee7b7'];

const ReportsByCategoryChart = ({ data = [], loading = false }) => {
  const chartData = Array.isArray(data) && data.length > 0 ? data : [{ name: 'No Data', value: 1 }];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Reports by Category</h3>
        {loading && <p className="text-sm text-gray-500 mb-2">Loading categories...</p>}
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    </div>
  );
};

export default ReportsByCategoryChart;
