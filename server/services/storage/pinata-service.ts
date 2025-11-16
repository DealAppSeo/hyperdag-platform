/**
 * Pinata IPFS Pinning Service
 * 
 * Comprehensive IPFS file pinning, unpinning, and metadata management service
 * using Pinata Cloud for HyperDAG ecosystem applications.
 * 
 * Features:
 * - File upload and pinning to IPFS
 * - Pin management (list, unpin, update metadata)
 * - Gateway access and retrieval
 * - Analytics and usage tracking
 * - Quota management and cost optimization
 * - Metadata tagging and organization
 */

import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import crypto from 'crypto';

// ================== INTERFACES ==================

interface PinataConfig {
  apiKey?: string;
  secretApiKey?: string;
  gatewayUrl: string;
  apiUrl: string;
}

interface PinataAuthResponse {
  authenticated: boolean;
}

interface PinFileOptions {
  pinataMetadata?: {
    name?: string;
    keyvalues?: Record<string, string | number>;
  };
  pinataOptions?: {
    cidVersion?: 0 | 1;
    wrapWithDirectory?: boolean;
    customPinPolicy?: {
      regions: Array<{
        id: string;
        desiredReplicationCount: number;
      }>;
    };
  };
}

interface PinJSONOptions {
  pinataMetadata?: {
    name?: string;
    keyvalues?: Record<string, string | number>;
  };
  pinataOptions?: {
    cidVersion?: 0 | 1;
    customPinPolicy?: {
      regions: Array<{
        id: string;
        desiredReplicationCount: number;
      }>;
    };
  };
}

interface PinataFileResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate?: boolean;
}

interface PinataJSONResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate?: boolean;
}

interface PinListQuery {
  cid?: string;
  pinStart?: string;
  pinEnd?: string;
  unpinStart?: string;
  unpinEnd?: string;
  pinSizeMin?: number;
  pinSizeMax?: number;
  status?: 'all' | 'pinned' | 'unpinned' | 'pinning' | 'failed';
  pageLimit?: number;
  pageOffset?: number;
  metadata?: {
    name?: string;
    keyvalues?: Record<string, { value: string | number; op: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' }>
  };
}

interface PinListItem {
  id: string;
  ipfs_pin_hash: string;
  size: number;
  user_id: string;
  date_pinned: string;
  date_unpinned?: string;
  metadata: {
    name?: string;
    keyvalues?: Record<string, string | number>;
  };
  regions: Array<{
    regionId: string;
    currentReplicationCount: number;
    desiredReplicationCount: number;
  }>;
  mime_type?: string;
  number_of_files?: number;
}

interface PinListResponse {
  count: number;
  rows: PinListItem[];
}

interface UploadResult {
  ipfsHash: string;
  pinSize: number;
  timestamp: string;
  isDuplicate: boolean;
  gatewayUrl: string;
  provider: string;
  cost: number;
  success: boolean;
}

interface PinataUsage {
  pin_count: {
    used: number;
    limit: number;
  };
  pin_size: {
    used: number;
    limit: number;
  };
  bandwidth: {
    used: number;
    limit: number;
  };
}

// ================== MAIN SERVICE ==================

export class PinataService {
  private config: PinataConfig;
  private isInitialized: boolean = false;
  private lastUsageCheck: number = 0;
  private usageCheckInterval: number = 300000; // 5 minutes
  private currentUsage: PinataUsage | null = null;

  constructor() {
    this.config = {
      apiKey: process.env.PINATA_API_KEY,
      secretApiKey: process.env.PINATA_SECRET_API_KEY,
      gatewayUrl: process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs',
      apiUrl: 'https://api.pinata.cloud'
    };

    if (this.config.apiKey && this.config.secretApiKey) {
      this.initialize();
    } else {
      console.log('[Pinata] Service configured - waiting for API credentials setup');
    }
  }

  /**
   * Initialize the service and test authentication
   */
  private async initialize(): Promise<void> {
    try {
      const isAuthenticated = await this.testAuthentication();
      if (isAuthenticated) {
        this.isInitialized = true;
        console.log('[Pinata] Service successfully initialized and authenticated');
        
        // Load initial usage stats
        await this.refreshUsageStats();
        console.log('[Pinata] Initial usage stats loaded');
      } else {
        console.error('[Pinata] Authentication failed - invalid API credentials');
      }
    } catch (error) {
      console.error('[Pinata] Failed to initialize service:', error);
    }
  }

