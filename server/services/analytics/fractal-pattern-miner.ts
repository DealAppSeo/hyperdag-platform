/**
 * Fractal Pattern Miner
 * Advanced chaos theory-based request pattern analysis
 * Uses box-counting method to detect fractal dimensions in user behavior
 */

export interface RequestPattern {
  timestamp: number;
  userId?: string;
  endpoint: string;
  responseTime: number;
  cost: number;
  provider?: string;
}

export interface FractalAnalysis {
  fractalDimension: number;
  lyapunovExponent: number;
  patternComplexity: 'simple' | 'complex' | 'chaotic' | 'suspicious';
  anomalyScore: number;
  predictability: number;
  recommendations: string[];
}

export class FractalPatternMiner {
  private threshold: number;
  private fractalDimension: number | null = null;
  private requestHistory: RequestPattern[] = [];

  constructor(lyapunovThreshold = 0.0065) {
    this.threshold = lyapunovThreshold;
  }

  /**
   * Add request to analysis history
   */
  addRequest(request: RequestPattern): void {
    this.requestHistory.push(request);
    
    // Keep rolling window of last 10000 requests
    if (this.requestHistory.length > 10000) {
      this.requestHistory = this.requestHistory.slice(-10000);
    }
  }

  /**
   * Analyze request patterns using fractal dimension calculation
   */
  analyzeRequestPatterns(requestHistory?: RequestPattern[]): number {
    const history = requestHistory || this.requestHistory;
    
    if (history.length < 100) {
      throw new Error('Insufficient data for fractal analysis (minimum 100 requests)');
    }

    // Box-counting method for fractal dimension
    const scales = [2, 4, 8, 16, 32, 64, 128, 256, 512];
    const counts: number[] = [];
    
    for (const scale of scales) {
      // Partition timeline into boxes
      const boxes = this.partitionTimeline(history, scale);
      counts.push(boxes.filter(box => box.requestCount > 0).length);
    }
    
    // Fractal dimension via log-log slope
    const logScales = scales.map(s => Math.log(s));
    const logCounts = counts.map(c => Math.log(c));
    const slope = this.calculateSlope(logScales, logCounts);
    
    this.fractalDimension = -slope;
    return this.fractalDimension;  // Expect 1.4-1.6 for natural patterns
  }

