/**
 * GrantFlow API Routes
 * 
 * Complete API endpoints for grant discovery, matching, and proposal management.
 * This is the core API that external developers will use to integrate GrantFlow
 * capabilities into their applications.
 */

import express, { Request, Response } from 'express';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { requireAuth } from '../../middleware/auth-guard';
import { validateApiKey } from '../../middleware/api-key-middleware';
import { hyperCrowdTeamRecommendationService } from '../../services/hypercrowd-team-recommendations';
import { huggingFaceService } from '../../services/huggingface-service';
import { cohereService } from '../../services/cohere-service';
import { grantSources, rfis, rfps, proposals } from '@shared/schema';
import { eq, like, desc } from 'drizzle-orm';

const router = express.Router();

/**
 * GET /api/grantflow/grants
 * Discover available grant opportunities
 */
router.get('/grants', validateApiKey(), async (req: Request, res: Response) => {
  try {
    const { category, keywords, page = 1, limit = 20 } = req.query as any;
    
    const grants = await db.select().from(grantSources)
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit));

    // Filter by keywords if provided
    let filteredGrants = grants;
    if (keywords) {
      const keywordLower = keywords.toLowerCase();
      filteredGrants = grants.filter(grant => 
        grant.name.toLowerCase().includes(keywordLower) ||
        grant.description.toLowerCase().includes(keywordLower)
      );
    }

    res.json({
      success: true,
      data: {
        grants: filteredGrants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredGrants.length,
          hasMore: filteredGrants.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Grant discovery failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover grants'
    });
  }
});

/**
 * POST /api/grantflow/grants/match
 * AI-powered grant matching with semantic analysis
 */
router.post('/grants/match', validateApiKey(), async (req: Request, res: Response) => {
  try {
    const { projectDescription, categories, budget, threshold = 0.6, maxResults = 10, useAI = true } = req.body;
    
    // Use raw SQL to avoid schema mismatch issues
    const grantsResult = await db.execute(sql`
      SELECT 
        id, 
        name, 
        description, 
        website, 
        categories, 
        available_funds as "availableFunds", 
        application_url as "applicationUrl", 
        contact_email as "contactEmail",
        application_deadline as "applicationDeadline", 
        is_active as "isActive", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM grant_sources
      WHERE is_active = true OR is_active IS NULL
    `);
    const grants = grantsResult.rows || [];
    const matches = [];

    if (useAI && huggingFaceService.isAvailable() && projectDescription) {
      // Enhanced AI-powered matching using Hugging Face
      console.log('[grantflow] Using AI-powered semantic matching');
      
      try {
        const grantDescriptions = grants.map((grant: any) => String(grant.description || grant.name || ''));
        const aiMatches = await huggingFaceService.enhancedGrantMatching(
          projectDescription,
          grantDescriptions
        );

        for (const aiMatch of aiMatches) {
          const grant = grants[aiMatch.index];
          if (!grant) continue;
          
          let finalScore = aiMatch.similarity * 0.7; // AI similarity gets 70% weight
          
          // Add category bonus
          if (grant.categories && categories && Array.isArray(grant.categories)) {
            const grantCategories = grant.categories;
            const matchingCategories = categories.filter((cat: string) => 
              grantCategories.includes(cat)
            );
            finalScore += (matchingCategories.length / categories.length) * 0.2;
          }
          
          // Add budget compatibility
          if (budget && grant.availableFunds && budget <= grant.availableFunds) {
            finalScore += 0.1;
          }

          if (finalScore >= threshold) {
            matches.push({
              grant,
              matchScore: finalScore,
              semanticSimilarity: aiMatch.similarity,
              matchReasons: {
                aiPowered: true,
                semanticMatch: aiMatch.similarity,
                categoryMatch: grant.categories && categories ? 
                  categories.filter((cat: string) => grant.categories?.includes(cat)).length : 0,
                budgetCompatible: budget && grant.availableFunds ? budget <= grant.availableFunds : false
              }
            });
          }
        }
      } catch (aiError) {
        console.warn('[grantflow] AI matching failed, falling back to traditional matching:', aiError);
        // Fall back to traditional matching if AI fails
      }
    }

    // Traditional keyword-based matching if AI is not available or as fallback
    if (matches.length === 0) {
      console.log('[grantflow] Using traditional keyword matching');
      
      for (const grant of grants) {
        let score = 0;
        
        // Category matching
        if (grant.categories && categories) {
          const grantCategories = grant.categories || [];
          const matchingCategories = categories.filter((cat: string) => 
            grantCategories.includes(cat)
          );
          score += (matchingCategories.length / categories.length) * 0.5;
        }
        
        // Keyword matching in description
        if (projectDescription && grant.description) {
          const projectWords = projectDescription.toLowerCase().split(' ');
          const grantWords = grant.description.toLowerCase().split(' ');
          const commonWords = projectWords.filter((word: string) => grantWords.includes(word));
          score += (commonWords.length / projectWords.length) * 0.3;
        }
        
        // Budget compatibility
        if (budget && grant.availableFunds && budget <= grant.availableFunds) {
          score += 0.2;
        }
        
        if (score >= threshold) {
          matches.push({
            grant,
            matchScore: score,
            matchReasons: {
              aiPowered: false,
              categoryMatch: grant.categories && categories ? 
                categories.filter((cat: string) => grant.categories?.includes(cat)).length : 0,
              budgetCompatible: budget && grant.availableFunds ? budget <= grant.availableFunds : false
            }
          });
        }
      }
    }

    matches.sort((a, b) => b.matchScore - a.matchScore);
    const limitedMatches = matches.slice(0, maxResults);

    res.json({
      success: true,
      data: {
        matches: limitedMatches,
        matchingCriteria: {
          threshold,
          categories,
          totalEvaluated: grants.length,
          aiPowered: huggingFaceService.isAvailable() && useAI,
          method: matches.length > 0 && matches[0].matchReasons?.aiPowered ? 'semantic' : 'keyword'
        }
      }
    });
  } catch (error) {
    console.error('Grant matching failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to match grants'
    });
  }
});

