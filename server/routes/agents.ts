/**
 * AI Agent System API Routes
 * 
 * This module provides API endpoints for interacting with the AI agent system.
 */

import express from 'express';
import { agentSystem } from '../services/agents';
import { 
  AgentTaskType, 
  AgentTaskPriority, 
  AgentExecutionMode,
  AgentCapability,
  AgentTaskStatus
} from '../services/agents/types';
import { logger } from '../utils/logger';
import { requireAdmin, requireAuth } from '../middleware/auth-middleware';

const router = express.Router();

// Initialize agent system when routes are registered
(async () => {
  try {
    await agentSystem.initialize();
    logger.info('[agents] Agent system initialized on server startup');
  } catch (error) {
    logger.error('[agents] Failed to initialize agent system:', error);
  }
})();

/**
 * Get agent system status
 * 
 * GET /api/agents/status
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const metrics = await agentSystem.getSystemMetrics();
    const agents = agentSystem.getAllAgents().map(agent => ({
      id: agent.id,
      name: agent.name,
      status: agent.status,
      capabilities: agent.capabilities,
      taskTypes: agent.taskTypes
    }));

    res.json({
      success: true,
      systemStatus: 'active',
      metrics,
      agents
    });
  } catch (error) {
    logger.error('[agents] Failed to get agent system status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent system status'
    });
  }
});

/**
 * Get agent details
 * 
 * GET /api/agents/:agentId
 */
