import { jest } from '@jest/globals';
import notificationsController from '../../controllers/notificationsController.js';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  in: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  range: jest.fn(() => mockSupabase),
  single: jest.fn(() => mockSupabase)
};

// Mock the Supabase module
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

// Mock the config/database module
jest.mock('../../config/database.js', () => ({
  TABLES: {
    NOTIFICATIONS: 'notifications'
  }
}));

// Mock the helpers module
jest.mock('../../utils/helpers.js', () => ({
  successResponse: jest.fn((res, data, message, statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      data,
      message
    });
  }),
  errorResponse: jest.fn((res, message, statusCode = 500) => {
    res.status(statusCode).json({
      success: false,
      error: statusCode === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
      message
    });
  })
}));

describe('Notifications Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: '550e8400-e29b-41d4-a716-446655440000', role: 'user' },
      headers: { authorization: 'Bearer test-token' }
    };
    
    mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(() => mockRes),
      send: jest.fn(() => mockRes)
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/notifications - getNotifications', () => {
    it('should return user notifications with pagination', async () => {
      const mockNotifications = [
        {
          id: 'notification-1',
          user_id: 'test-user-id',
          title: 'New Task Assigned',
          message: 'You have been assigned a new waste collection task',
          type: 'task_assigned',
          is_read: false,
          created_at: new Date().toISOString()
        },
        {
          id: 'notification-2',
          user_id: 'test-user-id',
          title: 'Report Status Update',
          message: 'Your waste report has been updated',
          type: 'status_update',
          is_read: true,
          created_at: new Date().toISOString()
        }
      ];

      mockSupabase.range.mockResolvedValueOnce({
        data: mockNotifications,
        error: null,
        count: 2
      });

      mockReq.query = { page: '1', limit: '20' };

      notificationsController.getNotifications(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', '550e8400-e29b-41d4-a716-446655440000');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          notifications: mockNotifications,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalCount: 2,
            hasNextPage: false,
            hasPrevPage: false,
            limit: 20
          }
        },
        message: 'Notifications retrieved successfully'
      });
    });

    it('should filter notifications by read status', async () => {
      const mockNotifications = [
        {
          id: 'notification-1',
          user_id: 'test-user-id',
          title: 'Unread Notification',
          is_read: false
        }
      ];

      mockSupabase.range.mockResolvedValueOnce({
        data: mockNotifications,
        error: null,
        count: 1
      });

      mockReq.query = { is_read: 'false' };

      notificationsController.getNotifications(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSupabase.eq).toHaveBeenCalledWith('is_read', false);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should filter notifications by type', async () => {
      const mockNotifications = [
        {
          id: 'notification-1',
          user_id: 'test-user-id',
          type: 'task_assigned'
        }
      ];

      mockSupabase.range.mockResolvedValueOnce({
        data: mockNotifications,
        error: null,
        count: 1
      });

      mockReq.query = { type: 'task_assigned' };

      notificationsController.getNotifications(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSupabase.eq).toHaveBeenCalledWith('type', 'task_assigned');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle custom sorting and pagination', async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0
      });

      mockReq.query = {
        page: '2',
        limit: '10',
        sort_by: 'title',
        sort_order: 'asc'
      };

      notificationsController.getNotifications(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSupabase.order).toHaveBeenCalledWith('title', { ascending: true });
      expect(mockSupabase.range).toHaveBeenCalledWith(10, 19); // Second page with limit 10
    });

    it('should validate pagination limits', async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0
      });

      mockReq.query = {
        page: '0', // Invalid page
        limit: '200' // Exceeds max limit
      };

      notificationsController.getNotifications(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSupabase.range).toHaveBeenCalledWith(0, 99); // Corrected to max limit 100
    });

    it('should handle database errors', async () => {
      mockSupabase.range.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      });

      notificationsController.getNotifications(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch notifications'
      });
    });
  });

  describe('PUT /api/notifications/:id/read - markNotificationAsRead', () => {
    beforeEach(() => {
      mockReq.params.id = 'test-notification-id';
    });

    it('should mark notification as read successfully', async () => {
      const mockUpdatedNotification = {
        id: 'test-notification-id',
        user_id: 'test-user-id',
        title: 'Test Notification',
        is_read: true,
        updated_at: new Date().toISOString()
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockUpdatedNotification,
        error: null
      });

      notificationsController.markNotificationAsRead(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        is_read: true,
        updated_at: expect.any(String)
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-notification-id');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedNotification,
        message: 'Notification marked as read'
      });
    });

    it('should return 400 for invalid notification ID format', async () => {
      mockReq.params.id = 'invalid-uuid';

      notificationsController.markNotificationAsRead(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid notification ID format'
      });
    });

    it('should return 404 for non-existent notification', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      notificationsController.markNotificationAsRead(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'NOT_FOUND',
        message: 'Notification not found or access denied'
      });
    });

    it('should handle database errors', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      });

      notificationsController.markNotificationAsRead(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to update notification'
      });
    });
  });

  describe('PUT /api/notifications/bulk-read - markMultipleAsRead', () => {
    it('should mark multiple notifications as read successfully', async () => {
      const notificationIds = ['notification-1', 'notification-2'];
      const mockUpdatedNotifications = [
        {
          id: 'notification-1',
          user_id: 'test-user-id',
          is_read: true
        },
        {
          id: 'notification-2',
          user_id: 'test-user-id',
          is_read: true
        }
      ];

      mockReq.body = { notification_ids: notificationIds };

      mockSupabase.select.mockResolvedValueOnce({
        data: mockUpdatedNotifications,
        error: null
      });

      notificationsController.markMultipleAsRead(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSupabase.update).toHaveBeenCalledWith({
        is_read: true,
        updated_at: expect.any(String)
      });
      expect(mockSupabase.in).toHaveBeenCalledWith('id', notificationIds);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          updated_count: 2,
          notifications: mockUpdatedNotifications
        },
        message: '2 notifications marked as read'
      });
    });

    it('should return 400 for empty notification_ids array', async () => {
      mockReq.body = { notification_ids: [] };

      notificationsController.markMultipleAsRead(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'notification_ids must be a non-empty array'
      });
    });

    it('should return 400 for invalid notification ID format', async () => {
      mockReq.body = { notification_ids: ['valid-uuid', 'invalid-uuid'] };

      notificationsController.markMultipleAsRead(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid notification ID format'
      });
    });

    it('should return 400 for non-array notification_ids', async () => {
      mockReq.body = { notification_ids: 'not-an-array' };

      notificationsController.markMultipleAsRead(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'notification_ids must be a non-empty array'
      });
    });
  });

  describe('GET /api/notifications/counts - getNotificationCounts', () => {
    it('should return notification counts successfully', async () => {
      // Mock total count
      mockSupabase.select.mockResolvedValueOnce({
        count: 10,
        error: null
      });

      // Mock unread count
      mockSupabase.eq.mockResolvedValueOnce({
        count: 3,
        error: null
      });

      notificationsController.getNotificationCounts(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          total: 10,
          unread: 3,
          read: 7
        },
        message: 'Notification counts retrieved successfully'
      });
    });

    it('should handle zero counts', async () => {
      // Mock total count
      mockSupabase.select.mockResolvedValueOnce({
        count: 0,
        error: null
      });

      // Mock unread count
      mockSupabase.eq.mockResolvedValueOnce({
        count: 0,
        error: null
      });

      notificationsController.getNotificationCounts(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          total: 0,
          unread: 0,
          read: 0
        },
        message: 'Notification counts retrieved successfully'
      });
    });

    it('should handle database errors for total count', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        count: null,
        error: { message: 'Database connection failed' }
      });

      notificationsController.getNotificationCounts(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get notification counts'
      });
    });

    it('should handle database errors for unread count', async () => {
      // Mock successful total count
      mockSupabase.select.mockResolvedValueOnce({
        count: 10,
        error: null
      });

      // Mock failed unread count
      mockSupabase.eq.mockResolvedValueOnce({
        count: null,
        error: { message: 'Database connection failed' }
      });

      notificationsController.getNotificationCounts(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get notification counts'
      });
    });
  });

  describe('DELETE /api/notifications/:id - deleteNotification', () => {
    beforeEach(() => {
      mockReq.params.id = 'test-notification-id';
    });

    it('should delete notification successfully', async () => {
      mockSupabase.delete.mockResolvedValueOnce({
        error: null
      });

      notificationsController.deleteNotification(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-notification-id');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Notification deleted successfully'
      });
    });

    it('should return 400 for invalid notification ID format', async () => {
      mockReq.params.id = 'invalid-uuid';

      notificationsController.deleteNotification(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid notification ID format'
      });
    });

    it('should handle database errors', async () => {
      mockSupabase.delete.mockResolvedValueOnce({
        error: { message: 'Database connection failed' }
      });

      notificationsController.deleteNotification(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to delete notification'
      });
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      delete mockReq.user;

      notificationsController.getNotifications(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    });

    it('should ensure user can only access their own notifications', async () => {
      mockReq.params.id = 'test-notification-id';

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // No rows returned (access denied)
      });

      notificationsController.markNotificationAsRead(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'NOT_FOUND',
        message: 'Notification not found or access denied'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Mock an unexpected error
      mockSupabase.range.mockRejectedValueOnce(new Error('Unexpected error'));

      notificationsController.getNotifications(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      });
    });

    it('should validate required parameters', async () => {
      mockReq.params = {}; // Missing notification ID

      notificationsController.markNotificationAsRead(mockReq, mockRes);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid notification ID format'
      });
    });
  });
});