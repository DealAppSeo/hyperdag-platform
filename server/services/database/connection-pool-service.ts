/**
 * Enhanced Database Connection Pool Service
 * 
 * Implements connection pooling and retry logic for external dependencies
 * to improve stability from connectivity issues to 99% uptime
 */

import { Pool, PoolClient } from 'pg';

export interface ConnectionConfig {
  maxConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  executionTime: number;
  fromCache: boolean;
}

export class ConnectionPoolService {
  private pool: Pool;
  private config: ConnectionConfig;
  private queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>();
  private connectionHealth = new Map<string, { failures: number; lastFailure: number }>();

  constructor(connectionString: string, config?: Partial<ConnectionConfig>) {
    this.config = {
      maxConnections: 20,
      idleTimeout: 30000,
      connectionTimeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    this.pool = new Pool({
      connectionString,
      max: this.config.maxConnections,
      idleTimeoutMillis: this.config.idleTimeout,
      connectionTimeoutMillis: this.config.connectionTimeout,
      allowExitOnIdle: true
    });

    this.initializeHealthMonitoring();
  }

  /**
   * Execute query with retry logic and connection pooling
   */
  async query<T = any>(
    sql: string, 
    params?: any[], 
    options?: { cache?: boolean; cacheTTL?: number }
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const cacheKey = options?.cache ? this.createCacheKey(sql, params) : null;

    // Check cache first
    if (cacheKey && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < cached.ttl) {
        return {
          ...cached.result,
          executionTime: Date.now() - startTime,
          fromCache: true
        };
      } else {
        this.queryCache.delete(cacheKey);
      }
    }

    // Execute with retry logic
    const result = await this.executeWithRetry(sql, params);
    const executionTime = Date.now() - startTime;

    const queryResult: QueryResult<T> = {
      rows: result.rows,
      rowCount: result.rowCount || 0,
      executionTime,
      fromCache: false
    };

    // Cache result if requested
    if (cacheKey && options?.cache) {
      this.queryCache.set(cacheKey, {
        result: queryResult,
        timestamp: Date.now(),
        ttl: options.cacheTTL || 300000 // 5 minute default
      });
    }

    return queryResult;
  }

  /**
   * Execute query with exponential backoff retry logic
   */
  private async executeWithRetry(sql: string, params?: any[]): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      let client: PoolClient | null = null;

      try {
        client = await this.pool.connect();
        const result = await client.query(sql, params);
        
        // Update health on success
        this.updateConnectionHealth(true);
        
        return result;

      } catch (error) {
        lastError = error as Error;
        this.updateConnectionHealth(false, error as Error);
        
        console.warn(`[Connection Pool] Query attempt ${attempt} failed:`, error.message);

        if (attempt === this.config.retryAttempts) {
          break; // Don't wait after last attempt
        }

        // Exponential backoff with jitter
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.1 * delay;
        await new Promise(resolve => setTimeout(resolve, delay + jitter));

      } finally {
        if (client) {
          client.release();
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Execute transaction with retry logic
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    options?: { retryAttempts?: number }
  ): Promise<T> {
    const attempts = options?.retryAttempts || this.config.retryAttempts;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        
        this.updateConnectionHealth(true);
        return result;

      } catch (error) {
        await client.query('ROLLBACK');
        lastError = error as Error;
        this.updateConnectionHealth(false, error as Error);
        
        console.warn(`[Connection Pool] Transaction attempt ${attempt} failed:`, error.message);

        if (attempt < attempts) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } finally {
        client.release();
      }
    }

    throw lastError || new Error('Transaction failed after all retries');
  }

  /**
   * Create materialized view for task caching (as suggested)
   */
  async createTaskCacheView(): Promise<void> {
    const createViewSQL = `
      CREATE MATERIALIZED VIEW IF NOT EXISTS task_cache AS
      SELECT id, status, cost, provider, created_at
      FROM tasks
      WHERE status = 'completed' AND cost < 0.02
      ORDER BY created_at DESC
      LIMIT 1000;
    `;

    const refreshViewSQL = `REFRESH MATERIALIZED VIEW task_cache;`;

    try {
      await this.query(createViewSQL);
      await this.query(refreshViewSQL);
      console.log('[Connection Pool] Task cache view created and refreshed');
    } catch (error) {
      console.error('[Connection Pool] Failed to create task cache view:', error.message);
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats(): {
    totalConnections: number;
    idleConnections: number;
    waitingClients: number;
    health: Record<string, any>;
  } {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
      health: Object.fromEntries(this.connectionHealth)
    };
  }

  /**
   * Create cache key from SQL and parameters
   */
  private createCacheKey(sql: string, params?: any[]): string {
    const key = sql + (params ? JSON.stringify(params) : '');
    return Buffer.from(key).toString('base64').substring(0, 32);
  }

  /**
   * Update connection health tracking
   */
  private updateConnectionHealth(success: boolean, error?: Error): void {
    const timestamp = Date.now();
    const key = 'main_connection';
    
    if (!this.connectionHealth.has(key)) {
      this.connectionHealth.set(key, { failures: 0, lastFailure: 0 });
    }

    const health = this.connectionHealth.get(key)!;

    if (success) {
      // Reduce failure count on success
      health.failures = Math.max(0, health.failures - 1);
    } else {
      health.failures++;
      health.lastFailure = timestamp;
      
      if (error) {
        console.error(`[Connection Pool] Health degraded - ${health.failures} failures`, error.message);
      }
    }
  }

  /**
   * Initialize health monitoring
   */
  private initializeHealthMonitoring(): void {
    // Monitor pool events
    this.pool.on('connect', () => {
      console.log('[Connection Pool] New client connected');
    });

    this.pool.on('error', (err) => {
      console.error('[Connection Pool] Pool error:', err.message);
      this.updateConnectionHealth(false, err);
    });

    this.pool.on('remove', () => {
      console.log('[Connection Pool] Client removed');
    });

    // Periodic health check
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  /**
   * Perform periodic health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      await this.query('SELECT 1 as health_check', [], { cache: false });
      console.log('[Connection Pool] Health check passed');
    } catch (error) {
      console.error('[Connection Pool] Health check failed:', error.message);
    }
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    await this.pool.end();
    this.queryCache.clear();
    this.connectionHealth.clear();
  }
}

// Create default instance
export const connectionPool = new ConnectionPoolService(
  process.env.DATABASE_URL || 'postgresql://localhost:5432/hyperdag',
  {
    maxConnections: 20,
    idleTimeout: 30000,
    connectionTimeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000
  }
);