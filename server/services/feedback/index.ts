/**
 * Feedback Service
 * 
 * This service handles the collection, processing, and analysis of user feedback
 * to improve the platform through AI-powered insights and recommendations.
 */

import { logger } from '../../utils/logger';
import { db } from '../../db';
import { generateChatCompletion } from '../redundancy/ai';

// Feedback types
export type FeedbackType = 
  | 'feature_request' 
  | 'bug_report'
  | 'user_experience'
  | 'recommendation_quality'
  | 'performance_issue'
  | 'content_quality'
  | 'other';

// Feedback categories
export type FeedbackCategory = 
  | 'ui' 
  | 'ai' 
  | 'blockchain'
  | 'reputation'
  | 'crowdfunding'
  | 'authentication'
  | 'storage'
  | 'compute'
  | 'communication'
  | 'other';

// Feedback severity levels
export type FeedbackSeverity = 
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'enhancement';

// Feedback status
export type FeedbackStatus = 
  | 'new'
  | 'under_review'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'wont_fix'
  | 'duplicate'
  | 'invalid';

// Feedback item structure
export interface FeedbackItem {
  id?: number;
  userId: number;
  type: FeedbackType;
  category: FeedbackCategory;
  severity: FeedbackSeverity;
  title: string;
  description: string;
  path?: string; // URL path where feedback was submitted
  screenshot?: string; // Base64 encoded screenshot
  metadata?: Record<string, any>; // Additional contextual data
  rating?: number; // Optional rating (1-5)
  status?: FeedbackStatus;
  aiAnalysis?: string; // AI-generated analysis of the feedback
  tags?: string[]; // Automatically generated tags
  upvotes?: number; // Number of other users who upvoted this feedback
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Feedback Service class
 */
export class FeedbackService {
  private readonly tableName = 'user_feedback';
  private readonly analysisPrompt = `
You are an expert feedback analyzer for a Web3 hybrid blockchain/DAG platform called HyperDAG.

Please analyze the following feedback carefully and provide:

1. Key issues or requests identified (bullet points)
2. Potential impact (high/medium/low)
3. Any technical insights or implementation ideas
4. Suggested priority (critical/high/medium/low)
5. 3-5 relevant tags that categorize this feedback

Feedback type: {type}
Feedback category: {category}
User path: {path}
User description: {description}
User rating: {rating}/5

Please format your response as JSON with these fields:
{
  "analysis": "Your overall analysis",
  "issues": ["issue1", "issue2"],
  "impact": "high/medium/low",
  "technicalInsights": "Your technical insights",
  "suggestedPriority": "critical/high/medium/low",
  "tags": ["tag1", "tag2", "tag3"]
}
`;

  /**
   * Initialize the feedback service
   */
  constructor() {
    // Disable database initialization to prevent prepared statement errors
    // this.initializeDatabase();
    logger.info('[feedback] Feedback service initialized in memory-only mode');
  }

  /**
   * Create necessary database tables if they don't exist
   */
  private async initializeDatabase() {
    try {
      // Create feedback table if it doesn't exist
      await db.execute(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          type VARCHAR(30) NOT NULL,
          category VARCHAR(30) NOT NULL,
          severity VARCHAR(20) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          path VARCHAR(255),
          screenshot TEXT,
          metadata JSONB,
          rating INTEGER,
          status VARCHAR(20) DEFAULT 'new',
          ai_analysis JSONB,
          tags TEXT[],
          upvotes INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create indexes for faster queries (one at a time to avoid prepared statement issues)
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON ${this.tableName} (user_id)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_type ON ${this.tableName} (type)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_category ON ${this.tableName} (category)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_status ON ${this.tableName} (status)`);
      
      logger.info('[feedback] Feedback database tables initialized');
    } catch (error) {
      logger.error('[feedback] Failed to initialize feedback database:', error);
    }
  }

  /**
   * Submit a new feedback item
   */
  public async submitFeedback(feedback: FeedbackItem): Promise<FeedbackItem | null> {
    try {
      // Insert feedback into database
      const result = await db.execute(`
        INSERT INTO ${this.tableName}
        (user_id, type, category, severity, title, description, path, screenshot, metadata, rating, tags)
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        feedback.userId,
        feedback.type,
        feedback.category,
        feedback.severity,
        feedback.title,
        feedback.description,
        feedback.path || null,
        feedback.screenshot || null,
        JSON.stringify(feedback.metadata || {}),
        feedback.rating || null,
        feedback.tags || null
      ]);
      
      if (result.rows && result.rows.length > 0) {
        const savedFeedback = this.mapRowToFeedback(result.rows[0]);
        
        // Queue for AI analysis
        this.analyzeFeedbackAsync(savedFeedback);
        
        return savedFeedback;
      }
      
      return null;
    } catch (error) {
      logger.error('[feedback] Failed to submit feedback:', error);
      return null;
    }
  }

