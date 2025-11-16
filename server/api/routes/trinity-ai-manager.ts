/**
 * Trinity AI Manager Routes
 * 
 * Provides API access to the complete AI Trinity system:
 * - AI-Prompt-Manager (prompt optimization and AI/Web2 routing)
 * - HyperDAGManager (Web3/blockchain and decentralized systems)
 * - SynapticFlow-Manager (neuromorphic AI, memory, and synthesis)
 * 
 * Implements bilateral learning and cross-manager coordination
 */

import { Router } from 'express';
import { synapticFlowManagerService } from '../../services/ai/synapticflow-manager-service';
import { aiPromptManagerService } from '../../services/ai/ai-prompt-manager-service';
import { enforceAuth, generalRateLimit } from '../../middleware/security-fixes';
import { validateAndSanitize } from '../../middleware/security';

const router = Router();

// Apply security middleware
router.use(generalRateLimit);
router.use(validateAndSanitize);
router.use(enforceAuth); // Require authentication for all Trinity AI endpoints

// === SYNAPTICFLOW-MANAGER ENDPOINTS ===

/**
 * Process semantic query with neuromorphic enhancement
 */
router.post('/synapticflow/semantic-query', async (req, res) => {
  try {
    const { query, context } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string'
      });
    }

    const result = await synapticFlowManagerService.processSemanticQuery(query, context);

    res.json({
      success: true,
      data: {
        ...result,
        manager: 'SynapticFlow-Manager',
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('[Trinity AI] SynapticFlow semantic query failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process semantic query',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate AI recommendation using neuromorphic processing
 */
router.post('/synapticflow/recommendation', async (req, res) => {
  try {
    const { query, context } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string'
      });
    }

    const recommendation = await synapticFlowManagerService.generateRecommendation(query, context);

    res.json({
      success: true,
      data: {
        recommendation,
        manager: 'SynapticFlow-Manager',
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('[Trinity AI] SynapticFlow recommendation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Execute action through neuromorphic decision system
 */
router.post('/synapticflow/execute-action', async (req, res) => {
  try {
    const { actionType, parameters } = req.body;

    if (!actionType || typeof actionType !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Action type is required and must be a string'
      });
    }

    const result = await synapticFlowManagerService.executeAction(actionType, parameters);

    res.json({
      success: true,
      data: {
        result,
        manager: 'SynapticFlow-Manager',
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('[Trinity AI] SynapticFlow action execution failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute action',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get Trinity network coordination status
 */
router.get('/synapticflow/trinity-status', async (req, res) => {
  try {
    const trinityStatus = synapticFlowManagerService.getTrinityNetworkStatus();

    res.json({
      success: true,
      data: {
        ...trinityStatus,
        manager: 'SynapticFlow-Manager',
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('[Trinity AI] Trinity status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Trinity status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Coordinate with Trinity Symphony Network
 */
router.post('/synapticflow/trinity-coordinate', async (req, res) => {
  try {
    const { coordinationType, data } = req.body;

    if (!coordinationType || typeof coordinationType !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Coordination type is required and must be a string'
      });
    }

    const coordination = await synapticFlowManagerService.coordinateWithTrinityNetwork(coordinationType, data);

    res.json({
      success: true,
      data: {
        ...coordination,
        manager: 'SynapticFlow-Manager',
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('[Trinity AI] Trinity coordination failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to coordinate with Trinity network',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// === AI-PROMPT-MANAGER ENDPOINTS ===

/**
 * Optimize prompt using AI-Prompt-Manager ANFIS
 */
router.post('/ai-prompt/optimize', async (req, res) => {
  try {
    const { prompt, context, options } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a string'
      });
    }

    const result = await aiPromptManagerService.optimizePrompt(prompt, context, options);

    res.json({
      success: true,
      data: {
        ...result,
        manager: 'AI-Prompt-Manager',
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('[Trinity AI] AI-Prompt-Manager optimization failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate text using AI-Prompt-Manager ANFIS
 */
router.post('/ai-prompt/generate', async (req, res) => {
  try {
    const { prompt, options } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a string'
      });
    }

    const result = await aiPromptManagerService.generateText(prompt, options);

    res.json({
      success: true,
      data: {
        ...result,
        manager: 'AI-Prompt-Manager',
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('[Trinity AI] AI-Prompt-Manager generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate text',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get AI assistance using AI-Prompt-Manager
 */
router.post('/ai-prompt/assist', async (req, res) => {
  try {
    const { task, context, options } = req.body;

    if (!task || typeof task !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Task is required and must be a string'
      });
    }

    const result = await aiPromptManagerService.assistWithTask(task, context, options);

    res.json({
      success: true,
      data: {
        ...result,
        manager: 'AI-Prompt-Manager',
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('[Trinity AI] AI-Prompt-Manager assistance failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to provide assistance',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// === TRINITY ORCHESTRATION ENDPOINTS ===

/**
 * Get comprehensive Trinity AI system status
 */
router.get('/trinity/status', async (req, res) => {
  try {
    // Get status from all Trinity managers
    const synapticFlowStatus = synapticFlowManagerService.getHealthStatus();
    const aiPromptStatus = aiPromptManagerService.getHealthStatus();
    const trinityNetworkStatus = synapticFlowManagerService.getTrinityNetworkStatus();

    const overallStatus = {
      system: 'Trinity AI Management System',
      timestamp: Date.now(),
      managers: {
        synapticFlow: synapticFlowStatus,
        aiPrompt: aiPromptStatus,
        hyperdag: { status: 'simulated', note: 'HyperDAGManager integration simulated' }
      },
      network: trinityNetworkStatus,
      overall: {
        status: synapticFlowStatus.status === 'healthy' && aiPromptStatus.status === 'healthy' ? 'healthy' : 'degraded',
        activeManagers: 2, // SynapticFlow + AI-Prompt
        totalManagers: 3,  // Including HyperDAG (simulated)
        bilateralLearning: true,
        anfisCoordination: true
      }
    };

    res.json({
      success: true,
      data: overallStatus
    });

  } catch (error) {
    console.error('[Trinity AI] Trinity status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Trinity status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Perform cross-manager synthesis and optimization
 */
router.post('/trinity/synthesize', async (req, res) => {
  try {
    const { query, context, requireAllManagers = false } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string'
      });
    }

    // Coordinate response using multiple Trinity managers
    const synthesisTasks = [];

    // SynapticFlow-Manager: Neuromorphic processing
    synthesisTasks.push(
      synapticFlowManagerService.processSemanticQuery(query, { 
        ...context, 
        source: 'trinity_synthesis',
        managers: ['synapticflow'] 
      })
    );

    // AI-Prompt-Manager: Prompt optimization and AI routing
    synthesisTasks.push(
      aiPromptManagerService.generateText(query, { 
        taskType: 'analysis',
        prioritizeCost: false,
        maxTokens: 500
      })
    );

    // Execute synthesis tasks
    const [synapticResult, aiPromptResult] = await Promise.allSettled(synthesisTasks);

    // Combine results with neuromorphic synthesis
    const synthesisData = {
      query,
      neuromorphicAnalysis: synapticResult.status === 'fulfilled' ? synapticResult.value : null,
      aiPromptOptimization: aiPromptResult.status === 'fulfilled' ? aiPromptResult.value : null
    };

    // Generate final synthesis using SynapticFlow-Manager
    const finalSynthesis = await synapticFlowManagerService.coordinateWithTrinityNetwork('synthesis', synthesisData);

    res.json({
      success: true,
      data: {
        synthesis: finalSynthesis,
        components: {
          neuromorphic: synapticResult.status === 'fulfilled' ? synapticResult.value : { error: 'Failed to process' },
          aiPrompt: aiPromptResult.status === 'fulfilled' ? aiPromptResult.value : { error: 'Failed to process' },
          hyperdag: { status: 'simulated', note: 'HyperDAGManager synthesis simulated' }
        },
        manager: 'Trinity AI System',
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('[Trinity AI] Trinity synthesis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform Trinity synthesis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test bilateral learning between Trinity managers
 */
router.post('/trinity/test-bilateral-learning', async (req, res) => {
  try {
    const { testData = 'Trinity bilateral learning test' } = req.body;

    console.log('[Trinity AI] Testing bilateral learning between managers...');

    // Test SynapticFlow-Manager to AI-Prompt-Manager communication
    const synapticToAIPrompt = await synapticFlowManagerService.coordinateWithTrinityNetwork(
      'bilateral_learning_test',
      { 
        target: 'ai-prompt-manager', 
        data: testData,
        timestamp: Date.now()
      }
    );

    // Test AI-Prompt-Manager health and sync
    const aiPromptStats = aiPromptManagerService.getProviderStatistics();
    await aiPromptManagerService.syncWithHyperDAG();

    // Generate learning synthesis
    const learningResult = await synapticFlowManagerService.generateRecommendation(
      'Analyze the bilateral learning test results and provide insights on Trinity manager coordination',
      {
        synapticCoordination: synapticToAIPrompt,
        aiPromptStats,
        testData
      }
    );

    res.json({
      success: true,
      data: {
        bilateralLearningTest: {
          status: 'completed',
          synapticFlowCoordination: synapticToAIPrompt,
          aiPromptManagerStats: {
            providers: Object.keys(aiPromptStats).length,
            syncCompleted: true
          },
          learningInsights: learningResult,
          timestamp: Date.now()
        },
        manager: 'Trinity AI System',
        conclusion: 'Bilateral learning between SynapticFlow-Manager and AI-Prompt-Manager successfully tested'
      }
    });

  } catch (error) {
    console.error('[Trinity AI] Bilateral learning test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test bilateral learning',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get Trinity manager performance analytics
 */
router.get('/trinity/analytics', async (req, res) => {
  try {
    const synapticStatus = synapticFlowManagerService.getHealthStatus();
    const aiPromptStatus = aiPromptManagerService.getHealthStatus();
    const trinityNetworkStatus = synapticFlowManagerService.getTrinityNetworkStatus();

    const analytics = {
      system: 'Trinity AI Analytics',
      timestamp: Date.now(),
      performance: {
        synapticFlow: {
          neuromorphicNodes: synapticStatus.neuromorphicNetwork.totalNodes,
          activeNodes: synapticStatus.neuromorphicNetwork.activeNodes,
          memoryUtilization: synapticStatus.memorySystem.utilization,
          adaptationCapacity: trinityNetworkStatus.adaptationCapacity
        },
        aiPrompt: {
          providers: Object.keys(aiPromptStatus.providers).length,
          activeProviders: Object.values(aiPromptStatus.providers).filter((p: any) => p).length,
          anfisActive: aiPromptStatus.anfisActive
        },
        crossManagerLearning: {
          aiPromptEvents: synapticStatus.crossManagerLearning.aiPromptManagerEvents,
          hyperdagEvents: synapticStatus.crossManagerLearning.hyperdagManagerEvents,
          lastSync: synapticStatus.crossManagerLearning.lastSync,
          alignment: trinityNetworkStatus.crossManagerCoordination.alignment
        }
      },
      health: {
        overall: synapticStatus.status === 'healthy' && aiPromptStatus.status === 'healthy' ? 'optimal' : 'suboptimal',
        managers: {
          synapticFlow: synapticStatus.status,
          aiPrompt: aiPromptStatus.status,
          hyperdag: 'simulated'
        }
      },
      capabilities: {
        semanticRAG: true,
        neuromorphicProcessing: true,
        promptOptimization: true,
        bilateralLearning: true,
        anfisCoordination: true,
        crossManagerSynthesis: true
      }
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('[Trinity AI] Analytics generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;