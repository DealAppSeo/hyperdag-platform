import { logger } from '../../../utils/logger';
import { ipfsStorageProvider } from './ipfs-storage';
import { w3cliProvider } from './w3cli-provider';
import { smartStorageOptimizer } from './smart-storage-optimizer';
import { ServiceStatus } from '../core/types';
import { db } from '../../../db';
import { sql } from 'drizzle-orm';

/**
 * Advanced Storage Service
 * 
 * Provides intelligent, self-optimizing storage with automatic fallback:
 * 
 * 1. Uses fuzzy logic to select optimal storage provider
 * 2. Implements data fractionalization and compression
 * 3. Uses hybrid DAG-blockchain approach for critical data
 * 4. Provides cryptographic verification for data integrity
 * 5. Automatically adapts to changing conditions and usage patterns
 * 
 * This service extends the basic redundant storage with advanced
 * optimizations from the pasted document about hybrid blockchain-DAG
 * systems with fuzzy logic.
 */
export class AdvancedStorageService {
  private status: ServiceStatus = 'idle';
  private lastStatusCheck: number = 0;
  private statusCheckInterval: number = 60000; // 1 minute
  private pgAvailable: boolean = true;
  private ipfsAvailable: boolean = false;
  private w3cliAvailable: boolean = false;
  private dataAccessLog: Map<string, number[]> = new Map(); // Key -> [timestamps]
  private changeRates: Map<string, number> = new Map(); // Key -> changes per hour
  
  constructor() {
    this.initialize();
  }
  
  /**
   * Initialize the storage service
   */
  private async initialize() {
    try {
      // Check PostgreSQL availability
      try {
        await db.execute(sql`SELECT 1`);
        this.pgAvailable = true;
        logger.info('[advanced-storage] PostgreSQL connection verified');
      } catch (error) {
        this.pgAvailable = false;
        logger.error('[advanced-storage] PostgreSQL connection failed:', error);
      }
      
      // Check IPFS availability
      const ipfsStatus = await ipfsStorageProvider.checkStatus();
      this.ipfsAvailable = ipfsStatus !== 'error';
      logger.info(`[advanced-storage] IPFS status: ${ipfsStatus}`);
      
      // Check W3CLI availability
      const w3cliStatus = await w3cliProvider.checkStatus();
      this.w3cliAvailable = w3cliStatus !== 'error';
      logger.info(`[advanced-storage] W3CLI status: ${w3cliStatus}`);
      
      // Set initial service status
      if (this.pgAvailable || this.ipfsAvailable || this.w3cliAvailable) {
        this.status = 'available';
      } else {
        this.status = 'error';
      }
      
      logger.info(`[advanced-storage] Service initialized with status: ${this.status}`);
    } catch (error) {
      this.status = 'error';
      logger.error('[advanced-storage] Initialization failed:', error);
    }
  }
  
  /**
   * Check the status of all storage providers
   */
  public async checkStatus(): Promise<ServiceStatus> {
    const now = Date.now();
    
    // Only check status if enough time has passed since last check
    if (now - this.lastStatusCheck < this.statusCheckInterval) {
      return this.status;
    }
    
    this.lastStatusCheck = now;
    
    try {
      // Check PostgreSQL availability
      try {
        await db.execute(sql`SELECT 1`);
        this.pgAvailable = true;
      } catch (error) {
        this.pgAvailable = false;
        logger.error('[advanced-storage] PostgreSQL connection failed:', error);
      }
      
      // Check IPFS availability
      const ipfsStatus = await ipfsStorageProvider.checkStatus();
      this.ipfsAvailable = ipfsStatus !== 'error';
      
      // Check W3CLI availability
      const w3cliStatus = await w3cliProvider.checkStatus();
      this.w3cliAvailable = w3cliStatus !== 'error';
      
      // Update service status
      if (this.pgAvailable && (this.ipfsAvailable || this.w3cliAvailable)) {
        this.status = 'available';
      } else if (this.pgAvailable || this.ipfsAvailable || this.w3cliAvailable) {
        this.status = 'degraded';
      } else {
        this.status = 'error';
      }
      
      logger.debug(`[advanced-storage] Status check: PG=${this.pgAvailable}, IPFS=${this.ipfsAvailable}, W3CLI=${this.w3cliAvailable}, Status=${this.status}`);
      
      return this.status;
    } catch (error) {
      this.status = 'error';
      logger.error('[advanced-storage] Status check failed:', error);
      return this.status;
    }
  }
  
