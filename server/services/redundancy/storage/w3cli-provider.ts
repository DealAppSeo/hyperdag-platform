import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../../utils/logger';
import { ServiceStatus } from '../core/types';

const execAsync = promisify(exec);

/**
 * W3CLI Storage Provider
 * 
 * Provides IPFS storage capabilities through the w3 command line interface,
 * which is a client for the web3.storage w3up protocol.
 * 
 * This provider serves as a last-resort fallback when Web3.Storage API
 * and Helia are both unavailable, allowing for continued decentralized storage
 * operations through the command line interface.
 */
export class W3CLIProvider {
  private status: ServiceStatus = 'idle';
  private lastStatusCheck: number = 0;
  private statusCheckInterval: number = 300000; // 5 minutes
  private tempDir: string = path.join(process.cwd(), 'temp_w3cli');
  private initialized: boolean = false;
  private email: string | null = null;
  
  constructor(email?: string) {
    if (email) {
      this.email = email;
    }
    this.initialize();
  }
  
  /**
   * Initialize the W3CLI provider
   */
  private async initialize() {
    try {
      // Check if the w3 CLI is installed
      await this.checkCliInstalled();
      
      // Create temp directory if it doesn't exist
      await this.ensureTempDir();
      
      // If email is provided, attempt auto-login
      if (this.email) {
        await this.login(this.email);
      }
      
      this.initialized = true;
      logger.info('[w3cli-provider] W3CLI provider initialized');
    } catch (error) {
      logger.error('[w3cli-provider] Initialization failed:', error);
      this.status = 'error';
    }
  }
  
