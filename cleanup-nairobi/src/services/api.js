import { apiRequest, withErrorHandling, handleAuthenticationError } from '../utils/apiErrorHandler';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Enhanced API request wrapper with error handling
const makeAPIRequest = async (endpoint, options = {}, context = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    return await apiRequest(url, {
      headers: getAuthHeaders(),
      ...options
    }, {
      endpoint,
      ...context
    });
  } catch (error) {
    // Handle authentication errors globally
    handleAuthenticationError(error);
    throw error;
  }
};

// Authentication API with enhanced error handling
export const authAPI = {
  // Register new user
  register: withErrorHandling(async (userData) => {
    return await makeAPIRequest('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }, { operation: 'register' });
  }, { showToast: true }),

  // Login user
  login: withErrorHandling(async (credentials) => {
    return await makeAPIRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }, { operation: 'login' });
  }, { showToast: true }),

  // Get user profile
  getProfile: withErrorHandling(async () => {
    return await makeAPIRequest('/api/auth/profile', {
      method: 'GET',
    }, { operation: 'getProfile' });
  }, { showToast: false }), // Don't show toast for profile fetch failures

  // Update user profile
  updateProfile: withErrorHandling(async (profileData) => {
    return await makeAPIRequest('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }, { operation: 'updateProfile' });
  }, { showToast: true }),

  // Change password
  changePassword: withErrorHandling(async (passwordData) => {
    return await makeAPIRequest('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    }, { operation: 'changePassword' });
  }, { showToast: true }),
};

// Events API with enhanced error handling
export const eventsAPI = {
  // Get all events
  getAll: withErrorHandling(async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await makeAPIRequest(`/api/events?${queryString}`, {
      method: 'GET',
    }, { operation: 'getAllEvents', params });
  }, { showToast: false }),

  // Get event by ID
  getById: withErrorHandling(async (id) => {
    return await makeAPIRequest(`/api/events/${id}`, {
      method: 'GET',
    }, { operation: 'getEventById', eventId: id });
  }, { showToast: false }),

  // Join event
  join: withErrorHandling(async (eventId) => {
    return await makeAPIRequest(`/api/events/${eventId}/join`, {
      method: 'POST',
    }, { operation: 'joinEvent', eventId });
  }, { showToast: true }),

  // Leave event
  leave: withErrorHandling(async (eventId) => {
    return await makeAPIRequest(`/api/events/${eventId}/leave`, {
      method: 'DELETE',
    }, { operation: 'leaveEvent', eventId });
  }, { showToast: true }),

  // Get events joined by current user
  getMyEvents: withErrorHandling(async () => {
    return await makeAPIRequest('/api/events/my-events', {
      method: 'GET',
    }, { operation: 'getMyEvents' });
  }, { showToast: false }),
};

