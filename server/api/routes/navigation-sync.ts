import express from 'express';
import { randomBytes } from 'crypto';
import { requireAuth } from '../../middleware/auth-middleware';
import { webhooks } from '../../../shared/schema';
import { navigationSyncService } from '../../services/navigation-sync-service';
import { db } from '../../db';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * GET /api/navigation-sync
 * Get the current navigation structure
 */
router.get('/', async (req, res) => {
  try {
    const navigation = navigationSyncService.getCurrentNavigation();
    return res.json(navigation);
  } catch (error) {
    console.error('Error retrieving navigation:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve navigation structure'
      }
    });
  }
});

/**
 * GET /api/navigation-sync/webhooks
 * Get all registered webhooks
 * Requires authentication
 */
router.get('/webhooks', requireAuth, async (req, res) => {
  try {
    const allWebhooks = await db.select().from(webhooks)
      .where(eq(webhooks.type, 'navigation'));
    
    return res.json({
      success: true,
      data: allWebhooks
    });
  } catch (error) {
    console.error('Error retrieving webhooks:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to retrieve webhooks'
      }
    });
  }
});

/**
 * POST /api/navigation-sync/register
 * Register a new webhook for navigation updates
 * Requires authentication
 */
router.post('/register', requireAuth, async (req, res) => {
  try {
    const { url, applicationName } = req.body;
    
    if (!url || !applicationName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'URL and application name are required'
        }
      });
    }
    
    // Generate a secure API key for the webhook
    const apiKey = randomBytes(32).toString('hex');
    
    // Register the webhook
    const webhook = await navigationSyncService.registerWebhook({
      url,
      applicationName,
      apiKey,
      userId: req.user?.id
    });
    
    return res.status(201).json({
      success: true,
      data: {
        webhook,
        apiKey // Return the API key for initial setup only
      },
      message: 'Webhook registered successfully'
    });
  } catch (error) {
    console.error('Error registering webhook:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to register webhook'
      }
    });
  }
});

/**
 * DELETE /api/navigation-sync/webhooks/:id
 * Delete a webhook
 * Requires authentication
 */
router.delete('/webhooks/:id', requireAuth, async (req, res) => {
  try {
    const webhookId = parseInt(req.params.id);
    
    if (isNaN(webhookId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid webhook ID'
        }
      });
    }
    
    // Check if the webhook exists and belongs to the user
    const webhook = await db.select().from(webhooks)
      .where(eq(webhooks.id, webhookId))
      .where(eq(webhooks.userId, req.user.id));
    
    if (!webhook || webhook.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Webhook not found or you do not have permission to delete it'
        }
      });
    }
    
    // Delete the webhook
    await db.delete(webhooks).where(eq(webhooks.id, webhookId));
    
    return res.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to delete webhook'
      }
    });
  }
});

/**
 * POST /api/navigation-sync/notify
 * Manually trigger notifications to all webhooks
 * Requires authentication
 */
router.post('/notify', requireAuth, async (req, res) => {
  try {
    // Check if user has admin privileges (you can implement your own logic here)
    if (req.user.id !== 1) { // Temporary check for admin (ID = 1)
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to trigger webhook notifications'
        }
      });
    }
    
    // First refresh the navigation cache to get the latest version
    navigationSyncService.refreshNavigationCache();
    
    // Then notify all webhooks
    const result = await navigationSyncService.notifyAllWebhooks();
    
    return res.json({
      success: true,
      data: result,
      message: `Notified ${result.successful} of ${result.total} webhooks successfully`
    });
  } catch (error) {
    console.error('Error notifying webhooks:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to notify webhooks'
      }
    });
  }
});

/**
 * GET /api/navigation-sync/test/:id
 * Test a specific webhook by sending a notification
 * Requires authentication
 */
router.get('/test/:id', requireAuth, async (req, res) => {
  try {
    const webhookId = parseInt(req.params.id);
    
    if (isNaN(webhookId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid webhook ID'
        }
      });
    }
    
    // Check if the webhook exists
    const [webhook] = await db.select().from(webhooks)
      .where(eq(webhooks.id, webhookId));
    
    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Webhook not found'
        }
      });
    }
    
    // Test the webhook
    const success = await navigationSyncService.notifyWebhook(webhook);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Webhook notification sent successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: {
          code: 'NOTIFICATION_FAILED',
          message: 'Failed to send webhook notification'
        }
      });
    }
  } catch (error) {
    console.error('Error testing webhook:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to test webhook'
      }
    });
  }
});

export default router;