/**
 * Real Metrics Collector for Autonomous System
 * Collects actual system metrics instead of simulations
 */

import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { EventEmitter } from 'events';

export interface SystemMetrics {
  timestamp: Date;
  
  // Performance Metrics
  performance: {
    avgApiLatency: number;
    p95ApiLatency: number;
    databaseQueryTime: number;
    cacheHitRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  
  // Error Metrics
  errors: {
    totalErrors: number;
    errorRate: number;
    errorsByType: Record<string, number>;
    criticalErrors: number;
  };
  
  // Resource Metrics
  resources: {
    activeConnections: number;
    queueDepth: number;
    storageUsed: number;
    bandwidthUsed: number;
  };
  
  // AI Provider Metrics
  aiProviders: {
    totalRequests: number;
    successRate: number;
    avgResponseTime: number;
    freeTierUtilization: number;
    failuresByProvider: Record<string, number>;
  };
  
  // Business Metrics
  business: {
    activeUsers: number;
    requestsPerMinute: number;
    apiCallsToday: number;
    costSavings: number;
  };
}

export class RealMetricsCollector extends EventEmitter {
  private metrics: SystemMetrics | null = null;
  private collectionInterval: NodeJS.Timeout | null = null;
  private baselineMetrics: Partial<SystemMetrics> | null = null;
  
  // Performance tracking
  private apiLatencies: number[] = [];
  private errorCounts: Map<string, number> = new Map();
  private startTime: Date = new Date();
  
  constructor() {
    super();
  }
  
  /**
   * Start collecting metrics at regular intervals
   */
  start(intervalMs: number = 60000): void {
    console.log('[Real Metrics] Starting metric collection...');
    
    // Initial baseline collection
    this.collectMetrics().then(metrics => {
      this.baselineMetrics = metrics;
      console.log('[Real Metrics] Baseline established');
    });
    
    // Regular collection
    this.collectionInterval = setInterval(() => {
      this.collectMetrics().catch(error => {
        console.error('[Real Metrics] Collection error:', error);
      });
    }, intervalMs);
  }
  
  /**
   * Stop collecting metrics
   */
  stop(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }
  
  /**
   * Record API latency for tracking
   */
  recordApiLatency(latencyMs: number): void {
    this.apiLatencies.push(latencyMs);
    
    // Keep only last 1000 samples
    if (this.apiLatencies.length > 1000) {
      this.apiLatencies.shift();
    }
  }
  
  /**
   * Record an error occurrence
   */
  recordError(errorType: string): void {
    const count = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, count + 1);
  }
  
  /**
   * Collect current system metrics
   */
  async collectMetrics(): Promise<SystemMetrics> {
    try {
      const now = new Date();
      
      // Collect database metrics
      const dbMetrics = await this.collectDatabaseMetrics();
      
      // Collect performance metrics
      const performanceMetrics = this.collectPerformanceMetrics();
      
      // Collect error metrics
      const errorMetrics = this.collectErrorMetrics();
      
      // Collect resource metrics
      const resourceMetrics = this.collectResourceMetrics();
      
      // Collect AI provider metrics
      const aiProviderMetrics = await this.collectAIProviderMetrics();
      
      // Collect business metrics
      const businessMetrics = await this.collectBusinessMetrics();
      
      const metrics: SystemMetrics = {
        timestamp: now,
        performance: {
          ...performanceMetrics,
          databaseQueryTime: dbMetrics.avgQueryTime,
        },
        errors: errorMetrics,
        resources: resourceMetrics,
        aiProviders: aiProviderMetrics,
        business: businessMetrics,
      };
      
      this.metrics = metrics;
      this.emit('metrics', metrics);
      
      return metrics;
      
    } catch (error: any) {
      console.error('[Real Metrics] Error collecting metrics:', error);
      throw error;
    }
  }
  
  /**
   * Collect database performance metrics
   */
  private async collectDatabaseMetrics(): Promise<{ avgQueryTime: number }> {
    try {
      const start = Date.now();
      
      // Simple query to measure database performance
      await db.execute(sql`SELECT 1`);
      
      const queryTime = Date.now() - start;
      
      return {
        avgQueryTime: queryTime,
      };
    } catch (error) {
      console.error('[Real Metrics] Database metrics error:', error);
      return { avgQueryTime: 0 };
    }
  }
  
  /**
   * Collect performance metrics
   */
  private collectPerformanceMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Calculate API latency percentiles
    const sortedLatencies = [...this.apiLatencies].sort((a, b) => a - b);
    const avgLatency = sortedLatencies.length > 0
      ? sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length
      : 0;
    const p95Index = Math.floor(sortedLatencies.length * 0.95);
    const p95Latency = sortedLatencies[p95Index] || 0;
    
    // Memory usage in MB
    const memoryUsage = memUsage.heapUsed / 1024 / 1024;
    
