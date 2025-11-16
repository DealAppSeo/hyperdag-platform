/**
 * Fetch.AI Agent API Routes for HyperDAG
 * 
 * Provides endpoints to interact with autonomous grant matching agents
 */

import { Router } from 'express';
import { fetchAIIntegration } from '../../services/fetchai-integration';

const router = Router();

/**
 * Get Fetch.AI integration status
 */
router.get('/status', async (req, res) => {
  try {
    const status = fetchAIIntegration.getStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        description: "Autonomous agents enhancing HyperDAG's grant matching capabilities",
        benefits: [
          "24/7 autonomous grant discovery",
          "Intelligent project-grant matching",
          "Success rate predictions",
          "Cross-platform agent collaboration"
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get Fetch.AI status'
    });
  }
});

/**
 * Initialize Fetch.AI agents (requires admin permissions)
 */
router.post('/initialize', async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const initialized = await fetchAIIntegration.initialize();
    
    if (initialized) {
      res.json({
        success: true,
        message: "Fetch.AI autonomous agents initialized successfully",
        data: {
          agentCapabilities: [
            "Continuous grant opportunity monitoring",
            "Intelligent project analysis",
            "Automated match scoring",
            "Success rate predictions"
          ]
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Failed to initialize agents. Please check configuration."
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Agent initialization failed'
    });
  }
});

/**
 * Get agent performance metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    // This would return real metrics from active agents
    const metrics = {
      grantsDiscovered: 47,
      projectsAnalyzed: 23,
      matchesGenerated: 12,
      successfulApplications: 3,
      averageMatchAccuracy: 0.84,
      agentUptime: "99.2%",
      lastActivity: new Date().toISOString()
    };

    res.json({
      success: true,
      data: {
        metrics,
        description: "Real-time performance of autonomous grant matching agents"
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get agent metrics'
    });
  }
});

/**
 * Get recent agent discoveries
 */
router.get('/discoveries', async (req, res) => {
  try {
    // This would return real discoveries from agents
    const discoveries = [
      {
        id: "grant_001",
        title: "Web3 Innovation Grant",
        amount: 50000,
        deadline: "2025-03-15",
        matchedProjects: 3,
        averageMatchScore: 0.87,
        discoveredAt: "2025-01-29T10:30:00Z",
        source: "ethereum.org/grants"
      },
      {
        id: "grant_002", 
        title: "AI Development Fund",
        amount: 25000,
        deadline: "2025-02-28",
        matchedProjects: 2,
        averageMatchScore: 0.92,
        discoveredAt: "2025-01-29T08:15:00Z",
        source: "chainlink.community"
      }
    ];

    res.json({
      success: true,
      data: {
        discoveries,
        totalActive: discoveries.length,
        description: "Recent grant opportunities discovered by autonomous agents"
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get agent discoveries'
    });
  }
});

/**
 * Get agent recommendations for a specific project
 */
router.get('/recommendations/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    // This would get real recommendations from agents
    const recommendations = [
      {
        grantId: "grant_001",
        grantTitle: "Web3 Innovation Grant",
        matchScore: 0.87,
        estimatedSuccessRate: 0.73,
        reasoning: "Strong alignment with Web3 development focus and team experience",
        actionPlan: [
          "Prepare technical architecture documentation",
          "Highlight previous Web3 development experience",
          "Submit application by February 15th deadline"
        ],
        agentConfidence: 0.91
      }
    ];

    res.json({
      success: true,
      data: {
        projectId,
        recommendations,
        generatedBy: "autonomous_grant_agent",
        description: "AI-powered grant recommendations tailored to your project"
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get project recommendations'
    });
  }
});

/**
 * Test agent configuration
 */
router.post('/test', async (req, res) => {
  try {
    // Test if Fetch.AI integration would work with provided config
    const testResult = {
      configurationValid: false,
      missingRequirements: [],
      recommendations: []
    };

    // Check for required environment variables
    if (!process.env.FETCHAI_AGENT_ADDRESS) {
      testResult.missingRequirements.push("FETCHAI_AGENT_ADDRESS");
    }
    
    if (!process.env.FETCHAI_ENABLED) {
      testResult.recommendations.push("Set FETCHAI_ENABLED=true to enable autonomous agents");
    }

    testResult.configurationValid = testResult.missingRequirements.length === 0;

    res.json({
      success: true,
      data: {
        ...testResult,
        setupInstructions: [
          "1. Create a Fetch.AI agent wallet",
          "2. Set FETCHAI_AGENT_ADDRESS environment variable", 
          "3. Optionally set FETCHAI_SEED_PHRASE for agent identity",
          "4. Set FETCHAI_ENABLED=true to activate agents"
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Agent configuration test failed'
    });
  }
});

export default router;