  /**
   * Get feedback by ID
   */
  public async getFeedbackById(id: number): Promise<FeedbackItem | null> {
    try {
      const result = await db.execute(`
        SELECT * FROM ${this.tableName} WHERE id = $1
      `, [id]);
      
      if (result.rows && result.rows.length > 0) {
        return this.mapRowToFeedback(result.rows[0]);
      }
      
      return null;
    } catch (error) {
      logger.error(`[feedback] Failed to get feedback #${id}:`, error);
      return null;
    }
  }

  /**
   * Get all feedback with optional filters
   */
  public async getFeedback(options: {
    userId?: number;
    type?: FeedbackType;
    category?: FeedbackCategory;
    status?: FeedbackStatus;
    limit?: number;
    offset?: number;
  } = {}): Promise<FeedbackItem[]> {
    try {
      const {
        userId,
        type,
        category,
        status,
        limit = 100,
        offset = 0
      } = options;
      
      // Build query conditionally
      let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;
      const params: any[] = [];
      
      if (userId !== undefined) {
        params.push(userId);
        query += ` AND user_id = $${params.length}`;
      }
      
      if (type) {
        params.push(type);
        query += ` AND type = $${params.length}`;
      }
      
      if (category) {
        params.push(category);
        query += ` AND category = $${params.length}`;
      }
      
      if (status) {
        params.push(status);
        query += ` AND status = $${params.length}`;
      }
      
      // Add order by, limit, offset
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      const result = await db.execute(query, params);
      
      if (result.rows) {
        return result.rows.map(row => this.mapRowToFeedback(row));
      }
      
      return [];
    } catch (error) {
      logger.error('[feedback] Failed to get feedback list:', error);
      return [];
    }
  }

