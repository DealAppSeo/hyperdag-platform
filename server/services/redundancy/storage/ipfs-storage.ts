import { Web3Storage } from 'web3.storage';
import * as Helia from 'helia';
import { json } from '@helia/json';
import { ServiceStatus } from '../core/types';
import { db } from '../../../db';
import { logger } from '../../../utils/logger';
import { w3cliProvider } from './w3cli-provider';

/**
 * IPFS Storage Provider - Implements decentralized storage through IPFS
 * using multiple provider options for redundancy:
 * 1. Web3.Storage API (primary)
 * 2. Helia IPFS node (secondary)
 * 3. w3cli command line tool (tertiary/fallback)
 */
export class IPFSStorageProvider {
  private web3Storage: Web3Storage | null = null;
  private helia: any = null;
  private heliaJson: any = null;
  private status: ServiceStatus = 'idle';
  private lastStatusCheck: number = 0;
  private statusCheckInterval: number = 60000; // 1 minute
  private preferredProvider: 'web3.storage' | 'helia' | 'w3cli' = 'web3.storage';
  private w3cliAvailable: boolean = false;

  constructor() {
    this.initializeProviders();
  }

  private async initializeProviders() {
    try {
      let web3StorageInitialized = false;
      let heliaInitialized = false;
      
      // Initialize Web3.Storage if API token is available
      if (process.env.WEB3_STORAGE_TOKEN) {
        try {
          this.web3Storage = new Web3Storage({ token: process.env.WEB3_STORAGE_TOKEN });
          web3StorageInitialized = true;
          logger.info('[ipfs-storage] Web3.Storage initialized');
        } catch (web3Error) {
          logger.error('[ipfs-storage] Failed to initialize Web3.Storage:', web3Error);
        }
      } else {
        logger.warn('[ipfs-storage] Web3.Storage token not found, operating in local-only mode');
        // Automatically set Helia as preferred provider if Web3.Storage isn't available
        this.preferredProvider = 'helia';
      }

      // Initialize Helia for local IPFS node
      try {
        this.helia = await Helia.createHelia();
        this.heliaJson = json(this.helia);
        heliaInitialized = true;
        logger.info('[ipfs-storage] Helia IPFS node initialized');
      } catch (error) {
        logger.error('[ipfs-storage] Failed to initialize Helia IPFS node:', error);
      }

      // Set status based on which providers were successfully initialized
      if (web3StorageInitialized && heliaInitialized) {
        this.status = 'available';
      } else if (web3StorageInitialized || heliaInitialized) {
        this.status = 'degraded';
        logger.warn(`[ipfs-storage] Operating in degraded mode with only ${web3StorageInitialized ? 'Web3.Storage' : 'Helia'} available`);
      } else {
        this.status = 'error';
        logger.error('[ipfs-storage] No IPFS providers available');
      }
    } catch (error) {
      logger.error('[ipfs-storage] Failed to initialize IPFS storage providers:', error);
      this.status = 'error';
    }
  }

  /**
   * Checks the availability and health of the IPFS storage providers
   */
  public async checkStatus(): Promise<ServiceStatus> {
    const now = Date.now();
    
    // Only check status if enough time has passed since last check
    if (now - this.lastStatusCheck < this.statusCheckInterval) {
      return this.status;
    }
    
    this.lastStatusCheck = now;
    
    let web3StorageAvailable = false;
    let heliaAvailable = false;
    
    try {
      // Check Web3.Storage if available
      if (this.web3Storage) {
        try {
          // Simple test operation - list 1 item
          await this.web3Storage.list({ maxResults: 1 });
          web3StorageAvailable = true;
          this.preferredProvider = 'web3.storage';
          logger.info('[ipfs-storage] Web3.Storage availability check passed');
        } catch (error) {
          logger.warn('[ipfs-storage] Web3.Storage availability check failed:', error);
        }
      }
      
      // Try Helia regardless of Web3.Storage status
      if (this.helia) {
        try {
          // Simple test operation
          const testCid = await this.heliaJson.add({ test: 'connectivity-check' });
          await this.heliaJson.get(testCid);
          heliaAvailable = true;
          // Only set as preferred if Web3.Storage is not available
          if (!web3StorageAvailable) {
            this.preferredProvider = 'helia';
          }
          logger.info('[ipfs-storage] Helia availability check passed');
        } catch (error) {
          logger.warn('[ipfs-storage] Helia availability check failed:', error);
        }
      }
      
      // Check w3cli availability as the last resort option
      if (!web3StorageAvailable && !heliaAvailable) {
        try {
          const w3cliStatus = await w3cliProvider.checkStatus();
          this.w3cliAvailable = w3cliStatus === 'available';
          
          if (this.w3cliAvailable) {
            this.preferredProvider = 'w3cli';
            logger.info('[ipfs-storage] w3cli availability check passed');
          } else {
            logger.warn('[ipfs-storage] w3cli availability check failed');
          }
        } catch (error) {
          logger.warn('[ipfs-storage] w3cli availability check failed:', error);
          this.w3cliAvailable = false;
        }
      }
      
      // Determine service status based on provider availability
      if ((web3StorageAvailable && heliaAvailable) || 
          (web3StorageAvailable && this.w3cliAvailable) || 
          (heliaAvailable && this.w3cliAvailable)) {
        this.status = 'available';
      } else if (web3StorageAvailable || heliaAvailable || this.w3cliAvailable) {
        this.status = 'degraded';
        const availableProvider = web3StorageAvailable ? 'Web3.Storage' : 
                                 heliaAvailable ? 'Helia' : 'w3cli';
        logger.warn(`[ipfs-storage] Operating in degraded mode with only ${availableProvider}`);
      } else {
        this.status = 'error';
        logger.error('[ipfs-storage] All IPFS providers unavailable');
      }
      
      return this.status;
    } catch (error) {
      logger.error('[ipfs-storage] Status check failed:', error);
      this.status = 'error';
      return this.status;
    }
  }

