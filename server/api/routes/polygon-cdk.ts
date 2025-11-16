/**
 * Polygon CDK API Routes
 * 
 * This file defines the Polygon CDK integration API routes for the HyperDAG platform.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { polygonCDKService } from '../../services/blockchain/polygon-cdk-service';
import { log } from '../../vite';

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

const router = Router();

/**
 * @route GET /api/polygon-cdk/status
 * @description Get the status of the Polygon CDK integration
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    const isConfigured = await polygonCDKService.checkCDKConfiguration();
    return res.json({ 
      success: true, 
      data: { 
        isConfigured,
        addresses: polygonCDKService.getContractAddresses()
      }
    });
  } catch (error) {
    log(`Error checking CDK status: ${(error as Error).message}`, 'polygon-cdk-api');
    return res.status(500).json({
      success: false,
      message: 'Failed to check CDK status',
      error: (error as Error).message
    });
  }
});

/**
 * @route GET /api/polygon-cdk/config
 * @description Get the Polygon CDK configuration
 * @access Public
 */
router.get('/config', async (req, res) => {
  try {
    const config = await polygonCDKService.getCDKConfig();
    return res.json({ success: true, data: config });
  } catch (error) {
    log(`Error getting CDK config: ${(error as Error).message}`, 'polygon-cdk-api');
    return res.status(500).json({
      success: false,
      message: 'Failed to get CDK configuration',
      error: (error as Error).message
    });
  }
});

/**
 * @route POST /api/polygon-cdk/deploy
 * @description Deploy a project to Polygon CDK
 * @access Private
 */
router.post('/deploy', requireAuth, async (req, res) => {
  try {
    const { projectId, deploymentOptions } = req.body;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }
    
    // Add deployment logic here
    const deploymentResult = await polygonCDKService.deployProject(projectId, deploymentOptions);
    
    return res.json({ 
      success: true, 
      data: deploymentResult
    });
  } catch (error) {
    log(`Error deploying to CDK: ${(error as Error).message}`, 'polygon-cdk-api');
    return res.status(500).json({
      success: false,
      message: 'Failed to deploy to Polygon CDK',
      error: (error as Error).message
    });
  }
});

/**
 * @route GET /api/polygon-cdk/deployments
 * @description Get all deployments to Polygon CDK
 * @access Public
 */
router.get('/deployments', async (req, res) => {
  try {
    const deployments = await polygonCDKService.getDeployments();
    return res.json({ success: true, data: deployments });
  } catch (error) {
    log(`Error getting CDK deployments: ${(error as Error).message}`, 'polygon-cdk-api');
    return res.status(500).json({
      success: false,
      message: 'Failed to get CDK deployments',
      error: (error as Error).message
    });
  }
});

/**
 * @route GET /api/polygon-cdk/deployments/:id
 * @description Get a specific deployment to Polygon CDK
 * @access Public
 */
router.get('/deployments/:id', async (req, res) => {
  try {
    const deploymentId = req.params.id;
    const deployment = await polygonCDKService.getDeployment(deploymentId);
    
    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found'
      });
    }
    
    return res.json({ success: true, data: deployment });
  } catch (error) {
    log(`Error getting CDK deployment: ${(error as Error).message}`, 'polygon-cdk-api');
    return res.status(500).json({
      success: false,
      message: 'Failed to get CDK deployment',
      error: (error as Error).message
    });
  }
});

/**
 * @route POST /api/polygon-cdk/verify
 * @description Verify a proof using Plonky3
 * @access Public
 */
router.post('/verify', async (req, res) => {
  try {
    const { blockProof } = req.body;
    
    if (!blockProof) {
      return res.status(400).json({
        success: false,
        message: 'Block proof is required'
      });
    }
    
    const isValid = await polygonCDKService.verifyProof(blockProof);
    
    return res.json({ 
      success: true, 
      data: { isValid }
    });
  } catch (error) {
    log(`Error verifying proof: ${(error as Error).message}`, 'polygon-cdk-api');
    return res.status(500).json({
      success: false,
      message: 'Failed to verify proof',
      error: (error as Error).message
    });
  }
});

export default router;