/**
 * POST /api/grantflow/team/recommend
 * Get team recommendations for a project
 */
router.post('/team/recommend', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { projectRequirements, preferences } = req.body;

    if (!projectRequirements || !Array.isArray(projectRequirements)) {
      return res.status(400).json({
        success: false,
        error: 'Project requirements array is required'
      });
    }

    const recommendations = await hyperCrowdTeamRecommendationService.generateTeamRecommendations(
      projectRequirements,
      userId,
      preferences || {}
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Team recommendation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate team recommendations'
    });
  }
});

/**
 * GET /api/grantflow/discovery/sources
 * Get available grant discovery sources
 */
router.get('/discovery/sources', validateApiKey(), async (req: Request, res: Response) => {
  try {
    const sources = await db.select().from(grantSources);
    
    res.json({
      success: true,
      data: {
        sources,
        totalSources: sources.length
      }
    });
  } catch (error) {
    console.error('Grant sources retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get grant sources'
    });
  }
});

/**
 * POST /api/grantflow/analyze/text
 * AI-powered text analysis for grant proposals and descriptions
 */
router.post('/analyze/text', validateApiKey(), async (req: Request, res: Response) => {
  try {
    const { text, analysisType = 'comprehensive' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for analysis'
      });
    }

    const cohereAvailable = cohereService.isAvailable();
    const huggingFaceAvailable = huggingFaceService.isAvailable();
    
    if (!cohereAvailable && !huggingFaceAvailable) {
      return res.status(503).json({
        success: false,
        error: 'AI analysis service is not available'
      });
    }

    const primaryService = cohereAvailable ? 'cohere' : 'huggingface';
    const analysis: any = {
      originalText: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
      aiProvider: primaryService,
      timestamp: new Date().toISOString()
    };

    // Perform different types of analysis based on request
    if (analysisType === 'comprehensive' || analysisType === 'topics') {
      try {
        if (cohereAvailable) {
          const classification = await cohereService.classifyProject(text);
          analysis.topics = classification.focusAreas;
          analysis.categories = classification.categories;
          analysis.confidence = classification.confidence;
        } else {
          analysis.topics = await huggingFaceService.extractTopics(text);
        }
      } catch (error) {
        console.warn('[grantflow] Topic extraction failed:', error);
        analysis.topics = [];
      }
    }

    if (analysisType === 'comprehensive' || analysisType === 'sentiment') {
      try {
        analysis.sentiment = await huggingFaceService.analyzeSentiment(text);
      } catch (error) {
        console.warn('[grantflow] Sentiment analysis failed:', error);
        analysis.sentiment = { label: 'neutral', score: 0.5 };
      }
    }

    if (analysisType === 'comprehensive' || analysisType === 'summary') {
      try {
        if (cohereAvailable) {
          analysis.summary = await cohereService.summarizeText(text, 'medium');
        } else {
          analysis.summary = await huggingFaceService.summarizeText(text, 150);
        }
      } catch (error) {
        console.warn('[grantflow] Text summarization failed:', error);
        analysis.summary = text.substring(0, 150) + '...';
      }
    }

    if (analysisType === 'embeddings') {
      try {
        if (cohereAvailable) {
          const embeddings = await cohereService.generateEmbeddings([text]);
          analysis.embeddingsDimension = embeddings[0]?.length || 0;
          analysis.embeddingsGenerated = embeddings.length > 0;
        } else {
          analysis.embeddings = await huggingFaceService.generateEmbeddings(text);
          analysis.embeddingsDimension = analysis.embeddings.length;
          delete analysis.embeddings;
          analysis.embeddingsGenerated = true;
        }
      } catch (error) {
        console.warn('[grantflow] Embeddings generation failed:', error);
        analysis.embeddingsGenerated = false;
      }
    }

    // Add focus areas analysis with Cohere
    if (cohereAvailable && (analysisType === 'comprehensive' || analysisType === 'focus')) {
      try {
        const classification = await cohereService.classifyProject(text);
        analysis.focusAreas = classification.focusAreas;
        if (!analysis.categories) {
          analysis.categories = classification.categories;
        }
      } catch (error) {
        console.warn('[grantflow] Focus areas analysis failed:', error);
      }
    }

    res.json({
      success: true,
      data: {
        analysis,
        capabilities: {
          topics: true,
          sentiment: true,
          summary: true,
          embeddings: true,
          similarity: true
        }
      }
    });
  } catch (error) {
    console.error('Text analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze text'
    });
  }
});

/**
 * GET /api/grantflow/status
 * Get GrantFlow service status and capabilities
 */
router.get('/status', validateApiKey(), async (req: Request, res: Response) => {
  try {
    const huggingFaceStatus = huggingFaceService.getStatus();
    
    res.json({
      success: true,
      data: {
        grantflow: {
          version: '1.0.0',
          status: 'operational'
        },
        aiServices: {
          huggingface: huggingFaceStatus
        },
        capabilities: {
          grantDiscovery: true,
          semanticMatching: huggingFaceStatus.available,
          teamRecommendations: true,
          textAnalysis: huggingFaceStatus.available,
          proposalGeneration: true
        },
        endpoints: [
          'GET /api/grantflow/grants',
          'POST /api/grantflow/grants/match',
          'POST /api/grantflow/team/recommend',
          'GET /api/grantflow/discovery/sources',
          'POST /api/grantflow/analyze/text',
          'GET /api/grantflow/status'
        ]
      }
    });
  } catch (error) {
    console.error('Failed to get service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve service status'
    });
  }
});

export default router;