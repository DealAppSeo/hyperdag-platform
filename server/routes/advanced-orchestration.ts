/**
 * Advanced Orchestration API Routes
 * Comprehensive AI orchestration system with enhanced capabilities
 */

import express from 'express';
import { advancedPromptAnalyzer } from '../services/advanced/prompt-analyzer.js';
import { hyperDAGManager } from '../services/advanced/hyperdag-manager.js';
import { arpoAgent } from '../services/advanced/arpo-agent.js';
import { multiModalRAG } from '../services/advanced/multimodal-rag.js';
import { constitutionalRLAIF } from '../services/advanced/constitutional-rlaif.js';

// Import Trinity DragonflyDB integration
import trinityCache from '../../trinity-dragonfly-production.js';

const router = express.Router();

/**
 * POST /api/advanced/prompt-analysis
 * Analyze prompt with advanced NLP pipeline
 */
router.post('/prompt-analysis', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    // Check DragonflyDB cache first
    const cacheKey = { prompt, context: context || {} };
    const cached = await trinityCache.getCachedAIResponse(cacheKey);
    
    if (cached) {
      console.log(`⚡ Cache HIT for prompt analysis: ${prompt.substring(0, 50)}...`);
      return res.json({
        success: true,
        data: {
          ...cached,
          cached: true,
          cache_age_hours: cached.cache_age_hours,
          performance_boost: 'DragonflyDB cache acceleration'
        }
      });
    }

    console.log(`💾 Cache MISS for prompt analysis: ${prompt.substring(0, 50)}...`);
    const analysis = await advancedPromptAnalyzer.analyze(prompt, context);
    
    // Cache the analysis for future requests
    await trinityCache.cacheAIResponse(cacheKey, {
      ...analysis,
      provider: 'advanced-prompt-analyzer',
      model: 'nlp-pipeline-v2'
    });
    
    res.json({
      success: true,
      data: {
        ...analysis,
        cached: false,
        cache_stored: true,
        metadata: {
          analysisTimestamp: new Date().toISOString(),
          processingModel: 'advanced-nlp-pipeline-v2'
        }
      }
    });
  } catch (error) {
    console.error('[Advanced Orchestration] Prompt analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze prompt'
    });
  }
});

/**
 * POST /api/advanced/dag-workflow/create
 * Create a new DAG workflow
 */
router.post('/dag-workflow/create', async (req, res) => {
  try {
    const { workflowId, tasks } = req.body;
    
    if (!workflowId || !tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        error: 'WorkflowId and tasks array are required'
      });
    }

    hyperDAGManager.createTaskGraph(workflowId, tasks);
    
    res.json({
      success: true,
      data: {
        workflowId,
        taskCount: tasks.length,
        message: 'DAG workflow created successfully'
      }
    });
  } catch (error) {
    console.error('[Advanced Orchestration] DAG creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create DAG workflow'
    });
  }
});

/**
 * POST /api/advanced/dag-workflow/plan
 * Plan execution for a DAG workflow
 */
router.post('/dag-workflow/plan', async (req, res) => {
  try {
    const { workflowId, constraints } = req.body;
    
    if (!workflowId) {
      return res.status(400).json({
        success: false,
        error: 'WorkflowId is required'
      });
    }

    const executionPlan = await hyperDAGManager.planExecution(workflowId, constraints);
    
    res.json({
      success: true,
      data: executionPlan
    });
  } catch (error) {
    console.error('[Advanced Orchestration] Execution planning failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to plan workflow execution'
    });
  }
});

/**
 * POST /api/advanced/dag-workflow/execute
 * Execute a planned DAG workflow
 */
router.post('/dag-workflow/execute', async (req, res) => {
  try {
    const { workflowId, planId, context } = req.body;
    
    if (!workflowId || !planId) {
      return res.status(400).json({
        success: false,
        error: 'WorkflowId and planId are required'
      });
    }

    // Get the execution plan (in practice, this would be stored)
    const executionPlan = await hyperDAGManager.planExecution(workflowId);
    const results = await hyperDAGManager.executeGraph(workflowId, executionPlan, context);
    
    res.json({
      success: true,
      data: {
        workflowId,
        planId,
        executionResults: Object.fromEntries(results),
        completedTasks: results.size,
        successRate: Array.from(results.values()).filter(r => r.status === 'success').length / results.size
      }
    });
  } catch (error) {
    console.error('[Advanced Orchestration] Workflow execution failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute workflow'
    });
  }
});

