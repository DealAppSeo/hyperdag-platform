import { Router } from 'express';
import { z } from 'zod';
import { AIWorkflowService } from '../../services/ai/ai-workflow-service';
import { logger } from '../../utils/logger';
import { requireAuth } from '../../middleware/auth-middleware';

const aiWorkflowRouter = Router();
const aiWorkflowService = new AIWorkflowService();

// Schema for code analysis request
const codeAnalysisSchema = z.object({
  code: z.string().min(1, "Code is required"),
  language: z.string().optional().default("javascript"),
});

// Schema for personalized assistance request
const personalAssistanceSchema = z.object({
  query: z.string().min(1, "Query is required"),
  userLevel: z.enum(['beginner', 'intermediate', 'expert']).optional().default('intermediate'),
});

// Schema for grant recommendations request
const grantRecommendationsSchema = z.object({
  project: z.object({
    title: z.string(),
    description: z.string(),
    categories: z.array(z.string()),
  }),
  availableGrants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      fundingAmount: z.number(),
      requirements: z.array(z.string()),
    })
  ),
});

/**
 * Endpoint for analyzing code security and performance
 * Uses AI service with provider redundancy for reliability
 */
aiWorkflowRouter.post('/code-analysis', requireAuth, async (req, res) => {
  try {
    // Validate request
    const validationResult = codeAnalysisSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false, 
        errors: validationResult.error.errors
      });
    }
    
    const { code, language } = validationResult.data;
    
    // Log analysis request (without including the full code for security)
    logger.info(`[AI Workflow] Code analysis requested by user ${req.user?.id} for ${language} code`);
    
    // Run the analysis workflow
    const analysisResult = await aiWorkflowService.analyzeCode(code);
    
    // Return the result
    return res.json({
      success: true,
      result: analysisResult
    });
  } catch (error) {
    logger.error('[AI Workflow] Error in code analysis endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
});

/**
 * Endpoint for personalized assistance based on user level
 */
aiWorkflowRouter.post('/assistance', requireAuth, async (req, res) => {
  try {
    // Validate request
    const validationResult = personalAssistanceSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false, 
        errors: validationResult.error.errors
      });
    }
    
    const { query, userLevel } = validationResult.data;
    
    // Log assistance request
    logger.info(`[AI Workflow] Assistance requested by user ${req.user?.id} with level ${userLevel}`);
    
    // Generate personalized assistance
    const assistance = await aiWorkflowService.generatePersonalizedAssistance(query, userLevel);
    
    if (!assistance) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate assistance'
      });
    }
    
    // Return the result
    return res.json({
      success: true,
      result: assistance
    });
  } catch (error) {
    logger.error('[AI Workflow] Error in assistance endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
});

/**
 * Endpoint for grant matching recommendations
 */
aiWorkflowRouter.post('/grant-recommendations', requireAuth, async (req, res) => {
  try {
    // Validate request
    const validationResult = grantRecommendationsSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false, 
        errors: validationResult.error.errors
      });
    }
    
    const { project, availableGrants } = validationResult.data;
    
    // Log grant recommendations request
    logger.info(`[AI Workflow] Grant recommendations requested by user ${req.user?.id} for project "${project.title}"`);
    
    // Generate grant recommendations
    const recommendations = await aiWorkflowService.generateGrantRecommendations(project, availableGrants);
    
    if (!recommendations) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate grant recommendations'
      });
    }
    
    // Return the result
    return res.json({
      success: true,
      result: recommendations
    });
  } catch (error) {
    logger.error('[AI Workflow] Error in grant recommendations endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
});

export default aiWorkflowRouter;