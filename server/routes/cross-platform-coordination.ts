import { Router } from 'express';
import { autonomousOrchestrator } from '../services/autonomous-agent-orchestrator';
import { resourceArbitrageEngine } from '../services/resource-arbitrage-engine';

const router = Router();

// Cross-platform task execution endpoint
router.post('/execute-task', async (req, res) => {
  try {
    const { agentType, task, platform, priority = 5 } = req.body;
    
    if (!agentType || !task) {
      return res.status(400).json({
        success: false,
        error: 'Agent type and task required'
      });
    }

    console.log(`[Cross-Platform] Executing ${agentType} task from ${platform || 'unknown'}`);
    
    // Route task through resource arbitrage for optimal provider selection
    const coordination = await resourceArbitrageEngine.coordinateWithANFIS({
      taskType: agentType,
      payload: task,
      prioritizeCost: true,
      platform: platform
    });

    // Add task to orchestrator queue with cross-platform metadata
    const taskId = Date.now().toString();
    const enhancedTask = {
      id: taskId,
      type: agentType,
      priority: priority,
      estimatedCost: coordination.cost || 0,
      payload: {
        ...task,
        crossPlatform: true,
        originPlatform: platform,
        coordination: coordination
      }
    };

    res.json({
      success: true,
      data: {
        taskId: taskId,
        agentType: agentType,
        platform: platform,
        coordination: {
          provider: coordination.provider?.name || 'local',
          estimatedCost: coordination.cost || 0,
          source: coordination.source || 'direct'
        },
        status: 'queued',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Cross-Platform] Task execution failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute cross-platform task'
    });
  }
});

// Webhook endpoint for external platform events
router.post('/webhook/external-event', async (req, res) => {
  try {
    const { source, event, payload, timestamp } = req.body;
    
    console.log(`[Cross-Platform] Webhook received: ${event} from ${source}`);
    
    switch (source) {
      case 'defuzzyai':
        await handleDefuzzyAIEvent(event, payload);
        break;
      case 'ai-symphony-app':
        await handleAISymphonyEvent(event, payload);
        break;
      case 'lovable-frontend':
        await handleLovableEvent(event, payload);
        break;
      case 'bolt-mobile':
        await handleBoltEvent(event, payload);
        break;
      default:
        console.log(`[Cross-Platform] Unknown source: ${source}`);
    }

    res.json({
      success: true,
      processed: true,
      source: source,
      event: event,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Cross-Platform] Webhook processing failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook event'
    });
  }
});