  /**
   * Test API authentication
   */
  async testAuthentication(): Promise<boolean> {
    if (!this.config.apiKey || !this.config.secretApiKey) {
      return false;
    }

    try {
      const response = await axios.get(`${this.config.apiUrl}/data/testAuthentication`, {
        headers: this.getAuthHeaders()
      });

      const data: PinataAuthResponse = response.data;
      return data.authenticated === true;
    } catch (error) {
      console.error('[Pinata] Authentication test failed:', error);
      return false;
    }
  }

  /**
   * Check if service is available and has quota
   */
  isAvailable(): boolean {
    if (!this.isInitialized) {
      return false;
    }

    // Check if we have quota available
    if (this.currentUsage) {
      const hasFileQuota = this.currentUsage.pin_count.used < this.currentUsage.pin_count.limit;
      const hasSizeQuota = this.currentUsage.pin_size.used < this.currentUsage.pin_size.limit;
      return hasFileQuota && hasSizeQuota;
    }

    return true; // Assume available if we don't have usage data yet
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    return {
      'pinata_api_key': this.config.apiKey!,
      'pinata_secret_api_key': this.config.secretApiKey!
    };
  }

  /**
   * Refresh usage statistics
   */
  private async refreshUsageStats(): Promise<void> {
    if (Date.now() - this.lastUsageCheck < this.usageCheckInterval) {
      return; // Don't check too frequently
    }

    try {
      const response = await axios.get(`${this.config.apiUrl}/data/userPinnedDataTotal`, {
        headers: this.getAuthHeaders()
      });

      // Pinata doesn't provide exact quota limits in free tier, so we estimate
      this.currentUsage = {
        pin_count: {
          used: response.data.pin_count || 0,
          limit: 100 // Free tier typical limit
        },
        pin_size: {
          used: response.data.pin_size_total || 0,
          limit: 1024 * 1024 * 1024 // 1GB typical free tier limit
        },
        bandwidth: {
          used: 0, // Not provided by this endpoint
          limit: 1024 * 1024 * 1024 // 1GB typical monthly bandwidth
        }
      };

      this.lastUsageCheck = Date.now();
      console.log(`[Pinata] Usage stats updated: ${this.currentUsage.pin_count.used}/${this.currentUsage.pin_count.limit} files, ${(this.currentUsage.pin_size.used / (1024*1024)).toFixed(2)}MB used`);
    } catch (error) {
      console.error('[Pinata] Failed to refresh usage stats:', error);
    }
  }

  // ================== FILE OPERATIONS ==================

  /**
   * Upload and pin a file to IPFS
   */
  async pinFile(
    fileBuffer: Buffer,
    fileName: string,
    options: PinFileOptions = {}
  ): Promise<UploadResult> {
    if (!this.isAvailable()) {
      throw new Error('Pinata service not available or quota exceeded');
    }

    const startTime = Date.now();

    try {
      await this.refreshUsageStats();

      const form = new FormData();
      form.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'application/octet-stream'
      });

      // Add metadata if provided
      if (options.pinataMetadata) {
        form.append('pinataMetadata', JSON.stringify(options.pinataMetadata));
      }

      // Add pinning options if provided
      if (options.pinataOptions) {
        form.append('pinataOptions', JSON.stringify(options.pinataOptions));
      }

