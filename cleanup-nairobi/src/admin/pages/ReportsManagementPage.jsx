import React, { useState, useEffect } from 'react';
import { FaFilter, FaSort, FaFileExport, FaPlus, FaBell } from 'react-icons/fa';
import { reportsAPI, driversAPI, notificationsAPI } from '../../services/api';
import ReportsTable from '../components/ReportsTable';
import ReportAssignmentModal from '../components/ReportAssignmentModal';

const ReportsManagementPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'All',
    category: 'All',
    priority: 'All',
    zone: 'All',
    dateRange: 'Last 30 days',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [sort, setSort] = useState({
    field: 'createdAt',
    order: 'desc',
  });
  const [selectedReports, setSelectedReports] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [selectedReportForAssignment, setSelectedReportForAssignment] = useState(null);
  const [driversLoading, setDriversLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchDrivers();
    fetchNotifications();
  }, [filters, pagination.page, pagination.limit, sort]);

  // Auto-refresh notifications and reports every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
      // Only refresh reports if we're on the first page to avoid disrupting user navigation
      if (pagination.page === 1) {
        fetchReports(true); // Use silent refresh
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [pagination.page]);

  // Real-time updates when new reports are detected
  useEffect(() => {
    if (unreadCount > 0) {
      // Show browser notification if permission is granted
      if (Notification.permission === 'granted') {
        new Notification(`${unreadCount} new waste report${unreadCount > 1 ? 's' : ''}`, {
          body: 'New reports require your attention',
          icon: '/favicon.ico',
          tag: 'new-reports'
        });
      }
    }
  }, [unreadCount]);

  // Request notification permission on component mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchReports = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sort.field,
        order: sort.order,
        ...filters,
      };
      const data = await reportsAPI.getAll(params);
      console.log('API Response:', data);
      setReports(data.reports || data.data || []);
      setPagination((prev) => ({ ...prev, total: data.total || data.pagination?.total || 0 }));
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchDrivers = async () => {
    setDriversLoading(true);
    try {
      const data = await driversAPI.getAvailable();
      setDrivers(data.data?.drivers || []);
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
      setDrivers([]); // Also set to empty array on error
    } finally {
      setDriversLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationsAPI.getAll({ type: 'report_created', is_read: false });
      setNotifications(data.notifications || data.data || []);
      setUnreadCount(data.unreadCount || (data.notifications || data.data || []).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  const handleSortChange = (field) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedReports(reports.map((report) => report.id));
    } else {
      setSelectedReports([]);
    }
  };

  const handleSelectReport = (reportId) => {
    setSelectedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  const clearAllFilters = () => {
    setFilters({
      status: 'All',
      category: 'All',
      priority: 'All',
      zone: 'All',
      dateRange: 'Last 30 days',
      search: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Bulk actions
  const handleBulkAction = (action) => {
    console.log(`Performing bulk action: ${action} on reports:`, selectedReports);
    // Implement actual API calls here
    setSelectedReports([]);
  };

  // Report actions
  const handleViewReport = (reportId) => {
    console.log('View report:', reportId);
    // Implement report detail view
  };

  const handleEditReport = (reportId) => {
    console.log('Edit report:', reportId);
    // Implement report editing
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await reportsAPI.delete(reportId);
        fetchReports(); // Refresh the list
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Assignment modal handlers
  const handleAssignDriver = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    setSelectedReportForAssignment(report);
    setIsAssignmentModalOpen(true);
  };

  const handleAssignmentSubmit = async (assignmentData) => {
    try {
      await reportsAPI.assignToDriver(assignmentData.reportId, {
        driver_id: assignmentData.driverId,
        notes: assignmentData.notes,
        priority: assignmentData.priority
      });
      
      // Refresh reports and close modal
      fetchReports();
      setIsAssignmentModalOpen(false);
      setSelectedReportForAssignment(null);
    } catch (err) {
      throw new Error(err.message || 'Failed to assign driver');
    }
  };

  const closeAssignmentModal = () => {
    setIsAssignmentModalOpen(false);
    setSelectedReportForAssignment(null);
  };

  // Notification handlers
  const handleNotificationClick = async (notification) => {
    try {
      await notificationsAPI.markAsRead(notification.id);
      fetchNotifications();
      
      // Navigate to the related report if available
      if (notification.related_report_id) {
        handleViewReport(notification.related_report_id);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };


  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Waste Reports Management</h1>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Reports</p>
            <p className="text-2xl font-semibold text-gray-900">
              {pagination.total || reports.length}
            </p>
          </div>
          <div className="p-2 bg-blue-100 rounded-lg">
            <FaFilter className="text-blue-600 text-xl" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-semibold text-yellow-600">
              {reports.filter(r => r.status === 'pending').length}
            </p>
          </div>
          <div className="p-2 bg-yellow-100 rounded-lg">
            <FaFilter className="text-yellow-600 text-xl" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Assigned</p>
            <p className="text-2xl font-semibold text-blue-600">
              {reports.filter(r => r.status === 'assigned' || r.status === 'in_progress').length}
            </p>
          </div>
          <div className="p-2 bg-blue-100 rounded-lg">
            <FaFilter className="text-blue-600 text-xl" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-semibold text-green-600">
              {reports.filter(r => r.status === 'completed').length}
            </p>
          </div>
          <div className="p-2 bg-green-100 rounded-lg">
            <FaFilter className="text-green-600 text-xl" />
          </div>
        </div>
      </div>

      {/* Notifications Bar */}
      {unreadCount > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <FaBell className="text-blue-500 mr-3 text-lg" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </div>
              <div>
                <span className="text-blue-800 font-medium">
                  {unreadCount} new report{unreadCount > 1 ? 's' : ''} submitted
                </span>
                <p className="text-xs text-blue-600 mt-1">
                  Click on a report to view details and mark as read
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {notifications.slice(0, 3).map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="text-xs bg-white text-blue-800 px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm"
                  title={notification.message}
                >
                  #{notification.related_report_id?.substring(0, 8)}...
                </button>
              ))}
              {unreadCount > 3 && (
                <button
                  onClick={() => {
                    // Show all notifications
                    console.log('Show all notifications');
                  }}
                  className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                >
                  +{unreadCount - 3} more
                </button>
              )}
              <button
                onClick={async () => {
                  try {
                    const notificationIds = notifications.map(n => n.id);
                    await notificationsAPI.markMultipleAsRead(notificationIds);
                    fetchNotifications();
                  } catch (err) {
                    console.error('Failed to mark all as read:', err);
                  }
                }}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
              >
                Mark all read
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={() => {
              fetchReports(true);
              fetchNotifications();
            }}
            disabled={isRefreshing}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center disabled:opacity-50"
          >
            {isRefreshing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Refreshing...
              </>
            ) : (
              <>
                <FaSort className="mr-1" />
                Refresh
              </>
            )}
          </button>
        </div>
        <div className="flex space-x-3">
          <button className="btn bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center">
            <FaFileExport className="mr-2" /> Export CSV
          </button>
          <button className="btn bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center">
            <FaPlus className="mr-2" /> New Report
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option>All</option>
              <option>New</option>
              <option>Under Review</option>
              <option>Assigned</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option>All</option>
              <option>Organic</option>
              <option>Plastic</option>
              <option>E-waste</option>
              <option>Paper</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              id="priority"
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option>All</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>

          {/* Zone Filter */}
          <div>
            <label htmlFor="zone" className="block text-sm font-medium text-gray-700">Zone</label>
            <select
              id="zone"
              name="zone"
              value={filters.zone}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option>All</option>
              <option>Central</option>
              <option>East</option>
              <option>West</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">Date Range</label>
            <select
              id="dateRange"
              name="dateRange"
              value={filters.dateRange}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option>Today</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Custom</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="col-span-full md:col-span-2 lg:col-span-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search reports..."
              className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="col-span-full md:col-span-1 flex justify-end">
            <button
              onClick={clearAllFilters}
              className="btn bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedReports.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex items-center space-x-4">
          <span className="text-gray-700">{selectedReports.length} reports selected</span>
          <select
            onChange={(e) => handleBulkAction(e.target.value)}
            className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">Bulk Actions</option>
            <option value="assign">Assign to operator</option>
            <option value="status">Update status</option>
            <option value="priority">Change priority</option>
            <option value="export">Export selected</option>
            <option value="delete">Delete selected</option>
          </select>
        </div>
      )}

      {/* Reports Table */}
      <ReportsTable
        reports={reports}
        loading={loading}
        error={error}
        selectedReports={selectedReports}
        onSelectAll={handleSelectAll}
        onSelectReport={handleSelectReport}
        onSort={handleSortChange}
        sort={sort}
        onAssignDriver={handleAssignDriver}
        onViewReport={handleViewReport}
        onEditReport={handleEditReport}
        onDeleteReport={handleDeleteReport}
      />

      {/* Pagination */}
      {!loading && !error && reports.length > 0 && (
        <nav
          className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow"
          aria-label="Pagination"
        >
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-medium">{pagination.total}</span> results
            </p>
          </div>
          <div className="flex-1 flex justify-between sm:justify-end">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page * pagination.limit >= pagination.total}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </nav>
      )}

      {/* Assignment Modal */}
      <ReportAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={closeAssignmentModal}
        report={selectedReportForAssignment}
        drivers={drivers}
        onAssign={handleAssignmentSubmit}
        loading={driversLoading}
      />
    </div>
  );
};

export default ReportsManagementPage;
