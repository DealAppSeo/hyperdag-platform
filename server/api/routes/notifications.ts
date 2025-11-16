import express, { Request, Response } from 'express';
import { notificationService } from '../../services/notification-service';
import { requireAuth } from '../../middleware/auth-middleware';
import { sendSuccess, sendError } from '../../utils/response';
import { db } from '../../db';
import { sql } from 'drizzle-orm';

// Define notification types for the system
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SYSTEM = 'system',
  GRANT = 'grant',
  PROJECT = 'project',
  MESSAGE = 'message',
  REPUTATION = 'reputation',
  TEAM = 'team'
}

const router = express.Router();

// Apply auth middleware to all notification routes
router.use(requireAuth);

/**
 * Get all notifications for the authenticated user
 * GET /api/notifications
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 'UNAUTHORIZED', 401);
    }
    
    // Temporary implementation until we rebuild the notification service
    const notifications = await db.execute(
      sql`SELECT * FROM notifications 
          WHERE user_id = ${req.user.id}
          ORDER BY created_at DESC
          LIMIT 20`
    ).then(result => result.rows || []);
    return sendSuccess(res, notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return sendError(res, 'Failed to fetch notifications');
  }
});

/**
 * Get unread notification count for the authenticated user
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 'UNAUTHORIZED', 401);
    }
    
    const count = await notificationService.getUnreadCount(req.user.id);
    return sendSuccess(res, { count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return sendError(res, 'Failed to fetch unread count');
  }
});

/**
 * Mark a notification as read
 * POST /api/notifications/:id/mark-read
 */
router.post('/:id/mark-read', async (req: Request, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    if (!req.user) {
      return sendError(res, 'User not authenticated', 'UNAUTHORIZED', 401);
    }
    
    if (isNaN(notificationId)) {
      return sendError(res, 'Invalid notification ID', 'INVALID_INPUT', 400);
    }
    
    const success = await notificationService.markNotificationAsRead(notificationId, req.user.id);
    
    if (!success) {
      return sendError(res, 'Failed to mark notification as read', 'UPDATE_FAILED', 500);
    }
    
    return sendSuccess(res, { success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return sendError(res, 'Failed to mark notification as read');
  }
});

/**
 * Mark all notifications as read for the authenticated user
 * POST /api/notifications/mark-all-read
 */
router.post('/mark-all-read', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 'UNAUTHORIZED', 401);
    }
    
    const success = await notificationService.markAllNotificationsAsRead(req.user.id);
    
    if (!success) {
      return sendError(res, 'Failed to mark all notifications as read', 'UPDATE_FAILED', 500);
    }
    
    return sendSuccess(res, { success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return sendError(res, 'Failed to mark all notifications as read');
  }
});

/**
 * Create a test notification for the authenticated user (development only)
 * POST /api/notifications/test
 */
router.post('/test', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return sendError(res, 'Test endpoint disabled in production', 'FORBIDDEN', 403);
  }
  
  try {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 'UNAUTHORIZED', 401);
    }
    
    const { type = 'info', title = 'Test Notification', message = 'This is a test notification' } = req.body;
    
    const notification = await notificationService.createNotification(
      req.user.id,
      title,
      message,
      type as NotificationType
    );
    
    return sendSuccess(res, { notification }, 201);
  } catch (error) {
    console.error('Error creating test notification:', error);
    return sendError(res, 'Failed to create test notification');
  }
});

export default router;