/**
 * GET /api/advanced/dag-workflow/stats
 * Get DAG workflow execution statistics
 */
router.get('/dag-workflow/stats', async (req, res) => {
  try {
    const { workflowId } = req.query;
    
    const stats = hyperDAGManager.getExecutionStats(workflowId as string);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Advanced Orchestration] Stats retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow statistics'
    });
  }
});

/**
 * POST /api/advanced/arpo/select-provider
 * Select optimal AI provider using ARPO agent
 */
router.post('/arpo/select-provider', async (req, res) => {
  try {
    const { state, availableProviders, options } = req.body;
    
    if (!state || !availableProviders) {
      return res.status(400).json({
        success: false,
        error: 'State and availableProviders are required'
      });
    }

    const selection = await arpoAgent.selectProvider(state, availableProviders);
    
    res.json({
      success: true,
      data: selection
    });
  } catch (error) {
    console.error('[Advanced Orchestration] ARPO selection failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to select provider'
    });
  }
});

/**
 * POST /api/advanced/arpo/update-policy
 * Update ARPO policy with experience trajectory
 */
router.post('/arpo/update-policy', async (req, res) => {
  try {
    const { trajectory } = req.body;
    
    if (!trajectory) {
      return res.status(400).json({
        success: false,
        error: 'Experience trajectory is required'
      });
    }

    await arpoAgent.updatePolicy(trajectory);
    
    res.json({
      success: true,
      data: {
        message: 'ARPO policy updated successfully',
        trajectoryLength: trajectory.states?.length || 0
      }
    });
  } catch (error) {
    console.error('[Advanced Orchestration] ARPO policy update failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ARPO policy'
    });
  }
});

/**
 * GET /api/advanced/arpo/stats
 * Get ARPO agent statistics
 */
router.get('/arpo/stats', async (req, res) => {
  try {
    const stats = arpoAgent.getAgentStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Advanced Orchestration] ARPO stats retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ARPO statistics'
    });
  }
});

/**
 * POST /api/advanced/multimodal-rag/add-document
 * Add multi-modal document to knowledge base
 */
router.post('/multimodal-rag/add-document', async (req, res) => {
  try {
    const { documentId, content } = req.body;
    
    if (!documentId || !content) {
      return res.status(400).json({
        success: false,
        error: 'DocumentId and content are required'
      });
    }

    await multiModalRAG.addDocument(documentId, content);
    
    res.json({
      success: true,
      data: {
        documentId,
        message: 'Multi-modal document added successfully'
      }
    });
  } catch (error) {
    console.error('[Advanced Orchestration] Multi-modal document addition failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add multi-modal document'
    });
  }
});

/**
 * POST /api/advanced/multimodal-rag/query
 * Perform multi-modal RAG query
 */
router.post('/multimodal-rag/query', async (req, res) => {
  try {
    const { query, options } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    const retrievalResults = await multiModalRAG.retrieveMultiModal(query, options);
    const answer = await multiModalRAG.generateAnswer(query, retrievalResults, options);
    
    res.json({
      success: true,
      data: {
        ...answer,
        retrievalCount: retrievalResults.length,
        queryType: this.determineQueryType(query)
      }
    });
  } catch (error) {
    console.error('[Advanced Orchestration] Multi-modal RAG query failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process multi-modal query'
    });
  }
});

/**
 * GET /api/advanced/multimodal-rag/stats
 * Get multi-modal RAG system statistics
 */
router.get('/multimodal-rag/stats', async (req, res) => {
  try {
    const stats = multiModalRAG.getSystemStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Advanced Orchestration] Multi-modal RAG stats failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get multi-modal RAG statistics'
    });
  }
});

/**
 * POST /api/advanced/constitutional-rlaif/feedback
 * Generate constitutional AI feedback
 */
