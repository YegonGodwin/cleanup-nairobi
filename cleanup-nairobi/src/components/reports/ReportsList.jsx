import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/Button';
import { reportsAPI } from '../../services/api';
import ReportCard from './ReportCard';
import { FaFilter, FaSpinner, FaExclamationCircle } from 'react-icons/fa';

const ReportsList = ({ refreshTrigger }) => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    waste_type: 'all',
    sort: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Add error boundary protection
  const [hasError, setHasError] = useState(false);

  // Reset error state when refreshTrigger changes
  useEffect(() => {
    setHasError(false);
    setError(null);
  }, [refreshTrigger]);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const wasteTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'plastic', label: 'Plastic' },
    { value: 'organic', label: 'Organic' },
    { value: 'paper', label: 'Paper' },
    { value: 'metal', label: 'Metal' },
    { value: 'glass', label: 'Glass' },
    { value: 'electronic', label: 'Electronic' },
    { value: 'mixed', label: 'Mixed' },
    { value: 'other', label: 'Other' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'status', label: 'By Status' },
    { value: 'location', label: 'By Location' }
  ];

  // Fetch user's reports
  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await reportsAPI.getUserReports();
      
      // Debug logging
      console.log('API Response:', response);
      
      // The API returns { reports: [], pagination: {} } structure
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          // If data is directly an array (fallback)
          setReports(response.data);
        } else if (response.data.reports && Array.isArray(response.data.reports)) {
          // If data has reports property
          setReports(response.data.reports);
        } else {
          // Unexpected structure
          console.warn('Unexpected API response structure:', response.data);
          setReports([]);
        }
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message || 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and refresh when trigger changes
  useEffect(() => {
    if (!hasError) {
      fetchReports();
    }
  }, [refreshTrigger, hasError]);

  // Apply filters and sorting with error protection
  useEffect(() => {
    try {
      if (!Array.isArray(reports)) {
        console.warn('Reports is not an array:', reports);
        setFilteredReports([]);
        return;
      }

      let filtered = [...reports];

      // Apply status filter
      if (filters.status !== 'all') {
        filtered = filtered.filter(report => report && report.status === filters.status);
      }

      // Apply waste type filter
      if (filters.waste_type !== 'all') {
        filtered = filtered.filter(report => report && report.waste_type === filters.waste_type);
      }

      // Apply sorting with null checks
      filtered.sort((a, b) => {
        if (!a || !b) return 0;
        
        switch (filters.sort) {
          case 'newest':
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
          case 'oldest':
            return new Date(a.created_at || 0) - new Date(b.created_at || 0);
          case 'status':
            return (a.status || '').localeCompare(b.status || '');
          case 'location':
            return (a.location || '').localeCompare(b.location || '');
          default:
            return 0;
        }
      });

      setFilteredReports(filtered);
    } catch (err) {
      console.error('Error in filtering/sorting:', err);
      setFilteredReports([]);
    }
  }, [reports, filters]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  // Handle report click
  const handleReportClick = (report) => {
    // This will be handled by the parent component or routing
    console.log('Report clicked:', report);
  };

  // Test API connection
  const testAPI = async () => {
    try {
      console.log('Testing API connection...');
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }
      
      // Test the API endpoint directly
      const response = await fetch('http://localhost:5000/api/reports/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Response status:', response.status);
      const data = await response.json();
      console.log('API Response data:', data);
      
      if (response.ok) {
        if (data.data && data.data.reports) {
          setReports(data.data.reports);
        } else {
          setReports([]);
        }
      } else {
        setError(data.message || 'Failed to fetch reports');
      }
    } catch (err) {
      console.error('API Test Error:', err);
      setError('Failed to connect to server. Please check if the backend is running.');
    }
  };

  // Retry loading
  const handleRetry = () => {
    fetchReports();
  };

  // Test API directly
  const handleTestAPI = () => {
    testAPI();
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <FaSpinner className="animate-spin text-3xl text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your reports...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <FaExclamationCircle className="text-3xl text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleRetry} variant="outline">
              Try Again
            </Button>
            <Button onClick={handleTestAPI} variant="outline">
              Test API
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error boundary fallback
  if (hasError) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <FaExclamationCircle className="text-3xl text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Something went wrong while loading the reports.</p>
          <Button onClick={() => {
            setHasError(false);
            setError(null);
            fetchReports();
          }} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  try {
    return (
      <div className="w-full space-y-6">
        {/* Header with filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Reports</h2>
            <p className="text-gray-600">
              {Array.isArray(filteredReports) ? filteredReports.length : 0} of {Array.isArray(reports) ? reports.length : 0} reports
            </p>
          </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <FaFilter />
            Filters
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Waste Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waste Type
                </label>
                <select
                  value={filters.waste_type}
                  onChange={(e) => handleFilterChange('waste_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {wasteTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports Grid/List */}
      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {reports.length === 0 ? 'No reports yet' : 'No reports match your filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {reports.length === 0 
                ? 'Start by creating your first waste report to help keep Nairobi clean.'
                : 'Try adjusting your filters to see more reports.'
              }
            </p>
            {reports.length === 0 && (
              <Button onClick={() => window.location.hash = '#create-report'}>
                Create Your First Report
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onClick={() => handleReportClick(report)}
            />
          ))}
        </div>
      )}
    </div>
  );
  } catch (renderError) {
    console.error('Render error in ReportsList:', renderError);
    setHasError(true);
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <FaExclamationCircle className="text-3xl text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Error rendering reports list.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload Page
          </Button>
        </CardContent>
      </Card>
    );
  }
};

export default ReportsList;