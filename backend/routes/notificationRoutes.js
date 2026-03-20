import express from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markMultipleAsRead,
  getNotificationCounts,
  deleteNotification
} from '../controllers/notificationsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/notifications - Get user notifications with filtering and pagination
router.get('/', getNotifications);

// GET /api/notifications/counts - Get notification counts (read/unread)
router.get('/counts', getNotificationCounts);

// PUT /api/notifications/:id/read - Mark specific notification as read
router.put('/:id/read', markNotificationAsRead);

// PUT /api/notifications/bulk-read - Mark multiple notifications as read
router.put('/bulk-read', markMultipleAsRead);

// DELETE /api/notifications/:id - Delete specific notification
router.delete('/:id', deleteNotification);

export default router;