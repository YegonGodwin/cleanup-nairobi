
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import ReportForm from '../components/reports/ReportForm';
import ReportsList from '../components/reports/ReportsList';
import { FaPlus, FaList } from 'react-icons/fa';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleReportCreated = (newReport) => {
    // Trigger refresh of the reports list
    setRefreshTrigger(prev => prev + 1);
    // Switch back to list view
    setActiveTab('list');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with tabs */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Waste Reports</h1>
            <p className="text-gray-600 mt-1">
              Report waste issues and track their collection status
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaList size={14} />
            My Reports
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaPlus size={14} />
            Create Report
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'list' && (
          <ReportsList refreshTrigger={refreshTrigger} />
        )}
        
        {activeTab === 'create' && (
          <ReportForm onReportCreated={handleReportCreated} />
        )}
      </div>
    </div>
  );
};

export default Reports;