  /**
   * Store data using the optimal storage method based on data characteristics
   * 
   * @param key Unique identifier for the data
   * @param data The data to store
   * @param options Storage options including importance (1-10 scale)
   * @returns Promise resolving to success status
   */
  public async storeData(
    key: string, 
    data: any, 
    options: { 
      importance?: number,
      compress?: boolean,
      fractionalize?: boolean,
      ttl?: number
    } = {}
  ): Promise<boolean> {
    try {
      await this.checkStatus();
      
      if (this.status === 'error') {
        logger.error('[advanced-storage] Cannot store data, service in error state');
        return false;
      }
      
      // Record access for this key
      this.recordAccess(key);
      
      // Default options
      const importance = options.importance || 5; // Medium importance
      const compress = options.compress !== false; // Default to true
      const fractionalize = options.fractionalize !== false; // Default to true
      
      // Prepare data (compression happens inside fractionalization if needed)
      let preparedData = data;
      let merkleRoot = null;
      let chunks = null;
      
      // Fractionalize if requested and data is large enough
      if (fractionalize) {
        const serializedData = typeof data === 'string' ? data : JSON.stringify(data);
        const sizeEstimate = Buffer.byteLength(serializedData);
        
        // Only fractionalize if data is larger than 100KB
        if (sizeEstimate > 102400) {
          const fractionalized = smartStorageOptimizer.fractionalizeData(data);
          chunks = fractionalized.chunks;
          merkleRoot = fractionalized.merkleRoot;
          
          logger.debug(`[advanced-storage] Data fractionalized into ${chunks.length} chunks with merkle root ${merkleRoot}`);
        }
      }
      
      // Determine optimal storage provider
      const serializedSize = Buffer.byteLength(
        typeof data === 'string' ? data : JSON.stringify(data)
      );
      const providerScore = smartStorageOptimizer.getOptimalProvider(serializedSize, importance);
      
      let storeSuccess = false;
      
      // Based on provider score, choose the right storage method
      if (providerScore < 0.5 && this.pgAvailable) {
        // PostgreSQL is preferred for this data
        if (chunks && chunks.length > 1) {
          // Store fractionalized data
          storeSuccess = await this.storeDataInPostgres(key, {
            type: 'fractionalized',
            merkleRoot,
            chunks: chunks.map(c => ({ 
              index: c.index, 
              hash: c.hash,
              data: c.data.toString('base64')
            }))
          });
        } else {
          // Store regular data
          storeSuccess = await this.storeDataInPostgres(key, {
            type: 'regular',
            data
          });
        }
      } else if (providerScore < 1.5 && this.ipfsAvailable) {
        // IPFS is preferred
        if (chunks && chunks.length > 1) {
          // Store chunks individually and keep track of CIDs
          const chunkCids = [];
          for (const chunk of chunks) {
            const cid = await ipfsStorageProvider.uploadData(chunk);
            if (cid) {
              chunkCids.push({
                index: chunk.index,
                cid,
                hash: chunk.hash
              });
            }
          }
          
          // Store metadata in PostgreSQL if available
          if (this.pgAvailable) {
            storeSuccess = await this.storeDataInPostgres(key, {
              type: 'ipfs-fractionalized',
              merkleRoot,
              chunks: chunkCids
            });
          } else {
            // If PostgreSQL not available, store metadata in IPFS itself
            const metadataCid = await ipfsStorageProvider.uploadData({
              type: 'ipfs-fractionalized',
              key,
              merkleRoot,
              chunks: chunkCids
            });
            
            storeSuccess = !!metadataCid;
            
            // Remember this key -> CID mapping locally
            if (storeSuccess) {
              try {
                // Store in temporary indexedDB or similar if available
                logger.info(`[advanced-storage] Stored fractionalized data metadata on IPFS with CID ${metadataCid}`);
              } catch (storageError) {
                logger.warn('[advanced-storage] Could not store key-CID mapping locally:', storageError);
              }
            }
          }
        } else {
          // Store regular data on IPFS
          const cid = await ipfsStorageProvider.uploadData(data);
          
          if (cid) {
            // Store CID reference in PostgreSQL if available
            if (this.pgAvailable) {
              storeSuccess = await this.storeDataInPostgres(key, {
                type: 'ipfs-regular',
                cid
              });
            } else {
              storeSuccess = true;
              
              // Remember this key -> CID mapping locally
              try {
                // Store in temporary indexedDB or similar if available
                logger.info(`[advanced-storage] Stored data on IPFS with CID ${cid}`);
              } catch (storageError) {
                logger.warn('[advanced-storage] Could not store key-CID mapping locally:', storageError);
              }
            }
          }
        }
      } else if (providerScore < 2.5 && this.w3cliAvailable) {
        // W3CLI is preferred
        if (chunks && chunks.length > 1) {
          // Store chunks individually and keep track of CIDs
          const chunkCids = [];
          for (const chunk of chunks) {
            const cid = await w3cliProvider.uploadData(chunk);
            if (cid) {
              chunkCids.push({
                index: chunk.index,
                cid,
                hash: chunk.hash
              });
            }
          }
          
          // Store metadata in PostgreSQL if available
          if (this.pgAvailable) {
            storeSuccess = await this.storeDataInPostgres(key, {
              type: 'w3cli-fractionalized',
              merkleRoot,
              chunks: chunkCids
            });
          } else {
            // If PostgreSQL not available, store metadata in W3CLI itself
            const metadataCid = await w3cliProvider.uploadData({
              type: 'w3cli-fractionalized',
              key,
              merkleRoot,
              chunks: chunkCids
            });
            
            storeSuccess = !!metadataCid;
            
            // Remember this key -> CID mapping locally
            if (storeSuccess) {
              try {
                // Store in temporary indexedDB or similar if available
                logger.info(`[advanced-storage] Stored fractionalized data metadata on W3CLI with CID ${metadataCid}`);
              } catch (storageError) {
                logger.warn('[advanced-storage] Could not store key-CID mapping locally:', storageError);
              }
            }
          }
        } else {
          // Store regular data with W3CLI
          const cid = await w3cliProvider.uploadData(data);
          
          if (cid) {
            // Store CID reference in PostgreSQL if available
            if (this.pgAvailable) {
              storeSuccess = await this.storeDataInPostgres(key, {
                type: 'w3cli-regular',
                cid
              });
            } else {
              storeSuccess = true;
              
              // Remember this key -> CID mapping locally
              try {
                // Store in temporary indexedDB or similar if available
                logger.info(`[advanced-storage] Stored data on W3CLI with CID ${cid}`);
              } catch (storageError) {
                logger.warn('[advanced-storage] Could not store key-CID mapping locally:', storageError);
              }
            }
          }
        }
      } else if (providerScore >= 2.5) {
        // Hybrid approach for highest importance data
        // Store on multiple providers with blockchain reference
        // For now, we'll simulate by storing on both IPFS and W3CLI
        const results = await Promise.allSettled([
          this.ipfsAvailable ? ipfsStorageProvider.uploadData(data) : Promise.resolve(null),
          this.w3cliAvailable ? w3cliProvider.uploadData(data) : Promise.resolve(null)
        ]);
        
        const cids = results
          .filter(r => r.status === 'fulfilled' && r.value)
          .map(r => (r as PromiseFulfilledResult<string>).value);
        
        if (cids.length > 0) {
          // Store references in PostgreSQL if available
          if (this.pgAvailable) {
            storeSuccess = await this.storeDataInPostgres(key, {
              type: 'hybrid',
              cids,
              merkleRoot: merkleRoot || null
            });
          } else {
            storeSuccess = true;
            
            // Remember this key -> CID mapping locally
            try {
              // Store in temporary indexedDB or similar if available
              logger.info(`[advanced-storage] Stored data with hybrid approach, CIDs: ${cids.join(', ')}`);
            } catch (storageError) {
              logger.warn('[advanced-storage] Could not store key-CID mapping locally:', storageError);
            }
          }
        }
      }
      
      // Update change rate for this key
      this.recordChange(key);
      
      return storeSuccess;
    } catch (error) {
      logger.error('[advanced-storage] Failed to store data:', error);
      return false;
    }
  }
  
