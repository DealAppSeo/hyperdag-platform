/**
 * Feedback API Routes
 * 
 * This module implements the API routes for collecting and analyzing user feedback.
 */

import { Router } from 'express';
import { feedbackService, FeedbackItem, FeedbackType, FeedbackCategory, FeedbackSeverity } from '../services/feedback';
import { requireAuth } from '../middleware/auth-middleware';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Submit new feedback
 * 
 * POST /api/feedback
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      type,
      category,
      severity,
      title,
      description,
      path,
      screenshot,
      metadata,
      rating
    } = req.body;
    
    // Basic validation
    if (!type || !category || !severity || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (type, category, severity, title, description)',
      });
    }
    
    // Create feedback item
    const feedback: FeedbackItem = {
      userId: req.user!.id,
      type: type as FeedbackType,
      category: category as FeedbackCategory,
      severity: severity as FeedbackSeverity,
      title,
      description,
      path,
      screenshot,
      metadata,
      rating
    };
    
    // Submit feedback
    const result = await feedbackService.submitFeedback(feedback);
    
    if (result) {
      return res.status(201).json({
        success: true,
        data: result,
        message: 'Feedback submitted successfully',
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to submit feedback',
      });
    }
  } catch (error) {
    logger.error('[api] [feedback] Error submitting feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Get all feedback with optional filters
 * 
 * GET /api/feedback
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const {
      userId,
      type,
      category,
      status,
      limit,
      offset
    } = req.query;
    
    // Parse query parameters
    const options: any = {};
    
    // Only administrators can see all feedback
    if (req.user!.role === 'admin') {
      if (userId) options.userId = parseInt(userId as string);
    } else {
      // Regular users can only see their own feedback
      options.userId = req.user!.id;
    }
    
    if (type) options.type = type as FeedbackType;
    if (category) options.category = category as FeedbackCategory;
    if (status) options.status = status;
    if (limit) options.limit = parseInt(limit as string);
    if (offset) options.offset = parseInt(offset as string);
    
    const feedback = await feedbackService.getFeedback(options);
    
    return res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    logger.error('[api] [feedback] Error getting feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Get feedback by ID
 * 
 * GET /api/feedback/:id
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback ID',
      });
    }
    
    const feedback = await feedbackService.getFeedbackById(id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }
    
    // Only admin or the feedback owner can view details
    if (req.user!.role !== 'admin' && feedback.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    return res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    logger.error(`[api] [feedback] Error getting feedback #${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Update feedback status
 * 
 * PATCH /api/feedback/:id/status
 */
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    // Only admins can update status
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update feedback status',
      });
    }
    
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback ID',
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }
    
    const success = await feedbackService.updateFeedbackStatus(id, status);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Feedback status updated successfully',
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to update feedback status',
      });
    }
  } catch (error) {
    logger.error(`[api] [feedback] Error updating feedback #${req.params.id} status:`, error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Upvote feedback
 * 
 * POST /api/feedback/:id/upvote
 */
router.post('/:id/upvote', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback ID',
      });
    }
    
    const success = await feedbackService.upvoteFeedback(id);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Feedback upvoted successfully',
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to upvote feedback',
      });
    }
  } catch (error) {
    logger.error(`[api] [feedback] Error upvoting feedback #${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Delete feedback
 * 
 * DELETE /api/feedback/:id
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback ID',
      });
    }
    
    // Get the feedback to check ownership
    const feedback = await feedbackService.getFeedbackById(id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }
    
    // Only admin or the feedback owner can delete
    if (req.user!.role !== 'admin' && feedback.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    const success = await feedbackService.deleteFeedback(id);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Feedback deleted successfully',
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete feedback',
      });
    }
  } catch (error) {
    logger.error(`[api] [feedback] Error deleting feedback #${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Get feedback statistics
 * 
 * GET /api/feedback/stats
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    // Only administrators can see feedback statistics
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view feedback statistics',
      });
    }
    
    const stats = await feedbackService.getFeedbackStats();
    
    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('[api] [feedback] Error getting feedback stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Get feedback themes
 * 
 * GET /api/feedback/themes
 */
router.get('/themes', requireAuth, async (req, res) => {
  try {
    // Only administrators can see feedback themes
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view feedback themes',
      });
    }
    
    const themes = await feedbackService.getFeedbackThemes();
    
    return res.json({
      success: true,
      data: themes,
    });
  } catch (error) {
    logger.error('[api] [feedback] Error getting feedback themes:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * Get actionable insights from feedback
 * 
 * GET /api/feedback/insights
 */
router.get('/insights', requireAuth, async (req, res) => {
  try {
    // Only administrators can see insights
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view feedback insights',
      });
    }
    
    const insights = await feedbackService.getActionableInsights();
    
    return res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    logger.error('[api] [feedback] Error getting feedback insights:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;