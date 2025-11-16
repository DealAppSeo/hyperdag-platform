/**
 * Reputation API Routes
 * 
 * These routes handle the reputation system (RepID) functionality.
 * Includes integration with HyperCrowd for reputation-based matching and recommendations.
 */

import { Request, Response } from 'express';
import { repIdService, REPUTATION_ACTIVITIES } from '../../services/reputation/rep-id-service';
import { insertReputationActivitySchema, insertVerifiedCredentialSchema, insertTeamMatchSchema } from '@shared/schema';
import { z } from 'zod';
import reputationZKPRouter from './reputation-zkp';
import * as reputationZKPService from '../../services/zkp/reputation-zkp-service';
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

// Type guard for authenticated requests
const isAuthenticatedRequest = (req: any): req is Request & { user: any } => {
  return req.isAuthenticated() && !!req.user;
};

export function registerReputationRoutes(app: any) {
  // Register reputation ZKP routes
  app.use('/api/reputation/zkp', reputationZKPRouter);

  /**
   * Get a user's reputation profile
   */
  app.get('/api/reputation/profile/:userId', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const result = await repIdService.getUserReputation(userId);
      
      if (result.success) {
        return res.json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(404).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error getting reputation profile:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to get reputation profile'));
    }
  });

  /**
   * Add a reputation activity
   */
  app.post('/api/reputation/activity', requireAuth, async (req: Request, res: Response) => {
    try {
      const validation = insertReputationActivitySchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json(apiResponse(false, null, 'Invalid data', { code: 'VALIDATION_ERROR', message: JSON.stringify(validation.error.format()) }));
      }

      const result = await repIdService.addReputationActivity(validation.data);
      
      if (result.success) {
        return res.status(201).json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(400).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error adding reputation activity:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to add reputation activity'));
    }
  });

  /**
   * Create a verified credential
   */
  app.post('/api/reputation/credential', requireAuth, async (req: Request, res: Response) => {
    try {
      const validation = insertVerifiedCredentialSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json(apiResponse(false, null, 'Invalid data', { code: 'VALIDATION_ERROR', message: JSON.stringify(validation.error.format()) }));
      }

      const result = await repIdService.createVerifiedCredential(validation.data);
      
      if (result.success) {
        return res.status(201).json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(400).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error creating verified credential:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to create verified credential'));
    }
  });

  /**
   * Create a team match
   */
  app.post('/api/reputation/team-match', requireAuth, async (req: Request, res: Response) => {
    try {
      const validation = insertTeamMatchSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json(apiResponse(false, null, 'Invalid data', { code: 'VALIDATION_ERROR', message: JSON.stringify(validation.error.format()) }));
      }

      const result = await repIdService.createTeamMatch(validation.data);
      
      if (result.success) {
        return res.status(201).json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(400).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error creating team match:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to create team match'));
    }
  });

  /**
   * Get team matches for a user or project
   */
  app.get('/api/reputation/team-matches', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;

      if (!userId && !projectId) {
        return res.status(400).json(apiResponse(false, null, 'Either userId or projectId must be provided'));
      }

      const result = await repIdService.getTeamMatches({ userId, projectId });
      
      if (result.success) {
        return res.json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(404).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error getting team matches:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to get team matches'));
    }
  });

  /**
   * Get matching grants for a project
   */
  app.get('/api/reputation/matching-grants/:projectId', requireAuth, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const result = await repIdService.getMatchingGrants(projectId);
      
      if (result.success) {
        return res.json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(404).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error getting matching grants:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to get matching grants'));
    }
  });

  /**
   * Update a user's collaboration preferences
   */
  app.patch('/api/reputation/collaboration', requireAuth, async (req: Request, res: Response) => {
    try {
      // Check if the request is authenticated
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json(apiResponse(false, null, 'Authentication required'));
      }
      
      const schema = z.object({
        openToCollaboration: z.boolean()
      });
      
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json(apiResponse(false, null, 'Invalid data', { code: 'VALIDATION_ERROR', message: JSON.stringify(validation.error.format()) }));
      }

      const result = await repIdService.updateCollaborationPreferences(req.user.id, validation.data.openToCollaboration);
      
      if (result.success) {
        return res.json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(400).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error updating collaboration preferences:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to update collaboration preferences'));
    }
  });

  /**
   * Get a list of users who are open to collaboration
   */
  app.get('/api/reputation/collaboration-candidates', requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await repIdService.getCollaborationCandidates();
      
      if (result.success) {
        return res.json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(400).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error getting collaboration candidates:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to get collaboration candidates'));
    }
  });

  /**
   * Award reputation points for HyperCrowd activity
   */
  app.post('/api/reputation/award-hypercrowd-points', requireAuth, async (req: Request, res: Response) => {
    try {
      // Check if the request is authenticated
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json(apiResponse(false, null, 'Authentication required'));
      }

      const schema = z.object({
        userId: z.number(),
        activityType: z.string(),
        referenceId: z.number(),
        additionalDetails: z.string().optional()
      });
      
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json(apiResponse(false, null, 'Invalid data', { code: 'VALIDATION_ERROR', message: JSON.stringify(validation.error.format()) }));
      }

      // Only allow admins or the user themselves to award points
      if (req.user.id !== validation.data.userId && !req.user.isAdmin) {
        return res.status(403).json(apiResponse(false, null, 'Unauthorized to award points to this user'));
      }

      const result = await repIdService.awardHyperCrowdPoints(
        validation.data.userId,
        validation.data.activityType,
        validation.data.referenceId,
        validation.data.additionalDetails
      );
      
      if (result.success) {
        return res.status(201).json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(400).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error awarding HyperCrowd points:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to award HyperCrowd points'));
    }
  });

  /**
   * Get top contributors
   */
  app.get('/api/reputation/top-contributors', async (req: Request, res: Response) => {
    try {
      // Allow this endpoint without authentication since it's public information
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const result = await repIdService.getTopContributors(limit);
      
      if (result.success) {
        return res.json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(400).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error getting top contributors:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to get top contributors'));
    }
  });

  /**
   * Get reputation breakdown for a user
   */
  app.get('/api/reputation/breakdown/:userId', requireAuth, async (req: Request, res: Response) => {
    try {
      // Check if the request is authenticated
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json(apiResponse(false, null, 'Authentication required'));
      }

      const userId = parseInt(req.params.userId);
      
      // Only allow users to view their own breakdown or admins to view any
      if (req.user.id !== userId && !req.user.isAdmin) {
        return res.status(403).json(apiResponse(false, null, 'Unauthorized to view this reputation breakdown'));
      }
      
      const result = await repIdService.getReputationBreakdown(userId);
      
      if (result.success) {
        return res.json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(404).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error getting reputation breakdown:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to get reputation breakdown'));
    }
  });

  /**
   * Get reputation-based recommendations
   */
  app.get('/api/reputation/recommendations', requireAuth, async (req: Request, res: Response) => {
    try {
      // Check if the request is authenticated
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json(apiResponse(false, null, 'Authentication required'));
      }
      
      const result = await repIdService.getReputationBasedRecommendations(req.user.id);
      
      if (result.success) {
        return res.json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(404).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error getting reputation-based recommendations:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to get reputation-based recommendations'));
    }
  });

  /**
   * Check if user meets reputation requirements
   */
  app.get('/api/reputation/check-requirement', requireAuth, async (req: Request, res: Response) => {
    try {
      // Check if the request is authenticated
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json(apiResponse(false, null, 'Authentication required'));
      }
      
      const requiredScore = req.query.requiredScore ? parseInt(req.query.requiredScore as string) : 0;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : req.user.id;
      
      // Only allow users to check their own requirement or admins to check any
      if (req.user.id !== userId && !req.user.isAdmin) {
        return res.status(403).json(apiResponse(false, null, 'Unauthorized to check reputation for this user'));
      }
      
      const result = await repIdService.checkReputationRequirement(userId, requiredScore);
      
      if (result.success) {
        return res.json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(404).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error checking reputation requirement:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to check reputation requirement'));
    }
  });

  // Reputation breakdown endpoint is already defined above

  // Recommendations endpoint is already defined above

  // Top contributors endpoint is already defined above

  /**
   * Get reputation activity types
   */
  app.get('/api/reputation/activity-types', async (req: Request, res: Response) => {
    try {
      // Allow this endpoint without authentication since it's just metadata
      res.json(apiResponse(true, REPUTATION_ACTIVITIES, 'Reputation activity types'));
    } catch (error) {
      console.error('Error getting reputation activity types:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to get reputation activity types'));
    }
  });
  
  /**
   * Get user reputation activities (summarized by type)
   */
  app.get('/api/reputation/activities', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json(apiResponse(false, null, 'Authentication required'));
      }
      
      const userId = req.query.userId ? parseInt(req.query.userId as string) : req.user.id;
      
      // Only allow users to view their own activities or admins to view any
      if (req.user.id !== userId && !req.user.isAdmin) {
        return res.status(403).json(apiResponse(false, null, 'Unauthorized to view activities for this user'));
      }
      
      const result = await repIdService.getUserActivities(userId);
      
      if (result.success) {
        return res.json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(404).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error getting user activities:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to get user activities'));
    }
  });
  
  /**
   * Get detailed user reputation activities with filtering, pagination, and sorting
   */
  app.get('/api/reputation/activities/detailed', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json(apiResponse(false, null, 'Authentication required'));
      }
      
      // Parse query parameters
      const userId = req.query.userId ? parseInt(req.query.userId as string) : req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const type = req.query.type as string | undefined;
      const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
      const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
      const sortBy = req.query.sortBy === 'points' ? 'points' : 'timestamp';
      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
      
      // Only allow users to view their own activities or admins to view any
      if (req.user.id !== userId && !req.user.isAdmin) {
        return res.status(403).json(apiResponse(false, null, 'Unauthorized to view activities for this user'));
      }
      
      // Get detailed activities with filters and pagination
      const result = await repIdService.getUserDetailedActivities(userId, {
        limit,
        offset,
        type,
        fromDate,
        toDate,
        sortBy: sortBy as 'points' | 'timestamp',
        sortOrder: sortOrder as 'asc' | 'desc'
      });
      
      if (result.success) {
        return res.json({
          success: true,
          data: result.data,
          total: result.total || 0,
          meta: {
            pagination: {
              limit,
              offset,
              total: result.total || 0
            },
            filters: {
              type,
              fromDate,
              toDate
            },
            sorting: {
              sortBy,
              sortOrder
            }
          },
          message: result.message
        });
      } else {
        return res.status(404).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error getting detailed user activities:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to get detailed user activities'));
    }
  });
  
  /**
   * Get user credentials
   */
  app.get('/api/reputation/credentials', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json(apiResponse(false, null, 'Authentication required'));
      }
      
      const userId = req.query.userId ? parseInt(req.query.userId as string) : req.user.id;
      
      // Only allow users to view their own credentials or admins to view any
      if (req.user.id !== userId && !req.user.isAdmin) {
        return res.status(403).json(apiResponse(false, null, 'Unauthorized to view credentials for this user'));
      }
      
      const result = await repIdService.getUserCredentials(userId);
      
      if (result.success) {
        return res.json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(404).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error getting user credentials:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to get user credentials'));
    }
  });
  
  /**
   * Get current user's reputation profile
   */
  app.get('/api/reputation/profile', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json(apiResponse(false, null, 'Authentication required'));
      }
      
      const userId = req.user.id;
      const result = await repIdService.getUserReputation(userId);
      
      if (result.success) {
        return res.json(apiResponse(true, result.data, result.message));
      } else {
        return res.status(404).json(apiResponse(false, null, result.message));
      }
    } catch (error) {
      console.error('Error getting reputation profile:', error);
      return res.status(500).json(apiResponse(false, null, 'Failed to get reputation profile'));
    }
  });
}