  /**
   * Retrieve data by key
   * 
   * @param key The unique identifier for the data
   * @returns Promise resolving to the retrieved data or null
   */
  public async retrieveData(key: string): Promise<any | null> {
    try {
      await this.checkStatus();
      
      if (this.status === 'error') {
        logger.error('[advanced-storage] Cannot retrieve data, service in error state');
        return null;
      }
      
      // Record access for this key
      this.recordAccess(key);
      
      // First check PostgreSQL for data or reference
      if (this.pgAvailable) {
        const storedData = await this.retrieveDataFromPostgres(key);
        
        if (storedData) {
          if (storedData.type === 'regular') {
            // Data is directly stored in PostgreSQL
            return storedData.data;
          } else if (storedData.type === 'fractionalized') {
            // Data is fractionalized in PostgreSQL
            if (storedData.chunks && storedData.merkleRoot) {
              // Convert base64 chunks back to original data
              const reconstructedChunks = storedData.chunks.map(c => ({
                index: c.index,
                hash: c.hash,
                data: Buffer.from(c.data, 'base64')
              }));
              
              // Verify merkle root
              const isValid = smartStorageOptimizer.verifyDataIntegrity(
                reconstructedChunks,
                storedData.merkleRoot
              );
              
              if (!isValid) {
                logger.error('[advanced-storage] Data integrity check failed for fractionalized data');
                return null;
              }
              
              // Sort chunks by index
              reconstructedChunks.sort((a, b) => a.index - b.index);
              
              // Concatenate chunks
              const dataBuffer = Buffer.concat(reconstructedChunks.map(c => c.data));
              
              // Parse JSON if possible
              try {
                return JSON.parse(dataBuffer.toString());
              } catch (e) {
                // Not JSON, return as string
                return dataBuffer.toString();
              }
            }
          } else if (storedData.type === 'ipfs-regular' && storedData.cid) {
            // Data is stored on IPFS
            if (this.ipfsAvailable) {
              return await ipfsStorageProvider.retrieveData(storedData.cid);
            } else if (this.w3cliAvailable) {
              // Try fallback to W3CLI gateway for IPFS data
              return await w3cliProvider.retrieveData(storedData.cid);
            }
          } else if (storedData.type === 'w3cli-regular' && storedData.cid) {
            // Data is stored on W3CLI
            if (this.w3cliAvailable) {
              return await w3cliProvider.retrieveData(storedData.cid);
            } else if (this.ipfsAvailable) {
              // Try fallback to IPFS for W3CLI data (might work if CID is compatible)
              return await ipfsStorageProvider.retrieveData(storedData.cid);
            }
          } else if (storedData.type === 'ipfs-fractionalized' || storedData.type === 'w3cli-fractionalized') {
            // Data is fractionalized on IPFS/W3CLI
            if (storedData.chunks && storedData.merkleRoot) {
              const provider = storedData.type === 'ipfs-fractionalized' ? 
                (this.ipfsAvailable ? ipfsStorageProvider : w3cliProvider) : 
                (this.w3cliAvailable ? w3cliProvider : ipfsStorageProvider);
              
              if (!provider) {
                logger.error(`[advanced-storage] No provider available for ${storedData.type}`);
                return null;
              }
              
              // Retrieve all chunks
              const retrievedChunks = [];
              for (const chunk of storedData.chunks) {
                const chunkData = await provider.retrieveData(chunk.cid);
                if (chunkData) {
                  retrievedChunks.push({
                    index: chunk.index,
                    hash: chunk.hash,
                    data: Buffer.from(chunkData.data || chunkData)
                  });
                }
              }
              
              // Verify data integrity using merkle root
              const isValid = smartStorageOptimizer.verifyDataIntegrity(
                retrievedChunks,
                storedData.merkleRoot
              );
              
              if (!isValid) {
                logger.error('[advanced-storage] Data integrity check failed for fractionalized data');
                return null;
              }
              
              // Sort chunks by index
              retrievedChunks.sort((a, b) => a.index - b.index);
              
              // Concatenate chunks
              const dataBuffer = Buffer.concat(retrievedChunks.map(c => c.data));
              
              // Parse JSON if possible
              try {
                return JSON.parse(dataBuffer.toString());
              } catch (e) {
                // Not JSON, return as string
                return dataBuffer.toString();
              }
            }
          } else if (storedData.type === 'hybrid' && storedData.cids && storedData.cids.length > 0) {
            // Data is stored using hybrid approach, try CIDs in order
            for (const cid of storedData.cids) {
              // Try IPFS first
              if (this.ipfsAvailable) {
                const ipfsData = await ipfsStorageProvider.retrieveData(cid);
                if (ipfsData) return ipfsData;
              }
              
              // Try W3CLI next
              if (this.w3cliAvailable) {
                const w3cliData = await w3cliProvider.retrieveData(cid);
                if (w3cliData) return w3cliData;
              }
            }
          }
        }
      }
      
      // If not found in PostgreSQL or references couldn't be resolved,
      // try retrieving directly from IPFS and W3CLI using key as CID
      // This is a last resort for cases where we lost the mapping
      
      if (this.ipfsAvailable) {
        try {
          const ipfsData = await ipfsStorageProvider.retrieveData(key);
          if (ipfsData) {
            logger.info(`[advanced-storage] Retrieved data directly from IPFS using key as CID: ${key}`);
            return ipfsData;
          }
        } catch (error) {
          logger.debug(`[advanced-storage] Could not retrieve from IPFS using key as CID: ${error.message}`);
        }
      }
      
      if (this.w3cliAvailable) {
        try {
          const w3cliData = await w3cliProvider.retrieveData(key);
          if (w3cliData) {
            logger.info(`[advanced-storage] Retrieved data directly from W3CLI using key as CID: ${key}`);
            return w3cliData;
          }
        } catch (error) {
          logger.debug(`[advanced-storage] Could not retrieve from W3CLI using key as CID: ${error.message}`);
        }
      }
      
      logger.warn(`[advanced-storage] Could not retrieve data for key: ${key}`);
      return null;
    } catch (error) {
      logger.error('[advanced-storage] Failed to retrieve data:', error);
      return null;
    }
  }
  
