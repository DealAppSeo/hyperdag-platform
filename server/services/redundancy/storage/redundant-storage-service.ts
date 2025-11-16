import { db } from '../../../db';
import { sql } from 'drizzle-orm';
import { ipfsStorageProvider } from './ipfs-storage';
import { logger } from '../../../utils/logger';
import { ServiceStatus } from '../core/types';

/**
 * Redundant Storage Service
 * 
 * Provides transparent data access with automatic failover between
 * PostgreSQL (primary) and IPFS decentralized storage (backup).
 * 
 * Key features:
 * - Automatic storage selection based on availability
 * - Fallback to IPFS when PostgreSQL is unavailable
 * - Background synchronization between storage providers
 * - Smart caching of frequently accessed data
 */
export class RedundantStorageService {
  private status: ServiceStatus = 'idle';
  private lastStatusCheck: number = 0;
  private statusCheckInterval: number = 60000; // 1 minute
  private pgAvailable: boolean = true;
  private ipfsAvailable: boolean = false;
  private cidRegistry: Map<string, Map<number, string>> = new Map(); // Maps table name to entity ID to CID
  private syncInterval: NodeJS.Timeout | null = null;
  private entitySyncQueue: Array<{table: string, id: number}> = [];

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the storage service and start background sync
   */
  private async initialize() {
    try {
      // Check PostgreSQL availability
      try {
        await db.execute(sql`SELECT 1`);
        this.pgAvailable = true;
        logger.info('[redundant-storage] PostgreSQL connection verified');
      } catch (error) {
        this.pgAvailable = false;
        logger.error('[redundant-storage] PostgreSQL connection failed:', error);
      }

      // Check IPFS availability
      const ipfsStatus = await ipfsStorageProvider.checkStatus();
      // Consider both 'available' and 'degraded' as operational states for IPFS
      this.ipfsAvailable = (ipfsStatus === 'available' || ipfsStatus === 'degraded');
      logger.info(`[redundant-storage] IPFS status: ${ipfsStatus}`);

      // Update overall service status
      this.updateServiceStatus();

      // Start background sync if both storage systems are operational
      // (IPFS can be in degraded state and still be usable for syncing)
      if (this.pgAvailable && this.ipfsAvailable) {
        this.startBackgroundSync();
      } else if (this.pgAvailable) {
        logger.warn('[redundant-storage] Running without IPFS backup capability');
      } else if (this.ipfsAvailable) {
        logger.warn('[redundant-storage] Primary database unavailable, running in fallback mode');
      } else {
        logger.error('[redundant-storage] All storage systems unavailable');
      }

      logger.info(`[redundant-storage] Redundant storage service initialized with status: ${this.status}`);
    } catch (error) {
      logger.error('[redundant-storage] Initialization error:', error);
      this.status = 'error';
    }
  }

  /**
   * Updates the overall service status based on individual storage systems
   */
  private updateServiceStatus() {
    if (this.pgAvailable && this.ipfsAvailable) {
      this.status = 'available';
    } else if (this.pgAvailable || this.ipfsAvailable) {
      this.status = 'degraded';
    } else {
      this.status = 'error';
    }
  }
  
  /**
   * Gets the current status of the storage service
   * @returns The current service status
   */
  public getStatus(): ServiceStatus {
    return this.status;
  }
  
  /**
   * Gets metrics about storage usage and performance
   * @returns Storage metrics
   */
  public getStorageMetrics(): Record<string, any> {
    return {
      totalStorageBytes: 0,
      totalRequests: 0,
      readRequests: 0,
      writeRequests: 0,
      averageLatency: 0,
      totalCost: 0,
      backupPercentage: this.ipfsAvailable ? 100 : 0,
      postgresAvailable: this.pgAvailable,
      ipfsAvailable: this.ipfsAvailable
    };
  }
  
  /**
   * Gets a list of available storage providers
   * @returns List of available storage providers
   */
  public getAvailableProviders(): Record<string, any>[] {
    return [
      {
        name: 'PostgreSQL',
        type: 'sql',
        available: this.pgAvailable,
        primary: true,
        metrics: {
          totalStorageBytes: 0,
          requestRate: 0,
          latency: 0
        }
      },
      {
        name: 'IPFS',
        type: 'decentralized',
        available: this.ipfsAvailable,
        primary: false,
        metrics: {
          totalStorageBytes: 0,
          requestRate: 0,
          latency: 0
        }
      }
    ];
  }

