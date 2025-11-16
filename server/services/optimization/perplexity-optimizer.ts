/**
 * Perplexity Optimizer Service
 * 
 * This service uses Perplexity AI to analyze system metrics and provide
 * optimization recommendations for resource allocation and system performance.
 */

import { perplexityChat } from '../perplexity-service';
import { logger } from '../../utils/logger';
import { db } from '../../db';
import { optimizationRecommendations } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Types for system metrics and optimization
export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cached: number;
  };
  network: {
    rx: number;
    tx: number;
    connections: number;
  };
  storage: {
    total: number;
    used: number;
    free: number;
    readOps: number;
    writeOps: number;
  };
  database: {
    queries: number;
    slowQueries: number;
    connectionPool: {
      total: number;
      active: number;
      idle: number;
    };
    avgResponseTime: number;
  };
  api: {
    requests: number;
    latency: {
      avg: number;
      p95: number;
      p99: number;
    };
    errorRate: number;
  };
  custom?: Record<string, any>;
}

export interface OptimizationTarget {
  component: string;
  subcomponent?: string;
  metrics: Record<string, any>;
  issues: string[];
}

export interface OptimizationRecommendation {
  id?: number;
  target: string;
  currentMetrics: Record<string, any>;
  suggestedChanges: Array<{
    change: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }>;
  expectedImprovement: number;
  confidence: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  createdAt?: Date;
  implementedAt?: Date | null;
  effectiveness?: number | null;
}

/**
 * Uses Perplexity AI to analyze system metrics and provide optimization recommendations
 */
export class PerplexityOptimizer {
  /**
   * Analyzes system metrics and identifies potential optimization targets
   */
  async identifyOptimizationTargets(metrics: SystemMetrics): Promise<OptimizationTarget[]> {
    try {
      logger.info('[perplexity-optimizer] Analyzing system metrics to identify optimization targets');
      
      // Format metrics for analysis
      const formattedMetrics = this.formatMetricsForAnalysis(metrics);
      
      // Create prompt for optimization target identification
      const prompt = `
      As a system optimization expert, analyze these system metrics and identify components 
      that could benefit from optimization. Focus on potential bottlenecks, inefficient resource 
      utilization, and performance issues.

      System Metrics:
      ${JSON.stringify(formattedMetrics, null, 2)}

      For each identified optimization target, provide:
      1. The specific component and subcomponent
      2. Key metrics indicating problems
      3. Specific issues identified
      
      Return your analysis as a JSON array of optimization targets.
      Each target should have the structure:
      {
        "component": "string", // e.g., "database", "api", "memory"
        "subcomponent": "string", // optional, e.g., "connection pool", "caching"
        "metrics": {}, // relevant metrics showing the issue
        "issues": [] // array of specific issues identified
      }
      `;

      // Query Perplexity for optimization targets
      const response = await perplexityChat(prompt);
      
      // Extract and parse the JSON content
      const jsonContent = this.extractJsonFromResponse(response);
      
      // Parse and validate the optimization targets
      const optimizationTargets = this.parseOptimizationTargets(jsonContent);
      
      logger.info(`[perplexity-optimizer] Identified ${optimizationTargets.length} optimization targets`);
      
      return optimizationTargets;
    } catch (error) {
      logger.error('[perplexity-optimizer] Error identifying optimization targets:', error);
      throw new Error('Failed to identify optimization targets');
    }
  }

  /**
   * Generates specific optimization recommendations for identified targets
   */
  async generateRecommendations(targets: OptimizationTarget[], metrics: SystemMetrics): Promise<OptimizationRecommendation[]> {
    try {
      logger.info('[perplexity-optimizer] Generating optimization recommendations');
      
      const recommendations: OptimizationRecommendation[] = [];
      
      // Process each target to get detailed recommendations
      for (const target of targets) {
        // Create prompt for detailed recommendations
        const prompt = `
        As a system optimization expert, provide detailed optimization recommendations for this target:
        
        Target Component: ${target.component}
        ${target.subcomponent ? `Subcomponent: ${target.subcomponent}` : ''}
        Issues: ${target.issues.join(', ')}
        
        Relevant Metrics:
        ${JSON.stringify(target.metrics, null, 2)}
        
        Full System Context:
        ${JSON.stringify(metrics, null, 2)}
        
        Provide a detailed optimization recommendation with:
        1. Specific changes to implement
        2. Expected improvement (as a percentage)
        3. Implementation complexity (low, medium, high)
        4. Confidence level in the recommendation (0-1)
        
        Return your recommendation as JSON with this structure:
        {
          "target": "string", // component/subcomponent
          "currentMetrics": {}, // relevant current metrics
          "suggestedChanges": [
            {
              "change": "string", // specific change to implement
              "impact": "string", // expected impact
              "effort": "low|medium|high" // implementation effort
            }
          ],
          "expectedImprovement": number, // percentage
          "confidence": number, // 0-1
          "implementationComplexity": "low|medium|high"
        }
        `;
        
        // Query Perplexity for detailed recommendation
        const response = await perplexityChat(prompt);
        
        // Extract and parse the JSON content
        const jsonContent = this.extractJsonFromResponse(response);
        
        // Parse and validate the recommendation
        const recommendation = this.parseRecommendation(jsonContent);
        
        recommendations.push(recommendation);
      }
      
      // Store recommendations in database
      await this.storeRecommendations(recommendations);
      
      logger.info(`[perplexity-optimizer] Generated ${recommendations.length} optimization recommendations`);
      
      return recommendations;
    } catch (error) {
      logger.error('[perplexity-optimizer] Error generating recommendations:', error);
      throw new Error('Failed to generate optimization recommendations');
    }
  }