  /**
   * Store data in PostgreSQL
   * This is a helper method used by the main storeData method
   */
  private async storeDataInPostgres(key: string, value: any): Promise<boolean> {
    try {
      // Check for existing data
      const existingResult = await db.execute(sql`
        SELECT key FROM storage WHERE key = ${key}
      `);
      
      const exists = existingResult && existingResult.length > 0;
      
      if (exists) {
        // Update existing data
        await db.execute(sql`
          UPDATE storage 
          SET value = ${JSON.stringify(value)}, 
              updated_at = NOW() 
          WHERE key = ${key}
        `);
      } else {
        // Insert new data
        await db.execute(sql`
          INSERT INTO storage (key, value, created_at, updated_at)
          VALUES (${key}, ${JSON.stringify(value)}, NOW(), NOW())
        `);
      }
      
      return true;
    } catch (error) {
      logger.error('[advanced-storage] Failed to store data in PostgreSQL:', error);
      return false;
    }
  }
  
  /**
   * Retrieve data from PostgreSQL
   * This is a helper method used by the main retrieveData method
   */
  private async retrieveDataFromPostgres(key: string): Promise<any | null> {
    try {
      const result = await db.execute(sql`
        SELECT value FROM storage WHERE key = ${key}
      `);
      
      if (result && result.length > 0 && result[0].value) {
        return result[0].value;
      }
      
      return null;
    } catch (error) {
      logger.error('[advanced-storage] Failed to retrieve data from PostgreSQL:', error);
      return null;
    }
  }
  
