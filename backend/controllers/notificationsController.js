import { supabase, supabaseAdmin } from '../config/supabase.js';
import { TABLES } from '../config/database.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

/**
 * Get user notifications with filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      is_read, 
      type, 
      page = 1, 
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    // Validate sort parameters
    const validSortFields = ['created_at', 'is_read', 'type', 'title'];
    const validSortOrders = ['asc', 'desc'];
    
    const sortBy = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = validSortOrders.includes(sort_order) ? sort_order : 'desc';

    // Calculate offset
    const offset = (pageNum - 1) * limitNum;

    // Build query using admin client to bypass RLS
    let query = supabaseAdmin
      .from(TABLES.NOTIFICATIONS)
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (is_read !== undefined) {
      const isReadBool = is_read === 'true' || is_read === true;
      query = query.eq('is_read', isReadBool);
    }

    if (type) {
      query = query.eq('type', type);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limitNum - 1);

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return errorResponse(res, 'Failed to fetch notifications', 500);
    }

    // Calculate pagination info
    const totalPages = Math.ceil(count / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    const result = {
      notifications,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount: count,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      }
    };

    return successResponse(res, result, 'Notifications retrieved successfully');
  } catch (error) {
    console.error('Error in getNotifications:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Mark notification as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return errorResponse(res, 'Invalid notification ID format', 400);
    }

    // Update notification and verify ownership using admin client
    const { data: notification, error } = await supabaseAdmin
      .from(TABLES.NOTIFICATIONS)
      .update({ 
        is_read: true
      })
      .eq('id', id)
      .eq('user_id', userId) // Ensure user owns the notification
      .select()
      .single();

    if (error) {
      console.error('Error updating notification:', error);
      if (error.code === 'PGRST116') {
        return errorResponse(res, 'Notification not found or access denied', 404);
      }
      return errorResponse(res, 'Failed to update notification', 500);
    }

    if (!notification) {
      return errorResponse(res, 'Notification not found or access denied', 404);
    }

    return successResponse(res, notification, 'Notification marked as read');
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Mark multiple notifications as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const markMultipleAsRead = async (req, res) => {
  try {
    const { notification_ids } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
      return errorResponse(res, 'notification_ids must be a non-empty array', 400);
    }

    // Validate UUID format for all IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const invalidIds = notification_ids.filter(id => !uuidRegex.test(id));
    
    if (invalidIds.length > 0) {
      return errorResponse(res, 'Invalid notification ID format', 400);
    }

    // Update notifications and verify ownership using admin client
    const { data: notifications, error } = await supabaseAdmin
      .from(TABLES.NOTIFICATIONS)
      .update({ 
        is_read: true
      })
      .in('id', notification_ids)
      .eq('user_id', userId) // Ensure user owns the notifications
      .select();

    if (error) {
      console.error('Error updating notifications:', error);
      return errorResponse(res, 'Failed to update notifications', 500);
    }

    return successResponse(res, {
      updated_count: notifications.length,
      notifications
    }, `${notifications.length} notifications marked as read`);
  } catch (error) {
    console.error('Error in markMultipleAsRead:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get notification counts (read/unread)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getNotificationCounts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total count using admin client
    const { count: totalCount, error: totalError } = await supabaseAdmin
      .from(TABLES.NOTIFICATIONS)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (totalError) {
      console.error('Error getting total count:', totalError);
      return errorResponse(res, 'Failed to get notification counts', 500);
    }

    // Get unread count using admin client
    const { count: unreadCount, error: unreadError } = await supabaseAdmin
      .from(TABLES.NOTIFICATIONS)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (unreadError) {
      console.error('Error getting unread count:', unreadError);
      return errorResponse(res, 'Failed to get notification counts', 500);
    }

    const result = {
      total: totalCount || 0,
      unread: unreadCount || 0,
      read: (totalCount || 0) - (unreadCount || 0)
    };

    return successResponse(res, result, 'Notification counts retrieved successfully');
  } catch (error) {
    console.error('Error in getNotificationCounts:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Delete notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return errorResponse(res, 'Invalid notification ID format', 400);
    }

    // Delete notification and verify ownership using admin client
    const { error } = await supabaseAdmin
      .from(TABLES.NOTIFICATIONS)
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Ensure user owns the notification

    if (error) {
      console.error('Error deleting notification:', error);
      return errorResponse(res, 'Failed to delete notification', 500);
    }

    return successResponse(res, null, 'Notification deleted successfully');
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

export default {
  getNotifications,
  markNotificationAsRead,
  markMultipleAsRead,
  getNotificationCounts,
  deleteNotification
};