router.get('/:agentId', requireAuth, async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = agentSystem.getAgent(agentId);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent ${agentId} not found`
      });
    }
    
    const status = await agent.getStatus();
    
    res.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        capabilities: agent.capabilities,
        status: agent.status,
        taskTypes: agent.taskTypes,
        executionModes: agent.executionModes,
        defaultExecutionMode: agent.defaultExecutionMode,
        version: agent.version,
        config: agent.config,
        metrics: status.metrics,
        currentLoad: status.currentLoad
      }
    });
  } catch (error) {
    logger.error('[agents] Failed to get agent details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent details'
    });
  }
});

/**
 * Get all tasks (with optional filters)
 * 
 * GET /api/agents/tasks
 * 
 * Query parameters:
 * - status: Filter by task status
 * - agentId: Filter by agent ID
 * - priority: Filter by task priority
 * - limit: Maximum number of tasks to return (default: 100)
 * - offset: Offset for pagination (default: 0)
 */
router.get('/tasks', requireAuth, async (req, res) => {
  try {
    // Note: This is a basic implementation for the API route
    // The full SQL query for filtering will be implemented later

    const tasks = [];
    
    res.json({
      success: true,
      tasks,
      pagination: {
        limit: 100,
        offset: 0,
        total: tasks.length
      }
    });
  } catch (error) {
    logger.error('[agents] Failed to get tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tasks'
    });
  }
});

/**
 * Get a specific task
 * 
 * GET /api/agents/tasks/:taskId
 */
router.get('/tasks/:taskId', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await agentSystem.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task ${taskId} not found`
      });
    }
    
    res.json({
      success: true,
      task
    });
  } catch (error) {
    logger.error(`[agents] Failed to get task ${req.params.taskId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get task'
    });
  }
});

/**
 * Create a new task
 * 
 * POST /api/agents/tasks
 * 
 * Body parameters:
 * - type: Task type (required)
 * - description: Task description (required)
 * - params: Task parameters (required)
 * - agentId: Agent ID (optional, will be automatically determined if not provided)
 * - priority: Task priority (optional, default: medium)
 * - executionMode: Task execution mode (optional, default: autonomous)
 * - deadline: Task deadline (optional)
 * - requiresApproval: Whether the task requires approval (optional, default: false)
 * - aiOptions: AI options for task processing (optional)
 * - maxRetries: Maximum number of retries (optional, default: 3)
 * - tags: Task tags (optional)
 * - parent: Parent task ID (optional)
 */
router.post('/tasks', requireAuth, async (req, res) => {
  try {
    const {
      type,
      description,
      params,
      agentId,
      priority,
      executionMode,
      deadline,
      requiresApproval,
      aiOptions,
      maxRetries,
      tags,
      parent
    } = req.body;
    
    // Input validation
    if (!type || !Object.values(AgentTaskType).includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task type'
      });
    }
    
    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Task description is required'
      });
    }
    
    if (!params || typeof params !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Task parameters are required and must be an object'
      });
    }
    
    // Create the task
    const task = await agentSystem.createTask(
      type,
      description,
      params,
      {
        agentId,
        priority: priority || AgentTaskPriority.MEDIUM,
        executionMode: executionMode || AgentExecutionMode.AUTONOMOUS,
        deadline: deadline ? new Date(deadline) : undefined,
        userId: req.user?.id,
        requiresApproval: requiresApproval || false,
        aiOptions,
        maxRetries,
        tags,
        parent
      }
    );
    
    res.status(201).json({
      success: true,
      task
    });
  } catch (error) {
    logger.error('[agents] Failed to create task:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task'
    });
  }
});

/**
 * Cancel a task
 * 
 * POST /api/agents/tasks/:taskId/cancel
 */
router.post('/tasks/:taskId/cancel', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await agentSystem.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task ${taskId} not found`
      });
    }
    
    // Ensure the user can cancel this task
    if (task.userId && task.userId !== req.user?.id && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to cancel this task'
      });
    }
    
    const success = await agentSystem.cancelTask(taskId);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to cancel task'
      });
    }
    
    res.json({
      success: true,
      message: `Task ${taskId} cancelled successfully`
    });
  } catch (error) {
    logger.error(`[agents] Failed to cancel task ${req.params.taskId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel task'
    });
  }
});

/**
 * Approve task results
 * 
 * POST /api/agents/tasks/:taskId/approve
 */
router.post('/tasks/:taskId/approve', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await agentSystem.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task ${taskId} not found`
      });
    }
    
    // Ensure the user can approve this task
    if (task.userId && task.userId !== req.user?.id && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to approve this task'
      });
    }
    
    if (task.status !== AgentTaskStatus.SUCCEEDED) {
      return res.status(400).json({
        success: false,
        error: 'Only completed tasks can be approved'
      });
    }
    
    if (!task.requiresApproval) {
      return res.status(400).json({
        success: false,
        error: 'This task does not require approval'
      });
    }
    
    const success = await agentSystem.approveTaskResults(taskId, req.user?.id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to approve task'
      });
    }
    
    res.json({
      success: true,
      message: `Task ${taskId} approved successfully`
    });
  } catch (error) {
    logger.error(`[agents] Failed to approve task ${req.params.taskId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve task'
    });
  }
});

/**
 * Perform a system health check
 * 
 * POST /api/agents/health-check
 * 
 * Body parameters:
 * - checkIntegrity: Whether to check data integrity (optional, default: false)
 * - checkPerformance: Whether to check performance (optional, default: true)
 */
router.post('/health-check', requireAuth, async (req, res) => {
  try {
    const { checkIntegrity, checkPerformance } = req.body;
    
    // Create a health check task
    const task = await agentSystem.createTask(
      AgentTaskType.HEALTH_CHECK,
      'System health check',
      { checkIntegrity, checkPerformance },
      {
        priority: AgentTaskPriority.HIGH,
        executionMode: AgentExecutionMode.AUTONOMOUS,
        userId: req.user?.id
      }
    );
    
    res.json({
      success: true,
      task,
      message: 'Health check initiated'
    });
  } catch (error) {
    logger.error('[agents] Failed to initiate health check:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate health check'
    });
  }
});

/**
 * Optimize traffic routing
 * 
 * POST /api/agents/optimize-traffic
 * 
 * Body parameters:
 * - timeframe: Timeframe for optimization (optional, default: day)
 * - resetQuotas: Whether to reset quotas (optional, default: false)
 */
router.post('/optimize-traffic', requireAdmin, async (req, res) => {
  try {
    const { timeframe, resetQuotas } = req.body;
    
    // Create an optimization task
    const task = await agentSystem.createTask(
      AgentTaskType.OPTIMIZE_TRAFFIC,
      'Optimize traffic routing between providers',
      { timeframe, resetQuotas },
      {
        priority: AgentTaskPriority.HIGH,
        executionMode: AgentExecutionMode.AUTONOMOUS,
        userId: req.user?.id
      }
    );
    
    res.json({
      success: true,
      task,
      message: 'Traffic optimization initiated'
    });
  } catch (error) {
    logger.error('[agents] Failed to initiate traffic optimization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate traffic optimization'
    });
  }
});

/**
 * Test endpoint for development: Run a test task
 * 
 * POST /api/agents/test-task
 * 
 * This endpoint is for development and testing only.
 */
router.post('/test-task', async (req, res) => {
  try {
    const { taskType = AgentTaskType.OPTIMIZE_TRAFFIC, description = 'Test task', params = {} } = req.body;
    
    // Create a test task
    const task = await agentSystem.createTask(
      taskType,
      description,
      params,
      {
        priority: AgentTaskPriority.MEDIUM,
        executionMode: AgentExecutionMode.AUTONOMOUS,
        userId: 1 // Default test user ID
      }
    );
    
    res.json({
      success: true,
      task,
      message: 'Test task created successfully'
    });
  } catch (error) {
    logger.error('[agents] Failed to create test task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test task',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;