// Waste Reports API with enhanced error handling
export const reportsAPI = {
  // Create waste report with comprehensive validation
  create: withErrorHandling(async (reportData) => {
    // Validate required fields before sending
    const requiredFields = ['location', 'description', 'waste_type'];
    const missingFields = requiredFields.filter(field => !reportData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate waste_type enum
    const validWasteTypes = ['plastic', 'organic', 'metal', 'glass', 'paper', 'electronic', 'hazardous', 'mixed'];
    if (!validWasteTypes.includes(reportData.waste_type)) {
      throw new Error(`Invalid waste type. Must be one of: ${validWasteTypes.join(', ')}`);
    }

    return await makeAPIRequest('/api/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
      maxRetries: 2, // Reduce retries for create operations
    }, { operation: 'createReport', reportData });
  }, { 
    showToast: true,
    toastOptions: { 
      duration: 6000,
      showRetry: true 
    }
  }),

  // Get user's reports with optional filtering
  getUserReports: withErrorHandling(async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/reports/user?${queryString}` : '/api/reports/user';
    
    return await makeAPIRequest(endpoint, {
      method: 'GET',
    }, { operation: 'getUserReports', params });
  }, { showToast: false }),

  // Get all reports (admin) with comprehensive filtering
  getAll: withErrorHandling(async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/reports?${queryString}` : '/api/reports';
    
    return await makeAPIRequest(endpoint, {
      method: 'GET',
    }, { operation: 'getAllReports', params });
  }, { showToast: false }),

  // Get report by ID with detailed information
  getById: withErrorHandling(async (id) => {
    if (!id) {
      throw new Error('Report ID is required');
    }

    return await makeAPIRequest(`/api/reports/${id}`, {
      method: 'GET',
    }, { operation: 'getReportById', reportId: id });
  }, { showToast: false }),

  // Update report (admin only)
  update: withErrorHandling(async (reportId, updateData) => {
    if (!reportId) {
      throw new Error('Report ID is required');
    }

    return await makeAPIRequest(`/api/reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }, { operation: 'updateReport', reportId, updateData });
  }, { 
    showToast: true,
    toastOptions: { 
      duration: 4000,
      showRetry: true 
    }
  }),

  // Assign report to driver with validation
  assignToDriver: withErrorHandling(async (reportId, assignmentData) => {
    if (!reportId) {
      throw new Error('Report ID is required');
    }
    if (!assignmentData.driver_id) {
      throw new Error('Driver ID is required for assignment');
    }

    return await makeAPIRequest(`/api/reports/${reportId}/assign`, {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    }, { operation: 'assignReportToDriver', reportId, assignmentData });
  }, { 
    showToast: true,
    toastOptions: { 
      duration: 5000,
      showRetry: true 
    }
  }),

  // Update report status with validation
  updateStatus: withErrorHandling(async (reportId, statusData) => {
    if (!reportId) {
      throw new Error('Report ID is required');
    }

    const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'rejected'];
    if (statusData.status && !validStatuses.includes(statusData.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return await makeAPIRequest(`/api/reports/${reportId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    }, { operation: 'updateReportStatus', reportId, statusData });
  }, { 
    showToast: true,
    toastOptions: { 
      duration: 4000,
      showRetry: true 
    }
  }),

  // Get report status history
  getStatusHistory: withErrorHandling(async (reportId) => {
    if (!reportId) {
      throw new Error('Report ID is required');
    }

    return await makeAPIRequest(`/api/reports/${reportId}/history`, {
      method: 'GET',
    }, { operation: 'getReportStatusHistory', reportId });
  }, { showToast: false }),

  // Delete report (admin only)
  delete: withErrorHandling(async (reportId) => {
    if (!reportId) {
      throw new Error('Report ID is required');
    }

    return await makeAPIRequest(`/api/reports/${reportId}`, {
      method: 'DELETE',
    }, { operation: 'deleteReport', reportId });
  }, { 
    showToast: true,
    toastOptions: { 
      duration: 4000 
    }
  }),
};

// User Management API with enhanced error handling
export const userAPI = {
  getAllUsers: withErrorHandling(async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await makeAPIRequest(`/api/admin/users?${queryString}`, {
      method: 'GET',
    }, { operation: 'getAllUsers', params });
  }, { showToast: false }),

  getUserById: withErrorHandling(async (id) => {
    return await makeAPIRequest(`/api/admin/users/${id}`, {
      method: 'GET',
    }, { operation: 'getUserById', userId: id });
  }, { showToast: false }),

  updateUserRole: withErrorHandling(async (id, roleData) => {
    return await makeAPIRequest(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    }, { operation: 'updateUserRole', userId: id, roleData });
  }, { showToast: true }),

  deleteUser: withErrorHandling(async (id) => {
    return await makeAPIRequest(`/api/admin/users/${id}`, {
      method: 'DELETE',
    }, { operation: 'deleteUser', userId: id });
  }, { 
    showToast: true,
    toastOptions: { 
      duration: 4000 
    }
  }),
};

