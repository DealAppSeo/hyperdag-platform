/**
 * System Metrics Collector
 * 
 * Collects system metrics for optimization analysis including CPU, memory,
 * database, API, and storage performance data.
 */

import { SystemMetrics } from './perplexity-optimizer';
import { logger } from '../../utils/logger';
import { db } from '../../db';
import os from 'os';
import { sql } from 'drizzle-orm';

export class MetricsCollector {
  /**
   * Collects current system metrics
   */
  async collectMetrics(): Promise<SystemMetrics> {
    try {
      logger.info('[metrics-collector] Collecting system metrics');
      
      // Collect metrics in parallel for efficiency
      const [
        cpuMetrics,
        memoryMetrics,
        storageMetrics,
        databaseMetrics,
        apiMetrics,
        networkMetrics
      ] = await Promise.all([
        this.collectCpuMetrics(),
        this.collectMemoryMetrics(),
        this.collectStorageMetrics(),
        this.collectDatabaseMetrics(),
        this.collectApiMetrics(),
        this.collectNetworkMetrics()
      ]);
      
      return {
        cpu: cpuMetrics,
        memory: memoryMetrics,
        storage: storageMetrics,
        database: databaseMetrics,
        api: apiMetrics,
        network: networkMetrics
      };
    } catch (error) {
      logger.error('[metrics-collector] Error collecting system metrics:', error);
      // Return partial metrics if available, with defaults for missing ones
      return this.getDefaultMetrics();
    }
  }
  
  /**
   * Collects CPU metrics
   */
  private async collectCpuMetrics(): Promise<SystemMetrics['cpu']> {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    // Calculate CPU usage
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    }
    
    const usage = 1 - (totalIdle / totalTick);
    
    return {
      usage,
      cores: cpus.length,
      loadAverage: loadAvg
    };
  }
  
  /**
   * Collects memory metrics
   */
  private async collectMemoryMetrics(): Promise<SystemMetrics['memory']> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    
    // Get cached memory (estimated)
    // In real implementation, this would be more accurate
    const cachedMemory = Math.floor(totalMemory * 0.1); // Simplified estimation
    
    return {
      total: totalMemory,
      used: totalMemory - freeMemory,
      free: freeMemory,
      cached: cachedMemory
    };
  }
  
  /**
   * Collects network metrics
   */
  private async collectNetworkMetrics(): Promise<SystemMetrics['network']> {
    try {
      // In a real implementation, we would get actual network stats
      // For now, we're using simple estimation
      return {
        rx: 1024 * 1024 * 5, // 5 MB received (example)
        tx: 1024 * 1024 * 3, // 3 MB transmitted (example)
        connections: 25 // Active connections (example)
      };
    } catch (error) {
      logger.warn('[metrics-collector] Error collecting network metrics:', error);
      return {
        rx: 0,
        tx: 0,
        connections: 0
      };
    }
  }
  
  /**
   * Collects storage metrics
   */
  private async collectStorageMetrics(): Promise<SystemMetrics['storage']> {
    try {
      // This is a simplified implementation
      // In a real system, we would use actual disk IO statistics and space utilization
      return {
        total: 1024 * 1024 * 1024 * 20, // 20 GB total storage (example)
        used: 1024 * 1024 * 1024 * 8, // 8 GB used (example)
        free: 1024 * 1024 * 1024 * 12, // 12 GB free (example)
        readOps: 250, // Read operations per minute (example)
        writeOps: 120 // Write operations per minute (example)
      };
    } catch (error) {
      logger.warn('[metrics-collector] Error collecting storage metrics:', error);
      return {
        total: 0,
        used: 0,
        free: 0,
        readOps: 0,
        writeOps: 0
      };
    }
  }
  
  /**
   * Collects database metrics
   */
  private async collectDatabaseMetrics(): Promise<SystemMetrics['database']> {
    try {
      // Query for db stats - this is an example that would need to be adapted
      // to your specific database setup
      const dbStatsQuery = sql`
        SELECT 
          (SELECT count(*) FROM pg_stat_activity) as active_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections
      `;
      
      const results = await db.execute(dbStatsQuery);
      const stats = results[0] as any;
      
      // Sample query to estimate average response time
      const startTime = Date.now();
      await db.execute(sql`SELECT 1`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Get slow query count from logs or performance schema
      // This is an example - real implementation would be more sophisticated
      const slowQueryCount = 5; // Example value
      
      return {
        queries: 1200, // Total queries per minute (example)
        slowQueries: slowQueryCount,
        connectionPool: {
          total: 10, // Example max connections
          active: stats?.active_connections || 3,
          idle: stats?.idle_connections || 2
        },
        avgResponseTime: responseTime // ms
      };
    } catch (error) {
      logger.warn('[metrics-collector] Error collecting database metrics:', error);
      return {
        queries: 0,
        slowQueries: 0,
        connectionPool: {
          total: 10,
          active: 0,
          idle: 0
        },
        avgResponseTime: 0
      };
    }
  }
  
  /**
   * Collects API metrics
   */
  private async collectApiMetrics(): Promise<SystemMetrics['api']> {
    try {
      // In a real implementation, this would use data from API monitoring
      // For now, returning example values
      return {
        requests: 850, // Requests per minute (example)
        latency: {
          avg: 120, // Average latency in ms (example)
          p95: 250, // 95th percentile latency in ms (example)
          p99: 450 // 99th percentile latency in ms (example)
        },
        errorRate: 0.02 // 2% error rate (example)
      };
    } catch (error) {
      logger.warn('[metrics-collector] Error collecting API metrics:', error);
      return {
        requests: 0,
        latency: {
          avg: 0,
          p95: 0,
          p99: 0
        },
        errorRate: 0
      };
    }
  }
  
  /**
   * Returns default metrics when collection fails
   */
  private getDefaultMetrics(): SystemMetrics {
    return {
      cpu: {
        usage: 0,
        cores: 1,
        loadAverage: [0, 0, 0]
      },
      memory: {
        total: 0,
        used: 0,
        free: 0,
        cached: 0
      },
      network: {
        rx: 0,
        tx: 0,
        connections: 0
      },
      storage: {
        total: 0,
        used: 0,
        free: 0,
        readOps: 0,
        writeOps: 0
      },
      database: {
        queries: 0,
        slowQueries: 0,
        connectionPool: {
          total: 0,
          active: 0,
          idle: 0
        },
        avgResponseTime: 0
      },
      api: {
        requests: 0,
        latency: {
          avg: 0,
          p95: 0,
          p99: 0
        },
        errorRate: 0
      }
    };
  }
}

// Export singleton instance
export const metricsCollector = new MetricsCollector();