  /**
   * Update feedback status
   */
  public async updateFeedbackStatus(id: number, status: FeedbackStatus): Promise<boolean> {
    try {
      await db.execute(`
        UPDATE ${this.tableName}
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [status, id]);
      
      return true;
    } catch (error) {
      logger.error(`[feedback] Failed to update feedback #${id} status:`, error);
      return false;
    }
  }

  /**
   * Upvote a feedback item
   */
  public async upvoteFeedback(id: number): Promise<boolean> {
    try {
      await db.execute(`
        UPDATE ${this.tableName}
        SET upvotes = upvotes + 1
        WHERE id = $1
      `, [id]);
      
      return true;
    } catch (error) {
      logger.error(`[feedback] Failed to upvote feedback #${id}:`, error);
      return false;
    }
  }

  /**
   * Delete feedback
   */
  public async deleteFeedback(id: number): Promise<boolean> {
    try {
      await db.execute(`
        DELETE FROM ${this.tableName}
        WHERE id = $1
      `, [id]);
      
      return true;
    } catch (error) {
      logger.error(`[feedback] Failed to delete feedback #${id}:`, error);
      return false;
    }
  }

  /**
   * Get feedback statistics
   */
  public async getFeedbackStats(): Promise<{
    totalFeedback: number;
    byType: Record<FeedbackType, number>;
    byCategory: Record<FeedbackCategory, number>;
    byStatus: Record<FeedbackStatus, number>;
    averageRating: number;
  }> {
    try {
      // Get total count
      const countResult = await db.execute(`
        SELECT COUNT(*) as total FROM ${this.tableName}
      `);
      
      const total = parseInt(countResult.rows?.[0]?.total || '0');
      
      // Get counts by type
      const typeResult = await db.execute(`
        SELECT type, COUNT(*) as count 
        FROM ${this.tableName} 
        GROUP BY type
      `);
      
      const byType: Record<FeedbackType, number> = {} as any;
      if (typeResult.rows) {
        typeResult.rows.forEach(row => {
          byType[row.type as FeedbackType] = parseInt(row.count);
        });
      }
      
      // Get counts by category
      const categoryResult = await db.execute(`
        SELECT category, COUNT(*) as count 
        FROM ${this.tableName} 
        GROUP BY category
      `);
      
      const byCategory: Record<FeedbackCategory, number> = {} as any;
      if (categoryResult.rows) {
        categoryResult.rows.forEach(row => {
          byCategory[row.category as FeedbackCategory] = parseInt(row.count);
        });
      }
      
      // Get counts by status
      const statusResult = await db.execute(`
        SELECT status, COUNT(*) as count 
        FROM ${this.tableName} 
        GROUP BY status
      `);
      
      const byStatus: Record<FeedbackStatus, number> = {} as any;
      if (statusResult.rows) {
        statusResult.rows.forEach(row => {
          byStatus[row.status as FeedbackStatus] = parseInt(row.count);
        });
      }
      
      // Get average rating
      const ratingResult = await db.execute(`
        SELECT AVG(rating) as avg_rating 
        FROM ${this.tableName} 
        WHERE rating IS NOT NULL
      `);
      
      const averageRating = parseFloat(ratingResult.rows?.[0]?.avg_rating || '0');
      
      return {
        totalFeedback: total,
        byType,
        byCategory,
        byStatus,
        averageRating
      };
    } catch (error) {
      logger.error('[feedback] Failed to get feedback stats:', error);
      return {
        totalFeedback: 0,
        byType: {} as Record<FeedbackType, number>,
        byCategory: {} as Record<FeedbackCategory, number>,
        byStatus: {} as Record<FeedbackStatus, number>,
        averageRating: 0
      };
    }
  }

  /**
   * Map a database row to a FeedbackItem
   */
  private mapRowToFeedback(row: any): FeedbackItem {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type as FeedbackType,
      category: row.category as FeedbackCategory,
      severity: row.severity as FeedbackSeverity,
      title: row.title,
      description: row.description,
      path: row.path,
      screenshot: row.screenshot,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      rating: row.rating,
      status: row.status as FeedbackStatus,
      aiAnalysis: row.ai_analysis ? JSON.stringify(row.ai_analysis) : undefined,
      tags: row.tags,
      upvotes: row.upvotes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Analyze feedback asynchronously using AI
   */
  private async analyzeFeedbackAsync(feedback: FeedbackItem): Promise<void> {
    try {
      // Prepare the analysis prompt
      const analysisPromptWithValues = this.analysisPrompt
        .replace('{type}', feedback.type)
        .replace('{category}', feedback.category)
        .replace('{path}', feedback.path || 'N/A')
        .replace('{description}', feedback.description)
        .replace('{rating}', feedback.rating?.toString() || 'N/A');
      
      // Call AI service for analysis
      const aiResponse = await generateChatCompletion([
        { role: 'system', content: 'You are an expert feedback analyst for a Web3 platform.' },
        { role: 'user', content: analysisPromptWithValues }
      ], {
        temperature: 0.2,
        responseFormat: 'json',
        priority: 3, // Medium priority
        preferFreeTier: true
      });
      
      // Parse the analysis
      let analysis: any = null;
      try {
        analysis = JSON.parse(aiResponse.text);
      } catch (parseError) {
        logger.error('[feedback] Failed to parse AI analysis:', parseError);
        analysis = { analysis: aiResponse.text };
      }
      
      // Update the feedback with analysis
      await db.execute(`
        UPDATE ${this.tableName}
        SET ai_analysis = $1, tags = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [
        JSON.stringify(analysis),
        analysis.tags || [],
        feedback.id
      ]);
      
      logger.info(`[feedback] AI analysis completed for feedback #${feedback.id}`);
    } catch (error) {
      logger.error(`[feedback] Failed to analyze feedback #${feedback.id}:`, error);
    }
  }

  /**
   * Get most common feedback themes over time
   */
  public async getFeedbackThemes(): Promise<{
    theme: string;
    count: number;
    averageRating: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }[]> {
    try {
      // Get the most frequent tags
      const tagsResult = await db.execute(`
        SELECT unnest(tags) as tag, COUNT(*) as tag_count, AVG(rating) as avg_rating
        FROM ${this.tableName}
        WHERE tags IS NOT NULL
        GROUP BY tag
        ORDER BY tag_count DESC
        LIMIT 10
      `);
      
      if (!tagsResult.rows || tagsResult.rows.length === 0) {
        return [];
      }
      
      // For each tag, determine if trend is increasing or decreasing
      const themes = [];
      
      for (const row of tagsResult.rows) {
        const tag = row.tag;
        
        // Get count for last 30 days
        const recentResult = await db.execute(`
          SELECT COUNT(*) as recent_count
          FROM ${this.tableName}
          WHERE tags @> ARRAY[$1]
          AND created_at > NOW() - INTERVAL '30 days'
        `, [tag]);
        
        // Get count for previous 30 days
        const previousResult = await db.execute(`
          SELECT COUNT(*) as previous_count
          FROM ${this.tableName}
          WHERE tags @> ARRAY[$1]
          AND created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days'
        `, [tag]);
        
        const recentCount = parseInt(recentResult.rows?.[0]?.recent_count || '0');
        const previousCount = parseInt(previousResult.rows?.[0]?.previous_count || '0');
        
        let trend: 'increasing' | 'decreasing' | 'stable';
        
        if (recentCount > previousCount * 1.2) {
          trend = 'increasing';
        } else if (recentCount < previousCount * 0.8) {
          trend = 'decreasing';
        } else {
          trend = 'stable';
        }
        
        themes.push({
          theme: tag,
          count: parseInt(row.tag_count),
          averageRating: parseFloat(row.avg_rating || '0'),
          trend
        });
      }
      
      return themes;
    } catch (error) {
      logger.error('[feedback] Failed to get feedback themes:', error);
      return [];
    }
  }

  /**
   * Get actionable insights from feedback
   */
  public async getActionableInsights(): Promise<string[]> {
    try {
      // Get feedback with analysis
      const result = await db.execute(`
        SELECT ai_analysis
        FROM ${this.tableName}
        WHERE ai_analysis IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 50
      `);
      
      if (!result.rows || result.rows.length === 0) {
        return [];
      }
      
      // Extract insights from analyses
      const analysisTexts: string[] = [];
      
      for (const row of result.rows) {
        try {
          const analysis = JSON.parse(row.ai_analysis);
          if (analysis.analysis) {
            analysisTexts.push(analysis.analysis);
          }
        } catch (error) {
          // Skip unparseable analysis
        }
      }
      
      if (analysisTexts.length === 0) {
        return [];
      }
      
      // Use AI to generate insights from the collection of analyses
      const insightsPrompt = `
You are an expert product manager analyzing feedback for a Web3 platform.
Below are analyses from recent user feedback:

${analysisTexts.join('\n\n---\n\n')}

Based on these analyses, what are the top 5 most actionable insights?
Focus on concrete, specific recommendations that would improve the product.
Prioritize insights that appear repeatedly or represent user pain points.
`;
      
      const aiResponse = await generateChatCompletion([
        { role: 'system', content: 'You are an expert product manager for a Web3 platform.' },
        { role: 'user', content: insightsPrompt }
      ], {
        temperature: 0.3,
        priority: 4, // Higher priority
        preferFreeTier: false // Use best model
      });
      
      // Parse insights - expected as a list
      const insights = aiResponse.text
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().match(/^\d+\./))
        .map(line => line.replace(/^[-•\d.]+\s*/, '').trim())
        .filter(line => line.length > 0);
      
      return insights.length > 0 ? insights : [aiResponse.text];
    } catch (error) {
      logger.error('[feedback] Failed to get actionable insights:', error);
      return [];
    }
  }
}

// Create singleton instance
export const feedbackService = new FeedbackService();