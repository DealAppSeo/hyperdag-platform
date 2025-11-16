import express from 'express';
import { embeddedTestingRewards } from '../services/embedded-testing-rewards';
import { storage } from '../storage';

const router = express.Router();

/**
 * Register a new app for embedded testing rewards
 * POST /api/embed/register
 */
router.post('/embed/register', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const { appName, domain, pointsPerTest, bonusForDetailedFeedback, referralBonus } = req.body;

    if (!appName || !domain) {
      return res.status(400).json({
        success: false,
        message: 'App name and domain are required'
      });
    }

    const appDetails = {
      name: appName,
      domain: domain,
      pointsPerTest: pointsPerTest || 10,
      bonusForDetailedFeedback: bonusForDetailedFeedback || 5,
      referralBonus: referralBonus || 15
    };

    const embeddedApp = await embeddedTestingRewards.registerApp(req.user.id, appDetails);

    res.json({
      success: true,
      data: {
        appId: embeddedApp.id,
        apiKey: embeddedApp.apiKey,
        embedCode: embeddedTestingRewards.generateEmbedCode(embeddedApp.id, embeddedApp.apiKey),
        integrationGuide: `https://api.hyperdag.org/docs/embedded-testing`,
        message: 'App registered successfully! Copy the embed code to start rewarding testers.'
      }
    });

  } catch (error) {
    console.error('[Embedded Testing API] Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register app'
    });
  }
});

/**
 * Process testing session from embedded app
 * POST /api/embed/session
 */
router.post('/embed/session', async (req, res) => {
  try {
    const { appId, apiKey, sessionData } = req.body;

    if (!appId || !apiKey || !sessionData) {
      return res.status(400).json({
        success: false,
        message: 'appId, apiKey, and sessionData are required'
      });
    }

    // Verify API key
    const app = await storage.getEmbeddedApp(appId);
    if (!app || app.apiKey !== apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid app ID or API key'
      });
    }

    const session = await embeddedTestingRewards.processTestingSession(appId, sessionData);

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        rewardsEarned: session.rewardsEarned,
        qualityScore: session.qualityScore,
        testerMessage: `Great testing! You earned ${session.rewardsEarned} discovery points on HyperDAG.`
      }
    });

  } catch (error) {
    console.error('[Embedded Testing API] Session processing error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process testing session'
    });
  }
});

/**
 * Get app testing analytics
 * GET /api/embed/analytics/:appId
 */
router.get('/embed/analytics/:appId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const { appId } = req.params;
    const app = await storage.getEmbeddedApp(appId);

    if (!app || app.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied or app not found'
      });
    }

    const analytics = await storage.getAppTestingAnalytics(appId);

    res.json({
      success: true,
      data: {
        appName: app.appName,
        totalSessions: analytics.totalSessions,
        totalRewardsDistributed: analytics.totalRewards,
        averageQualityScore: analytics.averageQuality,
        monthlyActiveTesters: analytics.monthlyTesters,
        topFeedbackKeywords: analytics.feedbackKeywords,
        conversionToHyperDAG: analytics.conversionRate
      }
    });

  } catch (error) {
    console.error('[Embedded Testing API] Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics'
    });
  }
});

/**
 * Get user's registered apps
 * GET /api/embed/my-apps
 */
router.get('/embed/my-apps', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const apps = await storage.getUserEmbeddedApps(req.user.id);

    res.json({
      success: true,
      data: apps.map(app => ({
        appId: app.id,
        appName: app.appName,
        domain: app.domain,
        status: app.integrationStatus,
        monthlyVolume: app.monthlyTestingVolume,
        rewardSettings: app.rewardSettings
      }))
    });

  } catch (error) {
    console.error('[Embedded Testing API] My apps error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your apps'
    });
  }
});

/**
 * Update app reward settings
 * PUT /api/embed/settings/:appId
 */
router.put('/embed/settings/:appId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const { appId } = req.params;
    const { pointsPerTest, bonusForDetailedFeedback, referralBonus } = req.body;

    const app = await storage.getEmbeddedApp(appId);
    if (!app || app.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied or app not found'
      });
    }

    const updatedSettings = {
      pointsPerTest: pointsPerTest || app.rewardSettings.pointsPerTest,
      bonusForDetailedFeedback: bonusForDetailedFeedback || app.rewardSettings.bonusForDetailedFeedback,
      referralBonus: referralBonus || app.rewardSettings.referralBonus
    };

    await storage.updateEmbeddedAppSettings(appId, { rewardSettings: updatedSettings });

    res.json({
      success: true,
      data: {
        appId: appId,
        rewardSettings: updatedSettings,
        message: 'Reward settings updated successfully'
      }
    });

  } catch (error) {
    console.error('[Embedded Testing API] Settings update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

export default router;