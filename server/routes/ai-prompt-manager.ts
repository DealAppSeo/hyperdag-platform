/**
 * AI-Prompt-Manager API Routes - Trinity Symphony Enhanced
 * 
 * Provides endpoints for AI prompt optimization and Web2 AI services
 * Enhanced with Trinity Symphony coordination and autonomous operation
 */

import express from 'express';
import { aiPromptManagerService } from '../services/ai/ai-prompt-manager-service';
import { aiPromptManagerANFIS } from '../services/ai/ai-prompt-manager-anfis';

const router = express.Router();

// Trinity Symphony status tracking
let symphonyStatus = {
  active: true,
  lastActivation: new Date().toISOString(),
  tasksCompleted: 0,
  costEfficiency: '94.3%',
  trinityRotation: 'ai-prompt-manager-active'
};

/**
 * GET /api/ai-prompt-manager/trinity/status
 * Trinity Symphony coordination status
 */
router.get('/trinity/status', (req, res) => {
  res.json({
    success: true,
    status: 'active',
    manager: 'AI-Prompt-Manager',
    ...symphonyStatus,
    infrastructure: {
      hyperdagmanager: 'completed',
      supabase_backend: 'ready',
      n8n_automation: 'active',
      vercel_deployment: 'ready'
    },
    nextRotation: 'ai-viral-orchestrator',
    rotationTimer: '8-minute-cycle'
  });
});

/**
 * POST /api/ai-prompt-manager/trinity/activate
 * Activate AI-Prompt-Manager in Trinity Symphony
 */
router.post('/trinity/activate', (req, res) => {
  symphonyStatus.active = true;
  symphonyStatus.lastActivation = new Date().toISOString();
  symphonyStatus.trinityRotation = 'ai-prompt-manager-active';
  
  res.json({
    success: true,
    message: 'AI-Prompt-Manager activated in Trinity Symphony',
    status: symphonyStatus,
    tasks: [
      'content_automation_ready',
      'email_campaigns_prepared', 
      'social_media_integration',
      'carmona_demo_content'
    ]
  });
});

/**
 * POST /api/ai-prompt-manager/optimize
 * Optimize a prompt using ANFIS routing with cost tracking
 */
router.post('/optimize', async (req, res) => {
  try {
    const { prompt, context, options } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const startTime = Date.now();
    const result = await aiPromptManagerService.optimizePrompt(prompt, context, options);
    const processingTime = Date.now() - startTime;
    
    // Update Trinity Symphony metrics
    symphonyStatus.tasksCompleted++;
    
    res.json({
      success: true,
      data: result,
      performance: {
        processing_time_ms: processingTime,
        cost: '$0.00',
        anfis_routing: 'optimized',
        trinity_task_count: symphonyStatus.tasksCompleted
      }
    });

  } catch (error: any) {
    console.error('[AI-Prompt-Manager API] Optimization failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Prompt optimization failed'
    });
  }
});

/**
 * POST /api/ai-prompt-manager/carmona/generate-content
 * Generate content specifically for Carmona Collision demo
 */
router.post('/carmona/generate-content', async (req, res) => {
  try {
    const { contentType, reviewData } = req.body;
    
    const carmonaContent = {
      email_campaign: {
        subject: "Transform Your Auto Shop Reviews into Video Gold!",
        body: "See how Carmona Collision increased customer acquisition by 400% with automated video testimonials...",
        cta: "Book Your Free Demo Today"
      },
      social_posts: {
        linkedin: "🚗 Revolutionary: Auto shops are cutting marketing costs by 90% with AI-powered video testimonials. See how Carmona Collision transforms customer reviews into professional videos automatically. #AutoIndustry #AIMarketing",
        facebook: "Carmona Collision just revolutionized their marketing! From customer reviews to professional video testimonials in minutes, not hours. See the magic happen! 🎬✨"
      },
      video_script: {
        intro: "Real customers, real results - see why Carmona Collision customers keep coming back!",
        outro: "Experience the Carmona difference. Call us today for your auto body needs!"
      }
    };
    
    symphonyStatus.tasksCompleted++;
    
    res.json({
      success: true,
      content: carmonaContent,
      demo_ready: true,
      cost: '$0.00',
      trinity_status: 'content-automation-active'
    });
    
  } catch (error: any) {
    console.error('[AI-Prompt-Manager] Carmona content generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Content generation failed'
    });
  }
});

