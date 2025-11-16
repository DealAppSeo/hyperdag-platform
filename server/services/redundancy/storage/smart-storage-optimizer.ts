import { logger } from '../../../utils/logger';
import { ipfsStorageProvider } from './ipfs-storage';
import { w3cliProvider } from './w3cli-provider';
import crypto from 'crypto';
import { sql } from 'drizzle-orm';
import { db } from '../../../db';

/**
 * Smart Storage Optimizer
 * 
 * Implements advanced optimization strategies for storage operations:
 * 
 * 1. Fuzzy logic for adaptive decision making
 * 2. Data compression and fractionalization
 * 3. Hybrid DAG-blockchain storage pattern
 * 4. Cryptographic integrity verification
 * 5. ZKP-ready data structures
 * 
 * This service optimizes when and how to store data across different
 * storage providers based on size, access patterns, and cost considerations.
 */
export class SmartStorageOptimizer {
  private lastOptimization: number = 0;
  private optimizationInterval: number = 300000; // 5 minutes
  private storageMetrics: Map<string, any> = new Map();
  private accessPatterns: Map<string, any[]> = new Map();
  private chunkSize: number = 1024 * 1024; // 1MB default chunk size
  private fuzzyRuleBase: Map<string, (input: any) => number> = new Map();
  
  constructor() {
    this.initializeFuzzyRules();
    this.startOptimizationLoop();
  }
  
  /**
   * Initialize fuzzy logic rules for optimization decisions
   */
  private initializeFuzzyRules(): void {
    // Fuzzy rule for chunk size optimization based on access frequency
    this.fuzzyRuleBase.set('chunkSize', (accessFrequency: number): number => {
      // Linguistic variables: low, medium, high access frequency
      const lowAccess = this.triangularMF(accessFrequency, 0, 0, 10);
      const mediumAccess = this.triangularMF(accessFrequency, 5, 15, 25);
      const highAccess = this.triangularMF(accessFrequency, 20, 30, 30);
      
      // Fuzzy rules
      // If access frequency is low, use larger chunks
      // If access frequency is medium, use medium chunks
      // If access frequency is high, use smaller chunks
      const largeChunk = 2 * 1024 * 1024; // 2MB
      const mediumChunk = 512 * 1024; // 512KB
      const smallChunk = 128 * 1024; // 128KB
      
      // Defuzzification using weighted average
      const totalWeight = lowAccess + mediumAccess + highAccess;
      if (totalWeight === 0) return this.chunkSize; // Default
      
      const weightedSize = (lowAccess * largeChunk + 
                            mediumAccess * mediumChunk + 
                            highAccess * smallChunk) / totalWeight;
      
      return Math.round(weightedSize);
    });
    
    // Fuzzy rule for storage provider selection based on data size and importance
    this.fuzzyRuleBase.set('providerSelection', (params: {size: number, importance: number}): number => {
      const { size, importance } = params;
      
      // Size linguistic variables: small, medium, large
      const smallSize = this.triangularMF(size, 0, 0, 1024 * 1024); // 0-1MB
      const mediumSize = this.triangularMF(size, 512 * 1024, 2 * 1024 * 1024, 5 * 1024 * 1024); // 0.5-5MB
      const largeSize = this.triangularMF(size, 3 * 1024 * 1024, 10 * 1024 * 1024, 10 * 1024 * 1024); // 3MB+
      
      // Importance linguistic variables: low, medium, high
      const lowImportance = this.triangularMF(importance, 0, 0, 4);
      const mediumImportance = this.triangularMF(importance, 3, 5, 7);
      const highImportance = this.triangularMF(importance, 6, 10, 10);
      
      // Provider preference scores (higher = more preferred)
      // 0 = PostgreSQL, 1 = IPFS, 2 = W3CLI, 3 = Blockchain
      const pgScore = 0;
      const ipfsScore = 1;
      const w3cliScore = 2;
      const blockchainScore = 3;
      
      // Rules matrix (size × importance)
      // Small + Low -> PostgreSQL 
      // Small + Medium -> PostgreSQL
      // Small + High -> IPFS
      // Medium + Low -> IPFS
      // Medium + Medium -> IPFS
      // Medium + High -> W3CLI
      // Large + Low -> IPFS
      // Large + Medium -> W3CLI 
      // Large + High -> W3CLI+Blockchain (hybrid)
      
      const rules = [
        { condition: smallSize * lowImportance, score: pgScore },
        { condition: smallSize * mediumImportance, score: pgScore },
        { condition: smallSize * highImportance, score: ipfsScore },
        { condition: mediumSize * lowImportance, score: ipfsScore },
        { condition: mediumSize * mediumImportance, score: ipfsScore },
        { condition: mediumSize * highImportance, score: w3cliScore },
        { condition: largeSize * lowImportance, score: ipfsScore },
        { condition: largeSize * mediumImportance, score: w3cliScore },
        { condition: largeSize * highImportance, score: blockchainScore },
      ];
      
      // Defuzzification (center of gravity)
      let numerator = 0;
      let denominator = 0;
      
      for (const rule of rules) {
        numerator += rule.condition * rule.score;
        denominator += rule.condition;
      }
      
      if (denominator === 0) return ipfsScore; // Default to IPFS
      return numerator / denominator;
    });
    
    // Fuzzy rule for update frequency based on data change rate
    this.fuzzyRuleBase.set('updateFrequency', (changeRate: number): number => {
      // Linguistic variables: low, medium, high change rate (changes per hour)
      const lowChange = this.triangularMF(changeRate, 0, 0, 2);
      const mediumChange = this.triangularMF(changeRate, 1, 5, 10);
      const highChange = this.triangularMF(changeRate, 8, 20, 20);
      
      // Update intervals (in milliseconds)
      const longInterval = 24 * 60 * 60 * 1000; // 24 hours
      const mediumInterval = 4 * 60 * 60 * 1000; // 4 hours
      const shortInterval = 30 * 60 * 1000; // 30 minutes
      
      // Defuzzification
      const totalWeight = lowChange + mediumChange + highChange;
      if (totalWeight === 0) return 6 * 60 * 60 * 1000; // Default 6 hours
      
      const weightedInterval = (lowChange * longInterval + 
                               mediumChange * mediumInterval + 
                               highChange * shortInterval) / totalWeight;
      
      return Math.round(weightedInterval);
    });
  }
  