      const response: AxiosResponse<PinataFileResponse> = await axios.post(
        `${this.config.apiUrl}/pinning/pinFileToIPFS`,
        form,
        {
          headers: {
            ...this.getAuthHeaders(),
            ...form.getHeaders()
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      const result = response.data;
      const latency = Date.now() - startTime;

      console.log(`[Pinata] Successfully pinned ${fileName} (${fileBuffer.length} bytes) as ${result.IpfsHash} in ${latency}ms`);

      return {
        ipfsHash: result.IpfsHash,
        pinSize: result.PinSize,
        timestamp: result.Timestamp,
        isDuplicate: result.isDuplicate || false,
        gatewayUrl: `${this.config.gatewayUrl}/${result.IpfsHash}`,
        provider: 'Pinata',
        cost: this.calculateCost(result.PinSize),
        success: true
      };

    } catch (error: any) {
      const latency = Date.now() - startTime;
      console.error('[Pinata] File upload failed:', error.response?.data || error.message);
      
      throw new Error(`Pinata file upload failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Upload and pin JSON data to IPFS
   */
  async pinJSON(
    jsonData: any,
    options: PinJSONOptions = {}
  ): Promise<UploadResult> {
    if (!this.isAvailable()) {
      throw new Error('Pinata service not available or quota exceeded');
    }

    const startTime = Date.now();

    try {
      await this.refreshUsageStats();

      const requestBody = {
        pinataContent: jsonData,
        pinataMetadata: options.pinataMetadata || {
          name: 'HyperDAG JSON Data',
          keyvalues: {
            type: 'json',
            uploaded_by: 'hyperdag',
            timestamp: new Date().toISOString()
          }
        },
        pinataOptions: options.pinataOptions || {}
      };

      const response: AxiosResponse<PinataJSONResponse> = await axios.post(
        `${this.config.apiUrl}/pinning/pinJSONToIPFS`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          }
        }
      );

      const result = response.data;
      const latency = Date.now() - startTime;

      console.log(`[Pinata] Successfully pinned JSON data as ${result.IpfsHash} in ${latency}ms`);

      return {
        ipfsHash: result.IpfsHash,
        pinSize: result.PinSize,
        timestamp: result.Timestamp,
        isDuplicate: result.isDuplicate || false,
        gatewayUrl: `${this.config.gatewayUrl}/${result.IpfsHash}`,
        provider: 'Pinata',
        cost: this.calculateCost(result.PinSize),
        success: true
      };

    } catch (error: any) {
      const latency = Date.now() - startTime;
      console.error('[Pinata] JSON upload failed:', error.response?.data || error.message);
      
      throw new Error(`Pinata JSON upload failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Pin an existing IPFS hash by CID
   */
  async pinByCID(
    cid: string,
    options: {
      pinataMetadata?: {
        name?: string;
        keyvalues?: Record<string, string | number>;
      };
    } = {}
  ): Promise<{ success: boolean; message: string }> {
    if (!this.isAvailable()) {
      throw new Error('Pinata service not available or quota exceeded');
    }

    try {
      const requestBody = {
        hashToPin: cid,
        pinataMetadata: options.pinataMetadata || {
          name: `Pinned CID: ${cid}`,
          keyvalues: {
            pinned_by: 'hyperdag',
            timestamp: new Date().toISOString()
          }
        }
      };

      const response = await axios.post(
        `${this.config.apiUrl}/pinning/pinByHash`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          }
        }
      );

      console.log(`[Pinata] Successfully pinned existing CID: ${cid}`);
      
      return {
        success: true,
        message: `Successfully pinned CID: ${cid}`
      };

    } catch (error: any) {
      console.error('[Pinata] Pin by CID failed:', error.response?.data || error.message);
      
      return {
        success: false,
        message: `Failed to pin CID: ${error.response?.data?.error || error.message}`
      };
    }
  }

  // ================== PIN MANAGEMENT ==================

  /**
   * List pinned files with optional filtering
   */
  async listPinnedFiles(query: PinListQuery = {}): Promise<PinListResponse> {
    if (!this.isInitialized) {
      throw new Error('Pinata service not initialized');
    }

    try {
      const params = new URLSearchParams();
      
      // Add query parameters
      if (query.cid) params.append('hashContains', query.cid);
      if (query.pinStart) params.append('pinStart', query.pinStart);
      if (query.pinEnd) params.append('pinEnd', query.pinEnd);
      if (query.unpinStart) params.append('unpinStart', query.unpinStart);
      if (query.unpinEnd) params.append('unpinEnd', query.unpinEnd);
      if (query.pinSizeMin) params.append('pinSizeMin', query.pinSizeMin.toString());
      if (query.pinSizeMax) params.append('pinSizeMax', query.pinSizeMax.toString());
      if (query.status && query.status !== 'all') params.append('status', query.status);
      if (query.pageLimit) params.append('pageLimit', query.pageLimit.toString());
      if (query.pageOffset) params.append('pageOffset', query.pageOffset.toString());

      // Add metadata filters
      if (query.metadata) {
        if (query.metadata.name) {
          params.append('metadata[name]', query.metadata.name);
        }
        if (query.metadata.keyvalues) {
          Object.entries(query.metadata.keyvalues).forEach(([key, filter]) => {
            params.append(`metadata[keyvalues][${key}][value]`, filter.value.toString());
            params.append(`metadata[keyvalues][${key}][op]`, filter.op);
          });
        }
      }

      const response: AxiosResponse<PinListResponse> = await axios.get(
        `${this.config.apiUrl}/data/pinList?${params.toString()}`,
        {
          headers: this.getAuthHeaders()
        }
      );

      console.log(`[Pinata] Retrieved ${response.data.rows.length} pinned files`);
      return response.data;

    } catch (error: any) {
      console.error('[Pinata] List pinned files failed:', error.response?.data || error.message);
      throw new Error(`Failed to list pinned files: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Unpin a file by IPFS hash
   */
  async unpinFile(ipfsHash: string): Promise<{ success: boolean; message: string }> {
    if (!this.isInitialized) {
      throw new Error('Pinata service not initialized');
    }

    try {
      await axios.delete(`${this.config.apiUrl}/pinning/unpin/${ipfsHash}`, {
        headers: this.getAuthHeaders()
      });

      console.log(`[Pinata] Successfully unpinned file: ${ipfsHash}`);
      
      return {
        success: true,
        message: `Successfully unpinned file: ${ipfsHash}`
      };

    } catch (error: any) {
      console.error('[Pinata] Unpin failed:', error.response?.data || error.message);
      
      return {
        success: false,
        message: `Failed to unpin file: ${error.response?.data?.error || error.message}`
      };
    }
  }

  /**
   * Update metadata for a pinned file
   */
  async updateMetadata(
    ipfsHash: string,
    metadata: {
      name?: string;
      keyvalues?: Record<string, string | number>;
    }
  ): Promise<{ success: boolean; message: string }> {
    if (!this.isInitialized) {
      throw new Error('Pinata service not initialized');
    }

    try {
      await axios.put(
        `${this.config.apiUrl}/pinning/hashMetadata`,
        {
          ipfsPinHash: ipfsHash,
          name: metadata.name,
          keyvalues: metadata.keyvalues
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          }
        }
      );

      console.log(`[Pinata] Successfully updated metadata for: ${ipfsHash}`);
      
      return {
        success: true,
        message: `Successfully updated metadata for: ${ipfsHash}`
      };

    } catch (error: any) {
      console.error('[Pinata] Update metadata failed:', error.response?.data || error.message);
      
      return {
        success: false,
        message: `Failed to update metadata: ${error.response?.data?.error || error.message}`
      };
    }
  }

  // ================== RETRIEVAL & GATEWAY ==================

  /**
   * Retrieve file content from IPFS gateway
   */
  async retrieveFile(ipfsHash: string, timeout: number = 10000): Promise<Buffer> {
    try {
      const response = await axios.get(`${this.config.gatewayUrl}/${ipfsHash}`, {
        responseType: 'arraybuffer',
        timeout
      });

      console.log(`[Pinata] Successfully retrieved file: ${ipfsHash} (${response.data.length} bytes)`);
      return Buffer.from(response.data);

    } catch (error: any) {
      console.error('[Pinata] File retrieval failed:', error.message);
      throw new Error(`Failed to retrieve file from IPFS: ${error.message}`);
    }
  }

  /**
   * Retrieve JSON data from IPFS gateway
   */
  async retrieveJSON(ipfsHash: string, timeout: number = 10000): Promise<any> {
    try {
      const response = await axios.get(`${this.config.gatewayUrl}/${ipfsHash}`, {
        responseType: 'json',
        timeout
      });

      console.log(`[Pinata] Successfully retrieved JSON: ${ipfsHash}`);
      return response.data;

    } catch (error: any) {
      console.error('[Pinata] JSON retrieval failed:', error.message);
      throw new Error(`Failed to retrieve JSON from IPFS: ${error.message}`);
    }
  }

  /**
   * Get gateway URL for an IPFS hash
   */
  getGatewayUrl(ipfsHash: string, filename?: string): string {
    const baseUrl = `${this.config.gatewayUrl}/${ipfsHash}`;
    return filename ? `${baseUrl}/${filename}` : baseUrl;
  }

  // ================== ANALYTICS & UTILITIES ==================

  /**
   * Calculate estimated cost for storage (free tier is $0)
   */
  private calculateCost(sizeBytes: number): number {
    // Pinata free tier - no cost calculation needed
    return 0;
  }

  /**
   * Get remaining quota information
   */
  getRemainingQuota(): {
    files: { used: number; limit: number; remaining: number };
    storage: { used: number; limit: number; remaining: number };
    bandwidth: { used: number; limit: number; remaining: number };
  } | null {
    if (!this.currentUsage) {
      return null;
    }

    return {
      files: {
        used: this.currentUsage.pin_count.used,
        limit: this.currentUsage.pin_count.limit,
        remaining: Math.max(0, this.currentUsage.pin_count.limit - this.currentUsage.pin_count.used)
      },
      storage: {
        used: this.currentUsage.pin_size.used,
        limit: this.currentUsage.pin_size.limit,
        remaining: Math.max(0, this.currentUsage.pin_size.limit - this.currentUsage.pin_size.used)
      },
      bandwidth: {
        used: this.currentUsage.bandwidth.used,
        limit: this.currentUsage.bandwidth.limit,
        remaining: Math.max(0, this.currentUsage.bandwidth.limit - this.currentUsage.bandwidth.used)
      }
    };
  }

  /**
   * Get service statistics
   */
  getStats() {
    const quota = this.getRemainingQuota();
    
    return {
      provider: 'Pinata IPFS',
      tier: 'free',
      initialized: this.isInitialized,
      available: this.isAvailable(),
      quota: quota ? {
        files: {
          percentage: (quota.files.used / quota.files.limit) * 100,
          remaining: quota.files.remaining
        },
        storage: {
          percentage: (quota.storage.used / quota.storage.limit) * 100,
          remainingMB: quota.storage.remaining / (1024 * 1024)
        },
        bandwidth: {
          percentage: (quota.bandwidth.used / quota.bandwidth.limit) * 100,
          remainingMB: quota.bandwidth.remaining / (1024 * 1024)
        }
      } : null,
      capabilities: [
        'file_pinning',
        'json_pinning',
        'pin_by_cid',
        'metadata_management',
        'gateway_access',
        'pin_listing',
        'batch_operations',
        'custom_gateways'
      ],
      config: {
        apiUrl: this.config.apiUrl,
        gatewayUrl: this.config.gatewayUrl,
        hasCredentials: !!(this.config.apiKey && this.config.secretApiKey)
      }
    };
  }

  /**
   * Generate a shareable gateway URL with optional filename
   */
  generateShareableUrl(ipfsHash: string, options: {
    filename?: string;
    download?: boolean;
  } = {}): string {
    let url = this.getGatewayUrl(ipfsHash, options.filename);
    
    if (options.download) {
      url += '?download=true';
    }
    
    return url;
  }

  /**
   * Batch operation: Pin multiple files
   */
  async batchPinFiles(
    files: Array<{
      buffer: Buffer;
      filename: string;
      metadata?: PinFileOptions['pinataMetadata'];
    }>
  ): Promise<Array<UploadResult | { error: string; filename: string }>> {
    const results: Array<UploadResult | { error: string; filename: string }> = [];

    for (const file of files) {
      try {
        const result = await this.pinFile(file.buffer, file.filename, {
          pinataMetadata: file.metadata
        });
        results.push(result);
      } catch (error: any) {
        results.push({
          error: error.message,
          filename: file.filename
        });
      }
    }

    return results;
  }

  /**
   * Batch operation: Unpin multiple files
   */
  async batchUnpinFiles(ipfsHashes: string[]): Promise<Array<{ 
    ipfsHash: string; 
    success: boolean; 
    message: string 
  }>> {
    const results: Array<{ ipfsHash: string; success: boolean; message: string }> = [];

    for (const hash of ipfsHashes) {
      try {
        const result = await this.unpinFile(hash);
        results.push({
          ipfsHash: hash,
          success: result.success,
          message: result.message
        });
      } catch (error: any) {
        results.push({
          ipfsHash: hash,
          success: false,
          message: error.message
        });
      }
    }

    return results;
  }
}

// ================== SINGLETON EXPORT ==================

export const pinataService = new PinataService();
export default pinataService;