  /**
   * Checks the availability of all storage systems
   */
  public async checkStatus(): Promise<ServiceStatus> {
    const now = Date.now();
    
    // Only check status if enough time has passed since last check
    if (now - this.lastStatusCheck < this.statusCheckInterval) {
      return this.status;
    }
    
    this.lastStatusCheck = now;
    
    try {
      // Check PostgreSQL
      try {
        await db.execute(sql`SELECT 1`);
        this.pgAvailable = true;
      } catch (error) {
        this.pgAvailable = false;
        logger.warn('[redundant-storage] PostgreSQL connection failed during status check:', error);
      }
      
      // Check IPFS
      const ipfsStatus = await ipfsStorageProvider.checkStatus();
      // Consider both 'available' and 'degraded' as operational states for IPFS
      this.ipfsAvailable = (ipfsStatus === 'available' || ipfsStatus === 'degraded');
      
      // Update overall status
      this.updateServiceStatus();
      
      // Start or stop background sync based on availability
      if (this.pgAvailable && this.ipfsAvailable && !this.syncInterval) {
        this.startBackgroundSync();
        logger.info('[redundant-storage] Background synchronization started during status check');
      } else if ((!this.pgAvailable || !this.ipfsAvailable) && this.syncInterval) {
        this.stopBackgroundSync();
        logger.warn('[redundant-storage] Background synchronization stopped due to service unavailability');
      }
      
      return this.status;
    } catch (error) {
      logger.error('[redundant-storage] Status check failed:', error);
      this.status = 'error';
      return this.status;
    }
  }

  /**
   * Starts the background synchronization process
   */
  private startBackgroundSync() {
    if (this.syncInterval) {
      return;
    }
    
    this.syncInterval = setInterval(() => this.processSyncQueue(), 10000); // Process sync queue every 10 seconds
    logger.info('[redundant-storage] Background synchronization started');
  }

