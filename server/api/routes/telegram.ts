/**
 * Telegram API Routes
 * 
 * This file defines API routes for interacting with the Telegram service.
 * These routes allow users to connect their HyperDAG accounts to Telegram,
 * verify connections, and manage notification preferences.
 */

import express from 'express';
import {
  getUserVerificationCode,
  isUserConnected,
  verifyUser,
  sendNotification
} from '../../services/telegram-service';

const router = express.Router();

/**
 * Get connection status
 * Checks if the bot token is configured and working
 */
router.get('/status', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    return res.json({
      connected: false,
      reason: 'Bot token not configured'
    });
  }

  try {
    // Test the bot token by calling getMe
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      res.json({
        connected: true,
        botInfo: {
          username: data.result.username,
          firstName: data.result.first_name
        }
      });
    } else {
      res.json({
        connected: false,
        reason: 'Invalid bot token'
      });
    }
  } catch (error) {
    res.json({
      connected: false,
      reason: 'Failed to connect to Telegram API'
    });
  }
});

/**
 * Verify Telegram connection
 * Verifies a user's Telegram connection using a code provided through the Telegram bot
 */
router.post('/verify', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Verification code is required' });
  }
  
  const username = req.user.username;
  const expectedCode = getUserVerificationCode(username);
  
  if (!expectedCode) {
    return res.status(400).json({
      message: 'No pending Telegram connection found. Please start the connection process from the Telegram bot.'
    });
  }
  
  const isVerified = verifyUser(username, code);
  
  if (isVerified) {
    return res.json({
      success: true,
      message: 'Telegram account connected successfully'
    });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification code'
    });
  }
});

/**
 * Send test notification
 * Sends a test notification to the user's connected Telegram account
 */
router.post('/test-notification', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const username = req.user.username;
  
  if (!isUserConnected(username)) {
    return res.status(400).json({
      message: 'You need to connect your Telegram account first'
    });
  }
  
  const success = await sendNotification(
    username,
    'This is a test notification from HyperDAG. If you received this, your notification settings are working correctly!'
  );
  
  if (success) {
    return res.json({
      success: true,
      message: 'Test notification sent successfully'
    });
  } else {
    return res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
});

export default router;
