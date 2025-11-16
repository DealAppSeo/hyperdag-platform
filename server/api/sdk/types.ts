/**
 * Type definitions for the HyperDAG Developer SDK
 */

/**
 * Project creation parameters
 */
export interface ProjectParams {
  title: string;
  description: string;
  type: 'rfi' | 'rfp'; // Request for Information or Request for Proposal
  categories: string[];
  teamRoles?: string[];
  fundingGoal?: number;
  durationDays?: number;
  stakeTokens?: boolean; // Whether to stake HDAG tokens
}

/**
 * Team member data structure
 */
export interface TeamMember {
  id: number;
  username: string;
  skills: string[];
  experience: number;
  persona: string;
  walletAddress?: string;
  reputation: number;
}

/**
 * Team structure for project matching
 */
export interface Team {
  id: string;
  members: TeamMember[];
  matchScore: number;
  requiredRoles: string[];
  completedRoles: string[];
  missingRoles: string[];
}

/**
 * Network metrics structure
 */
export interface NetworkMetrics {
  tps: number; // Transactions per second
  averageLatency: number; // Average latency in milliseconds
  confirmedTxs: number; // Total confirmed transactions
  pendingTxs: number; // Pending transactions
  activeNodes: number; // Number of active nodes
}

/**
 * API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

/**
 * SDK configuration options
 */
export interface SDKOptions {
  baseUrl?: string;
  apiKey?: string;
  network?: 'mainnet' | 'testnet' | 'localhost';
  debug?: boolean;
}