router.post('/constitutional-rlaif/feedback', async (req, res) => {
  try {
    const { response, context } = req.body;
    
    if (!response) {
      return res.status(400).json({
        success: false,
        error: 'Response is required for feedback generation'
      });
    }

    const feedback = await constitutionalRLAIF.generateAIFeedback(response, context || {});
    
    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('[Advanced Orchestration] Constitutional RLAIF feedback failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate constitutional feedback'
    });
  }
});

/**
 * GET /api/advanced/constitutional-rlaif/stats
 * Get constitutional RLAIF system statistics
 */
router.get('/constitutional-rlaif/stats', async (req, res) => {
  try {
    const stats = constitutionalRLAIF.getSystemStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Advanced Orchestration] Constitutional RLAIF stats failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get constitutional RLAIF statistics'
    });
  }
});

/**
 * GET /api/advanced/system-overview
 * Get comprehensive system overview
 */
router.get('/system-overview', async (req, res) => {
  try {
    const [
      arpoStats,
      dagStats,
      multiModalStats,
      constitutionalStats
    ] = await Promise.all([
      arpoAgent.getAgentStats(),
      hyperDAGManager.getExecutionStats(),
      multiModalRAG.getSystemStats(),
      constitutionalRLAIF.getSystemStats()
    ]);

    const systemOverview = {
      timestamp: new Date().toISOString(),
      components: {
        arpo: {
          status: 'active',
          ...arpoStats
        },
        dagOrchestrator: {
          status: 'active',
          ...dagStats
        },
        multiModalRAG: {
          status: 'active',
          ...multiModalStats
        },
        constitutionalRLAIF: {
          status: 'active',
          ...constitutionalStats
        }
      },
      capabilities: [
        'Advanced Prompt Analysis',
        'DAG Workflow Orchestration',
        'Reinforcement Learning Provider Selection',
        'Multi-Modal RAG Retrieval',
        'Constitutional AI Feedback',
        'Self-Improving Architecture',
        'Cross-Modal Fusion',
        'Parallel Task Execution'
      ],
      performance: {
        totalProcessingCapacity: 'High',
        latencyOptimization: 'Active',
        resourceUtilization: 'Optimal',
        learningRate: 'Adaptive'
      }
    };

    res.json({
      success: true,
      data: systemOverview
    });
  } catch (error) {
    console.error('[Advanced Orchestration] System overview failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system overview'
    });
  }
});

// Helper method
function determineQueryType(query: any): string {
  if (query.text && query.image && query.audio) return 'tri-modal';
  if (query.text && query.image) return 'text-image';
  if (query.text && query.audio) return 'text-audio';
  if (query.image && query.audio) return 'image-audio';
  if (query.text) return 'text-only';
  if (query.image) return 'image-only';
  if (query.audio) return 'audio-only';
  return 'unknown';
}

/**
 * GET /api/advanced/cache/performance
 * Get DragonflyDB cache performance metrics
 */
router.get('/cache/performance', async (req, res) => {
  try {
    const metrics = await trinityCache.getPerformanceMetrics();
    
    res.json({
      success: true,
      cache_performance: {
        hit_ratio_percentage: (metrics.cache_hit_ratio * 100).toFixed(1),
        average_latency_ms: metrics.average_latency_ms.toFixed(2),
        error_rate_percentage: (metrics.error_rate * 100).toFixed(2),
        total_operations: metrics.total_operations,
        cache_hits: metrics.hits,
        cache_misses: metrics.misses,
        connection_status: metrics.is_connected ? 'Connected' : 'Disconnected'
      },
      performance_insights: {
        efficiency_score: trinityCache.calculateEfficiencyScore(metrics),
        cost_savings_estimate: trinityCache.estimateCostSavings(metrics),
        recommendations: trinityCache.generateOptimizationRecommendations(metrics)
      },
      trinity_symphony: {
        databases: {
          conductor: 'AI-Prompt-Manager cache',
          learner: 'Pattern discovery cache', 
          validator: 'HyperDAGManager cache',
          fallback: 'Emergency backup cache'
        },
        status: 'Trinity Symphony DragonflyDB integration active'
      }
    });
  } catch (error) {
    console.error('[Advanced Orchestration] Cache performance failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache performance metrics'
    });
  }
});

export default router;