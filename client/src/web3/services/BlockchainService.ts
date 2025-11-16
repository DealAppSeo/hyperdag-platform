/**
 * Blockchain Service
 * 
 * This service provides utilities for interacting with the HyperDAG blockchain contracts
 * from the frontend, using both direct Web3 connections and API endpoints.
 */

import { ethers } from 'ethers';
import { apiRequest } from '../../lib/queryClient';

// ABI fragments for direct interaction when needed
const HYPERCROWD_ABI_FRAGMENT = [
  // Basic functions that might be needed client-side
  'function getProject(uint256 projectId) external view returns (tuple(uint256 id, address creator, string title, string description, string[] categories, string[] requiredRoles, uint256 fundingGoal, uint256 currentFunding, uint256 durationDays, uint256 createdAt, uint256 completedAt, bool isActive, bool isFunded, uint8 projectType))',
  'function getTotalProjects() external view returns (uint256)',
  'function getPlatformFeePercent() external view returns (uint16)',
];

const HDAG_TOKEN_ABI_FRAGMENT = [
  'function balanceOf(address account) external view returns (uint256)',
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
];

// Contract addresses (to be set by the provider)
let hyperCrowdAddress: string | null = null;
let hdagTokenAddress: string | null = null;

// Types
export type Project = {
  id: number;
  creator: string;
  title: string;
  description: string;
  categories: string[];
  requiredRoles: string[];
  fundingGoal: string; // ETH value as string
  currentFunding: string; // ETH value as string
  durationDays: number;
  createdAt: Date;
  completedAt: Date | null;
  isActive: boolean;
  isFunded: boolean;
  projectType: 'RFI' | 'RFP';
};

export type TeamMember = {
  address: string;
  role: string;
  reputationScore: number;
  joinedAt: Date;
  isActive: boolean;
};

export type Proposal = {
  id: number;
  projectId: number;
  proposer: string;
  description: string;
  amount: string; // ETH value as string
  createdAt: Date;
  isAccepted: boolean;
};

export type NetworkStatus = {
  connected: boolean;
  chainId: number | null;
  networkName: string | null;
  blockNumber: number | null;
  provider: ethers.JsonRpcProvider | null;
};

export type NetworkMetrics = {
  tps: number;
  averageLatency: number;
  confirmedTxs: number;
  pendingTxs: number;
  activeNodes: number;
};

/**
 * Initialize the blockchain service with contract addresses
 * @param hypercrowdContractAddress The HyperCrowd contract address
 * @param hdagTokenContractAddress The HDAG token contract address
 */
export function initialize(hypercrowdContractAddress?: string, hdagTokenContractAddress?: string) {
  if (hypercrowdContractAddress) {
    hyperCrowdAddress = hypercrowdContractAddress;
  }
  
  if (hdagTokenContractAddress) {
    hdagTokenAddress = hdagTokenContractAddress;
  }
}

/**
 * Get the current network status
 * @param provider The ethers provider
 * @returns Network status information
 */
export async function getNetworkStatus(provider: ethers.JsonRpcProvider): Promise<NetworkStatus> {
  try {
    const [network, blockNumber] = await Promise.all([
      provider.getNetwork(),
      provider.getBlockNumber()
    ]);
    
    // Get the network name based on the chain ID
    let networkName = 'Unknown';
    
    // Map chain IDs to network names
    const networks: Record<number, string> = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai Testnet',
      1101: 'Polygon zkEVM Mainnet',
      2442: 'Polygon zkEVM Cardona Testnet',
    };
    
    if (networks[Number(network.chainId)]) {
      networkName = networks[Number(network.chainId)];
    }
    
    return {
      connected: true,
      chainId: Number(network.chainId),
      networkName,
      blockNumber,
      provider
    };
  } catch (error) {
    console.error('Error getting network status:', error);
    return {
      connected: false,
      chainId: null,
      networkName: null,
      blockNumber: null,
      provider: null
    };
  }
}

/**
 * Get the latest network metrics
 * @returns Network performance metrics
 */
export async function getNetworkMetrics(): Promise<NetworkMetrics> {
  try {
    const response = await apiRequest('GET', '/api/v1/network/metrics');
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting network metrics:', error);
    throw error;
  }
}

/**
 * Get the blockchain health status
 * @returns Boolean indicating if the blockchain connection is healthy
 */
export async function getBlockchainHealth(): Promise<boolean> {
  try {
    const response = await apiRequest('GET', '/api/blockchain/health');
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error checking blockchain health:', error);
    return false;
  }
}

/**
 * Get the total number of projects
 * @returns The total project count
 */
export async function getTotalProjects(): Promise<number> {
  try {
    const response = await apiRequest('GET', '/api/blockchain/projects');
    const result = await response.json();
    return result.data?.totalProjects || 0;
  } catch (error) {
    console.error('Error getting total projects:', error);
    return 0;
  }
}

/**
 * Get a project by ID
 * @param projectId The ID of the project
 * @returns The project details
 */
export async function getProject(projectId: number): Promise<Project | null> {
  try {
    const response = await apiRequest('GET', `/api/blockchain/projects/${projectId}`);
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error(`Error getting project ${projectId}:`, error);
    return null;
  }
}

/**
 * Get the team members for a project
 * @param projectId The ID of the project
 * @returns Array of team members
 */
