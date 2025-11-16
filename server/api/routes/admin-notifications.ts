import { Router, Request, Response } from 'express';
import { sendAdminNewUserNotification } from '../../services/email-service';
import { logger } from '../../utils/logger';

export const adminNotificationRouter = Router();

/**
 * Test endpoint for sending admin notifications
 * This allows testing the email functionality without creating actual users
 */
adminNotificationRouter.post('/test-notification', async (req: Request, res: Response) => {
  try {
    const { username, persona, referrer, emailType } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }
    
    if (emailType === 'new_user') {
      // Send admin notification for new user registration
      const result = await sendAdminNewUserNotification(
        username, 
        persona || 'Not specified',
        referrer
      );
      
      if (result) {
        logger.info(`Test admin notification sent for new user: ${username}`);
        return res.json({
          success: true,
          message: 'Admin notification sent successfully'
        });
      } else {
        logger.error(`Failed to send test admin notification for user: ${username}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to send admin notification'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid email type. Supported types: new_user'
      });
    }
  } catch (error) {
    logger.error('Error sending test admin notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});