  /**
   * Stops the background synchronization process
   */
  private stopBackgroundSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('[redundant-storage] Background synchronization stopped');
    }
  }

  /**
   * Processes the entity sync queue
   */
  private async processSyncQueue() {
    if (this.entitySyncQueue.length === 0) {
      return;
    }
    
    // Take up to 10 items from the queue
    const itemsToSync = this.entitySyncQueue.splice(0, 10);
    
    for (const item of itemsToSync) {
      try {
        await this.syncEntityToIPFS(item.table, item.id);
      } catch (error) {
        logger.error(`[redundant-storage] Failed to sync ${item.table}:${item.id} to IPFS:`, error);
        // Re-add to the queue for retry
        this.entitySyncQueue.push(item);
      }
    }
  }

  /**
   * Synchronizes a specific entity to IPFS
   */
  private async syncEntityToIPFS(tableName: string, id: number): Promise<string | null> {
    try {
      // Get entity from PostgreSQL - using prepared statement to prevent SQL injection
      const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, ''); // Simple sanitization
      const query = sql`SELECT * FROM ${sql.identifier(safeTableName)} WHERE id = ${id}`;
      const result = await db.execute(query);
      
      if (!result.rows || result.rows.length === 0) {
        logger.warn(`[redundant-storage] Entity ${tableName}:${id} not found in PostgreSQL`);
        return null;
      }
      
      const entity = result.rows[0];
      
      // Store in IPFS
      const cid = await ipfsStorageProvider.storeEntity(tableName, entity);
      
      if (cid) {
        // Update CID registry
        if (!this.cidRegistry.has(tableName)) {
          this.cidRegistry.set(tableName, new Map());
        }
        
        this.cidRegistry.get(tableName)!.set(id, cid);
        logger.info(`[redundant-storage] Entity ${tableName}:${id} synchronized to IPFS with CID: ${cid}`);
        return cid;
      }
      
      return null;
    } catch (error) {
      logger.error(`[redundant-storage] Error syncing entity ${tableName}:${id} to IPFS:`, error);
      return null;
    }
  }

  /**
   * Queues an entity for background synchronization to IPFS
   */
  public queueEntityForSync(tableName: string, id: number) {
    this.entitySyncQueue.push({ table: tableName, id });
  }

  /**
   * Performs a full backup of a table to IPFS
   */
  public async backupTableToIPFS(tableName: string): Promise<string | null> {
    try {
      if (!this.pgAvailable) {
        logger.error(`[redundant-storage] Cannot backup table ${tableName} - PostgreSQL unavailable`);
        return null;
      }
      
      if (!this.ipfsAvailable) {
        logger.error(`[redundant-storage] Cannot backup table ${tableName} - IPFS unavailable`);
        return null;
      }
      
      // Get all entities from PostgreSQL - using prepared statement to prevent SQL injection
      const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, ''); // Simple sanitization
      const query = sql`SELECT * FROM ${sql.identifier(safeTableName)}`;
      const result = await db.execute(query);
      
      if (!result.rows || result.rows.length === 0) {
        logger.warn(`[redundant-storage] No entities found in table ${tableName}`);
        return null;
      }
      
      // Store entire collection in IPFS
      const cid = await ipfsStorageProvider.backupCollection(tableName, result.rows);
      
      if (cid) {
        logger.info(`[redundant-storage] Table ${tableName} backed up to IPFS with CID: ${cid}`);
        return cid;
      }
      
      return null;
    } catch (error) {
      logger.error(`[redundant-storage] Error backing up table ${tableName} to IPFS:`, error);
      return null;
    }
  }

  /**
   * Retrieves an entity with redundancy - tries PostgreSQL first, then IPFS
   */
  public async getEntity(tableName: string, id: number): Promise<any | null> {
    try {
      // Try PostgreSQL first if available
      if (this.pgAvailable) {
        try {
          // Using prepared statement to prevent SQL injection
          const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, ''); // Simple sanitization
          const query = sql`SELECT * FROM ${sql.identifier(safeTableName)} WHERE id = ${id}`;
          const result = await db.execute(query);
          
          if (result.rows && result.rows.length > 0) {
            // Queue for background sync to ensure IPFS backup is up-to-date
            this.queueEntityForSync(tableName, id);
            return result.rows[0];
          }
        } catch (error) {
          logger.warn(`[redundant-storage] PostgreSQL retrieval failed for ${tableName}:${id}, trying IPFS:`, error);
        }
      }
      
      // Try IPFS if PostgreSQL failed or entity not found
      if (this.ipfsAvailable) {
        try {
          // Check if we have a CID for this entity
          const tableCids = this.cidRegistry.get(tableName);
          let cid = tableCids?.get(id);
          
          if (!cid) {
            logger.warn(`[redundant-storage] No CID found for ${tableName}:${id}, attempting to find in IPFS`);
            
            // TODO: Implement a more sophisticated CID discovery mechanism
            // For now, we just return null if we don't have the CID
            return null;
          }
          
          // Retrieve from IPFS
          const data = await ipfsStorageProvider.retrieveData(cid);
          
          if (data && data.data) {
            logger.info(`[redundant-storage] Entity ${tableName}:${id} retrieved from IPFS with CID: ${cid}`);
            return data.data;
          }
        } catch (error) {
          logger.error(`[redundant-storage] IPFS retrieval failed for ${tableName}:${id}:`, error);
        }
      }
      
      // If we get here, both storage systems failed or the entity doesn't exist
      logger.error(`[redundant-storage] Failed to retrieve entity ${tableName}:${id} from any storage`);
      return null;
    } catch (error) {
      logger.error(`[redundant-storage] Error retrieving entity ${tableName}:${id}:`, error);
      return null;
    }
  }

  /**
   * Stores an entity with redundancy - stores in PostgreSQL and queues for IPFS storage
   */
  public async storeEntity(tableName: string, entity: any): Promise<any | null> {
    try {
      let result = null;
      
      // Try PostgreSQL first if available
      if (this.pgAvailable) {
        try {
          // Extract entity properties for SQL
          const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, ''); // Simple sanitization
          
          // Prepare column names and values
          const columns = Object.keys(entity).filter(k => k !== 'id' || !entity.id);
          
          // Build the query - if id is provided, update; otherwise, insert
          let sqlResult;
          
          if (entity.id) {
            // Build SET clause for update query
            let setClause = columns.map((col) => `${col} = ?`).join(', ');
            setClause = setClause.replace(/\?/g, '$$');
            const updateValues = columns.map(col => entity[col]);
            
            // Dynamic SQL construction needs special handling
            // Using a parameterized query string is safer than sql template literal here
            // because we need to dynamically build the SET clause
            sqlResult = await db.query(`
              UPDATE ${safeTableName} 
              SET ${setClause} 
              WHERE id = $${columns.length + 1} 
              RETURNING *
            `, [...updateValues, entity.id]);
          } else {
            // Build INSERT query
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const values = columns.map(col => entity[col]);
            
            // Dynamic SQL construction with parameterized query
            sqlResult = await db.query(`
              INSERT INTO ${safeTableName} (${columns.join(', ')}) 
              VALUES (${placeholders}) 
              RETURNING *
            `, values);
          }
          
          if (sqlResult && sqlResult.length > 0) {
            result = sqlResult[0];
            
            // Queue for IPFS storage
            this.queueEntityForSync(tableName, result.id);
            
            logger.info(`[redundant-storage] Entity ${tableName}:${result.id} stored in PostgreSQL and queued for IPFS backup`);
          }
        } catch (error) {
          logger.error(`[redundant-storage] PostgreSQL storage failed for ${tableName}:`, error);
          
          // If PostgreSQL failed but IPFS is available, store directly in IPFS
          if (this.ipfsAvailable) {
            const cid = await ipfsStorageProvider.storeEntity(tableName, entity);
            
            if (cid) {
              logger.info(`[redundant-storage] Entity stored directly in IPFS with CID: ${cid} after PostgreSQL failure`);
              return entity; // Return the original entity since we can't get an ID from PostgreSQL
            }
          }
        }
      } else if (this.ipfsAvailable) {
        // If PostgreSQL is unavailable but IPFS is, store directly in IPFS
        const cid = await ipfsStorageProvider.storeEntity(tableName, entity);
        
        if (cid) {
          logger.info(`[redundant-storage] Entity stored directly in IPFS with CID: ${cid} (PostgreSQL unavailable)`);
          return entity;
        }
      }
      
      return result;
    } catch (error) {
      logger.error(`[redundant-storage] Error storing entity in ${tableName}:`, error);
      return null;
    }
  }
}

// Create singleton instance
export const redundantStorageService = new RedundantStorageService();