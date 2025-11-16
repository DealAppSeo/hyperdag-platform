import express, { Request, Response } from 'express';
import { sendAdminNewUserNotification } from '../../services/email-service';
import { logger } from '../../utils/logger';

export const testEmailRouter = express.Router();

// Test endpoint for sending admin new user notification
testEmailRouter.post('/admin-notification', async (req: Request, res: Response) => {
  try {
    const { username, persona } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }
    
    logger.info(`[test-email] Sending test admin notification for user: ${username}`);
    console.log(`[test-email] EMAIL_SENDER set to: ${process.env.EMAIL_SENDER || 'not set'}`);
    console.log(`[test-email] ADMIN_EMAIL set to: ${process.env.ADMIN_EMAIL || 'not set, using dealappseo@gmail.com'}`);
    console.log(`[test-email] MAILGUN_DOMAIN set to: ${process.env.MAILGUN_DOMAIN || 'not set'}`);
    console.log(`[test-email] Calling sendAdminNewUserNotification with username=${username}, persona=${persona || 'Not specified'}`);
    
    const result = await sendAdminNewUserNotification(
      username,
      persona || 'Not specified',
      null // referrer
    );
    
    if (result) {
      logger.info(`[test-email] Admin notification sent successfully`);
      return res.json({
        success: true,
        message: 'Admin notification sent successfully to dealappseo@gmail.com'
      });
    } else {
      logger.error(`[test-email] Failed to send admin notification`);
      return res.status(500).json({
        success: false,
        message: 'Failed to send admin notification'
      });
    }
  } catch (error) {
    logger.error('[test-email] Error sending admin notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});