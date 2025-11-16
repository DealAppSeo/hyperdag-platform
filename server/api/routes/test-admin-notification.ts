import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth-middleware';
import { sendAdminNewUserNotification } from '../../services/email-service';

/**
 * Routes for testing admin notification functionality
 */
export const testAdminNotificationRouter = Router();

/**
 * Test endpoint to send an admin notification for new user registration
 * @route POST /api/test/admin-notification
 * @access Protected (requires authentication)
 */
testAdminNotificationRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { username, persona, referrer } = req.body;

    // Validate required fields
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Add a prefix to clearly indicate this is a test
    const testUsername = `[TEST] ${username}`;
    
    // Send the admin notification using our email service
    const notificationSent = await sendAdminNewUserNotification(
      testUsername,
      persona || 'Not specified',
      referrer || null
    );

    if (notificationSent) {
      return res.json({
        success: true,
        message: 'Test admin notification sent successfully',
        details: {
          username: testUsername,
          persona: persona || 'Not specified',
          referrer: referrer || 'None'
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send test admin notification. Check server logs for details.'
      });
    }
  } catch (error) {
    console.error('Error in test admin notification route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending test admin notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});