    // CPU usage as percentage (rough estimate)
    const totalCpuUsage = cpuUsage.user + cpuUsage.system;
    const cpuPercent = totalCpuUsage / 1000000 / 60; // Convert to seconds, estimate over 1 minute
    
    return {
      avgApiLatency: Math.round(avgLatency),
      p95ApiLatency: Math.round(p95Latency),
      cacheHitRate: 0, // Will integrate with Trinity DragonflyDB cache metrics when available
      memoryUsage: Math.round(memoryUsage),
      cpuUsage: Math.min(100, Math.round(cpuPercent)),
    };
  }
  
  /**
   * Collect error metrics
   */
  private collectErrorMetrics() {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0);
    const errorsByType: Record<string, number> = {};
    
    this.errorCounts.forEach((count, type) => {
      errorsByType[type] = count;
    });
    
    // Calculate error rate (errors per minute)
    const runtimeMinutes = (Date.now() - this.startTime.getTime()) / 60000;
    const errorRate = runtimeMinutes > 0 ? totalErrors / runtimeMinutes : 0;
    
    // Count critical errors
    const criticalErrors = errorsByType['database'] || 0 + errorsByType['auth'] || 0;
    
    return {
      totalErrors,
      errorRate: Math.round(errorRate * 100) / 100,
      errorsByType,
      criticalErrors,
    };
  }
  
  /**
   * Collect resource metrics
   */
  private collectResourceMetrics() {
    const memUsage = process.memoryUsage();
    
    return {
      activeConnections: 0, // Will track when connection pool monitoring is added
      queueDepth: 0, // Will track when task queue is implemented
      storageUsed: Math.round(memUsage.external / 1024 / 1024), // MB
      bandwidthUsed: 0, // Will track when bandwidth monitoring is added
    };
  }
  
  /**
   * Collect AI provider metrics
   */
  private async collectAIProviderMetrics() {
    // Will integrate with ANFIS router metrics when available
    return {
      totalRequests: 0,
      successRate: 0,
      avgResponseTime: 0,
      freeTierUtilization: 0,
      failuresByProvider: {},
    };
  }
  
  /**
   * Collect business metrics
   */
  private async collectBusinessMetrics() {
    try {
      // Will integrate with database analytics when user tracking is implemented
      return {
        activeUsers: 0,
        requestsPerMinute: 0,
        apiCallsToday: 0,
        costSavings: 0,
      };
    } catch (error) {
      console.error('[Real Metrics] Business metrics error:', error);
      return {
        activeUsers: 0,
        requestsPerMinute: 0,
        apiCallsToday: 0,
        costSavings: 0,
      };
    }
  }
  
  /**
   * Get current metrics
   */
  getCurrentMetrics(): SystemMetrics | null {
    return this.metrics;
  }
  
  /**
   * Get baseline metrics for comparison
   */
  getBaselineMetrics(): Partial<SystemMetrics> | null {
    return this.baselineMetrics;
  }
  
  /**
   * Compare current metrics to baseline and detect degradation
   */
  detectDegradation(): Array<{
    metric: string;
    baseline: number;
    current: number;
    degradationPercent: number;
  }> {
    if (!this.metrics || !this.baselineMetrics) {
      return [];
    }
    
    const degradations: Array<{
      metric: string;
      baseline: number;
      current: number;
      degradationPercent: number;
    }> = [];
    
    // Check database query time
    if (this.baselineMetrics.performance?.databaseQueryTime &&
        this.metrics.performance.databaseQueryTime) {
      const baseline = this.baselineMetrics.performance.databaseQueryTime;
      const current = this.metrics.performance.databaseQueryTime;
      const degradation = ((current - baseline) / baseline) * 100;
      
      if (degradation > 20) { // More than 20% slower
        degradations.push({
          metric: 'Database Query Time',
          baseline,
          current,
          degradationPercent: degradation,
        });
      }
    }
    
    // Check API latency
    if (this.baselineMetrics.performance?.avgApiLatency &&
        this.metrics.performance.avgApiLatency) {
      const baseline = this.baselineMetrics.performance.avgApiLatency;
      const current = this.metrics.performance.avgApiLatency;
      const degradation = ((current - baseline) / baseline) * 100;
      
      if (degradation > 25) { // More than 25% slower
        degradations.push({
          metric: 'API Latency',
          baseline,
          current,
          degradationPercent: degradation,
        });
      }
    }
    
    // Check error rate
    if (this.metrics.errors.errorRate > 1) { // More than 1 error per minute
      degradations.push({
        metric: 'Error Rate',
        baseline: 0,
        current: this.metrics.errors.errorRate,
        degradationPercent: 100,
      });
    }
    
    return degradations;
  }
}

// Global singleton instance
export const realMetricsCollector = new RealMetricsCollector();
