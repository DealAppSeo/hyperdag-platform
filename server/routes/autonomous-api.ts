/**
 * Autonomous System API Endpoints
 * Provides access to autonomous decision-making, problem detection, and debate system
 */

import { Router } from 'express';
import { autonomous } from '../services/autonomous';
import { startHDMAutonomousTest, stopHDMAutonomousTest } from '../services/autonomous/hdm-autonomous-test';
import { startHDMRotation, stopHDMRotation } from '../services/autonomous/hdm-rotation-loop';
import { startSupabaseCoordination, stopSupabaseCoordination, claimNextTask } from '../services/autonomous/hdm-supabase-coordination';

const router = Router();

/**
 * GET /api/autonomous/status
 * Get overall autonomous system status
 */
router.get('/status', (req, res) => {
  const status = {
    decisionEngine: {
      metrics: autonomous.decisionEngine.getMetrics(),
      autoImplementQueue: autonomous.decisionEngine.getAutoImplementQueue().length,
      totalDecisions: autonomous.decisionEngine.getAllDecisions().length
    },
    problemDetector: {
      problems: autonomous.problemDetector.getAllProblems().length,
      criticalProblems: autonomous.problemDetector.getProblemsBySeverity('critical').length,
      highProblems: autonomous.problemDetector.getProblemsBySeverity('high').length
    },
    debateProtocol: {
      statistics: autonomous.debateProtocol.getStatistics(),
      activeDebates: autonomous.debateProtocol.getActiveDebates().length
    },
    autoFixExecutor: {
      successRate: autonomous.autoFixExecutor.getSuccessRate(),
      totalFixes: autonomous.autoFixExecutor.getHistory().length,
      knownFixes: autonomous.autoFixExecutor.getKnownFixes().length
    }
  };

  res.json({
    success: true,
    status,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/autonomous/decision/evaluate
 * Manually trigger decision evaluation
 */
router.post('/decision/evaluate', async (req, res) => {
  try {
    const { type, description, context } = req.body;

    if (!type || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, description'
      });
    }

    const decision = await autonomous.decisionEngine.evaluateDecision(
      type,
      description,
      context || {}
    );

    res.json({
      success: true,
      decision
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/autonomous/decisions
 * Get all decisions
 */
router.get('/decisions', (req, res) => {
  const { priority } = req.query;

  let decisions;
  if (priority) {
    decisions = autonomous.decisionEngine.getDecisionsByPriority(priority as any);
  } else {
    decisions = autonomous.decisionEngine.getAllDecisions();
  }

  res.json({
    success: true,
    decisions,
    count: decisions.length
  });
});

/**
 * POST /api/autonomous/decision/:id/complete
 * Mark decision as completed
 */
router.post('/decision/:id/complete', (req, res) => {
  const { id } = req.params;
  const { success, result } = req.body;

  autonomous.decisionEngine.markCompleted(id, success, result);

  res.json({
    success: true,
    message: 'Decision marked as completed'
  });
});

/**
 * GET /api/autonomous/problems
 * Get all detected problems
 */
router.get('/problems', (req, res) => {
  const { severity } = req.query;

  let problems;
  if (severity) {
    problems = autonomous.problemDetector.getProblemsBySeverity(severity as any);
  } else {
    problems = autonomous.problemDetector.getAllProblems();
  }

  res.json({
    success: true,
    problems,
    count: problems.length
  });
});

/**
 * POST /api/autonomous/debate/start
 * Start a new debate
 */
router.post('/debate/start', (req, res) => {
  try {
    const { topic, initiator } = req.body;

    if (!topic || !initiator) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: topic, initiator'
      });
    }

    const debateId = autonomous.debateProtocol.startDebate(topic, initiator);

    res.json({
      success: true,
      debateId,
      message: 'Debate started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/autonomous/debate/:id/message
 * Add message to debate
 */
router.post('/debate/:id/message', (req, res) => {
  try {
    const { id } = req.params;
    const { sender, type, content } = req.body;

    if (!sender || !type || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sender, type, content'
      });
    }

    const result = autonomous.debateProtocol.addMessage(id, sender, type, content);

    res.json({
      success: result.success,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/autonomous/debate/:id/vote
 * Submit vote for debate
 */
router.post('/debate/:id/vote', (req, res) => {
  try {
    const { id } = req.params;
    const { voter, vote } = req.body;

    if (!voter || !vote) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: voter, vote'
      });
    }

    const result = autonomous.debateProtocol.submitVote(id, voter, vote);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/autonomous/debate/:id
 * Get debate details
 */
router.get('/debate/:id', (req, res) => {
  const { id } = req.params;
  const debate = autonomous.debateProtocol.getDebate(id);

  if (!debate) {
    return res.status(404).json({
      success: false,
      error: 'Debate not found'
    });
  }

  res.json({
    success: true,
    debate
  });
});

/**
 * GET /api/autonomous/debates
 * Get all debates
 */
router.get('/debates', (req, res) => {
  const { status } = req.query;

  let debates;
  if (status === 'active') {
    debates = autonomous.debateProtocol.getActiveDebates();
  } else if (status === 'history') {
    debates = autonomous.debateProtocol.getDebateHistory();
  } else {
    debates = [
      ...autonomous.debateProtocol.getActiveDebates(),
      ...autonomous.debateProtocol.getDebateHistory()
    ];
  }

  res.json({
    success: true,
    debates,
    count: debates.length
  });
});

/**
 * POST /api/autonomous/agentic/wrap
 * Wrap a prompt with agentic instructions
 */
router.post('/agentic/wrap', (req, res) => {
  try {
    const { prompt, context } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: prompt'
      });
    }

    const wrappedPrompt = autonomous.agenticWrapper.wrapPrompt(prompt, context);

    res.json({
      success: true,
      wrappedPrompt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/autonomous/agentic/enhance
 * Enhance a generative AI response to be more agentic
 */
router.post('/agentic/enhance', (req, res) => {
  try {
    const { response, originalPrompt } = req.body;

    if (!response || !originalPrompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: response, originalPrompt'
      });
    }

    const enhanced = autonomous.agenticWrapper.enhanceResponse(response, originalPrompt);

    res.json({
      success: true,
      enhanced
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/autonomous/fix/history
 * Get fix history
 */
router.get('/fix/history', (req, res) => {
  const history = autonomous.autoFixExecutor.getHistory();

  res.json({
    success: true,
    history,
    count: history.length,
    successRate: autonomous.autoFixExecutor.getSuccessRate()
  });
});

/**
 * GET /api/autonomous/fix/known
 * Get known fixes
 */
router.get('/fix/known', (req, res) => {
  const fixes = autonomous.autoFixExecutor.getKnownFixes();

  res.json({
    success: true,
    fixes,
    count: fixes.length
  });
});

/**
 * POST /api/autonomous/fix/:id/rollback
 * Rollback a fix
 */
router.post('/fix/:id/rollback', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await autonomous.autoFixExecutor.rollbackFix(id);

    res.json({
      success,
      message: success ? 'Fix rolled back successfully' : 'Rollback failed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/autonomous/hdm-test/start
 * Start HDM 5-minute autonomous test
 */
router.post('/hdm-test/start', async (req, res) => {
  try {
    const result = await startHDMAutonomousTest();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/autonomous/hdm-test/stop
 * Stop HDM autonomous test
 */
router.post('/hdm-test/stop', (req, res) => {
  try {
    const result = stopHDMAutonomousTest();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/autonomous/hdm-rotation/start
 * Start HDM 20-minute rotation cycle
 */
router.post('/hdm-rotation/start', async (req, res) => {
  try {
    const result = await startHDMRotation();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/autonomous/hdm-rotation/stop
 * Stop HDM rotation cycle
 */
router.post('/hdm-rotation/stop', (req, res) => {
  try {
    const result = stopHDMRotation();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/autonomous/supabase/connect
 * Connect HDM to shared Supabase for Trinity coordination
 */
router.post('/supabase/connect', async (req, res) => {
  try {
    const result = await startSupabaseCoordination();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/autonomous/supabase/disconnect
 * Disconnect from Supabase coordination
 */
router.post('/supabase/disconnect', async (req, res) => {
  try {
    const result = await stopSupabaseCoordination();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/autonomous/supabase/claim-task
 * Manually claim next available task from Supabase
 */
router.post('/supabase/claim-task', async (req, res) => {
  try {
    const result = await claimNextTask();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