// Admin API for dashboard and management views
export const adminAPI = {
  getDashboardStats: withErrorHandling(async () => {
    return await makeAPIRequest('/api/admin/stats', {
      method: 'GET',
    }, { operation: 'getDashboardStats' });
  }, { showToast: false }),

  getRecentActivities: withErrorHandling(async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/admin/activities?${queryString}` : '/api/admin/activities';
    return await makeAPIRequest(endpoint, {
      method: 'GET',
    }, { operation: 'getRecentActivities', params });
  }, { showToast: false }),
};

// Drivers API with enhanced error handling
export const driversAPI = {
  // Get all available drivers
  getAvailable: withErrorHandling(async () => {
    return await makeAPIRequest('/api/drivers/available', {
      method: 'GET',
    }, { operation: 'getAvailableDrivers' });
  }, { showToast: false }),

  // Get all drivers
  getAll: withErrorHandling(async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await makeAPIRequest(`/api/drivers?${queryString}`, {
      method: 'GET',
    }, { operation: 'getAllDrivers', params });
  }, { showToast: false }),

  // Get assigned vehicle for the current driver
  getAssignedVehicle: withErrorHandling(async () => {
    const response = await makeAPIRequest('/api/drivers/vehicle', {
      method: 'GET',
    }, { operation: 'getAssignedVehicle' });

    // Normalize backend payload variants into a single vehicle object or null.
    let vehicleData = response?.data ?? null;
    if (Array.isArray(vehicleData)) {
      vehicleData = vehicleData[0] || null;
    }
    if (vehicleData?.vehicles) {
      vehicleData = Array.isArray(vehicleData.vehicles)
        ? (vehicleData.vehicles[0] || null)
        : vehicleData.vehicles;
    }

    return {
      ...response,
      data: vehicleData || null
    };
  }, { showToast: false }),

  // Create driver (admin only)
  create: withErrorHandling(async (driverData) => {
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'password', 'phone', 'vehicleNumber', 'vehicleType', 'licenseNumber'];
    const missingFields = requiredFields.filter(field => !driverData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    return await makeAPIRequest('/api/admin/drivers', {
      method: 'POST',
      body: JSON.stringify(driverData),
    }, { operation: 'createDriver', driverData });
  }, { 
    showToast: true,
    toastOptions: { 
      duration: 5000,
      showRetry: true 
    }
  }),
};

// Assignments API with enhanced error handling and comprehensive operations
export const assignmentsAPI = {
  // Get driver assignments with filtering and pagination
  getDriverTasks: withErrorHandling(async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/assignments/driver?${queryString}` : '/api/assignments/driver';
    
    return await makeAPIRequest(endpoint, {
      method: 'GET',
    }, { operation: 'getDriverTasks', params });
  }, { showToast: false }),

  // Get all assignments (admin view)
  getAll: withErrorHandling(async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/assignments?${queryString}` : '/api/assignments';
    
    return await makeAPIRequest(endpoint, {
      method: 'GET',
    }, { operation: 'getAllAssignments', params });
  }, { showToast: false }),

  // Get assignment by ID with detailed information
  getById: withErrorHandling(async (assignmentId) => {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }

    return await makeAPIRequest(`/api/assignments/${assignmentId}`, {
      method: 'GET',
    }, { operation: 'getAssignmentById', assignmentId });
  }, { showToast: false }),

  // Accept assignment with validation
  accept: withErrorHandling(async (assignmentId, acceptanceData = {}) => {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }

    return await makeAPIRequest(`/api/assignments/${assignmentId}/accept`, {
      method: 'PUT',
      body: JSON.stringify(acceptanceData),
    }, { operation: 'acceptAssignment', assignmentId, acceptanceData });
  }, { 
    showToast: true,
    toastOptions: { 
      duration: 4000,
      showRetry: true 
    }
  }),

  // Start assignment with validation
  start: withErrorHandling(async (assignmentId, startData = {}) => {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }

    return await makeAPIRequest(`/api/assignments/${assignmentId}/start`, {
      method: 'PUT',
      body: JSON.stringify(startData),
    }, { operation: 'startAssignment', assignmentId, startData });
  }, { 
    showToast: true,
    toastOptions: { 
      duration: 4000,
      showRetry: true 
    }
  }),

  // Complete assignment with comprehensive data
  complete: withErrorHandling(async (assignmentId, completionData = {}) => {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }

    // Validate completion data if provided
    if (completionData.completion_image_url && typeof completionData.completion_image_url !== 'string') {
      throw new Error('Completion image URL must be a string');
    }

    return await makeAPIRequest(`/api/assignments/${assignmentId}/complete`, {
      method: 'PUT',
      body: JSON.stringify(completionData),
    }, { operation: 'completeAssignment', assignmentId, completionData });
  }, { 
    showToast: true,
    toastOptions: { 
      duration: 5000,
      showRetry: true 
    }
  }),

  // Cancel assignment with reason
  cancel: withErrorHandling(async (assignmentId, cancellationData = {}) => {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }

    return await makeAPIRequest(`/api/assignments/${assignmentId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify(cancellationData),
    }, { operation: 'cancelAssignment', assignmentId, cancellationData });
  }, { 
    showToast: true,
    toastOptions: { 
      duration: 4000,
      showRetry: true 
    }
  }),

  // Update assignment status (admin only)
  updateStatus: withErrorHandling(async (assignmentId, statusData) => {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }

    const validStatuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
    if (statusData.status && !validStatuses.includes(statusData.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return await makeAPIRequest(`/api/assignments/${assignmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    }, { operation: 'updateAssignmentStatus', assignmentId, statusData });
  }, { 
    showToast: true,
    toastOptions: { 
      duration: 4000,
      showRetry: true 
    }
  }),

  // Get assignment history
  getHistory: withErrorHandling(async (assignmentId) => {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }

    return await makeAPIRequest(`/api/assignments/${assignmentId}/history`, {
      method: 'GET',
    }, { operation: 'getAssignmentHistory', assignmentId });
  }, { showToast: false }),

  // Bulk operations for assignments
  bulkUpdate: withErrorHandling(async (assignmentIds, updateData) => {
    if (!Array.isArray(assignmentIds) || assignmentIds.length === 0) {
      throw new Error('Assignment IDs array is required');
    }

    return await makeAPIRequest('/api/assignments/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({ assignmentIds, updateData }),
    }, { operation: 'bulkUpdateAssignments', assignmentIds, updateData });
  }, { 
    showToast: true,
    toastOptions: { 
      duration: 5000,
      showRetry: true 
    }
  }),
};

// Notifications API with enhanced error handling and real-time capabilities
export const notificationsAPI = {
  // Get user notifications with comprehensive filtering
  getAll: withErrorHandling(async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/notifications?${queryString}` : '/api/notifications';
    
    return await makeAPIRequest(endpoint, {
      method: 'GET',
    }, { operation: 'getAllNotifications', params });
  }, { showToast: false }),

  // Alias for getAll to match component usage
  getNotifications: withErrorHandling(async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/notifications?${queryString}` : '/api/notifications';
    
    return await makeAPIRequest(endpoint, {
      method: 'GET',
    }, { operation: 'getNotifications', params });
  }, { showToast: false }),

  // Get notification by ID
  getById: withErrorHandling(async (notificationId) => {
    if (!notificationId) {
      throw new Error('Notification ID is required');
    }

    return await makeAPIRequest(`/api/notifications/${notificationId}`, {
      method: 'GET',
    }, { operation: 'getNotificationById', notificationId });
  }, { showToast: false }),

  // Get unread notifications count
  getUnreadCount: withErrorHandling(async () => {
    return await makeAPIRequest('/api/notifications/unread-count', {
      method: 'GET',
    }, { operation: 'getUnreadNotificationsCount' });
  }, { showToast: false }),

  // Get notification counts (read/unread/total)
  getCounts: withErrorHandling(async () => {
    return await makeAPIRequest('/api/notifications/counts', {
      method: 'GET',
    }, { operation: 'getNotificationCounts' });
  }, { showToast: false }),

  // Mark notification as read
  markAsRead: withErrorHandling(async (notificationId) => {
    if (!notificationId) {
      throw new Error('Notification ID is required');
    }

    return await makeAPIRequest(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    }, { operation: 'markNotificationAsRead', notificationId });
  }, { showToast: false }), // Silent operation

  // Mark multiple notifications as read
  markMultipleAsRead: withErrorHandling(async (notificationIds) => {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw new Error('Notification IDs array is required');
    }

    return await makeAPIRequest('/api/notifications/bulk-read', {
      method: 'PUT',
      body: JSON.stringify({ notification_ids: notificationIds }),
    }, { operation: 'markMultipleNotificationsAsRead', notificationIds });
  }, { showToast: false }), // Silent operation

  // Mark all notifications as read
  markAllAsRead: withErrorHandling(async () => {
    return await makeAPIRequest('/api/notifications/mark-all-read', {
      method: 'PUT',
    }, { operation: 'markAllNotificationsAsRead' });
  }, { showToast: false }), // Silent operation

  // Delete notification
  delete: withErrorHandling(async (notificationId) => {
    if (!notificationId) {
      throw new Error('Notification ID is required');
    }

    return await makeAPIRequest(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    }, { operation: 'deleteNotification', notificationId });
  }, { 
    showToast: false, // Silent operation
    toastOptions: { 
      duration: 3000 
    }
  }),

  // Alias for delete to match component usage
  deleteNotification: withErrorHandling(async (notificationId) => {
    if (!notificationId) {
      throw new Error('Notification ID is required');
    }

    return await makeAPIRequest(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    }, { operation: 'deleteNotification', notificationId });
  }, { 
    showToast: false, // Silent operation
    toastOptions: { 
      duration: 3000 
    }
  }),

  // Delete multiple notifications
  deleteMultiple: withErrorHandling(async (notificationIds) => {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw new Error('Notification IDs array is required');
    }

    return await makeAPIRequest('/api/notifications/bulk-delete', {
      method: 'DELETE',
      body: JSON.stringify({ notificationIds }),
    }, { operation: 'deleteMultipleNotifications', notificationIds });
  }, { 
    showToast: false, // Silent operation
    toastOptions: { 
      duration: 3000 
    }
  }),

  // Get notifications by type
  getByType: withErrorHandling(async (type, params = {}) => {
    if (!type) {
      throw new Error('Notification type is required');
    }

    const validTypes = ['report_created', 'report_assigned', 'task_assigned', 'status_update'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
    }

    const queryParams = new URLSearchParams({ type, ...params }).toString();
    return await makeAPIRequest(`/api/notifications/type?${queryParams}`, {
      method: 'GET',
    }, { operation: 'getNotificationsByType', type, params });
  }, { showToast: false }),

  // Create notification (admin only)
  create: withErrorHandling(async (notificationData) => {
    const requiredFields = ['user_id', 'title', 'message', 'type'];
    const missingFields = requiredFields.filter(field => !notificationData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const validTypes = ['report_created', 'report_assigned', 'task_assigned', 'status_update'];
    if (!validTypes.includes(notificationData.type)) {
      throw new Error(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
    }

    return await makeAPIRequest('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    }, { operation: 'createNotification', notificationData });
  }, { 
    showToast: true,
    toastOptions: { 
      duration: 4000,
      showRetry: true 
    }
  }),

  // Bulk create notifications (admin only)
  bulkCreate: withErrorHandling(async (notificationsData) => {
    if (!Array.isArray(notificationsData) || notificationsData.length === 0) {
      throw new Error('Notifications data array is required');
    }

    return await makeAPIRequest('/api/notifications/bulk-create', {
      method: 'POST',
      body: JSON.stringify({ notifications: notificationsData }),
    }, { operation: 'bulkCreateNotifications', notificationsData });
  }, { 
    showToast: true,
    toastOptions: { 
      duration: 5000,
      showRetry: true 
    }
  }),

  // Real-time notification subscription handling
  subscribeToUpdates: withErrorHandling(async (subscriptionData = {}) => {
    return await makeAPIRequest('/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    }, { operation: 'subscribeToNotificationUpdates', subscriptionData });
  }, { showToast: false }),

  // Unsubscribe from real-time updates
  unsubscribeFromUpdates: withErrorHandling(async () => {
    return await makeAPIRequest('/api/notifications/unsubscribe', {
      method: 'POST',
    }, { operation: 'unsubscribeFromNotificationUpdates' });
  }, { showToast: false }),

  // Get notification preferences
  getPreferences: withErrorHandling(async () => {
    return await makeAPIRequest('/api/notifications/preferences', {
      method: 'GET',
    }, { operation: 'getNotificationPreferences' });
  }, { showToast: false }),

  // Update notification preferences
  updatePreferences: withErrorHandling(async (preferencesData) => {
    return await makeAPIRequest('/api/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferencesData),
    }, { operation: 'updateNotificationPreferences', preferencesData });
  }, { 
    showToast: true,
    toastOptions: { 
      duration: 4000,
      showRetry: true 
    }
  }),
};

// Vehicles API
export const vehiclesAPI = {
  // Get all vehicles
  getAll: withErrorHandling(async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/api/vehicles?${queryString}` : '/api/vehicles';
    return await makeAPIRequest(endpoint, {
      method: 'GET',
    }, { operation: 'getAllVehicles', params });
  }, { showToast: false }),

  // Get vehicle by ID
  getById: withErrorHandling(async (id) => {
    return await makeAPIRequest(`/api/vehicles/${id}`, {
      method: 'GET',
    }, { operation: 'getVehicleById', vehicleId: id });
  }, { showToast: false }),

  // Get available vehicles
  getAvailable: withErrorHandling(async () => {
    return await makeAPIRequest('/api/vehicles/available', {
      method: 'GET',
    }, { operation: 'getAvailableVehicles' });
  }, { showToast: false }),

  // Create vehicle
  create: withErrorHandling(async (vehicleData) => {
    return await makeAPIRequest('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    }, { operation: 'createVehicle', vehicleData });
  }, { showToast: true }),

  // Update vehicle
  update: withErrorHandling(async (id, vehicleData) => {
    return await makeAPIRequest(`/api/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData),
    }, { operation: 'updateVehicle', vehicleId: id, vehicleData });
  }, { showToast: true }),

  // Delete vehicle
  delete: withErrorHandling(async (id) => {
    return await makeAPIRequest(`/api/vehicles/${id}`, {
      method: 'DELETE',
    }, { operation: 'deleteVehicle', vehicleId: id });
  }, { showToast: true }),
};

export default {
  authAPI,
  eventsAPI,
  reportsAPI,
  userAPI,
  adminAPI,
  driversAPI,
  assignmentsAPI,
  notificationsAPI,
  vehiclesAPI
};