  /**
   * Comprehensive fractal analysis with security implications
   */
  performComprehensiveAnalysis(requestHistory?: RequestPattern[]): FractalAnalysis {
    const history = requestHistory || this.requestHistory;
    
    try {
      const fractalDim = this.analyzeRequestPatterns(history);
      const lyapunov = this.calculateLyapunovExponent(history);
      const complexity = this.classifyPatternComplexity(fractalDim, lyapunov);
      const anomalyScore = this.calculateAnomalyScore(fractalDim, lyapunov);
      const predictability = this.calculatePredictability(fractalDim, lyapunov);
      const recommendations = this.generateRecommendations(complexity, anomalyScore, fractalDim);

      return {
        fractalDimension: fractalDim,
        lyapunovExponent: lyapunov,
        patternComplexity: complexity,
        anomalyScore,
        predictability,
        recommendations
      };
    } catch (error) {
      console.error('[FractalMiner] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Partition timeline into boxes for box-counting
   */
  private partitionTimeline(history: RequestPattern[], scale: number): Array<{startTime: number, endTime: number, requestCount: number}> {
    if (history.length === 0) return [];
    
    const minTime = Math.min(...history.map(r => r.timestamp));
    const maxTime = Math.max(...history.map(r => r.timestamp));
    const timeRange = maxTime - minTime;
    const boxSize = timeRange / scale;
    
    const boxes: Array<{startTime: number, endTime: number, requestCount: number}> = [];
    
    for (let i = 0; i < scale; i++) {
      const startTime = minTime + (i * boxSize);
      const endTime = startTime + boxSize;
      const requestCount = history.filter(r => r.timestamp >= startTime && r.timestamp < endTime).length;
      
      boxes.push({ startTime, endTime, requestCount });
    }
    
    return boxes;
  }

  /**
   * Calculate slope for fractal dimension
   */
  private calculateSlope(xValues: number[], yValues: number[]): number {
    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  /**
   * Calculate Lyapunov exponent for chaos detection
   */
  private calculateLyapunovExponent(history: RequestPattern[]): number {
    if (history.length < 50) return 0;
    
    // Convert timestamps to intervals
    const intervals = history.slice(1).map((req, i) => req.timestamp - history[i].timestamp);
    
    // Calculate sensitivity to initial conditions
    let lyapunov = 0;
    const windowSize = 10;
    
    for (let i = 0; i < intervals.length - windowSize - 1; i++) {
      const window1 = intervals.slice(i, i + windowSize);
      const window2 = intervals.slice(i + 1, i + windowSize + 1);
      
      const divergence = this.calculateDivergence(window1, window2);
      if (divergence > 0) {
        lyapunov += Math.log(divergence);
      }
    }
    
    return lyapunov / (intervals.length - windowSize - 1);
  }

  /**
   * Calculate divergence between two time series windows
   */
  private calculateDivergence(window1: number[], window2: number[]): number {
    const diff = window1.map((val, i) => Math.abs(val - window2[i]));
    const avgDiff = diff.reduce((a, b) => a + b, 0) / diff.length;
    return avgDiff;
  }

  /**
   * Classify pattern complexity based on fractal dimension and Lyapunov exponent
   */
  private classifyPatternComplexity(fractalDim: number, lyapunov: number): 'simple' | 'complex' | 'chaotic' | 'suspicious' {
    // Suspicious patterns: too regular (bot-like) or too chaotic (attack-like)
    if (fractalDim < 1.1 || fractalDim > 1.9) {
      return 'suspicious';
    }
    
    // Chaotic: high Lyapunov exponent
    if (lyapunov > this.threshold && fractalDim > 1.6) {
      return 'chaotic';
    }
    
    // Complex: natural human-like patterns
    if (fractalDim >= 1.4 && fractalDim <= 1.6 && lyapunov <= this.threshold) {
      return 'complex';
    }
    
    // Simple: basic patterns
    return 'simple';
  }

  /**
   * Calculate anomaly score (0-1, where 1 = highly anomalous)
   */
  private calculateAnomalyScore(fractalDim: number, lyapunov: number): number {
    // Expected natural range: fractalDim 1.4-1.6, lyapunov < 0.0065
    const fractalDeviation = Math.abs(fractalDim - 1.5) / 0.5; // Normalize to 0-1+
    const lyapunovScore = Math.min(lyapunov / (this.threshold * 2), 1); // Cap at 1
    
    return Math.min((fractalDeviation + lyapunovScore) / 2, 1);
  }

  /**
   * Calculate predictability score (0-1, where 1 = highly predictable)
   */
  private calculatePredictability(fractalDim: number, lyapunov: number): number {
    // Lower Lyapunov = more predictable, fractal dim around 1.5 = natural predictability
    const lyapunovPredictability = Math.max(0, 1 - (lyapunov / this.threshold));
    const fractalPredictability = 1 - Math.abs(fractalDim - 1.5) / 0.5;
    
    return Math.max(0, Math.min((lyapunovPredictability + fractalPredictability) / 2, 1));
  }

  /**
   * Generate actionable recommendations based on analysis
   */
  private generateRecommendations(complexity: string, anomalyScore: number, fractalDim: number): string[] {
    const recommendations: string[] = [];
    
    if (complexity === 'suspicious') {
      if (fractalDim < 1.1) {
        recommendations.push('Bot-like behavior detected - implement additional CAPTCHA challenges');
        recommendations.push('Consider rate limiting for this user pattern');
      } else {
        recommendations.push('Highly chaotic pattern - potential attack vector detected');
        recommendations.push('Escalate to security team for manual review');
      }
    }
    
    if (anomalyScore > 0.7) {
      recommendations.push('High anomaly score - monitor closely for security threats');
      recommendations.push('Consider additional authentication factors for high-anomaly users');
    }
    
    if (complexity === 'chaotic') {
      recommendations.push('Chaotic usage pattern - optimize ANFIS routing for unpredictable requests');
      recommendations.push('Increase resource buffer for this user segment');
    }
    
    if (complexity === 'complex') {
      recommendations.push('Natural usage pattern detected - ideal for standard service');
      recommendations.push('Consider user for premium feature recommendations');
    }
    
    return recommendations;
  }

  /**
   * Get current fractal dimension
   */
  getFractalDimension(): number | null {
    return this.fractalDimension;
  }

  /**
   * Reset analysis state
   */
  reset(): void {
    this.fractalDimension = null;
    this.requestHistory = [];
  }

  /**
   * Get analysis statistics
   */
  getStatistics(): {
    totalRequests: number;
    analysisWindow: number;
    lastAnalysis: number | null;
  } {
    return {
      totalRequests: this.requestHistory.length,
      analysisWindow: Math.min(this.requestHistory.length, 10000),
      lastAnalysis: this.fractalDimension
    };
  }
}