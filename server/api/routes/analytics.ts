import { Router } from 'express';
import { storage } from '../../storage';
import { sendSuccess, sendError } from '../../utils/api-response';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit for analytics to prevent abuse
const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  message: { success: false, message: 'Too many analytics requests, please try again later.' }
});

// Admin only middleware
const requireAdmin = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    return sendError(res, 'Admin access required', 'UNAUTHORIZED', 403);
  }
  next();
};

// Track user events
router.post('/event', analyticsLimiter, async (req, res) => {
  try {
    const { category, action, label, value, metadata, sessionId } = req.body;
    
    if (!category || !action) {
      return sendError(res, 'Missing required fields', 'VALIDATION_ERROR', 400);
    }
    
    // Set userId if user is authenticated
    const userId = req.isAuthenticated() ? req.user.id : null;
    
    // Store the event in the database
    await storage.createAnalyticsEvent({
      userId,
      sessionId,
      category,
      action,
      label: label || null,
      value: value || null,
      metadata: metadata || null,
      createdAt: new Date()
    });
    
    // If user is authenticated, we can update their engagement score
    if (userId) {
      await storage.incrementUserEngagement(userId, 1);
    }
    
    return sendSuccess(res);
  } catch (error) {
    console.error('Analytics event error:', error);
    return sendError(res, 'Failed to record event', 'ANALYTICS_ERROR', 500);
  }
});

// Track page views
router.post('/pageview', analyticsLimiter, async (req, res) => {
  try {
    const { path, title, referrer, sessionId } = req.body;
    
    if (!path) {
      return sendError(res, 'Missing required fields', 'VALIDATION_ERROR', 400);
    }
    
    // Set userId if user is authenticated
    const userId = req.isAuthenticated() ? req.user.id : null;
    
    // Store the pageview in the database
    await storage.createPageView({
      userId,
      sessionId,
      path,
      title: title || null,
      referrer: referrer || null,
      createdAt: new Date()
    });
    
    return sendSuccess(res);
  } catch (error) {
    console.error('Analytics pageview error:', error);
    return sendError(res, 'Failed to record pageview', 'ANALYTICS_ERROR', 500);
  }
});

// Get user analytics summary (requires authentication)
router.get('/user-summary', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return sendError(res, 'Authentication required', 'UNAUTHORIZED', 401);
    }
    
    const userId = req.user.id;
    
    // Get analytics summary
    const summary = await storage.getUserAnalyticsSummary(userId);
    
    return sendSuccess(res, summary);
  } catch (error) {
    console.error('Analytics summary error:', error);
    return sendError(res, 'Failed to get analytics summary', 'ANALYTICS_ERROR', 500);
  }
});

// ADMIN ANALYTICS ENDPOINTS

// Get page view statistics for admin dashboard
router.get('/admin/page-views', requireAdmin, async (req, res) => {
  try {
    const pageViewsData = await storage.getAdminPageViewsAnalytics();
    return sendSuccess(res, pageViewsData);
  } catch (error) {
    console.error('Admin analytics page views error:', error);
    return sendError(res, 'Failed to get page view analytics', 'ANALYTICS_ERROR', 500);
  }
});

// Get event statistics for admin dashboard
router.get('/admin/events', requireAdmin, async (req, res) => {
  try {
    const eventsData = await storage.getAdminEventsAnalytics();
    return sendSuccess(res, eventsData);
  } catch (error) {
    console.error('Admin analytics events error:', error);
    return sendError(res, 'Failed to get events analytics', 'ANALYTICS_ERROR', 500);
  }
});

// Get user statistics for admin dashboard
router.get('/admin/user-stats', requireAdmin, async (req, res) => {
  try {
    const userStats = await storage.getAdminUserAnalytics();
    return sendSuccess(res, userStats);
  } catch (error) {
    console.error('Admin analytics user stats error:', error);
    return sendError(res, 'Failed to get user analytics', 'ANALYTICS_ERROR', 500);
  }
});

// Get all analytics data in one call for admin dashboard
router.get('/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const [pageViewsData, eventsData, userStats] = await Promise.all([
      storage.getAdminPageViewsAnalytics(),
      storage.getAdminEventsAnalytics(),
      storage.getAdminUserAnalytics()
    ]);

    return sendSuccess(res, {
      pageViews: pageViewsData,
      events: eventsData,
      userStats: userStats
    });
  } catch (error) {
    console.error('Admin analytics dashboard error:', error);
    return sendError(res, 'Failed to get analytics dashboard data', 'ANALYTICS_ERROR', 500);
  }
});

export default router;