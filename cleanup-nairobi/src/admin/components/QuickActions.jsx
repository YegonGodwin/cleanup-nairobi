
import React from 'react';
import { Plus, FileText, Truck, BarChart } from 'lucide-react';

const QuickActions = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="flex flex-col items-center justify-center p-4 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors">
          <Plus size={24} />
          <span className="mt-2 text-sm font-medium">New Collection</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors">
          <FileText size={24} />
          <span className="mt-2 text-sm font-medium">Manual Report</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors">
          <Truck size={24} />
          <span className="mt-2 text-sm font-medium">Add Vehicle</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors">
          <BarChart size={24} />
          <span className="mt-2 text-sm font-medium">Generate Report</span>
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
