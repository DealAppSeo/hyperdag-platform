import { Router } from 'express';
import { trinityCoordinator } from '../../services/trinity/trinity-coordinator';
import { anfisRouter } from '../../services/trinity/anfis-router';
import { z } from 'zod';

const router = Router();

/**
 * Trinity Symphony Coordination API
 * Endpoints for multi-agent orchestration with ANFIS routing
 */

const createTrinitySchema = z.object({
  taskDescription: z.string().min(10).max(1000),
});

const executeTaskSchema = z.object({
  trinityId: z.string(),
  taskDescription: z.string().min(10).max(1000),
});

const routeTaskSchema = z.object({
  requiresWeb3: z.number().min(0).max(1),
  requiresAI: z.number().min(0).max(1),
  requiresVisuals: z.number().min(0).max(1),
  urgency: z.number().min(0).max(1),
  budgetSensitive: z.number().min(0).max(1),
  complexity: z.number().min(0).max(1),
});

const feedbackSchema = z.object({
  agentId: z.string(),
  taskType: z.string(),
  success: z.boolean(),
});

/**
 * POST /api/trinity/create
 * Create a new Trinity formation
 */
router.post('/create', async (req, res) => {
  try {
    const { taskDescription } = createTrinitySchema.parse(req.body);
    
    const trinityId = trinityCoordinator.createTrinity(taskDescription);
    const trinity = trinityCoordinator.getTrinityStatus(trinityId);
    
    res.status(201).json({
      success: true,
      trinityId,
      members: trinity?.members,
      message: 'Trinity formation created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('[Trinity] Create error:', error);
    res.status(500).json({ error: 'Failed to create Trinity' });
  }
});

/**
 * POST /api/trinity/decompose
 * Decompose task using ReAct pattern
 */
router.post('/decompose', async (req, res) => {
  try {
    const { taskDescription } = createTrinitySchema.parse(req.body);
    
    const decomposition = trinityCoordinator.decomposeTask(taskDescription);
    
    res.json({
      success: true,
      decomposition,
      subtaskCount: decomposition.subtasks.length,
      estimatedTime: `${decomposition.totalEstimatedTime.toFixed(1)} minutes`,
      estimatedCost: `$${decomposition.totalEstimatedCost.toFixed(2)}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('[Trinity] Decompose error:', error);
    res.status(500).json({ error: 'Failed to decompose task' });
  }
});

/**
 * POST /api/trinity/execute
 * Execute task with Trinity using ReAct loop
 */
router.post('/execute', async (req, res) => {
  try {
    const { trinityId, taskDescription } = executeTaskSchema.parse(req.body);
    
    const task = await trinityCoordinator.executeTaskWithReAct(trinityId, taskDescription);
    
    res.json({
      success: true,
      taskId: task.id,
      status: task.status,
      reactSteps: task.reactSteps,
      result: task.result,
      executionTime: task.completedAt && task.startedAt 
        ? `${((task.completedAt - task.startedAt) / 1000).toFixed(2)}s`
        : 'N/A',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('[Trinity] Execute error:', error);
    res.status(500).json({ error: 'Failed to execute task' });
  }
});

/**
 * GET /api/trinity/:trinityId
 * Get Trinity status
 */
router.get('/:trinityId', (req, res) => {
  try {
    const { trinityId } = req.params;
    
    const trinity = trinityCoordinator.getTrinityStatus(trinityId);
    if (!trinity) {
      return res.status(404).json({ error: 'Trinity not found' });
    }
    
    res.json({
      success: true,
      trinity: {
        id: trinity.id,
        members: trinity.members,
        unityScore: trinity.unityScore,
        taskQueueLength: trinity.taskQueue.length,
        createdAt: trinity.createdAt,
        lastRotation: trinity.lastRotation,
      },
    });
  } catch (error) {
    console.error('[Trinity] Get status error:', error);
    res.status(500).json({ error: 'Failed to retrieve Trinity status' });
  }
});

/**
 * GET /api/trinity/all/active
 * Get all active Trinities
 */
router.get('/all/active', (req, res) => {
  try {
    const trinities = trinityCoordinator.getAllTrinities();
    
    res.json({
      success: true,
      count: trinities.length,
      trinities: trinities.map(t => ({
        id: t.id,
        members: t.members,
        unityScore: t.unityScore,
        taskCount: t.taskQueue.length,
      })),
    });
  } catch (error) {
    console.error('[Trinity] Get all error:', error);
    res.status(500).json({ error: 'Failed to retrieve Trinities' });
  }
});

/**
 * POST /api/trinity/anfis/route
 * Route task using ANFIS logic
 */
router.post('/anfis/route', (req, res) => {
  try {
    const taskRequirements = routeTaskSchema.parse(req.body);
    
    const decision = anfisRouter.routeTask(taskRequirements);
    
    res.json({
      success: true,
      routing: decision,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('[ANFIS] Route error:', error);
    res.status(500).json({ error: 'Failed to route task' });
  }
});

/**
 * POST /api/trinity/anfis/feedback
 * Provide feedback for ANFIS learning
 */
router.post('/anfis/feedback', (req, res) => {
  try {
    const { agentId, taskType, success } = feedbackSchema.parse(req.body);
    
    anfisRouter.provideFeedback(agentId, taskType, success);
    
    res.json({
      success: true,
      message: 'Feedback recorded successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('[ANFIS] Feedback error:', error);
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});

/**
 * GET /api/trinity/anfis/agents
 * Get ANFIS agent status
 */
router.get('/anfis/agents', (req, res) => {
  try {
    const agents = anfisRouter.getAgentStatus();
    
    res.json({
      success: true,
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        capabilities: agent.capabilities,
        currentLoad: agent.currentLoad,
        repIDScore: agent.repIDScore,
      })),
    });
  } catch (error) {
    console.error('[ANFIS] Get agents error:', error);
    res.status(500).json({ error: 'Failed to retrieve agent status' });
  }
});

export default router;
