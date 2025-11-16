/**
 * n8n.io Integration Webhooks for HyperDAG
 * 
 * These endpoints provide n8n-compatible webhook interfaces for automating
 * HyperDAG workflows including user management, reputation tracking, and
 * grant processing.
 */

import express, { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import { storage } from '../../storage';
import { notificationService } from '../../services/notification-service';

const router = express.Router();

// Middleware for n8n webhook authentication
const authenticateN8nWebhook = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('[n8n-webhooks] N8N_WEBHOOK_SECRET not configured, allowing all requests');
    return next();
  }
  
  if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
    return sendError(res, 'Unauthorized webhook access', 'UNAUTHORIZED', 401);
  }
  
  next();
};

/**
 * User Registration Webhook
 * Triggered when new users register - perfect for onboarding automation
 * POST /api/n8n/webhooks/user-registered
 */
router.post('/user-registered', authenticateN8nWebhook, async (req: Request, res: Response) => {
  try {
    const { userId, email, username, referralCode } = req.body;
    
    if (!userId || !username) {
      return sendError(res, 'Missing required fields: userId, username', 'VALIDATION_ERROR', 400);
    }
    
    // Get full user details
    const user = await storage.getUser(parseInt(userId));
    if (!user) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', 404);
    }
    
    // Format webhook payload for n8n
    const webhookPayload = {
      event: 'user_registered',
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        referralCode: user.referralCode,
        reputationScore: user.reputationScore,
        tokens: user.tokens,
        points: user.points,
        createdAt: user.createdAt,
        onboardingStage: user.onboardingStage
      },
      actions: {
        sendWelcomeEmail: true,
        createOnboardingTasks: true,
        assignInitialReputation: true
      }
    };
    
    return sendSuccess(res, webhookPayload, 'User registration webhook processed');
  } catch (error) {
    console.error('[n8n-webhooks] Error processing user registration:', error);
    return sendError(res, 'Failed to process user registration webhook');
  }
});

/**
 * Reputation Score Update Webhook
 * Triggered when user reputation changes - for automated rewards/notifications
 * POST /api/n8n/webhooks/reputation-updated
 */
router.post('/reputation-updated', authenticateN8nWebhook, async (req: Request, res: Response) => {
  try {
    const { userId, oldScore, newScore, reason, category } = req.body;
    
    if (!userId || newScore === undefined) {
      return sendError(res, 'Missing required fields: userId, newScore', 'VALIDATION_ERROR', 400);
    }
    
    const user = await storage.getUser(parseInt(userId));
    if (!user) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', 404);
    }
    
    // Calculate reputation milestone achievements
    const milestones = [10, 25, 50, 100, 250, 500, 1000];
    const achievedMilestone = milestones.find(milestone => 
      oldScore < milestone && newScore >= milestone
    );
    
    const webhookPayload = {
      event: 'reputation_updated',
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      reputation: {
        oldScore: oldScore || 0,
        newScore,
        change: newScore - (oldScore || 0),
        reason,
        category: category || 'general'
      },
      milestone: achievedMilestone ? {
        reached: achievedMilestone,
        isNewAchievement: true,
        rewardEligible: true
      } : null,
      actions: {
        sendNotification: Math.abs(newScore - (oldScore || 0)) >= 5,
        updateBadges: true,
        checkRewards: !!achievedMilestone
      }
    };
    
    return sendSuccess(res, webhookPayload, 'Reputation update webhook processed');
  } catch (error) {
    console.error('[n8n-webhooks] Error processing reputation update:', error);
    return sendError(res, 'Failed to process reputation update webhook');
  }
});

/**
 * Grant Application Webhook
 * Triggered when users apply for grants - for automated matching and notifications
 * POST /api/n8n/webhooks/grant-application
 */
router.post('/grant-application', authenticateN8nWebhook, async (req: Request, res: Response) => {
  try {
    const { grantId, userId, applicationData, skills, experience } = req.body;
    
    if (!grantId || !userId) {
      return sendError(res, 'Missing required fields: grantId, userId', 'VALIDATION_ERROR', 400);
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', 404);
    }
    
    // Check if user meets minimum reputation threshold
    const minReputationRequired = 15;
    const meetsRequirements = user.reputationScore >= minReputationRequired;
    
    const webhookPayload = {
      event: 'grant_application_submitted',
      timestamp: new Date().toISOString(),
      grant: {
        id: grantId,
        applicationId: `app_${Date.now()}_${userId}`
      },
      applicant: {
        id: user.id,
        username: user.username,
        email: user.email,
        reputationScore: user.reputationScore,
        skills: user.skills || skills || [],
        experience: experience || 'Not specified'
      },
      application: {
        data: applicationData,
        submittedAt: new Date().toISOString(),
        status: 'pending_review'
      },
      eligibility: {
        meetsRequirements,
        reputationCheck: user.reputationScore >= minReputationRequired,
        requiresManualReview: !meetsRequirements
      },
      actions: {
        notifyAdmins: true,
        runCompatibilityCheck: true,
        sendConfirmationEmail: true,
        scheduleFollow: !meetsRequirements
      }
    };
    
    return sendSuccess(res, webhookPayload, 'Grant application webhook processed');
  } catch (error) {
    console.error('[n8n-webhooks] Error processing grant application:', error);
    return sendError(res, 'Failed to process grant application webhook');
  }
});