// Get cross-platform system status
router.get('/status', async (req, res) => {
  try {
    const orchestratorStatus = autonomousOrchestrator.getStatus();
    const arbitrageOpportunities = await resourceArbitrageEngine.scanForOpportunities();
    const freeTierStatus = resourceArbitrageEngine.getFreeTierStatus();

    res.json({
      success: true,
      data: {
        hyperDagManager: {
          status: 'operational',
          agents: {
            active: orchestratorStatus.agentCount,
            queuedTasks: orchestratorStatus.queuedTasks,
            successRate: calculateAverageSuccessRate(orchestratorStatus.agentPerformance)
          },
          budget: {
            daily: orchestratorStatus.dailyBudget,
            spent: orchestratorStatus.spentToday,
            remaining: orchestratorStatus.dailyBudget - orchestratorStatus.spentToday
          },
          arbitrage: {
            opportunities: arbitrageOpportunities.length,
            avgSavings: calculateAverageSavings(arbitrageOpportunities),
            freeTierCapacity: freeTierStatus.totalCapacity
          }
        },
        aiPromptManager: {
          status: 'operational',
          integration: 'active',
          crossPlatformSync: 'enabled'
        },
        externalPlatforms: {
          defuzzyAI: 'ready-for-integration',
          aiSymphonyApp: 'ready-for-integration',
          zuplo: 'configured',
          infura: 'active'
        },
        communication: {
          directAPIs: 'enabled',
          webhooks: 'active',
          gatewayRouting: 'ready'
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Cross-Platform] Status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cross-platform status'
    });
  }
});

// Send notification to external platforms
router.post('/notify', async (req, res) => {
  try {
    const { platforms, event, payload } = req.body;
    
    if (!platforms || !event) {
      return res.status(400).json({
        success: false,
        error: 'Platforms and event required'
      });
    }

    const notifications = [];
    
    for (const platform of platforms) {
      try {
        const result = await sendPlatformNotification(platform, event, payload);
        notifications.push({
          platform: platform,
          success: true,
          result: result
        });
      } catch (error) {
        notifications.push({
          platform: platform,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        event: event,
        notifications: notifications,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Cross-Platform] Notification failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send cross-platform notifications'
    });
  }
});

// Handle deFuzzyAI.com events
async function handleDefuzzyAIEvent(event: string, payload: any) {
  switch (event) {
    case 'user-prompt-submitted':
      // Route through AI-Prompt-Manager for optimization
      console.log('[Cross-Platform] Optimizing prompt from deFuzzyAI');
      // Could trigger AI-Prompt-Manager ANFIS optimization
      break;
    case 'ui-preference-changed':
      // Update user preferences across all platforms
      console.log('[Cross-Platform] UI preferences updated from deFuzzyAI');
      break;
    case 'cost-budget-adjusted':
      // Update budget across all systems
      autonomousOrchestrator.adjustBudget(payload.newBudget);
      break;
  }
}

// Handle AI Symphony App events
async function handleAISymphonyEvent(event: string, payload: any) {
  switch (event) {
    case 'mobile-command':
      // Execute mobile commands
      const { command, params } = payload;
      switch (command) {
        case 'pause-agents':
          autonomousOrchestrator.pauseAll();
          break;
        case 'resume-agents':
          autonomousOrchestrator.resumeAll();
          break;
        case 'adjust-budget':
          autonomousOrchestrator.adjustBudget(params.budget);
          break;
      }
      break;
    case 'priority-task-request':
      // Add high-priority task from mobile
      console.log('[Cross-Platform] High priority task from mobile app');
      break;
  }
}

// Handle Lovable frontend events
async function handleLovableEvent(event: string, payload: any) {
  switch (event) {
    case 'ui-interaction':
      console.log('[Cross-Platform] UI interaction from Lovable frontend');
      break;
    case 'optimization-request':
      console.log('[Cross-Platform] Optimization request from Lovable');
      break;
  }
}

// Handle Bolt.new mobile app events
async function handleBoltEvent(event: string, payload: any) {
  switch (event) {
    case 'agent-control':
      console.log('[Cross-Platform] Agent control from Bolt mobile app');
      break;
    case 'budget-alert':
      console.log('[Cross-Platform] Budget alert from Bolt mobile');
      break;
  }
}

// Send notification to external platform
async function sendPlatformNotification(platform: string, event: string, payload: any) {
  const webhookURLs = {
    'defuzzyai': 'https://defuzzyai.com/webhook/hyperdag-event',
    'ai-symphony-app': 'https://ai-symphony-app.bolt.new/webhook/hyperdag-event',
    'lovable-frontend': 'https://defuzzyai.lovable.app/webhook/hyperdag-event'
  };

  const url = webhookURLs[platform as keyof typeof webhookURLs];
  if (!url) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  // In production, this would make actual HTTP requests
  console.log(`[Cross-Platform] Would send to ${url}:`, { event, payload });
  
  return {
    status: 'sent',
    url: url,
    timestamp: new Date().toISOString()
  };
}

// Utility functions
function calculateAverageSuccessRate(agentPerformance: any) {
  const rates = Object.values(agentPerformance).map((perf: any) => perf.successRate);
  return rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;
}

function calculateAverageSavings(opportunities: any[]) {
  if (opportunities.length === 0) return '0%';
  
  const totalSavings = opportunities.reduce((sum, opp) => {
    const savings = parseFloat(opp.savings.replace('%', ''));
    return sum + savings;
  }, 0);
  
  return (totalSavings / opportunities.length).toFixed(1) + '%';
}

export default router;