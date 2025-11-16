/**
 * ANFIS AI Router API Routes
 * 
 * Provides endpoints for the ANFIS fuzzy logic AI routing system
 */

import express from 'express';
import { aiService } from '../services/ai/ai-service';
import { anfisRouter } from '../services/ai/anfis-router';

const router = express.Router();

/**
 * POST /api/anfis/query
 * Process AI query using ANFIS routing
 */
router.post('/query', async (req, res) => {
  try {
    const { question, context } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    const result = await aiService.processRequest(question, context);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[ERROR][[anfis-ai] Query processing failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process AI query'
    });
  }
});

/**
 * GET /api/anfis/analyze
 * Analyze question characteristics without processing
 */
router.get('/analyze', async (req, res) => {
  try {
    const { question } = req.query;
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Question parameter is required'
      });
    }

    const characteristics = anfisRouter.analyzeQuestion(question);
    const routing = anfisRouter.selectOptimalProvider(characteristics);
    
    res.json({
      success: true,
      data: {
        characteristics,
        routing
      }
    });
  } catch (error) {
    console.error('[ERROR][[anfis-ai] Analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze question'
    });
  }
});

/**
 * GET /api/anfis/providers
 * Get status of all AI providers including MY-deFuzzyAI-Ninja
 */
router.get('/providers', async (req, res) => {
  try {
    const providersStatus = anfisRouter.getProvidersStatus();
    
    res.json({
      success: true,
      data: {
        providers: providersStatus,
        totalProviders: Object.keys(providersStatus).length,
        availableProviders: Object.values(providersStatus).filter((p: any) => p.available).length
      }
    });
  } catch (error) {
    console.error('[ERROR][[anfis-ai] Provider status failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get provider status'
    });
  }
});

/**
 * POST /api/anfis/test-myninja
 * Test MY-deFuzzyAI-Ninja integration specifically
 */
router.post('/test-myninja', async (req, res) => {
  try {
    const { prompt = "Test research capabilities of MY-deFuzzyAI-Ninja" } = req.body;
    
    // Force routing to MyNinja for testing
    const characteristics = anfisRouter.analyzeQuestion(prompt);
    characteristics.analysisIntensive = 0.9; // High analysis requirement
    characteristics.questionType = 'analytical';
    
    const routing = anfisRouter.selectOptimalProvider(characteristics);
    
    if (routing.provider === 'myninja') {
      try {
        const result = await aiService.processRequest(prompt);
        res.json({
          success: true,
          message: 'MY-deFuzzyAI-Ninja integration successful',
          data: {
            provider: result.provider,
            confidence: result.confidence,
            reasoning: result.reasoning,
            responseTime: result.responseTime,
            response: result.response.substring(0, 200) + '...' // Truncate for testing
          }
        });
      } catch (aiError: any) {
        res.json({
          success: false,
          message: 'MY-deFuzzyAI-Ninja integration configured but API call failed',
          error: aiError.message,
          routing: routing
        });
      }
    } else {
      res.json({
        success: false,
        message: 'ANFIS router did not select MyNinja',
        selectedProvider: routing.provider,
        reasoning: routing.reasoning,
        availableProviders: Object.keys(anfisRouter.getProvidersStatus())
      });
    }
  } catch (error) {
    console.error('[ERROR][[anfis-ai] MyNinja test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test MyNinja integration'
    });
  }
});

/**
 * GET /api/anfis/stats
 * Get ANFIS routing statistics and performance metrics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = aiService.getRoutingStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[ERROR][[anfis-ai] Stats retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics'
    });
  }
});

/**
 * GET /api/anfis/providers
 * Get available AI providers and their capabilities
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = {
      openai: {
        name: 'OpenAI',
        available: !!process.env.OPENAI_API_KEY,
        strengths: ['reasoning', 'code_generation', 'versatility']
      },
      anthropic: {
        name: 'Anthropic',
        available: !!process.env.ANTHROPIC_API_KEY,
        strengths: ['reasoning', 'analysis', 'accuracy']
      },
      perplexity: {
        name: 'Perplexity',
        available: !!process.env.PERPLEXITY_API_KEY,
        strengths: ['real_time_knowledge', 'research', 'speed']
      },
      asi1: {
        name: 'ASi1.ai',
        available: !!process.env.ASI1_API_KEY,
        strengths: ['workflows', 'automation', 'specialized_tasks']
      }
    };
    
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('[ERROR][[anfis-ai] Provider info failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve provider information'
    });
  }
});

/**
 * POST /api/anfis/test
 * Test different AI providers with the same question
 */
router.post('/test', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    // Analyze question first
    const characteristics = anfisRouter.analyzeQuestion(question);
    
    // Get routing recommendation
    const routing = anfisRouter.selectOptimalProvider(characteristics);
    
    // Process with recommended provider
    const result = await aiService.processRequest(question);
    
    res.json({
      success: true,
      data: {
        question,
        characteristics,
        routing,
        result
      }
    });
  } catch (error) {
    console.error('[ERROR][[anfis-ai] Test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test AI routing'
    });
  }
});

export default router;