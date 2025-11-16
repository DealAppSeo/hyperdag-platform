import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth-middleware';
import { sendAdminNewUserNotification } from '../../services/email-service';

/**
 * Router for sending test admin notifications
 */
const router = Router();

/**
 * Send a test admin notification email
 * @route GET /api/send-test-notification
 * @access Protected (requires authentication and admin rights)
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    // Only allow admins to send test notifications
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only admins can send test notifications'
      });
    }

    // Generate a random test username
    const testUsername = `TestUser${Math.floor(Math.random() * 10000)}`;
    const testPersona = 'developer';
    const testReferrer = 'Sean';

    // Send the notification
    const success = await sendAdminNewUserNotification(
      `[TEST] ${testUsername}`,
      testPersona,
      testReferrer
    );

    if (success) {
      return res.json({
        success: true,
        message: 'Test admin notification sent successfully',
        details: {
          to: 'dealappseo@gmail.com',
          username: testUsername,
          persona: testPersona,
          referrer: testReferrer,
          date: new Date().toLocaleString()
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send test admin notification'
      });
    }
  } catch (error) {
    console.error('Error sending test admin notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while sending test notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;