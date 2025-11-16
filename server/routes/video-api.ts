import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { videoService } from '../services/video-api-service';
import { db } from '../db';
import { videos, reviews, apiUsage, insertVideoSchema, insertApiUsageSchema } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Validation schemas
const generateVideoSchema = z.object({
  reviewId: z.number().optional(),
  text: z.string().min(10).max(2000),
  style: z.string().optional(),
  duration: z.number().min(5).max(60).optional(),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).optional(),
  voice: z.string().optional(),
  music: z.boolean().optional(),
  preferredProvider: z.enum(['ossa.ai', 'runway.ml', 'pika.art', 'local-ffmpeg']).optional()
});

// Generate video from text
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const validatedData = generateVideoSchema.parse(req.body);
    
    // Create video record with pending status
    const [videoRecord] = await db.insert(videos).values({
      reviewId: validatedData.reviewId,
      status: 'generating',
      provider: validatedData.preferredProvider || 'local-ffmpeg'
    }).returning();
    
    try {
      // Generate video using the service
      const result = await videoService.generateVideo({
        text: validatedData.text,
        style: validatedData.style,
        duration: validatedData.duration,
        aspectRatio: validatedData.aspectRatio,
        voice: validatedData.voice,
        music: validatedData.music
      }, validatedData.preferredProvider);
      
      // Update video record with results
      await db.update(videos)
        .set({
          videoUrl: result.videoUrl,
          thumbnailUrl: result.thumbnailUrl,
          durationSeconds: result.duration,
          fileSizeMb: result.fileSize.toString(),
          provider: result.provider,
          status: 'completed',
          generationCost: '0.95' // This would come from the actual cost tracking
        })
        .where(eq(videos.id, videoRecord.id));
      
      // If this was for a review, mark it as processed
      if (validatedData.reviewId) {
        await db.update(reviews)
          .set({ videoGenerated: true })
          .where(eq(reviews.id, validatedData.reviewId));
      }
      
      res.json({
        success: true,
        video: {
          id: videoRecord.id,
          ...result
        }
      });
      
    } catch (generationError: any) {
      // Update video record with error
      await db.update(videos)
        .set({
          status: 'failed',
          errorMessage: generationError.message
        })
        .where(eq(videos.id, videoRecord.id));
      
      throw generationError;
    }
    
  } catch (error: any) {
    console.error('Video generation error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Video generation failed'
    });
  }
});

// Get video by ID
router.get('/video/:id', async (req: Request, res: Response) => {
  try {
    const videoId = parseInt(req.params.id);
    
    const [video] = await db.select()
      .from(videos)
      .where(eq(videos.id, videoId))
      .limit(1);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }
    
    res.json({
      success: true,
      video
    });
    
  } catch (error: any) {
    console.error('Get video error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve video'
    });
  }
});

// Get all videos with pagination
router.get('/videos', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    const videoList = await db.select()
      .from(videos)
      .limit(limit)
      .offset(offset)
      .orderBy(videos.createdAt);
    
    res.json({
      success: true,
      videos: videoList,
      pagination: {
        page,
        limit,
        hasMore: videoList.length === limit
      }
    });
    
  } catch (error: any) {
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve videos'
    });
  }
});

// Get usage statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const serviceStats = videoService.getUsageStats();
    
    // Get database stats
    const totalVideos = await db.select().from(videos);
    const completedVideos = totalVideos.filter(v => v.status === 'completed');
    const failedVideos = totalVideos.filter(v => v.status === 'failed');
    
    res.json({
      success: true,
      stats: {
        service: serviceStats,
        database: {
          totalVideos: totalVideos.length,
          completedVideos: completedVideos.length,
          failedVideos: failedVideos.length,
          successRate: totalVideos.length > 0 ? (completedVideos.length / totalVideos.length) * 100 : 0
        }
      }
    });
    
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics'
    });
  }
});

