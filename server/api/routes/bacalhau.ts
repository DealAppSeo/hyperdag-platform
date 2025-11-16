/**
 * Bacalhau API Routes
 * 
 * These routes provide an interface for submitting compute jobs to the Bacalhau
 * network and retrieving their results.
 */

import { Router, Request, Response } from 'express';
import { bacalhauService } from '../../services/bacalhau-service';
import { z } from 'zod';

const router = Router();

// Schemas for validation
const createJobSchema = z.object({
  image: z.string(),
  command: z.array(z.string()),
  resources: z.object({
    cpu: z.string().optional(),
    memory: z.string().optional(),
    gpu: z.string().optional()
  }).optional(),
  inputs: z.array(z.object({
    name: z.string(),
    source: z.string()
  })).optional()
});

const mlInferenceSchema = z.object({
  model: z.string(),
  inputData: z.string(),
  parameters: z.record(z.any()).optional()
});

const videoProcessingSchema = z.object({
  inputCid: z.string(),
  processingCommand: z.string()
});

const dataAnalysisSchema = z.object({
  script: z.string(),
  inputCid: z.string()
});

// Authentication middleware
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

/**
 * Submit a generic compute job to Bacalhau
 */
router.post('/jobs', requireAuth, async (req: Request, res: Response) => {
  try {
    const validationResult = createJobSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid job specification',
        errors: validationResult.error.format()
      });
    }

    const { image, command, resources, inputs } = validationResult.data;
    const jobId = await bacalhauService.createJob(image, command, resources, inputs);
    
    res.status(201).json({
      jobId,
      message: 'Job submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting job:', error);
    res.status(500).json({
      message: 'Failed to submit job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get job status
 */
router.get('/jobs/:jobId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await bacalhauService.getJobStatus(jobId);
    
    res.json(job);
  } catch (error) {
    console.error(`Error getting job status for ${req.params.jobId}:`, error);
    res.status(500).json({
      message: 'Failed to get job status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get job results
 */
router.get('/jobs/:jobId/results', requireAuth, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const results = await bacalhauService.getJobResults(jobId);
    
    res.json({
      results
    });
  } catch (error) {
    console.error(`Error getting job results for ${req.params.jobId}:`, error);
    res.status(500).json({
      message: 'Failed to get job results',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Cancel a job
 */
router.post('/jobs/:jobId/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    await bacalhauService.cancelJob(jobId);
    
    res.json({
      message: 'Job cancelled successfully'
    });
  } catch (error) {
    console.error(`Error cancelling job ${req.params.jobId}:`, error);
    res.status(500).json({
      message: 'Failed to cancel job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Run ML inference
 */
router.post('/ml/inference', requireAuth, async (req: Request, res: Response) => {
  try {
    const validationResult = mlInferenceSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid ML inference request',
        errors: validationResult.error.format()
      });
    }

    const { model, inputData, parameters } = validationResult.data;
    const jobId = await bacalhauService.runMLInference(model, inputData, parameters);
    
    res.status(201).json({
      jobId,
      message: 'ML inference job submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting ML inference job:', error);
    res.status(500).json({
      message: 'Failed to submit ML inference job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Process video
 */
router.post('/video/process', requireAuth, async (req: Request, res: Response) => {
  try {
    const validationResult = videoProcessingSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid video processing request',
        errors: validationResult.error.format()
      });
    }

    const { inputCid, processingCommand } = validationResult.data;
    const jobId = await bacalhauService.processVideo(inputCid, processingCommand);
    
    res.status(201).json({
      jobId,
      message: 'Video processing job submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting video processing job:', error);
    res.status(500).json({
      message: 'Failed to submit video processing job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Data analysis
 */
router.post('/data/analyze', requireAuth, async (req: Request, res: Response) => {
  try {
    const validationResult = dataAnalysisSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid data analysis request',
        errors: validationResult.error.format()
      });
    }

    const { script, inputCid } = validationResult.data;
    const jobId = await bacalhauService.analyzeData(script, inputCid);
    
    res.status(201).json({
      jobId,
      message: 'Data analysis job submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting data analysis job:', error);
    res.status(500).json({
      message: 'Failed to submit data analysis job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
