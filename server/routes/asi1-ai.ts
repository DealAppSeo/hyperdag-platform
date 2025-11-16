import { Router, Request, Response } from 'express';
import { z } from 'zod';
import ASi1Service from '../services/ai/asi1-service';
import { requireAuth } from '../middleware/auth';

const router = Router();
const asi1Service = new ASi1Service();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await asi1Service.healthCheck();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed'
    });
  }
});

// Grant matching endpoint
const grantMatchingSchema = z.object({
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  experience: z.string(),
  projectGoals: z.string()
});

router.post('/grant-matching', requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = grantMatchingSchema.parse(req.body);
    const matches = await asi1Service.matchGrants(profile);
    
    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Grant matching failed'
    });
  }
});

// Team formation analysis endpoint
const teamFormationSchema = z.object({
  title: z.string(),
  description: z.string(),
  requiredSkills: z.array(z.string()),
  budget: z.number().optional(),
  timeline: z.string().optional()
});

router.post('/team-formation', requireAuth, async (req: Request, res: Response) => {
  try {
    const project = teamFormationSchema.parse(req.body);
    const analysis = await asi1Service.analyzeTeamFormation(project);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Team formation analysis failed'
    });
  }
});

// Project optimization endpoint
const projectOptimizationSchema = z.object({
  currentStatus: z.string(),
  goals: z.array(z.string()),
  resources: z.any(),
  challenges: z.array(z.string())
});

router.post('/project-optimization', requireAuth, async (req: Request, res: Response) => {
  try {
    const projectData = projectOptimizationSchema.parse(req.body);
    const optimization = await asi1Service.optimizeProject(projectData);
    
    res.json({
      success: true,
      data: optimization
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Project optimization failed'
    });
  }
});

// Grant content generation endpoint
const contentGenerationSchema = z.object({
  grantType: z.string(),
  projectSummary: z.string(),
  teamCapabilities: z.array(z.string()),
  fundingGoals: z.string()
});

router.post('/generate-content', requireAuth, async (req: Request, res: Response) => {
  try {
    const params = contentGenerationSchema.parse(req.body);
    const content = await asi1Service.generateGrantContent(params);
    
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Content generation failed'
    });
  }
});

// Sentiment analysis endpoint
const sentimentAnalysisSchema = z.object({
  text: z.string(),
  context: z.enum(['project', 'grant', 'team', 'community'])
});

router.post('/sentiment-analysis', requireAuth, async (req: Request, res: Response) => {
  try {
    const content = sentimentAnalysisSchema.parse(req.body);
    const analysis = await asi1Service.analyzeSentiment(content);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sentiment analysis failed'
    });
  }
});

// Team matching insights endpoint
router.post('/team-matching-insights', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userProfile, availableProjects } = req.body;
    const insights = await asi1Service.getTeamMatchingInsights(userProfile, availableProjects);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Team matching insights failed'
    });
  }
});

// Smart contract analysis endpoint
const smartContractSchema = z.object({
  address: z.string(),
  abi: z.any().optional(),
  purpose: z.string()
});

router.post('/smart-contract-analysis', requireAuth, async (req: Request, res: Response) => {
  try {
    const contractData = smartContractSchema.parse(req.body);
    const analysis = await asi1Service.analyzeSmartContract(contractData);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Smart contract analysis failed'
    });
  }
});

// Service status endpoint
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = asi1Service.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed'
    });
  }
});

export default router;