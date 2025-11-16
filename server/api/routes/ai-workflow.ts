import { Router } from 'express';
import { z } from 'zod';
import { SecurityAnalysisWorkflow } from '../../services/ai/langgraph-workflow';
import { logger } from '../../utils/logger';
import { requireAuth } from '../../middleware/auth-middleware';

const aiWorkflowRouter = Router();
const securityAnalysisWorkflow = new SecurityAnalysisWorkflow();

// Schema for code analysis request
const codeAnalysisSchema = z.object({
  code: z.string().min(1, "Code is required"),
  language: z.string().optional().default("javascript"),
});

/**
 * Endpoint for analyzing code security and performance
 * Uses LangGraph to orchestrate AI workflow across multiple providers
 */
aiWorkflowRouter.post('/security-analysis', requireAuth, async (req, res) => {
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
    logger.info(`[AI Workflow] Security analysis requested by user ${req.user?.id} for ${language} code`);
    
    // Run the analysis workflow
    const analysisResult = await securityAnalysisWorkflow.analyzeCode(code);
    
    // Return the result
    return res.json({
      success: true,
      result: analysisResult
    });
  } catch (error) {
    logger.error('[AI Workflow] Error in security analysis endpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
});

export default aiWorkflowRouter;