import { Router } from 'express';
import { autonomousOrchestrator } from '../services/autonomous-agent-orchestrator';

const router = Router();

// Get orchestrator status
router.get('/status', async (req, res) => {
  try {
    const status = autonomousOrchestrator.getStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        recommendation: status.freeTierUtilization < 70 
          ? 'Agents will increase activity to maximize free tier usage'
          : status.spentToday / status.dailyBudget > 0.8
          ? 'Approaching daily budget - prioritizing free tier tasks'
          : 'Optimal operation - balanced free tier and quality',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Autonomous Agents] Status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orchestrator status'
    });
  }
});

// Pause all agents
router.post('/pause', async (req, res) => {
  try {
    autonomousOrchestrator.pauseAll();
    
    res.json({
      success: true,
      message: 'All autonomous agents paused',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Autonomous Agents] Pause failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause agents'
    });
  }
});

// Resume all agents
router.post('/resume', async (req, res) => {
  try {
    autonomousOrchestrator.resumeAll();
    
    res.json({
      success: true,
      message: 'All autonomous agents resumed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Autonomous Agents] Resume failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume agents'
    });
  }
});

// Adjust daily budget
router.post('/budget', async (req, res) => {
  try {
    const { dailyBudget } = req.body;
    
    if (!dailyBudget || dailyBudget < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid daily budget required'
      });
    }

    autonomousOrchestrator.adjustBudget(parseFloat(dailyBudget));
    
    res.json({
      success: true,
      message: `Daily budget adjusted to $${dailyBudget}`,
      newBudget: parseFloat(dailyBudget),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Autonomous Agents] Budget adjustment failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to adjust budget'
    });
  }
});

// Get agent performance metrics
router.get('/performance', async (req, res) => {
  try {
    const status = autonomousOrchestrator.getStatus();
    
    const agentMetrics = Object.entries(status.agentPerformance).map(([type, perf]) => ({
      agentType: type,
      tasksCompleted: perf.tasksCompleted,
      successRate: (perf.successRate * 100).toFixed(1) + '%',
      avgCost: '$' + perf.avgCost.toFixed(3),
      lastActive: perf.lastActiveTime,
      efficiency: perf.successRate / Math.max(0.001, perf.avgCost) // Success per dollar
    }));

    // Sort by efficiency
    agentMetrics.sort((a, b) => b.efficiency - a.efficiency);

    res.json({
      success: true,
      data: {
        overview: {
          totalAgents: agentMetrics.length,
          avgSuccessRate: agentMetrics.reduce((sum, agent) => 
            sum + parseFloat(agent.successRate), 0) / agentMetrics.length,
          totalTasksCompleted: agentMetrics.reduce((sum, agent) => 
            sum + agent.tasksCompleted, 0),
          mostEfficient: agentMetrics[0]?.agentType || 'none'
        },
        agents: agentMetrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Autonomous Agents] Performance check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics'
    });
  }
});

// Emergency stop
router.post('/emergency-stop', async (req, res) => {
  try {
    autonomousOrchestrator.pauseAll();
    
    res.json({
      success: true,
      message: 'Emergency stop activated - all agents paused',
      timestamp: new Date().toISOString(),
      action: 'All autonomous operations halted immediately'
    });
  } catch (error) {
    console.error('[Autonomous Agents] Emergency stop failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute emergency stop'
    });
  }
});

export default router;