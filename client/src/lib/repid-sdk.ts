/**
 * HyperDAG RepID SDK - Developer-friendly wrapper for ZKP Reputation System
 * 
 * Abstracts ZK proof complexity and provides simple methods for RepID operations.
 * Supports both mock mode (for testing) and production ZKP mode.
 */

export interface RepIDScore {
  category: 'governance' | 'community' | 'technical' | 'faithtech' | 'defi' | 'custom';
  score: number;
  weight?: number;
}

export interface RepIDProfile {
  wallet: string;
  scores: RepIDScore[];
  totalScore: number;
  level: number;
  nftTokenId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRepIDOptions {
  wallet: string;
  scores: RepIDScore[];
  mockMode?: boolean; // Skip ZKP generation for testing
  biometricChallenge?: string; // For 4FA integration
}

export interface VerifyRepIDOptions {
  wallet: string;
  threshold?: number;
  category?: string;
  mockMode?: boolean;
}

export interface SDKConfig {
  apiUrl?: string;
  mockMode?: boolean;
  enableRealTimeGasCosts?: boolean;
  timeout?: number;
}

/**
 * Main RepID SDK class
 */
export class RepIDSDK {
  private apiUrl: string;
  private mockMode: boolean;
  private enableRealTimeGasCosts: boolean;
  private timeout: number;

  constructor(config: SDKConfig = {}) {
    this.apiUrl = config.apiUrl || '/api/zkp-repid';
    this.mockMode = config.mockMode || false;
    this.enableRealTimeGasCosts = config.enableRealTimeGasCosts || true;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Create a new RepID with ZK proof verification
   * 
   * @example
   * ```typescript
   * const repid = await sdk.createRepID({
   *   wallet: '0x...',
   *   scores: [
   *     { category: 'governance', score: 750 },
   *     { category: 'technical', score: 850 }
   *   ]
   * });
   * ```
   */
  async createRepID(options: CreateRepIDOptions): Promise<RepIDProfile> {
    try {
      const endpoint = options.mockMode || this.mockMode ? '/create-mock' : '/create';
      
      // Estimate gas costs if enabled
      const gasCost = this.enableRealTimeGasCosts ? 
        await this.estimateGasCosts('create') : null;

      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: options.wallet,
          scores: options.scores,
          biometricChallenge: options.biometricChallenge,
          gasCostEstimate: gasCost
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`RepID creation failed: ${response.statusText}`);
      }

      const result = await response.json();
      return this.transformToProfile(result);
    } catch (error: any) {
      throw new Error(`Failed to create RepID: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Verify RepID meets threshold without revealing exact score
   * 
   * @example
   * ```typescript
   * const isValid = await sdk.verifyRepID({
   *   wallet: '0x...',
   *   threshold: 800,
   *   category: 'governance'
   * });
   * ```
   */
  async verifyRepID(options: VerifyRepIDOptions): Promise<boolean> {
    try {
      const endpoint = options.mockMode || this.mockMode ? '/verify-mock' : '/verify';
      
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: options.wallet,
          threshold: options.threshold,
          category: options.category
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`RepID verification failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.verified === true;
    } catch (error: any) {
      throw new Error(`Failed to verify RepID: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get RepID profile data (public information only)
   */
  async getRepIDProfile(wallet: string): Promise<RepIDProfile | null> {
    try {
      const response = await fetch(`${this.apiUrl}/data/${wallet}`, {
        signal: AbortSignal.timeout(this.timeout)
      });

      if (response.status === 404) {
        return null; // No RepID found
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch RepID: ${response.statusText}`);
      }

      const result = await response.json();
      return this.transformToProfile(result);
    } catch (error: any) {
      throw new Error(`Failed to get RepID profile: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Update RepID scores with new achievements
   */
  async updateRepIDScores(wallet: string, newScores: RepIDScore[], mockMode?: boolean): Promise<RepIDProfile> {
    try {
      const endpoint = mockMode || this.mockMode ? '/update-mock' : '/update';
      
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          scores: newScores
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`RepID update failed: ${response.statusText}`);
      }

      const result = await response.json();
      return this.transformToProfile(result);
    } catch (error: any) {
      throw new Error(`Failed to update RepID: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Batch verify multiple RepIDs efficiently
   */
  async batchVerifyRepIDs(requests: VerifyRepIDOptions[]): Promise<boolean[]> {
    try {
      const hasMockMode = requests.some(r => r.mockMode) || this.mockMode;
      const endpoint = hasMockMode ? '/batch-verify-mock' : '/batch';
      
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests }),
        signal: AbortSignal.timeout(this.timeout * 2) // Longer timeout for batch
      });

      if (!response.ok) {
        throw new Error(`Batch verification failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.results || [];
    } catch (error: any) {
      throw new Error(`Failed to batch verify RepIDs: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get real-time gas cost estimates for operations
   */
  async estimateGasCosts(operation: 'create' | 'update' | 'verify' | 'batch'): Promise<{
    gasPrice: string;
    estimatedCost: string;
    costUSD?: number;
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/gas-estimate/${operation}`, {
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Gas estimation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // Return fallback estimates if service unavailable
      return {
        gasPrice: '30000000000', // 30 gwei fallback
        estimatedCost: '0.01', // $0.01 fallback
        costUSD: 0.01
      };
    }
  }

  /**
   * Check if user has existing RepID
   */
  async hasRepID(wallet: string): Promise<boolean> {
    const profile = await this.getRepIDProfile(wallet);
    return profile !== null;
  }

  /**
   * Get RepID level based on total score
   */
  static getRepIDLevel(totalScore: number): number {
    if (totalScore >= 5000) return 5; // Master
    if (totalScore >= 3000) return 4; // Expert  
    if (totalScore >= 1500) return 3; // Advanced
    if (totalScore >= 500) return 2;  // Intermediate
    return 1; // Beginner
  }

  /**
   * Enable/disable mock mode for testing
   */
  setMockMode(enabled: boolean): void {
    this.mockMode = enabled;
  }

  /**
   * Get SDK configuration
   */
  getConfig(): SDKConfig {
    return {
      apiUrl: this.apiUrl,
      mockMode: this.mockMode,
      enableRealTimeGasCosts: this.enableRealTimeGasCosts,
      timeout: this.timeout
    };
  }

  private transformToProfile(apiResult: any): RepIDProfile {
    return {
      wallet: apiResult.wallet,
      scores: apiResult.scores || [],
      totalScore: apiResult.totalScore || 0,
      level: RepIDSDK.getRepIDLevel(apiResult.totalScore || 0),
      nftTokenId: apiResult.nftTokenId,
      createdAt: new Date(apiResult.createdAt),
      updatedAt: new Date(apiResult.updatedAt)
    };
  }
}

// Export convenience functions for quick usage
export const repidSDK = new RepIDSDK();

/**
 * Quick create RepID function
 */
export const createRepID = (options: CreateRepIDOptions) => repidSDK.createRepID(options);

/**
 * Quick verify RepID function  
 */
export const verifyRepID = (options: VerifyRepIDOptions) => repidSDK.verifyRepID(options);

/**
 * Quick get profile function
 */
export const getRepIDProfile = (wallet: string) => repidSDK.getRepIDProfile(wallet);