  /**
   * Stores data in IPFS and returns the CID
   */
  public async storeData(data: any): Promise<string | null> {
    try {
      // Try primary provider first
      if (this.preferredProvider === 'web3.storage' && this.web3Storage) {
        try {
          // Convert data to a File object for web3.storage
          const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
          const files = [new File([blob], 'data.json')];
          
          // Store and get CID
          const cid = await this.web3Storage.put(files, { wrapWithDirectory: false });
          logger.info(`[ipfs-storage] Data stored in Web3.Storage with CID: ${cid}`);
          return cid.toString();
        } catch (error) {
          logger.warn('[ipfs-storage] Web3.Storage store failed, trying next provider:', error);
        }
      }
      
      // Try Helia as fallback or primary
      if (this.preferredProvider === 'helia' || (this.heliaJson && this.preferredProvider !== 'w3cli')) {
        try {
          const cid = await this.heliaJson.add(data);
          logger.info(`[ipfs-storage] Data stored with Helia with CID: ${cid.toString()}`);
          return cid.toString();
        } catch (error) {
          logger.warn('[ipfs-storage] Helia store failed, trying next provider:', error);
        }
      }
      
      // Try w3cli as final fallback or if it's the preferred provider
      if (this.preferredProvider === 'w3cli' || (this.w3cliAvailable && (!this.web3Storage || !this.heliaJson))) {
        try {
          const cid = await w3cliProvider.uploadData(data);
          if (cid) {
            logger.info(`[ipfs-storage] Data stored with w3cli with CID: ${cid}`);
            return cid;
          }
        } catch (error) {
          logger.error('[ipfs-storage] w3cli store failed:', error);
        }
      }
      
      logger.error('[ipfs-storage] All storage providers failed');
      return null;
    } catch (error) {
      logger.error('[ipfs-storage] Error storing data:', error);
      return null;
    }
  }

  /**
   * Retrieves data from IPFS using its CID
   */
  public async retrieveData(cid: string): Promise<any | null> {
    try {
      // Try Web3.Storage first if it's the preferred provider
      if (this.preferredProvider === 'web3.storage' && this.web3Storage) {
        try {
          const res = await fetch(`https://${cid}.ipfs.w3s.link/data.json`);
          if (res.ok) {
            const data = await res.json();
            logger.info(`[ipfs-storage] Data retrieved from Web3.Storage with CID: ${cid}`);
            return data;
          }
        } catch (error) {
          logger.warn('[ipfs-storage] Web3.Storage retrieval failed, trying next provider:', error);
        }
      }
      
      // Try Helia as fallback or primary
      if (this.preferredProvider === 'helia' || (this.heliaJson && this.preferredProvider !== 'w3cli')) {
        try {
          const data = await this.heliaJson.get(cid);
          logger.info(`[ipfs-storage] Data retrieved from Helia with CID: ${cid}`);
          return data;
        } catch (error) {
          logger.warn('[ipfs-storage] Helia retrieval failed, trying next provider:', error);
        }
      }
      
      // Try w3cli as final fallback or if it's the preferred provider
      if (this.preferredProvider === 'w3cli' || (this.w3cliAvailable && (!this.web3Storage || !this.heliaJson))) {
        try {
          const data = await w3cliProvider.retrieveData(cid);
          if (data) {
            logger.info(`[ipfs-storage] Data retrieved from w3cli with CID: ${cid}`);
            return data;
          }
        } catch (error) {
          logger.error('[ipfs-storage] w3cli retrieval failed:', error);
        }
      }
      
      logger.error(`[ipfs-storage] Failed to retrieve data for CID: ${cid} from any provider`);
      return null;
    } catch (error) {
      logger.error('[ipfs-storage] Error retrieving data:', error);
      return null;
    }
  }

  /**
   * Stores an entity in IPFS and returns the CID
   * This method adds a table name to make retrieving easier
   */
  public async storeEntity(tableName: string, entity: any): Promise<string | null> {
    try {
      const wrappedData = {
        __tableName: tableName,
        __timestamp: Date.now(),
        data: entity
      };
      
      return await this.storeData(wrappedData);
    } catch (error) {
      logger.error(`[ipfs-storage] Error storing entity from ${tableName}:`, error);
      return null;
    }
  }

  /**
   * Backup a collection of entities to IPFS
   */
  public async backupCollection(tableName: string, entities: any[]): Promise<string | null> {
    try {
      const wrappedData = {
        __tableName: tableName,
        __timestamp: Date.now(),
        __count: entities.length,
        data: entities
      };
      
      return await this.storeData(wrappedData);
    } catch (error) {
      logger.error(`[ipfs-storage] Error backing up collection ${tableName}:`, error);
      return null;
    }
  }
}

// Create singleton instance
export const ipfsStorageProvider = new IPFSStorageProvider();