  /**
   * Check if the w3 CLI is installed
   */
  private async checkCliInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('which w3 || echo "not found"');
      if (stdout.trim() === 'not found') {
        logger.warn('[w3cli-provider] w3 CLI not found, attempting to install');
        
        // Try to install w3cli
        await execAsync('npm install -g @web3-storage/w3cli');
        logger.info('[w3cli-provider] w3 CLI installed successfully');
      } else {
        logger.info('[w3cli-provider] w3 CLI found at ' + stdout.trim());
      }
      return true;
    } catch (error) {
      logger.error('[w3cli-provider] Failed to check/install w3 CLI:', error);
      throw new Error('W3 CLI not available');
    }
  }
  
  /**
   * Ensure the temporary directory exists
   */
  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      logger.error('[w3cli-provider] Failed to create temp directory:', error);
      throw error;
    }
  }
  
  /**
   * Login to web3.storage with the provided email
   */
  public async login(email: string): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      logger.info(`[w3cli-provider] Attempting login with email: ${email}`);
      
      try {
        // First check if we're already logged in
        const { stdout: whoamiOutput } = await execAsync('w3 whoami');
        if (whoamiOutput && !whoamiOutput.includes('not logged in')) {
          logger.info(`[w3cli-provider] Already logged in as: ${whoamiOutput.trim()}`);
          this.status = 'available';
          return true;
        }
      } catch (error) {
        // Not logged in, will proceed with login
        logger.info('[w3cli-provider] Not currently logged in, proceeding with login');
      }
      
      // Execute login command - this will require user interaction or headless setup
      await execAsync(`w3 login ${email}`);
      
      // Verify the login worked
      try {
        const { stdout } = await execAsync('w3 whoami');
        if (stdout && !stdout.includes('not logged in')) {
          this.status = 'available';
          logger.info(`[w3cli-provider] Login successful as: ${stdout.trim()}`);
          return true;
        } else {
          throw new Error('Login verification failed');
        }
      } catch (loginCheckError) {
        throw new Error(`Login succeeded but verification failed: ${loginCheckError.message}`);
      }
    } catch (error) {
      logger.error('[w3cli-provider] Login failed:', error);
      this.status = 'error';
      return false;
    }
  }
  
  /**
   * Check the status of the w3 CLI provider
   */
  public async checkStatus(): Promise<ServiceStatus> {
    const now = Date.now();
    
    // Only check status if enough time has passed since last check
    if (now - this.lastStatusCheck < this.statusCheckInterval) {
      return this.status;
    }
    
    this.lastStatusCheck = now;
    
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Run whoami command to verify CLI is working and logged in
      const { stdout } = await execAsync('w3 whoami || echo "not logged in"');
      
      if (stdout.includes('not logged in')) {
        if (this.email) {
          logger.warn('[w3cli-provider] Not logged in, attempting login');
          const loginSuccess = await this.login(this.email);
          this.status = loginSuccess ? 'available' : 'error';
        } else {
          logger.warn('[w3cli-provider] Not logged in and no email provided');
          this.status = 'error';
        }
      } else {
        logger.info(`[w3cli-provider] Logged in as: ${stdout.trim()}`);
        this.status = 'available';
      }
      
      return this.status;
    } catch (error) {
      logger.error('[w3cli-provider] Status check failed:', error);
      this.status = 'error';
      return this.status;
    }
  }
  
  /**
   * Upload data to IPFS using w3 CLI
   */
  public async uploadData(data: any): Promise<string | null> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      if (this.status === 'error') {
        await this.checkStatus();
        if (this.status === 'error') {
          logger.error('[w3cli-provider] Cannot upload, provider in error state');
          return null;
        }
      }
      
      // Write the data to a temporary file
      const tempFilePath = path.join(this.tempDir, `upload_${Date.now()}.json`);
      await fs.writeFile(tempFilePath, JSON.stringify(data));
      
      // Upload the file
      logger.info(`[w3cli-provider] Uploading file: ${tempFilePath}`);
      
      // Execute the actual upload command with w3 CLI
      const { stdout } = await execAsync(`w3 up ${tempFilePath}`);
      logger.debug(`[w3cli-provider] Upload command output: ${stdout}`);
      
      // Extract the CID from the output
      // The pattern to extract the CID - we're looking for a string starting with bafy or bafybei
      const cidMatch = stdout.match(/(?:bafy|bafybei)[a-zA-Z0-9]+/);
      const cid = cidMatch ? cidMatch[0] : null;
      
      // Clean up the temporary file
      await fs.unlink(tempFilePath);
      
      if (cid) {
        logger.info(`[w3cli-provider] Upload successful, CID: ${cid}`);
        return cid;
      } else {
        logger.error('[w3cli-provider] Failed to extract CID from upload output:', stdout);
        return null;
      }
    } catch (error) {
      logger.error('[w3cli-provider] Upload failed:', error);
      return null;
    }
  }
  
  /**
   * Retrieve data from IPFS using w3 CLI
   */
  public async retrieveData(cid: string): Promise<any | null> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      if (this.status === 'error') {
        await this.checkStatus();
        if (this.status === 'error') {
          logger.error('[w3cli-provider] Cannot retrieve, provider in error state');
          return null;
        }
      }
      
      logger.info(`[w3cli-provider] Retrieving data for CID: ${cid}`);
      
      // Create a temporary directory to store the retrieved data
      const retrieveDir = path.join(this.tempDir, `retrieve_${Date.now()}`);
      await fs.mkdir(retrieveDir, { recursive: true });
      
      try {
        // Use the w3 service gateway to retrieve the data
        // We'll extract it to a file and then read it
        const tempFilePath = path.join(retrieveDir, 'data.json');
        await execAsync(`curl -s https://w3s.link/ipfs/${cid} -o ${tempFilePath}`);
        
        // Read the retrieved data 
        const dataBuffer = await fs.readFile(tempFilePath);
        
        try {
          // Try to parse the data as JSON
          const data = JSON.parse(dataBuffer.toString());
          
          // Clean up the temporary directory
          await fs.rm(retrieveDir, { recursive: true, force: true });
          
          logger.info(`[w3cli-provider] Successfully retrieved and parsed data for CID: ${cid}`);
          return data;
        } catch (parseError) {
          // If JSON parsing fails, return the raw data as string
          logger.warn(`[w3cli-provider] Retrieved data is not valid JSON: ${parseError.message}`);
          
          // Clean up the temporary directory
          await fs.rm(retrieveDir, { recursive: true, force: true });
          
          return {
            raw: dataBuffer.toString(),
            cid
          };
        }
      } catch (retrievalError) {
        // If gateway retrieval fails, try using the w3 CLI directly
        logger.warn(`[w3cli-provider] Gateway retrieval failed, trying w3 CLI: ${retrievalError.message}`);
        
        try {
          const tempFilePath = path.join(retrieveDir, 'data.json');
          await execAsync(`w3 cat ${cid} > ${tempFilePath}`);
          
          // Read the retrieved data 
          const dataBuffer = await fs.readFile(tempFilePath);
          
          try {
            // Try to parse the data as JSON
            const data = JSON.parse(dataBuffer.toString());
            
            // Clean up the temporary directory
            await fs.rm(retrieveDir, { recursive: true, force: true });
            
            logger.info(`[w3cli-provider] Successfully retrieved and parsed data using w3 CLI for CID: ${cid}`);
            return data;
          } catch (parseError) {
            // If JSON parsing fails, return the raw data as string
            logger.warn(`[w3cli-provider] Retrieved data is not valid JSON: ${parseError.message}`);
            
            // Clean up the temporary directory
            await fs.rm(retrieveDir, { recursive: true, force: true });
            
            return {
              raw: dataBuffer.toString(),
              cid
            };
          }
        } catch (cliError) {
          logger.error(`[w3cli-provider] CLI retrieval also failed: ${cliError.message}`);
          
          // Clean up the temporary directory
          await fs.rm(retrieveDir, { recursive: true, force: true });
          
          return null;
        }
      }
    } catch (error) {
      logger.error('[w3cli-provider] Retrieval failed:', error);
      return null;
    }
  }
}

// Export a singleton instance
export const w3cliProvider = new W3CLIProvider(process.env.WEB3_STORAGE_EMAIL);