// Get cost breakdown
router.get('/costs', async (req: Request, res: Response) => {
  try {
    const dailyCost = videoService.getDailyCost();
    const monthlyCost = videoService.getMonthlyCost();
    
    // Get cost breakdown by provider from database
    const apiUsageData = await db.select().from(apiUsage);
    
    const providerCosts = apiUsageData.reduce((acc, usage) => {
      if (!acc[usage.provider]) {
        acc[usage.provider] = { total: 0, calls: 0, failures: 0 };
      }
      acc[usage.provider].total += parseFloat(usage.cost);
      acc[usage.provider].calls += 1;
      if (!usage.success) {
        acc[usage.provider].failures += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; calls: number; failures: number }>);
    
    res.json({
      success: true,
      costs: {
        daily: dailyCost,
        monthly: monthlyCost,
        breakdown: providerCosts
      }
    });
    
  } catch (error: any) {
    console.error('Get costs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cost data'
    });
  }
});

// Webhook for processing review updates
router.post('/webhook/review-update', async (req: Request, res: Response) => {
  try {
    const { reviewId, platform, autoGenerate = false } = req.body;
    
    if (!reviewId) {
      return res.status(400).json({
        success: false,
        error: 'Review ID is required'
      });
    }
    
    // Get review data
    const [review] = await db.select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    // Auto-generate video if requested and review hasn't been processed
    if (autoGenerate && !review.videoGenerated) {
      try {
        const videoText = `${review.businessName} received a ${review.rating}-star review: "${review.reviewText}"`;
        
        const result = await videoService.generateVideo({
          text: videoText,
          aspectRatio: '9:16', // Vertical for social media
          duration: 15
        });
        
        // Create video record
        await db.insert(videos).values({
          reviewId: review.id,
          videoUrl: result.videoUrl,
          thumbnailUrl: result.thumbnailUrl,
          durationSeconds: result.duration,
          fileSizeMb: result.fileSize.toString(),
          provider: result.provider,
          status: 'completed',
          generationCost: '0.50'
        });
        
        // Mark review as processed
        await db.update(reviews)
          .set({ 
            processed: true,
            videoGenerated: true 
          })
          .where(eq(reviews.id, review.id));
        
      } catch (videoError: any) {
        console.error('Auto video generation failed:', videoError);
        // Continue - don't fail the webhook for video generation errors
      }
    }
    
    res.json({
      success: true,
      message: 'Review webhook processed successfully'
    });
    
  } catch (error: any) {
    console.error('Review webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

// Video demo endpoint for Thursday presentation
router.post('/generate-demo', async (req, res) => {
  try {
    const { businessName, platform, reviewText, rating } = req.body;
    
    // Simulate video generation for demo
    const demoVideo = {
      id: Date.now(),
      businessName: businessName || 'Demo Business',
      platform: platform || 'google',
      rating: rating || 5,
      reviewText: reviewText || 'Great service, highly recommended!',
      videoUrl: '/demo-video.mp4',
      thumbnailUrl: '/demo-thumbnail.jpg',
      durationSeconds: 30,
      status: 'completed',
      provider: 'demo-provider',
      generationCost: 0.25,
      createdAt: new Date().toISOString()
    };

    // Log API usage for cost tracking
    console.log(`[Video Demo] Generated video for ${businessName} - Cost: $${demoVideo.generationCost}`);

    res.json({
      success: true,
      data: demoVideo,
      message: 'Demo video generated successfully'
    });
  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate demo video'
    });
  }
});

// Get video generation cost estimates
router.get('/cost-estimate', async (req, res) => {
  try {
    const estimates = {
      providers: [
        { name: 'OpenAI Sora', costPerMinute: 0.80, quality: 'High', features: ['4K', 'Custom voices'] },
        { name: 'Runway Gen-3', costPerMinute: 0.95, quality: 'Premium', features: ['Motion control', 'Style transfer'] },
        { name: 'Fliki AI', costPerMinute: 0.25, quality: 'Standard', features: ['Text-to-speech', 'Templates'] }
      ],
      recommended: 'Fliki AI',
      totalMonthlySavings: 102.80,
      infrastructure: {
        hosting: 'Railway ($5/mo vs Vercel $20/mo)',
        cdn: 'Bunny.net ($1.20/mo vs Cloudinary $89/mo)',
        database: 'Included (existing PostgreSQL)'
      }
    };

    res.json({
      success: true,
      data: estimates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cost estimates'
    });
  }
});

export default router;