/**
 * Project Creation Webhook
 * Triggered when users create new projects - for team matching and collaboration
 * POST /api/n8n/webhooks/project-created
 */
router.post('/project-created', authenticateN8nWebhook, async (req: Request, res: Response) => {
  try {
    const { projectId, creatorId, title, description, tags, lookingForTeam } = req.body;
    
    if (!projectId || !creatorId || !title) {
      return sendError(res, 'Missing required fields: projectId, creatorId, title', 'VALIDATION_ERROR', 400);
    }
    
    const creator = await storage.getUser(creatorId);
    if (!creator) {
      return sendError(res, 'Creator not found', 'USER_NOT_FOUND', 404);
    }
    
    const webhookPayload = {
      event: 'project_created',
      timestamp: new Date().toISOString(),
      project: {
        id: projectId,
        title,
        description: description || '',
        tags: tags || [],
        lookingForTeam: lookingForTeam || false,
        createdAt: new Date().toISOString()
      },
      creator: {
        id: creator.id,
        username: creator.username,
        email: creator.email,
        reputationScore: creator.reputationScore,
        skills: creator.skills || []
      },
      automation: {
        findCollaborators: lookingForTeam,
        matchSkills: (tags || []).length > 0,
        promoteProject: creator.reputationScore >= 25,
        sendNotifications: true
      },
      actions: {
        indexForSearch: true,
        notifyNetwork: creator.reputationScore >= 10,
        suggestTeamMembers: lookingForTeam,
        createProjectChannel: true
      }
    };
    
    return sendSuccess(res, webhookPayload, 'Project creation webhook processed');
  } catch (error) {
    console.error('[n8n-webhooks] Error processing project creation:', error);
    return sendError(res, 'Failed to process project creation webhook');
  }
});

/**
 * Notification Trigger Webhook
 * Generic webhook for triggering various types of notifications
 * POST /api/n8n/webhooks/send-notification
 */
router.post('/send-notification', authenticateN8nWebhook, async (req: Request, res: Response) => {
  try {
    const { userId, type, title, message, urgency, channels } = req.body;
    
    if (!userId || !title || !message) {
      return sendError(res, 'Missing required fields: userId, title, message', 'VALIDATION_ERROR', 400);
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', 404);
    }
    
    // Send notification through the notification service
    let notificationSent = false;
    
    if (!channels || channels.includes('email')) {
      notificationSent = await notificationService.sendWelcomeMessage({
        ...user,
        customTitle: title,
        customMessage: message
      });
    }
    
    const webhookPayload = {
      event: 'notification_sent',
      timestamp: new Date().toISOString(),
      notification: {
        type: type || 'info',
        title,
        message,
        urgency: urgency || 'normal',
        channels: channels || ['email']
      },
      recipient: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      delivery: {
        attempted: true,
        successful: notificationSent,
        timestamp: new Date().toISOString()
      }
    };
    
    return sendSuccess(res, webhookPayload, 'Notification webhook processed');
  } catch (error) {
    console.error('[n8n-webhooks] Error processing notification:', error);
    return sendError(res, 'Failed to process notification webhook');
  }
});

/**
 * Webhook Status and Configuration Endpoint
 * GET /api/n8n/webhooks/status
 */
router.get('/status', (req: Request, res: Response) => {
  const webhookEndpoints = [
    {
      name: 'User Registration',
      endpoint: '/api/n8n/webhooks/user-registered',
      method: 'POST',
      description: 'Triggered when new users register',
      samplePayload: {
        userId: 123,
        username: 'newuser',
        email: 'user@example.com',
        referralCode: 'ABC123'
      }
    },
    {
      name: 'Reputation Update',
      endpoint: '/api/n8n/webhooks/reputation-updated',
      method: 'POST',
      description: 'Triggered when user reputation changes',
      samplePayload: {
        userId: 123,
        oldScore: 10,
        newScore: 25,
        reason: 'Project completion',
        category: 'development'
      }
    },
    {
      name: 'Grant Application',
      endpoint: '/api/n8n/webhooks/grant-application',
      method: 'POST',
      description: 'Triggered when users apply for grants',
      samplePayload: {
        grantId: 'grant_456',
        userId: 123,
        applicationData: { pitch: 'My project idea...' },
        skills: ['javascript', 'react']
      }
    },
    {
      name: 'Project Creation',
      endpoint: '/api/n8n/webhooks/project-created',
      method: 'POST',
      description: 'Triggered when users create projects',
      samplePayload: {
        projectId: 'proj_789',
        creatorId: 123,
        title: 'My New Project',
        lookingForTeam: true
      }
    },
    {
      name: 'Send Notification',
      endpoint: '/api/n8n/webhooks/send-notification',
      method: 'POST',
      description: 'Send notifications to users',
      samplePayload: {
        userId: 123,
        type: 'info',
        title: 'Welcome!',
        message: 'Welcome to HyperDAG!'
      }
    }
  ];
  
  const status = {
    service: 'HyperDAG n8n Webhooks',
    version: '1.0.0',
    status: 'active',
    baseUrl: process.env.APP_URL || 'https://api.hyperdag.org',
    authentication: process.env.N8N_WEBHOOK_SECRET ? 'Bearer token required' : 'No authentication',
    webhooks: webhookEndpoints,
    documentation: 'https://hyperdag.org/docs/integrations/n8n',
    timestamp: new Date().toISOString()
  };
  
  return sendSuccess(res, status, 'n8n webhook service status');
});

export default router;