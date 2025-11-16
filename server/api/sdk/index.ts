/**
 * HyperDAG Developer SDK
 * 
 * This SDK provides a set of tools and utilities for developers to integrate with the HyperDAG platform.
 * It includes functionality for creating projects, matching teams, and interacting with the blockchain.
 */

import { ethers } from 'ethers';
import type { ProjectParams, TeamMember, Team, ApiResponse, SDKOptions, NetworkMetrics } from './types';
import { createProjectSchema } from '@shared/schema';
import { ZodError } from 'zod';

class HyperDAGSDK {
  private apiKey: string | null = null;
  private baseUrl: string;
  private network: 'mainnet' | 'testnet' | 'localhost';
  private debug: boolean;
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private walletConnected: boolean = false;
  
  /**
   * Constructor for the HyperDAG SDK
   * @param options Configuration options
   */
  constructor(options: SDKOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:5000/api';
    this.apiKey = options.apiKey || null;
    this.network = options.network || 'testnet';
    this.debug = options.debug || false;
  }
  
  /**
   * Connect to the HyperDAG platform using Web3 wallet
   * @returns Promise resolving to connection success status
   */
  async connect(): Promise<boolean> {
    try {
      // Check if window object exists (browser environment)
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        this.walletConnected = true;
        this.log('Connected to Web3 provider');
        return true;
      } else {
        // Fallback for server-side or non-Web3 environments
        if (this.apiKey) {
          // Use API key authentication
          this.log('Using API key authentication');
          return true;
        }
        throw new Error('No Web3 provider detected and no API key provided');
      }
    } catch (error) {
      this.log('Failed to connect:', error);
      return false;
    }
  }
  
  /**
   * Create a new project on the HyperDAG platform
   * @param params Project parameters
   * @returns Promise resolving to project ID
   */
  async createProject(params: ProjectParams): Promise<string> {
    try {
      // Validate project parameters against schema
      const validationResult = createProjectSchema.safeParse(params);
      
      if (!validationResult.success) {
        throw new Error(`Invalid project parameters: ${validationResult.error.message}`);
      }
      
      const response = await this.apiRequest<{id: number}>('/projects', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params)
      });
      
      return response.data.id.toString();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation failed: ${error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Match teams for a project based on skills and requirements
   * @param projectId Project ID
   * @returns Promise resolving to array of matched teams
   */
  async matchTeams(projectId: string): Promise<Team[]> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    
    const response = await this.apiRequest<{teams: Team[]}>(`/projects/${projectId}/teams/match`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    return response.data.teams;
  }
  
  /**
   * Get transaction metrics for the HyperDAG network
   * @returns Promise resolving to transaction metrics
   */
  async getNetworkMetrics(): Promise<NetworkMetrics> {
    const response = await this.apiRequest<NetworkMetrics>('/network/metrics', {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    return response.data;
  }
  
  /**
   * Submit a transaction to the HyperDAG network
   * @param txData Transaction data
   * @returns Promise resolving to transaction hash
   */
  async submitTransaction(txData: any): Promise<string> {
    if (!this.walletConnected || !this.signer) {
      throw new Error('Wallet not connected. Call connect() first.');
    }
    
    // This is a simplified version. In a real implementation, we would:
    // 1. Create a transaction object
    // 2. Sign it with the signer
    // 3. Submit it to the network
    
    const response = await this.apiRequest<{txHash: string}>('/transactions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(txData)
    });
    
    return response.data.txHash;
  }
  
  /**
   * Get the user's HDAG token balance
   * @returns Promise resolving to token balance
   */
  async getTokenBalance(): Promise<number> {
    if (!this.walletConnected && !this.apiKey) {
      throw new Error('Not authenticated. Call connect() first or provide an API key.');
    }
    
    const response = await this.apiRequest<{balance: number}>('/tokens/balance', {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    return response.data.balance;
  }
  
  /**
   * Make an API request to the HyperDAG platform
   * @param endpoint API endpoint
   * @param options Fetch options
   * @returns Promise resolving to API response
   */
  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      this.log(`Making API request to ${url}`);
      const response = await fetch(url, options);
      const data = await response.json() as ApiResponse<T>;
      
      if (!data.success) {
        throw new Error(data.error?.message || 'API request failed');
      }
      
      this.log(`API response received:`, data);
      return data;
    } catch (error) {
      this.log(`API request failed for ${url}:`, error);
      throw new Error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get headers for API requests
   * @returns Headers object
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    } else if (this.walletConnected && this.signer) {
      // In a real implementation, we would add a signed message for authentication
      // This is a simplified version
      headers['Authorization'] = `Web3 ${this.signer.address}`;
    }
    
    return headers;
  }
  
  /**
   * Log debug messages if debug mode is enabled
   * @param message Message to log
   * @param args Additional arguments
   */
  private log(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`[HyperDAG SDK] ${message}`, ...args);
    }
  }
}

export default HyperDAGSDK;
