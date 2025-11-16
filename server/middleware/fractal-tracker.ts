/**
 * Fractal Pattern Tracking Middleware
 * Automatically tracks all API requests for fractal analysis
 */

import { Request, Response, NextFunction } from 'express';
import { FractalPatternMiner, RequestPattern } from '../services/analytics/fractal-pattern-miner.js';

// Global fractal miner instance (shared with routes)
let globalFractalMiner: FractalPatternMiner | null = null;

export function initializeFractalTracker(): FractalPatternMiner {
  if (!globalFractalMiner) {
    globalFractalMiner = new FractalPatternMiner(0.0065);
    console.log('[FractalTracker] Initialized chaos theory-based pattern analysis');
  }
  return globalFractalMiner;
}

export function getFractalMiner(): FractalPatternMiner {
  if (!globalFractalMiner) {
    return initializeFractalTracker();
  }
  return globalFractalMiner;
}

/**
 * Middleware to automatically track request patterns for fractal analysis
 */
export function fractalTrackingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Capture response end to calculate response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, callback?: any) {
    const responseTime = Date.now() - startTime;
    
    // Skip tracking for non-API requests and health checks
    if (req.path.startsWith('/api') && req.path !== '/api/health' && req.path !== '/health') {
      try {
        const requestPattern: RequestPattern = {
          timestamp: startTime,
          userId: (req as any).user?.id || extractUserIdFromHeaders(req),
          endpoint: req.path,
          responseTime,
          cost: estimateRequestCost(req.path, responseTime),
          provider: extractProviderFromPath(req.path)
        };
        
        const fractalMiner = getFractalMiner();
        fractalMiner.addRequest(requestPattern);
        
        // Log interesting patterns (optional, for debugging)
        if (Math.random() < 0.01) { // 1% sampling for logging
          try {
            const stats = fractalMiner.getStatistics();
            if (stats.totalRequests > 100 && stats.totalRequests % 100 === 0) {
              const analysis = fractalMiner.performComprehensiveAnalysis();
              console.log(`[FractalTracker] Pattern Analysis: ${stats.totalRequests} requests, ` +
                         `fractal dimension: ${analysis.fractalDimension.toFixed(3)}, ` +
                         `complexity: ${analysis.patternComplexity}`);
            }
          } catch (error) {
            // Silent fail for analysis logging
          }
        }
      } catch (error) {
        console.error('[FractalTracker] Error tracking request:', error);
      }
    }
    
    // Call original end method
    originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
}

/**
 * Extract user ID from various sources
 */
function extractUserIdFromHeaders(req: Request): string | undefined {
  // Try various authentication methods
  const authHeader = req.headers.authorization;
  if (authHeader) {
    // Extract from JWT or API key (simplified)
    const token = authHeader.replace('Bearer ', '');
    if (token.length > 10) {
      return token.substring(0, 8); // Use first 8 chars as user identifier
    }
  }
  
  // Try session-based auth
  if ((req as any).session?.userId) {
    return (req as any).session.userId;
  }
  
  // Try IP-based identification (last resort)
  const ip = req.ip || req.connection.remoteAddress;
  if (ip) {
    return `ip_${ip.replace(/\./g, '_')}`;
  }
  
  return undefined;
}

/**
 * Estimate request cost based on endpoint and response time
 */
function estimateRequestCost(endpoint: string, responseTime: number): number {
  // AI endpoints are more expensive
  if (endpoint.includes('/ai/') || endpoint.includes('/chat/') || endpoint.includes('/inference/')) {
    const baseAICost = 0.002; // $0.002 base cost for AI requests
    const timePenalty = responseTime > 5000 ? (responseTime - 5000) / 1000 * 0.0001 : 0;
    return baseAICost + timePenalty;
  }
  
  // Web3 endpoints have gas costs
  if (endpoint.includes('/web3/') || endpoint.includes('/blockchain/') || endpoint.includes('/wallet/')) {
    return 0.001; // Approximate gas cost
  }
  
  // Database operations
  if (endpoint.includes('/users/') || endpoint.includes('/projects/') || endpoint.includes('/grants/')) {
    return responseTime > 1000 ? 0.0001 : 0.00005;
  }
  
  // Default minimal cost for other endpoints
  return 0.00001;
}

/**
 * Extract provider information from request path
 */
function extractProviderFromPath(endpoint: string): string | undefined {
  if (endpoint.includes('/openai/')) return 'openai';
  if (endpoint.includes('/anthropic/')) return 'anthropic';
  if (endpoint.includes('/deepseek/')) return 'deepseek';
  if (endpoint.includes('/myninja/')) return 'myninja';
  if (endpoint.includes('/huggingface/')) return 'huggingface';
  if (endpoint.includes('/perplexity/')) return 'perplexity';
  if (endpoint.includes('/web3/')) return 'infura';
  if (endpoint.includes('/polygon/')) return 'polygon';
  if (endpoint.includes('/ethereum/')) return 'ethereum';
  
  return undefined;
}

/**
 * Periodic analysis function (can be called by cron jobs)
 */
export async function performPeriodicFractalAnalysis(): Promise<void> {
  try {
    const fractalMiner = getFractalMiner();
    const stats = fractalMiner.getStatistics();
    
    if (stats.totalRequests < 100) {
      console.log('[FractalTracker] Insufficient data for periodic analysis');
      return;
    }
    
    const analysis = fractalMiner.performComprehensiveAnalysis();
    
    console.log('[FractalTracker] Periodic Analysis Results:');
    console.log(`  Total Requests: ${stats.totalRequests}`);
    console.log(`  Fractal Dimension: ${analysis.fractalDimension.toFixed(3)} (expected: 1.4-1.6)`);
    console.log(`  Pattern Complexity: ${analysis.patternComplexity}`);
    console.log(`  Anomaly Score: ${(analysis.anomalyScore * 100).toFixed(1)}%`);
    console.log(`  Lyapunov Exponent: ${analysis.lyapunovExponent.toFixed(6)}`);
    
    if (analysis.patternComplexity === 'suspicious') {
      console.warn('[FractalTracker] ⚠️  SUSPICIOUS PATTERN DETECTED!');
      console.warn(`  Recommendations: ${analysis.recommendations.join(', ')}`);
    }
    
    if (analysis.anomalyScore > 0.8) {
      console.warn('[FractalTracker] ⚠️  HIGH ANOMALY SCORE DETECTED!');
    }
    
  } catch (error) {
    console.error('[FractalTracker] Periodic analysis failed:', error);
  }
}