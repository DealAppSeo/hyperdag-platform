import { Router } from 'express';
import { ProfileCompletionService } from '../../services/profile-completion-service';
import { requireAuth } from '../../middleware/auth-middleware';

const router = Router();

/**
 * Get profile completion status for current user
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const status = ProfileCompletionService.calculateCompletionStatus(req.user);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting profile completion status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile completion status'
    });
  }
});

/**
 * Send immediate profile completion nudge to current user
 */
router.post('/nudge', requireAuth, async (req, res) => {
  try {
    if (!req.user?.createdAt) {
      return res.status(400).json({
        success: false,
        message: 'User registration date not found'
      });
    }

    const daysSinceRegistration = Math.floor(
      (Date.now() - req.user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const success = await ProfileCompletionService.sendCompletionNudge(
      req.user.id, 
      daysSinceRegistration
    );

    res.json({
      success,
      message: success ? 'Profile completion nudge sent' : 'Failed to send nudge'
    });
  } catch (error) {
    console.error('Error sending profile completion nudge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send profile completion nudge'
    });
  }
});

/**
 * Process all users for profile completion nudges (admin only)
 */
router.post('/process-all', requireAuth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Run the processing in the background
    ProfileCompletionService.processAllUsers()
      .then(() => {
        console.log('Profile completion processing completed');
      })
      .catch((error) => {
        console.error('Error in profile completion processing:', error);
      });

    res.json({
      success: true,
      message: 'Profile completion processing started'
    });
  } catch (error) {
    console.error('Error starting profile completion processing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start profile completion processing'
    });
  }
});

/**
 * Test the profile completion system with sample data (admin only)
 */
router.post('/test', requireAuth, async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Get current user's profile completion status
    const status = ProfileCompletionService.calculateCompletionStatus(req.user);
    
    // Force send a test nudge regardless of completion percentage
    const success = await ProfileCompletionService.sendCompletionNudge(req.user.id, 1);

    res.json({
      success: true,
      data: {
        profileStatus: status,
        testEmailSent: success,
        message: success ? 'Test profile completion email sent successfully!' : 'Failed to send test email'
      }
    });
  } catch (error) {
    console.error('Error testing profile completion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test profile completion system'
    });
  }
});

export default router;