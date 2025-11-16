/**
 * Slack API Routes
 * 
 * This file defines API routes for interacting with the Slack service.
 * These routes allow the application to send messages and interact with Slack channels.
 */

import express from 'express';
import { slackService } from '../../services/slack-service';

const router = express.Router();

/**
 * Check Slack OAuth integration status
 * Returns whether the Slack OAuth service is properly configured
 */
router.get('/status', (req, res) => {
  const hasCredentials = !!(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET);
  
  res.json({
    configured: hasCredentials,
    oauthEnabled: hasCredentials,
    redirectUri: hasCredentials ? slackService.getAuthUrl() : null
  });
});

/**
 * Test Slack OAuth authentication
 * Redirects to Slack OAuth for testing authentication flow
 */
router.get('/test-auth', (req, res) => {
  try {
    const authUrl = slackService.getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error generating Slack auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating authentication URL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