  /**
   * Formats system metrics for analysis
   */
  private formatMetricsForAnalysis(metrics: SystemMetrics): Record<string, any> {
    // Add derived metrics that help with analysis
    return {
      ...metrics,
      derived: {
        memoryUtilization: metrics.memory.used / metrics.memory.total,
        cpuSaturation: metrics.cpu.loadAverage[0] / metrics.cpu.cores,
        databaseConnectionUtilization: 
          metrics.database.connectionPool.active / metrics.database.connectionPool.total,
        storageUtilization: metrics.storage.used / metrics.storage.total,
      }
    };
  }

  /**
   * Extracts JSON content from Perplexity response
   */
  private extractJsonFromResponse(response: string): string {
    // Look for JSON content within the response
    const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in the response');
    }
    return jsonMatch[0];
  }

  /**
   * Parses and validates optimization targets
   */
  private parseOptimizationTargets(jsonContent: string): OptimizationTarget[] {
    try {
      const parsed = JSON.parse(jsonContent);
      
      // Ensure the result is an array
      const targets = Array.isArray(parsed) ? parsed : [parsed];
      
      // Validate each target
      return targets.map(target => this.validateOptimizationTarget(target));
    } catch (error) {
      logger.error('[perplexity-optimizer] Error parsing optimization targets:', error);
      throw new Error('Failed to parse optimization targets');
    }
  }

  /**
   * Validates an optimization target
   */
  private validateOptimizationTarget(target: any): OptimizationTarget {
    if (!target.component || !target.metrics || !Array.isArray(target.issues)) {
      throw new Error('Invalid optimization target format');
    }
    
    return {
      component: target.component,
      subcomponent: target.subcomponent,
      metrics: target.metrics,
      issues: target.issues
    };
  }

  /**
   * Parses and validates an optimization recommendation
   */
  private parseRecommendation(jsonContent: string): OptimizationRecommendation {
    try {
      const parsed = JSON.parse(jsonContent);
      
      // Validate the recommendation
      if (!parsed.target || !parsed.suggestedChanges || 
          typeof parsed.expectedImprovement !== 'number' || 
          typeof parsed.confidence !== 'number') {
        throw new Error('Invalid recommendation format');
      }
      
      return {
        target: parsed.target,
        currentMetrics: parsed.currentMetrics || {},
        suggestedChanges: parsed.suggestedChanges,
        expectedImprovement: parsed.expectedImprovement,
        confidence: parsed.confidence,
        implementationComplexity: parsed.implementationComplexity || 'medium',
        createdAt: new Date()
      };
    } catch (error) {
      logger.error('[perplexity-optimizer] Error parsing recommendation:', error);
      throw new Error('Failed to parse optimization recommendation');
    }
  }

  /**
   * Stores recommendations in the database
   */
  private async storeRecommendations(recommendations: OptimizationRecommendation[]): Promise<void> {
    try {
      for (const rec of recommendations) {
        await db.insert(optimizationRecommendations).values({
          target: rec.target,
          currentMetrics: rec.currentMetrics as any,
          suggestedChanges: rec.suggestedChanges as any,
          expectedImprovement: rec.expectedImprovement,
          confidence: rec.confidence,
          implementationComplexity: rec.implementationComplexity,
          createdAt: rec.createdAt || new Date(),
          implementedAt: null,
          effectiveness: null
        });
      }
    } catch (error) {
      logger.error('[perplexity-optimizer] Error storing recommendations:', error);
      // Continue execution even if storing fails
    }
  }

  /**
   * Gets all stored optimization recommendations
   */
  async getStoredRecommendations(): Promise<OptimizationRecommendation[]> {
    try {
      return await db.select().from(optimizationRecommendations);
    } catch (error) {
      logger.error('[perplexity-optimizer] Error getting stored recommendations:', error);
      return [];
    }
  }

  /**
   * Marks a recommendation as implemented
   */
  async markRecommendationAsImplemented(id: number): Promise<void> {
    try {
      await db.update(optimizationRecommendations)
        .set({ 
          implementedAt: new Date()
        })
        .where(eq(optimizationRecommendations.id, id));
    } catch (error) {
      logger.error('[perplexity-optimizer] Error marking recommendation as implemented:', error);
      throw new Error('Failed to update recommendation status');
    }
  }

  /**
   * Records the effectiveness of an implemented recommendation
   */
  async recordRecommendationEffectiveness(id: number, effectiveness: number): Promise<void> {
    try {
      await db.update(optimizationRecommendations)
        .set({ 
          effectiveness: effectiveness
        })
        .where(eq(optimizationRecommendations.id, id));
    } catch (error) {
      logger.error('[perplexity-optimizer] Error recording recommendation effectiveness:', error);
      throw new Error('Failed to update recommendation effectiveness');
    }
  }
}

// Export singleton instance
export const perplexityOptimizer = new PerplexityOptimizer();