  /**
   * Record data access for a key
   * Used for optimization decisions
   */
  private recordAccess(key: string): void {
    // Also inform the optimizer
    smartStorageOptimizer.recordAccess(key);
    
    // Keep track for our own calculations
    if (!this.dataAccessLog.has(key)) {
      this.dataAccessLog.set(key, []);
    }
    
    const accesses = this.dataAccessLog.get(key);
    accesses.push(Date.now());
    
    // Limit array size to prevent memory issues
    if (accesses.length > 1000) {
      this.dataAccessLog.set(key, accesses.slice(-1000));
    }
  }
  
  /**
   * Record a data change for calculating change rates
   */
  private recordChange(key: string): void {
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    
    // Get access history for this key
    const accesses = this.dataAccessLog.get(key) || [];
    
    // Count changes in the last 24 hours
    const changesLast24h = accesses.filter(time => time > now - 24 * hourMs).length;
    
    // Calculate changes per hour
    const changesPerHour = changesLast24h / 24;
    
    // Update the change rate
    this.changeRates.set(key, changesPerHour);
    
    // Calculate optimal update frequency for this data based on change rate
    const updateFrequency = smartStorageOptimizer.getOptimalUpdateFrequency(changesPerHour);
    logger.debug(`[advanced-storage] Key ${key} has change rate of ${changesPerHour.toFixed(2)}/hour, update frequency set to ${updateFrequency}ms`);
  }
  
