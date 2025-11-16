import { Router, Request, Response } from 'express';
import { advancedAIAgentSystem } from '../../services/ai/advanced-ai-agent';
import { requireAuth } from '../../middleware/auth-middleware';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * Get AI agent system status
 * @route GET /api/advanced-ai/status
 */
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const status = advancedAIAgentSystem.getCapabilitiesStatus();
    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('[advanced-ai-api] Error getting status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get AI agent system status'
    });
  }
});

/**
 * Analyze code quality
 * @route POST /api/advanced-ai/analyze-code
 */
router.post('/analyze-code', requireAuth, async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: 'Code snippet and language are required'
      });
    }
    
    const analysis = await advancedAIAgentSystem.analyzeCode(code, language);
    
    if (!analysis) {
      return res.status(503).json({
        success: false,
        message: 'Code analysis service is currently unavailable'
      });
    }
    
    return res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('[advanced-ai-api] Error analyzing code:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze code'
    });
  }
});

/**
 * Scan for security vulnerabilities
 * @route POST /api/advanced-ai/security-scan
 */
router.post('/security-scan', requireAuth, async (req: Request, res: Response) => {
  try {
    const { codebase } = req.body;
    
    if (!codebase || !Array.isArray(codebase) || codebase.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid codebase array is required'
      });
    }
    
    const scanResult = await advancedAIAgentSystem.scanSecurity(codebase);
    
    if (!scanResult) {
      return res.status(503).json({
        success: false,
        message: 'Security scanning service is currently unavailable'
      });
    }
    
    return res.json({
      success: true,
      data: scanResult
    });
  } catch (error) {
    logger.error('[advanced-ai-api] Error scanning security:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to scan for security vulnerabilities'
    });
  }
});

/**
 * Generate architecture improvement plan
 * @route POST /api/advanced-ai/architecture-improvement
 */
router.post('/architecture-improvement', requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentArchitecture, performanceMetrics } = req.body;
    
    if (!currentArchitecture) {
      return res.status(400).json({
        success: false,
        message: 'Current architecture description is required'
      });
    }
    
    const metrics = performanceMetrics || {};
    const improvementPlan = await advancedAIAgentSystem.generateArchitectureImprovement(
      currentArchitecture,
      metrics
    );
    
    if (!improvementPlan) {
      return res.status(503).json({
        success: false,
        message: 'Architecture improvement service is currently unavailable'
      });
    }
    
    return res.json({
      success: true,
      data: improvementPlan
    });
  } catch (error) {
    logger.error('[advanced-ai-api] Error generating architecture improvement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate architecture improvement plan'
    });
  }
});

/**
 * Multi-agent collaboration on a task
 * @route POST /api/advanced-ai/collaborate
 */
router.post('/collaborate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { taskDescription, agentSpecialities, context } = req.body;
    
    if (!taskDescription || !agentSpecialities || !Array.isArray(agentSpecialities)) {
      return res.status(400).json({
        success: false,
        message: 'Task description and agent specialities array are required'
      });
    }
    
    const collaborationResult = await advancedAIAgentSystem.collaborateOnTask(
      taskDescription,
      agentSpecialities,
      context || {}
    );
    
    if (!collaborationResult) {
      return res.status(503).json({
        success: false,
        message: 'AI collaboration service is currently unavailable'
      });
    }
    
    return res.json({
      success: true,
      data: collaborationResult
    });
  } catch (error) {
    logger.error('[advanced-ai-api] Error in agent collaboration:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to perform agent collaboration'
    });
  }
});

/**
 * Get personalized assistance
 * @route POST /api/advanced-ai/personalized-assistance
 */
router.post('/personalized-assistance', requireAuth, async (req: Request, res: Response) => {
  try {
    const { query, userHistory } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'User query is required'
      });
    }
    
    // Default to beginner if no knowledge level is provided
    const history = userHistory || {
      pastInteractions: [],
      knowledgeLevel: 'beginner',
      preferences: {}
    };
    
    const assistance = await advancedAIAgentSystem.generatePersonalizedAssistance(
      req.user?.id || 0,
      history,
      query
    );
    
    if (!assistance) {
      return res.status(503).json({
        success: false,
        message: 'Personalized assistance service is currently unavailable'
      });
    }
    
    return res.json({
      success: true,
      data: assistance
    });
  } catch (error) {
    logger.error('[advanced-ai-api] Error generating personalized assistance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate personalized assistance'
    });
  }
});

export default router;