export async function getProjectTeam(projectId: number): Promise<TeamMember[]> {
  try {
    const response = await apiRequest('GET', `/api/blockchain/projects/${projectId}/team`);
    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error(`Error getting project team for project ${projectId}:`, error);
    return [];
  }
}

/**
 * Get the proposals for a project
 * @param projectId The ID of the project
 * @returns Array of proposals
 */
export async function getProjectProposals(projectId: number): Promise<Proposal[]> {
  try {
    const response = await apiRequest('GET', `/api/blockchain/projects/${projectId}/proposals`);
    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error(`Error getting proposals for project ${projectId}:`, error);
    return [];
  }
}

/**
 * Get projects created by a user
 * @param address The wallet address of the user
 * @returns Array of project IDs
 */
export async function getUserProjects(address: string): Promise<number[]> {
  try {
    const response = await apiRequest('GET', `/api/blockchain/users/${address}/projects`);
    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error(`Error getting projects for user ${address}:`, error);
    return [];
  }
}

/**
 * Get projects joined by a user
 * @param address The wallet address of the user
 * @returns Array of project IDs
 */
export async function getUserJoinedProjects(address: string): Promise<number[]> {
  try {
    const response = await apiRequest('GET', `/api/blockchain/users/${address}/joined`);
    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error(`Error getting joined projects for user ${address}:`, error);
    return [];
  }
}

/**
 * Get the token balance for a user
 * @param address The wallet address of the user
 * @returns The token balance as a string (in ETH format)
 */
export async function getTokenBalance(address: string): Promise<string> {
  try {
    const response = await apiRequest('GET', `/api/blockchain/tokens/${address}/balance`);
    const result = await response.json();
    return result.success ? result.data.balance : '0';
  } catch (error) {
    console.error(`Error getting token balance for user ${address}:`, error);
    return '0';
  }
}

/**
 * Get the token balance directly from the blockchain
 * @param provider The ethers provider
 * @param address The wallet address of the user
 * @returns The token balance as a string (in ETH format)
 */
export async function getTokenBalanceDirect(provider: ethers.JsonRpcProvider, address: string): Promise<string> {
  try {
    if (!hdagTokenAddress) {
      throw new Error('HDAG token address not set');
    }
    
    const tokenContract = new ethers.Contract(hdagTokenAddress, HDAG_TOKEN_ABI_FRAGMENT, provider);
    const balance = await tokenContract.balanceOf(address);
    
    return ethers.formatEther(balance);
  } catch (error) {
    console.error(`Error getting direct token balance for user ${address}:`, error);
    return '0';
  }
}

/**
 * Send a transaction to create a project
 * @param provider The ethers provider
 * @param signer The ethers signer
 * @param projectData The project data
 * @returns Transaction hash
 */
export async function createProject(
  provider: ethers.JsonRpcProvider,
  signer: ethers.JsonRpcSigner,
  projectData: {
    title: string;
    description: string;
    categories: string[];
    requiredRoles: string[];
    fundingGoal: string; // ETH value as string
    durationDays: number;
    projectType: 0 | 1; // 0 = RFI, 1 = RFP
  }
): Promise<string> {
  try {
    if (!hyperCrowdAddress) {
      throw new Error('HyperCrowd contract address not set');
    }
    
    const contract = new ethers.Contract(hyperCrowdAddress, HYPERCROWD_ABI_FRAGMENT, provider).connect(signer);
    
    const fundingGoalWei = ethers.parseEther(projectData.fundingGoal);
    
    const tx = await contract.createProject(
      projectData.title,
      projectData.description,
      projectData.categories,
      projectData.requiredRoles,
      fundingGoalWei,
      projectData.durationDays,
      projectData.projectType
    );
    
    return tx.hash;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

/**
 * Fund a project
 * @param provider The ethers provider
 * @param signer The ethers signer
 * @param projectId The ID of the project
 * @param amount The amount to fund in ETH
 * @returns Transaction hash
 */
export async function fundProject(
  provider: ethers.JsonRpcProvider,
  signer: ethers.JsonRpcSigner,
  projectId: number,
  amount: string
): Promise<string> {
  try {
    if (!hyperCrowdAddress) {
      throw new Error('HyperCrowd contract address not set');
    }
    
    const contract = new ethers.Contract(hyperCrowdAddress, HYPERCROWD_ABI_FRAGMENT, provider).connect(signer);
    
    const tx = await contract.fundProject(projectId, {
      value: ethers.parseEther(amount)
    });
    
    return tx.hash;
  } catch (error) {
    console.error(`Error funding project ${projectId}:`, error);
    throw error;
  }
}

/**
 * Join a project team
 * @param provider The ethers provider
 * @param signer The ethers signer
 * @param projectId The ID of the project
 * @param role The role to join as
 * @returns Transaction hash
 */
export async function joinTeam(
  provider: ethers.JsonRpcProvider,
  signer: ethers.JsonRpcSigner,
  projectId: number,
  role: string
): Promise<string> {
  try {
    if (!hyperCrowdAddress) {
      throw new Error('HyperCrowd contract address not set');
    }
    
    const contract = new ethers.Contract(hyperCrowdAddress, HYPERCROWD_ABI_FRAGMENT, provider).connect(signer);
    
    const tx = await contract.joinTeam(projectId, role);
    
    return tx.hash;
  } catch (error) {
    console.error(`Error joining team for project ${projectId}:`, error);
    throw error;
  }
}