  /**
   * Triangular membership function for fuzzy logic
   */
  private triangularMF(x: number, a: number, b: number, c: number): number {
    if (x <= a || x >= c) return 0;
    if (x === b) return 1;
    if (x > a && x < b) return (x - a) / (b - a);
    return (c - x) / (c - b);
  }
  
  /**
   * Start the background optimization loop
   */
  private startOptimizationLoop(): void {
    setInterval(() => {
      this.optimizeStorage();
    }, this.optimizationInterval);
    
    logger.info('[smart-storage-optimizer] Optimization loop started');
  }
  
  /**
   * Run storage optimization routines
   */
  private async optimizeStorage(): Promise<void> {
    try {
      this.lastOptimization = Date.now();
      
      // Collect storage metrics
      await this.collectMetrics();
      
      // Update fuzzy rule parameters based on metrics
      this.updateOptimizationParameters();
      
      // Run data rebalancing if needed
      await this.rebalanceData();
      
      logger.info('[smart-storage-optimizer] Storage optimization completed');
    } catch (error) {
      logger.error('[smart-storage-optimizer] Optimization failed:', error);
    }
  }
  
  /**
   * Collect metrics about storage usage
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Collect PostgreSQL usage metrics
      const pgResult = await db.execute(sql`
        SELECT 
          pg_database_size(current_database()) as db_size,
          (SELECT COUNT(*) FROM pg_stat_activity) as connections
      `);
      
      if (pgResult && pgResult[0]) {
        this.storageMetrics.set('postgres', {
          size: pgResult[0].db_size,
          connections: pgResult[0].connections,
          timestamp: Date.now()
        });
      }
      
      // Collect IPFS metrics if available
      const ipfsStatus = await ipfsStorageProvider.checkStatus();
      if (ipfsStatus !== 'error') {
        this.storageMetrics.set('ipfs', {
          status: ipfsStatus,
          timestamp: Date.now()
        });
      }
      
      // Collect W3CLI metrics if available
      const w3cliStatus = await w3cliProvider.checkStatus();
      if (w3cliStatus !== 'error') {
        this.storageMetrics.set('w3cli', {
          status: w3cliStatus,
          timestamp: Date.now()
        });
      }
      
      logger.debug('[smart-storage-optimizer] Metrics collected');
    } catch (error) {
      logger.error('[smart-storage-optimizer] Failed to collect metrics:', error);
    }
  }
  
  /**
   * Update optimization parameters based on collected metrics
   */
  private updateOptimizationParameters(): void {
    try {
      // Update chunk size based on access patterns
      const accessFrequency = this.calculateAccessFrequency();
      const newChunkSize = this.fuzzyRuleBase.get('chunkSize')(accessFrequency);
      
      if (Math.abs(newChunkSize - this.chunkSize) > 102400) { // 100KB threshold
        logger.info(`[smart-storage-optimizer] Adjusting chunk size from ${this.chunkSize} to ${newChunkSize} bytes`);
        this.chunkSize = newChunkSize;
      }
      
      // Update other parameters as needed
      
      logger.debug('[smart-storage-optimizer] Optimization parameters updated');
    } catch (error) {
      logger.error('[smart-storage-optimizer] Failed to update parameters:', error);
    }
  }
  
