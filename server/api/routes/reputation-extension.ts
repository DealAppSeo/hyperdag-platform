/**
 * Reputation Extension API Routes
 * 
 * These routes expose the extended reputation functionality,
 * including persona-specific metrics and enhanced recommendations.
 */

import { Request, Response } from 'express';
import { repIdServiceExtension } from '../../services/reputation/rep-id-service-extension';
import { log } from '../../vite';

// Helper function for API responses
const apiResponse = (success: boolean, data?: any, message?: string, error?: { code: string, message: string }) => {
  if (success) {
    return { success, data, message };
  } else {
    return { success, error: error || { code: 'UNKNOWN_ERROR', message: message || 'An unknown error occurred' } };
  }
};

// Auth middleware
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json(apiResponse(false, null, 'Authentication required', { code: 'UNAUTHORIZED', message: 'Authentication required' }));
  }
  next();
};

export function registerReputationExtensionRoutes(app: any) {
  /**
   * Get persona-specific reputation metrics for a user
   */
  app.get('/api/reputation/persona-metrics/:userId', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const result = await repIdServiceExtension.getPersonaMetrics(userId);
      
      if (result.success) {
        return res.json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(404).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error getting persona metrics:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to get persona metrics'));
    }
  });

  /**
   * Get reputation-based recommendations
   */
  app.get('/api/reputation/recommendations/:userId', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const result = await repIdServiceExtension.getReputationRecommendations(userId);
      
      if (result.success) {
        return res.json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(404).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error getting reputation recommendations:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to get reputation recommendations'));
    }
  });

  /**
   * Award persona-specific reputation points
   */
  app.post('/api/reputation/award-points', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId, activityType, points, description } = req.body;
      
      if (!userId || !activityType || !points || !description) {
        return res.status(400).json(apiResponse(false, null, 'Missing required fields', { code: 'VALIDATION_ERROR', message: 'userId, activityType, points, and description are required' }));
      }
      
      const result = await repIdServiceExtension.awardPersonaPoints(
        userId,
        activityType,
        points,
        description
      );
      
      if (result.success) {
        return res.status(201).json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(400).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error awarding reputation points:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to award reputation points'));
    }
  });
}
