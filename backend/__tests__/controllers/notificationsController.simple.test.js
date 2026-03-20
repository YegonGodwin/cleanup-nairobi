import { jest } from '@jest/globals';

describe('Notifications Controller - Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockSupabase;
  let notificationsController;

  beforeAll(async () => {
    // Mock Supabase
    mockSupabase = {
      from: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      update: jest.fn(() => mockSupabase),
      delete: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      in: jest.fn(() => mockSupabase),
      order: jest.fn(() => mockSupabase),
      range: jest.fn(() => mockSupabase),
      single: jest.fn(() => mockSupabase)
    };

    // Mock modules
    jest.unstable_mockModule('@supabase/supabase-js', () => ({
      createClient: jest.fn(() => mockSupabase)
    }));

    jest.unstable_mockModule('../../config/database.js', () => ({
      TABLES: { NOTIFICATIONS: 'notifications' }
    }));

    jest.unstable_mockModule('../../utils/helpers.js', () => ({
      successResponse: jest.fn((res, data, message, statusCode = 200) => {
        return res.status(statusCode).json({ success: true, data, message });
      }),
      errorResponse: jest.fn((res, message, statusCode = 500) => {
        return res.status(statusCode).json({ 
          success: false, 
          error: statusCode === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
          message 
        });
      })
    }));

    // Import controller after mocking
    const module = await import('../../controllers/notificationsController.js');
    notificationsController = module.default;
  });

  beforeEach(() => {
    mockReq = {
      user: { id: '550e8400-e29b-41d4-a716-446655440000' },
      params: {},
      query: {},
      body: {}
    };

    mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(() => mockRes)
    };

    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should successfully retrieve notifications', async () => {
      const mockNotifications = [
        { id: 'notif-1', title: 'Test', is_read: false },
        { id: 'notif-2', title: 'Test 2', is_read: true }
      ];

      mockSupabase.range.mockResolvedValue({
        data: mockNotifications,
        error: null,
        count: 2
      });

      await notificationsController.getNotifications(mockReq, mockRes);

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', '550e8400-e29b-41d4-a716-446655440000');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle database errors', async () => {
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await notificationsController.getNotifications(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should apply filters correctly', async () => {
      mockReq.query = { is_read: 'false', type: 'task_assigned' };

      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      await notificationsController.getNotifications(mockReq, mockRes);

      expect(mockSupabase.eq).toHaveBeenCalledWith('is_read', false);
      expect(mockSupabase.eq).toHaveBeenCalledWith('type', 'task_assigned');
    });
  });

  describe('markNotificationAsRead', () => {
    beforeEach(() => {
      mockReq.params.id = '550e8400-e29b-41d4-a716-446655440001';
    });

    it('should successfully mark notification as read', async () => {
      const mockNotification = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        is_read: true
      };

      mockSupabase.single.mockResolvedValue({
        data: mockNotification,
        error: null
      });

      await notificationsController.markNotificationAsRead(mockReq, mockRes);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        is_read: true,
        updated_at: expect.any(String)
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '550e8400-e29b-41d4-a716-446655440001');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', '550e8400-e29b-41d4-a716-446655440000');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid UUID', async () => {
      mockReq.params.id = 'invalid-uuid';

      await notificationsController.markNotificationAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 for non-existent notification', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      await notificationsController.markNotificationAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('markMultipleAsRead', () => {
    it('should successfully mark multiple notifications as read', async () => {
      const notificationIds = [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002'
      ];

      mockReq.body = { notification_ids: notificationIds };

      const mockNotifications = [
        { id: notificationIds[0], is_read: true },
        { id: notificationIds[1], is_read: true }
      ];

      mockSupabase.select.mockResolvedValue({
        data: mockNotifications,
        error: null
      });

      await notificationsController.markMultipleAsRead(mockReq, mockRes);

      expect(mockSupabase.in).toHaveBeenCalledWith('id', notificationIds);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', '550e8400-e29b-41d4-a716-446655440000');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for empty array', async () => {
      mockReq.body = { notification_ids: [] };

      await notificationsController.markMultipleAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid UUIDs', async () => {
      mockReq.body = { notification_ids: ['invalid-uuid'] };

      await notificationsController.markMultipleAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getNotificationCounts', () => {
    it('should return correct counts', async () => {
      // Mock total count call
      mockSupabase.select.mockResolvedValueOnce({
        count: 10,
        error: null
      });

      // Mock unread count call
      mockSupabase.eq.mockResolvedValueOnce({
        count: 3,
        error: null
      });

      await notificationsController.getNotificationCounts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle database errors', async () => {
      mockSupabase.select.mockResolvedValue({
        count: null,
        error: { message: 'Database error' }
      });

      await notificationsController.getNotificationCounts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteNotification', () => {
    beforeEach(() => {
      mockReq.params.id = '550e8400-e29b-41d4-a716-446655440001';
    });

    it('should successfully delete notification', async () => {
      mockSupabase.delete.mockResolvedValue({
        error: null
      });

      await notificationsController.deleteNotification(mockReq, mockRes);

      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '550e8400-e29b-41d4-a716-446655440001');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', '550e8400-e29b-41d4-a716-446655440000');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid UUID', async () => {
      mockReq.params.id = 'invalid-uuid';

      await notificationsController.deleteNotification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle database errors', async () => {
      mockSupabase.delete.mockResolvedValue({
        error: { message: 'Database error' }
      });

      await notificationsController.deleteNotification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Authentication', () => {
    it('should handle missing user', async () => {
      delete mockReq.user;

      await notificationsController.getNotifications(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Input Validation', () => {
    it('should validate UUID format in markNotificationAsRead', async () => {
      mockReq.params.id = 'not-a-uuid';

      await notificationsController.markNotificationAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should validate UUID format in deleteNotification', async () => {
      mockReq.params.id = 'not-a-uuid';

      await notificationsController.deleteNotification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should validate notification_ids array in markMultipleAsRead', async () => {
      mockReq.body = { notification_ids: 'not-an-array' };

      await notificationsController.markMultipleAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors in getNotifications', async () => {
      mockSupabase.range.mockRejectedValue(new Error('Unexpected error'));

      await notificationsController.getNotifications(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should handle unexpected errors in markNotificationAsRead', async () => {
      mockReq.params.id = '550e8400-e29b-41d4-a716-446655440001';
      mockSupabase.single.mockRejectedValue(new Error('Unexpected error'));

      await notificationsController.markNotificationAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should handle unexpected errors in markMultipleAsRead', async () => {
      mockReq.body = { notification_ids: ['550e8400-e29b-41d4-a716-446655440001'] };
      mockSupabase.select.mockRejectedValue(new Error('Unexpected error'));

      await notificationsController.markMultipleAsRead(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should handle unexpected errors in getNotificationCounts', async () => {
      mockSupabase.select.mockRejectedValue(new Error('Unexpected error'));

      await notificationsController.getNotificationCounts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should handle unexpected errors in deleteNotification', async () => {
      mockReq.params.id = '550e8400-e29b-41d4-a716-446655440001';
      mockSupabase.delete.mockRejectedValue(new Error('Unexpected error'));

      await notificationsController.deleteNotification(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});