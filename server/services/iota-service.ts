import { logger } from '../utils/logger';

/**
 * Simplified IOTA Service
 * Provides basic connectivity to check the IOTA network status
 * 
 * This implementation focuses on network status reporting to match
 * the interfaces of other blockchain services without implementing
 * full wallet functionality yet.
 */
class IOTAService {
  private initialized: boolean = false;
  private connecting: boolean = false;
  private lastError: string | null = null;
  private nodeUrl: string = '';
  private explorerUrl: string = 'https://explorer.shimmer.network/testnet';

  constructor() {
    this.nodeUrl = process.env.IOTA_NODE_URL || 'https://api.testnet.shimmer.network';
    logger.info(`IOTA service initializing with node URL: ${this.nodeUrl}`);
    this.init();
  }

  /**
   * Initialize the IOTA service
   */
  async init(): Promise<boolean> {
    try {
      if (this.connecting) {
        return false;
      }
      
      this.connecting = true;
      
      // Simple health check to see if node is responsive
      const health = await this.checkNodeAvailability();
      
      this.initialized = health;
      this.connecting = false;
      
      if (health) {
        this.lastError = null;
        logger.info('IOTA client initialized successfully');
      } else {
        this.lastError = 'Failed to connect to IOTA node';
        logger.error('IOTA client initialization failed: Failed to connect to node');
      }
      
      return health;
    } catch (error: any) {
      this.connecting = false;
      this.initialized = false;
      this.lastError = error.message;
      logger.error('IOTA client initialization failed:', error);
      return false;
    }
  }

  /**
   * Simple health check to see if node is accessible
   */
  private async checkNodeAvailability(): Promise<boolean> {
    try {
      // Try to connect to the node using fetch API
      const response = await fetch(`${this.nodeUrl}/health`);
      return response.ok;
    } catch (error: any) {
      logger.error('IOTA node health check failed:', error);
      return false;
    }
  }

  /**
   * Get basic node info
   */
  async getNodeInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.nodeUrl}/api/v2/info`);
      if (!response.ok) {
        throw new Error(`Failed to get node info: ${response.statusText}`);
      }
      return await response.json();
    } catch (error: any) {
      logger.error('Error getting IOTA node info:', error);
      throw error;
    }
  }

  /**
   * Get current IOTA network status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      connecting: this.connecting,
      lastError: this.lastError,
      nodeUrl: this.nodeUrl
    };
  }

  /**
   * Get network status in the same format as other blockchain services
   */
  async getNetworkStatus() {
    try {
      // First check if node is available
      const isHealthy = await this.checkNodeAvailability();
      
      if (!isHealthy) {
        return {
          status: 'disconnected',
          endpoint: this.nodeUrl,
          error: this.lastError || 'Node is not responding'
        };
      }
      
      // Try to get additional node info
      try {
        const info = await this.getNodeInfo();
        return {
          status: 'connected',
          endpoint: this.nodeUrl,
          networkId: info.nodeInfo?.networkId || 'unknown',
          version: info.nodeInfo?.version || 'unknown',
          error: null
        };
      } catch (err) {
        // If we can't get node info but health check passed
        return {
          status: 'connected',
          endpoint: this.nodeUrl,
          error: null
        };
      }
    } catch (err: any) {
      logger.error('Error checking IOTA network status:', err);
      return {
        status: 'error',
        endpoint: this.nodeUrl,
        error: err.message || 'Unknown error'
      };
    }
  }
  
  /**
   * Get validator information (placeholder)
   */
  async getValidatorInfo(validatorAddress?: string) {
    return {
      name: 'HyperDAG Validator',
      description: 'HyperDAG participation in IOTA network',
      imageUrl: 'https://hyperdag.org/logo.png',
      projectUrl: 'https://hyperdag.org',
      networkAddress: this.nodeUrl,
      status: this.initialized ? 'active' : 'inactive',
      address: validatorAddress || 'iota1...'
    };
  }
}

export const iotaService = new IOTAService();