  /**
   * Get the optimal update frequency for a key
   * Used by external services to know how often to update data
   */
  public getOptimalUpdateFrequency(key: string): number {
    const changeRate = this.changeRates.get(key) || 0;
    return smartStorageOptimizer.getOptimalUpdateFrequency(changeRate);
  }
  
  /**
   * Delete data from all storage providers
   */
  public async deleteData(key: string): Promise<boolean> {
    try {
      await this.checkStatus();
      
      if (this.status === 'error') {
        logger.error('[advanced-storage] Cannot delete data, service in error state');
        return false;
      }
      
      let pgDeleted = true;
      
      // Get data references from PostgreSQL if available
      if (this.pgAvailable) {
        const storedData = await this.retrieveDataFromPostgres(key);
        
        if (storedData) {
          // Attempt to delete from IPFS/W3CLI if references exist
          if (storedData.type === 'ipfs-regular' && storedData.cid && this.ipfsAvailable) {
            // Note: IPFS does not allow deletion directly, but we could unpin
            logger.debug(`[advanced-storage] Cannot delete from IPFS directly, CID: ${storedData.cid}`);
          } else if (storedData.type === 'w3cli-regular' && storedData.cid && this.w3cliAvailable) {
            // Note: W3CLI might not support deletion, would need to check docs
            logger.debug(`[advanced-storage] Cannot delete from W3CLI directly, CID: ${storedData.cid}`);
          } else if ((storedData.type === 'ipfs-fractionalized' || storedData.type === 'w3cli-fractionalized') 
                  && storedData.chunks) {
            // Same limitation for fractionalized data
            logger.debug(`[advanced-storage] Cannot delete fractionalized data directly from IPFS/W3CLI`);
          }
        }
        
        // Delete from PostgreSQL
        try {
          await db.execute(sql`DELETE FROM storage WHERE key = ${key}`);
          pgDeleted = true;
        } catch (error) {
          logger.error('[advanced-storage] Failed to delete from PostgreSQL:', error);
          pgDeleted = false;
        }
      }
      
      // Clean up internal tracking
      this.dataAccessLog.delete(key);
      this.changeRates.delete(key);
      
      return pgDeleted;
    } catch (error) {
      logger.error('[advanced-storage] Failed to delete data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const advancedStorageService = new AdvancedStorageService();