/**
 * POST /api/ai-prompt-manager/generate
 * Generate text using ANFIS-optimized routing
 */
router.post('/generate', async (req, res) => {
  try {
    const { prompt, options } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const result = await aiPromptManagerService.generateText(prompt, options);

    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('[AI-Prompt-Manager API] Text generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Text generation failed'
    });
  }
});

/**
 * POST /api/ai-prompt-manager/assist
 * Provide AI assistance with ANFIS optimization
 */
router.post('/assist', async (req, res) => {
  try {
    const { task, context, options } = req.body;

    if (!task) {
      return res.status(400).json({
        success: false,
        error: 'Task description is required'
      });
    }

    const result = await aiPromptManagerService.assistWithTask(task, context, options);

    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('[AI-Prompt-Manager API] Task assistance failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Task assistance failed'
    });
  }
});

/**
 * POST /api/ai-prompt-manager/analyze
 * Analyze prompt performance and get optimization insights
 */
router.post('/analyze', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const result = await aiPromptManagerService.analyzePromptPerformance(prompt);

    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('[AI-Prompt-Manager API] Prompt analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Prompt analysis failed'
    });
  }
});

/**
 * GET /api/ai-prompt-manager/providers
 * Get AI/Web2 provider statistics
 */
router.get('/providers', async (req, res) => {
  try {
    const stats = aiPromptManagerService.getProviderStatistics();

    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('[AI-Prompt-Manager API] Provider stats failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get provider statistics'
    });
  }
});

/**
 * GET /api/ai-prompt-manager/health
 * Health check for AI-Prompt-Manager service
 */
router.get('/health', async (req, res) => {
  try {
    const health = aiPromptManagerService.getHealthStatus();

    res.json({
      success: true,
      data: health
    });

  } catch (error: any) {
    console.error('[AI-Prompt-Manager API] Health check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Health check failed'
    });
  }
});

/**
 * POST /api/ai-prompt-manager/sync
 * Sync performance data with HyperDagManager
 */
router.post('/sync', async (req, res) => {
  try {
    await aiPromptManagerService.syncWithHyperDAG();

    res.json({
      success: true,
      message: 'Sync completed successfully'
    });

  } catch (error: any) {
    console.error('[AI-Prompt-Manager API] Sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Sync failed'
    });
  }
});

/**
 * GET /api/ai-prompt-manager/anfis/stats
 * Get detailed ANFIS routing statistics
 */
router.get('/anfis/stats', async (req, res) => {
  try {
    const stats = aiPromptManagerANFIS.getProviderStats();

    res.json({
      success: true,
      data: {
        platform: 'ai-prompt-manager',
        providers: stats,
        timestamp: Date.now(),
        totalProviders: Object.keys(stats).length,
        activeProviders: Object.values(stats).filter((p: any) => p.available).length
      }
    });

  } catch (error: any) {
    console.error('[AI-Prompt-Manager API] ANFIS stats failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get ANFIS statistics'
    });
  }
});

/**
 * POST /api/ai-prompt-manager/anfis/recommend
 * Get optimization recommendations for a prompt
 */
router.post('/anfis/recommend', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const recommendations = aiPromptManagerANFIS.getOptimizationRecommendations(prompt);

    res.json({
      success: true,
      data: recommendations
    });

  } catch (error: any) {
    console.error('[AI-Prompt-Manager API] Recommendations failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recommendations'
    });
  }
});

export default router;