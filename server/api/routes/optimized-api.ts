/**
 * API routes specifically optimized for mobile consumption
 * These routes return lightweight versions of data with pagination
 */

import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../../storage';
import { Project } from '@shared/schema';

// Create router
const router = Router();

// Middleware to check if the user is authenticated
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  next();
};

// Helper to check if request is from a mobile device
const isMobileRequest = (req: Request): boolean => {
  const userAgent = req.headers['user-agent'] || '';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

/**
 * Lightweight user profile data
 * Only returns essential user data for mobile devices
 */
router.get('/user/lightweight', requireAuth, async (req: Request, res: Response) => {
  try {
    // @ts-ignore - user is added by auth middleware
    const userId = req.user.id;
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Return only essential user data for mobile
    const lightweightUserData = {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      bio: user.bio || '',
      persona: user.persona || 'developer',
      authLevel: user.authLevel,
      reputationScore: user.reputationScore,
      // Only return verified status of social accounts, not details
      socialVerification: {
        github: !!user.githubVerified,
        twitter: !!user.xVerified,
        discord: !!user.discordVerified,
        medium: !!user.mediumVerified,
        stackoverflow: !!user.stackoverflowVerified
      }
    };

    return res.json({ success: true, data: lightweightUserData });
  } catch (error) {
    console.error('[Optimized API] Error fetching lightweight user data:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user data' });
  }
});

/**
 * Lightweight projects list
 * Returns a paginated, simplified list of projects
 */
router.get('/projects/lightweight', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const projects = await storage.getProjectsPaginated(page, limit);
    
    // Transform to lightweight format
    const lightweightProjects = projects.map((project: Project) => ({
      id: project.id,
      title: project.title,
      type: project.type,
      categories: project.categories,
      createdAt: project.createdAt,
      fundingGoal: project.fundingGoal,
      currentFunding: project.currentFunding || 0,
      progress: project.fundingGoal ? Math.min(100, Math.round((project.currentFunding || 0) / (project.fundingGoal || 1) * 100)) : 0
    }));

    // Get total count for pagination
    const totalProjects = (await storage.getProjects()).length;
    const totalPages = Math.ceil(totalProjects / limit);

    return res.json({
      success: true,
      data: lightweightProjects,
      pagination: {
        page,
        limit,
        totalItems: totalProjects,
        totalPages
      }
    });
  } catch (error) {
    console.error('[Optimized API] Error fetching lightweight projects:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
});

/**
 * Lightweight RFP listing
 * Returns simplified RFP data for mobile
 */
router.get('/rfps/lightweight', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const rfps = await storage.getRfpsPaginated(page, limit);
    
    // Transform to lightweight format
    const lightweightRfps = rfps.map((rfp: any) => ({
      id: rfp.id,
      title: rfp.title,
      category: rfp.category,
      status: rfp.status,
      fundingGoal: rfp.fundingGoal,
      totalFunded: rfp.totalFunded,
      deadline: rfp.deadline,
      createdAt: rfp.createdAt,
      progress: rfp.fundingGoal ? Math.min(100, Math.round((rfp.totalFunded || 0) / rfp.fundingGoal * 100)) : 0
    }));

    // Get total count for pagination
    const totalRfps = (await storage.getRfps()).length;
    const totalPages = Math.ceil(totalRfps / limit);

    return res.json({
      success: true,
      data: lightweightRfps,
      pagination: {
        page,
        limit,
        totalItems: totalRfps,
        totalPages
      }
    });
  } catch (error) {
    console.error('[Optimized API] Error fetching lightweight RFPs:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch RFPs' });
  }
});

/**
 * Middleware to automatically redirect mobile requests to lightweight endpoints
 * This should be registered at the app level, not at the router level
 */
const mobileRedirectMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Only apply to GET requests on specific endpoints
  if (req.method !== 'GET' || !isMobileRequest(req)) {
    return next();
  }

  // Map of standard endpoints to their lightweight versions
  const endpointMap: Record<string, string> = {
    '/api/user': '/api/optimized/user/lightweight',
    '/api/projects': '/api/optimized/projects/lightweight',
    '/api/rfps': '/api/optimized/rfps/lightweight'
  };

  // Check if current path has a lightweight alternative
  const lightweightPath = endpointMap[req.path];
  if (lightweightPath && !req.query.fullData) {
    console.log(`[Mobile Optimization] Redirecting ${req.path} to ${lightweightPath}`);
    req.url = lightweightPath;
  }

  next();
};

// Export the router and middleware
export default router;
export { mobileRedirectMiddleware };