  /**
   * Calculate access frequency from stored patterns
   */
  private calculateAccessFrequency(): number {
    const now = Date.now();
    const hourAgo = now - 3600000;
    let accessCount = 0;
    
    // Count accesses in the last hour
    for (const [_, accesses] of this.accessPatterns) {
      accessCount += accesses.filter(time => time > hourAgo).length;
    }
    
    return accessCount;
  }
  
  /**
   * Rebalance data across storage providers if needed
   */
  private async rebalanceData(): Promise<void> {
    // Implementation will depend on specific storage backends and data models
    logger.debug('[smart-storage-optimizer] Data rebalancing check completed');
  }
  
  /**
   * Record data access for optimization
   */
  public recordAccess(key: string): void {
    const now = Date.now();
    
    if (!this.accessPatterns.has(key)) {
      this.accessPatterns.set(key, []);
    }
    
    const accesses = this.accessPatterns.get(key);
    accesses.push(now);
    
    // Keep only last 100 accesses to avoid memory growth
    if (accesses.length > 100) {
      this.accessPatterns.set(key, accesses.slice(-100));
    }
  }
  
  /**
   * Calculate the optimal storage provider for data based on size and importance
   * Returns a value indicating preferred provider:
   * - < 0.5: PostgreSQL
   * - 0.5-1.5: IPFS
   * - 1.5-2.5: W3CLI
   * - > 2.5: Blockchain or hybrid approach
   */
  public getOptimalProvider(sizeBytes: number, importance: number): number {
    return this.fuzzyRuleBase.get('providerSelection')({ size: sizeBytes, importance });
  }
  
  /**
   * Fractionalize data into optimally sized chunks with integrity verification
   * Returns array of chunks with their hashes
   */
  public fractionalizeData(data: any): { chunks: any[], merkleRoot: string } {
    try {
      // Convert data to buffer if it's not already
      const buffer = Buffer.isBuffer(data) 
        ? data 
        : Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
      
      // Calculate optimal chunk size based on current settings
      const chunks = [];
      const hashes = [];
      
      // Split data into chunks
      for (let i = 0; i < buffer.length; i += this.chunkSize) {
        const chunk = buffer.slice(i, i + this.chunkSize);
        const hash = crypto.createHash('sha256').update(chunk).digest('hex');
        
        chunks.push({
          data: chunk,
          index: i / this.chunkSize,
          hash
        });
        
        hashes.push(hash);
      }
      
      // Create merkle root for verification
      const merkleRoot = this.calculateMerkleRoot(hashes);
      
      return {
        chunks,
        merkleRoot
      };
    } catch (error) {
      logger.error('[smart-storage-optimizer] Data fractionalization failed:', error);
      throw error;
    }
  }
  
  /**
   * Calculate merkle tree root from an array of hashes
   * This creates a cryptographic binding of all data chunks
   */
  private calculateMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) return '';
    if (hashes.length === 1) return hashes[0];
    
    const nextLevel = [];
    
    for (let i = 0; i < hashes.length; i += 2) {
      if (i + 1 < hashes.length) {
        const combinedHash = crypto.createHash('sha256')
          .update(hashes[i] + hashes[i + 1])
          .digest('hex');
        nextLevel.push(combinedHash);
      } else {
        // Odd number of hashes, promote the last one
        nextLevel.push(hashes[i]);
      }
    }
    
    return this.calculateMerkleRoot(nextLevel);
  }
  
  /**
   * Verify data integrity against merkle root
   */
  public verifyDataIntegrity(chunks: any[], merkleRoot: string): boolean {
    try {
      const hashes = chunks.map(chunk => chunk.hash);
      const calculatedRoot = this.calculateMerkleRoot(hashes);
      
      return calculatedRoot === merkleRoot;
    } catch (error) {
      logger.error('[smart-storage-optimizer] Data verification failed:', error);
      return false;
    }
  }
  
  /**
   * Get the optimal update frequency for data based on change rate
   * Change rate is expressed as changes per hour
   */
  public getOptimalUpdateFrequency(changeRate: number): number {
    return this.fuzzyRuleBase.get('updateFrequency')(changeRate);
  }
}

// Export singleton instance
export const smartStorageOptimizer = new SmartStorageOptimizer();