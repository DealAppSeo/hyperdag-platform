/**
 * Contract Service
 * 
 * This service provides utilities for interacting with the HyperDAG smart contracts.
 */

import { ethers } from 'ethers';
import { log } from '../../vite';

// ABI for the HyperCrowd contract
// This is a simplified ABI with just the functions we need for the MVP
const HYPERCROWD_ABI = [
  // Project management
  'function createProject(string memory title, string memory description, string[] memory categories, string[] memory requiredRoles, uint256 fundingGoal, uint256 durationDays, uint8 projectType) external returns (uint256)',
  'function fundProject(uint256 projectId) external payable',
  'function getProject(uint256 projectId) external view returns (tuple(uint256 id, address creator, string title, string description, string[] categories, string[] requiredRoles, uint256 fundingGoal, uint256 currentFunding, uint256 durationDays, uint256 createdAt, uint256 completedAt, bool isActive, bool isFunded, uint8 projectType))',
  'function getTotalProjects() external view returns (uint256)',
  // Team management
  'function joinTeam(uint256 projectId, string memory role) external',
  'function getProjectTeam(uint256 projectId) external view returns (tuple(address memberAddress, string role, uint256 reputationScore, uint256 joinedAt, bool isActive)[])',
  // Proposal management
  'function submitProposal(uint256 projectId, string memory description, uint256 amount) external returns (uint256)',
  'function acceptProposal(uint256 projectId, uint256 proposalId) external',
  'function getProjectProposals(uint256 projectId) external view returns (tuple(uint256 id, uint256 projectId, address proposer, string description, uint256 amount, uint256 createdAt, bool isAccepted)[])',
  // User data
  'function getUserProjects(address userAddress) external view returns (uint256[])',
  'function getUserJoinedProjects(address userAddress) external view returns (uint256[])',
  // Grant management
  'function createGrant(string memory name, string memory description, string[] memory categories) external payable returns (uint256)',
  'function createGrantMatch(uint256 grantId, uint256 projectId, uint256 amount, uint256 matchScore) external',
  'function approveGrantMatch(uint256 grantId, uint256 projectId) external',
  'function claimGrantMatch(uint256 grantId, uint256 projectId) external',
  'function getGrant(uint256 grantId) external view returns (tuple(uint256 id, string name, string description, uint256 availableFunds, address provider, bool isActive, string[] categories, uint256 createdAt))',
  'function getProjectGrantMatches(uint256 projectId) external view returns (tuple(uint256 grantId, uint256 projectId, uint256 amount, uint256 matchScore, bool isApproved, bool isClaimed, uint256 claimedAt)[])',
  // Events
  'event ProjectCreated(uint256 indexed projectId, address indexed creator, string title, uint256 fundingGoal, uint256 durationDays, uint8 projectType)',
  'event ProjectFunded(uint256 indexed projectId, address indexed funder, uint256 amount)',
  'event TeamMemberJoined(uint256 indexed projectId, address indexed member, string role)',
  'event ProposalSubmitted(uint256 indexed projectId, uint256 indexed proposalId, address indexed proposer, uint256 amount)',
  'event ProposalAccepted(uint256 indexed projectId, uint256 indexed proposalId, address indexed proposer)',
  'event GrantCreated(uint256 indexed grantId, address indexed provider, string name, uint256 availableFunds)',
  'event GrantMatchCreated(uint256 indexed grantId, uint256 indexed projectId, uint256 amount, uint256 matchScore)',
  'event GrantMatchApproved(uint256 indexed grantId, uint256 indexed projectId, uint256 amount)',
  'event GrantMatchClaimed(uint256 indexed grantId, uint256 indexed projectId, uint256 amount, address recipient)'
];

// ABI for the HDAGToken contract
const HDAG_TOKEN_ABI = [
  // Basic ERC20 functions
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  // Custom token functions
  'function releaseTeamTokens() external',
  'function releaseInvestorTokens() external',
  'function pause() public',
  'function unpause() public',
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event TokensReleased(address indexed to, uint256 amount)'
];

// Contract addresses - these would be set after deployment
let HYPERCROWD_CONTRACT_ADDRESS: string = process.env.HYPERCROWD_CONTRACT_ADDRESS || '';
let HDAG_TOKEN_CONTRACT_ADDRESS: string = process.env.HDAG_TOKEN_CONTRACT_ADDRESS || '';

// Provider and contract instances
let provider: ethers.JsonRpcProvider;
let hyperCrowdContract: ethers.Contract;
let hdagTokenContract: ethers.Contract;

/**
 * Initialize the contract service with the given provider URL
 * @param providerUrl The JSON-RPC provider URL
 * @param hypercrowdAddress The HyperCrowd contract address (optional, defaults to env var)
 * @param hdagTokenAddress The HDAGToken contract address (optional, defaults to env var)
 */
export async function initContractService(
  providerUrl: string,
  hypercrowdAddress?: string,
  hdagTokenAddress?: string
): Promise<void> {
  try {
    log('Initializing contract service with provider URL: ' + providerUrl, 'blockchain');
    
    // Setup provider
    provider = new ethers.JsonRpcProvider(providerUrl);
    
    // Set contract addresses if provided
    if (hypercrowdAddress) {
      HYPERCROWD_CONTRACT_ADDRESS = hypercrowdAddress;
    }
    
    if (hdagTokenAddress) {
      HDAG_TOKEN_CONTRACT_ADDRESS = hdagTokenAddress;
    }
    
    // Use mock contract addresses if running in development mode and no real addresses are available
    if (!HYPERCROWD_CONTRACT_ADDRESS && process.env.NODE_ENV === 'development') {
      log('Using mock HyperCrowd contract address for development', 'blockchain');
      HYPERCROWD_CONTRACT_ADDRESS = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318';
    }
    
    if (!HDAG_TOKEN_CONTRACT_ADDRESS && process.env.NODE_ENV === 'development') {
      log('Using mock HDAG token contract address for development', 'blockchain');
      HDAG_TOKEN_CONTRACT_ADDRESS = '0x9A6e382f1bD1BDAb3f5Bc5Ad39F7E9cdFf74B3f0';
    }
    
    // Validate contract addresses
    if (!HYPERCROWD_CONTRACT_ADDRESS) {
      throw new Error('HyperCrowd contract address not set');
    }
    
    if (!HDAG_TOKEN_CONTRACT_ADDRESS) {
      throw new Error('HDAG token contract address not set');
    }
    
    // Log the contract addresses we're using
    log(`Using HyperCrowd contract address: ${HYPERCROWD_CONTRACT_ADDRESS}`, 'blockchain');
    log(`Using HDAG token contract address: ${HDAG_TOKEN_CONTRACT_ADDRESS}`, 'blockchain');
    
    // Initialize contract instances
    hyperCrowdContract = new ethers.Contract(
      HYPERCROWD_CONTRACT_ADDRESS,
      HYPERCROWD_ABI,
      provider
    );
    
    hdagTokenContract = new ethers.Contract(
      HDAG_TOKEN_CONTRACT_ADDRESS,
      HDAG_TOKEN_ABI,
      provider
    );
    
    log('Contract service initialized successfully', 'blockchain');
  } catch (error) {
    log('Failed to initialize contract service: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Get a signer for the contract
 * @param privateKey The private key to use for signing
 * @returns The contract signer
 */
export function getSigner(privateKey: string): ethers.Wallet {
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Get the total number of projects
 * @returns The total number of projects
 */
export async function getTotalProjects(): Promise<number> {
  try {
    const totalProjects = await hyperCrowdContract.getTotalProjects();
    return Number(totalProjects);
  } catch (error) {
    log('Failed to get total projects: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Get a project by ID
 * @param projectId The ID of the project
 * @returns The project data
 */
export async function getProject(projectId: number): Promise<any> {
  try {
    const project = await hyperCrowdContract.getProject(projectId);
    
    // Transform the project data to a more readable format
    return {
      id: Number(project.id),
      creator: project.creator,
      title: project.title,
      description: project.description,
      categories: project.categories,
      requiredRoles: project.requiredRoles,
      fundingGoal: ethers.formatEther(project.fundingGoal),
      currentFunding: ethers.formatEther(project.currentFunding),
      durationDays: Number(project.durationDays),
      createdAt: new Date(Number(project.createdAt) * 1000),
      completedAt: project.completedAt > 0 ? new Date(Number(project.completedAt) * 1000) : null,
      isActive: project.isActive,
      isFunded: project.isFunded,
      projectType: Number(project.projectType) === 0 ? 'RFI' : 'RFP'
    };
  } catch (error) {
    log('Failed to get project: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Create a new project
 * @param signer The signer for the transaction
 * @param title The title of the project
 * @param description The description of the project
 * @param categories The categories of the project
 * @param requiredRoles The required roles for the project
 * @param fundingGoal The funding goal in ETH
 * @param durationDays The duration in days
 * @param projectType The project type (0 = RFI, 1 = RFP)
 * @returns The transaction receipt
 */
export async function createProject(
  signer: ethers.Wallet,
  title: string,
  description: string,
  categories: string[],
  requiredRoles: string[],
  fundingGoal: number,
  durationDays: number,
  projectType: 0 | 1
): Promise<ethers.TransactionReceipt> {
  try {
    const fundingGoalWei = ethers.parseEther(fundingGoal.toString());
    
    const contract = hyperCrowdContract.connect(signer);
    
    const tx = await contract.createProject(
      title,
      description,
      categories,
      requiredRoles,
      fundingGoalWei,
      durationDays,
      projectType
    );
    
    const receipt = await tx.wait();
    return receipt!;
  } catch (error) {
    log('Failed to create project: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Fund a project
 * @param signer The signer for the transaction
 * @param projectId The ID of the project
 * @param amount The amount to fund in ETH
 * @returns The transaction receipt
 */
export async function fundProject(
  signer: ethers.Wallet,
  projectId: number,
  amount: number
): Promise<ethers.TransactionReceipt> {
  try {
    const amountWei = ethers.parseEther(amount.toString());
    
    const contract = hyperCrowdContract.connect(signer);
    
    const tx = await contract.fundProject(projectId, { value: amountWei });
    
    const receipt = await tx.wait();
    return receipt!;
  } catch (error) {
    log('Failed to fund project: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Join a project team
 * @param signer The signer for the transaction
 * @param projectId The ID of the project
 * @param role The role to join as
 * @returns The transaction receipt
 */
export async function joinTeam(
  signer: ethers.Wallet,
  projectId: number,
  role: string
): Promise<ethers.TransactionReceipt> {
  try {
    const contract = hyperCrowdContract.connect(signer);
    
    const tx = await contract.joinTeam(projectId, role);
    
    const receipt = await tx.wait();
    return receipt!;
  } catch (error) {
    log('Failed to join team: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Get the team members for a project
 * @param projectId The ID of the project
 * @returns The team members
 */
export async function getProjectTeam(projectId: number): Promise<any[]> {
  try {
    const teamMembers = await hyperCrowdContract.getProjectTeam(projectId);
    
    // Transform the team members data
    return teamMembers.map((member: any) => ({
      address: member.memberAddress,
      role: member.role,
      reputationScore: Number(member.reputationScore),
      joinedAt: new Date(Number(member.joinedAt) * 1000),
      isActive: member.isActive
    }));
  } catch (error) {
    log('Failed to get project team: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Submit a proposal
 * @param signer The signer for the transaction
 * @param projectId The ID of the project
 * @param description The description of the proposal
 * @param amount The amount requested in ETH
 * @returns The transaction receipt
 */
export async function submitProposal(
  signer: ethers.Wallet,
  projectId: number,
  description: string,
  amount: number
): Promise<ethers.TransactionReceipt> {
  try {
    const amountWei = ethers.parseEther(amount.toString());
    
    const contract = hyperCrowdContract.connect(signer);
    
    const tx = await contract.submitProposal(projectId, description, amountWei);
    
    const receipt = await tx.wait();
    return receipt!;
  } catch (error) {
    log('Failed to submit proposal: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Accept a proposal
 * @param signer The signer for the transaction
 * @param projectId The ID of the project
 * @param proposalId The ID of the proposal
 * @returns The transaction receipt
 */
export async function acceptProposal(
  signer: ethers.Wallet,
  projectId: number,
  proposalId: number
): Promise<ethers.TransactionReceipt> {
  try {
    const contract = hyperCrowdContract.connect(signer);
    
    const tx = await contract.acceptProposal(projectId, proposalId);
    
    const receipt = await tx.wait();
    return receipt!;
  } catch (error) {
    log('Failed to accept proposal: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Get the proposals for a project
 * @param projectId The ID of the project
 * @returns The proposals
 */
export async function getProjectProposals(projectId: number): Promise<any[]> {
  try {
    const proposals = await hyperCrowdContract.getProjectProposals(projectId);
    
    // Transform the proposals data
    return proposals.map((proposal: any) => ({
      id: Number(proposal.id),
      projectId: Number(proposal.projectId),
      proposer: proposal.proposer,
      description: proposal.description,
      amount: ethers.formatEther(proposal.amount),
      createdAt: new Date(Number(proposal.createdAt) * 1000),
      isAccepted: proposal.isAccepted
    }));
  } catch (error) {
    log('Failed to get project proposals: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Get the projects created by a user
 * @param userAddress The address of the user
 * @returns The project IDs
 */
export async function getUserProjects(userAddress: string): Promise<number[]> {
  try {
    const projectIds = await hyperCrowdContract.getUserProjects(userAddress);
    
    // Convert BigInts to numbers
    return projectIds.map((id: bigint) => Number(id));
  } catch (error) {
    log('Failed to get user projects: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Get the projects joined by a user
 * @param userAddress The address of the user
 * @returns The project IDs
 */
export async function getUserJoinedProjects(userAddress: string): Promise<number[]> {
  try {
    const projectIds = await hyperCrowdContract.getUserJoinedProjects(userAddress);
    
    // Convert BigInts to numbers
    return projectIds.map((id: bigint) => Number(id));
  } catch (error) {
    log('Failed to get user joined projects: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Get the balance of HDAG tokens for a user
 * @param userAddress The address of the user
 * @returns The token balance
 */
export async function getTokenBalance(userAddress: string): Promise<string> {
  try {
    const balance = await hdagTokenContract.balanceOf(userAddress);
    return ethers.formatEther(balance);
  } catch (error) {
    log('Failed to get token balance: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Transfer HDAG tokens
 * @param signer The signer for the transaction
 * @param toAddress The recipient address
 * @param amount The amount to transfer
 * @returns The transaction receipt
 */
export async function transferTokens(
  signer: ethers.Wallet,
  toAddress: string,
  amount: number
): Promise<ethers.TransactionReceipt> {
  try {
    const amountWei = ethers.parseEther(amount.toString());
    
    const contract = hdagTokenContract.connect(signer);
    
    const tx = await contract.transfer(toAddress, amountWei);
    
    const receipt = await tx.wait();
    return receipt!;
  } catch (error) {
    log('Failed to transfer tokens: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Create a new grant
 * @param signer The signer for the transaction
 * @param name The name of the grant
 * @param description The description of the grant
 * @param categories The categories of the grant
 * @param amount The amount to fund the grant with in ETH
 * @returns The transaction receipt
 */
export async function createGrant(
  signer: ethers.Wallet,
  name: string,
  description: string,
  categories: string[],
  amount: number
): Promise<ethers.TransactionReceipt> {
  try {
    const amountWei = ethers.parseEther(amount.toString());
    
    const contract = hyperCrowdContract.connect(signer);
    
    const tx = await contract.createGrant(name, description, categories, { value: amountWei });
    
    const receipt = await tx.wait();
    return receipt!;
  } catch (error) {
    log('Failed to create grant: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Get a grant by ID
 * @param grantId The ID of the grant
 * @returns The grant data
 */
export async function getGrant(grantId: number): Promise<any> {
  try {
    const grant = await hyperCrowdContract.getGrant(grantId);
    
    // Transform the grant data to a more readable format
    return {
      id: Number(grant.id),
      name: grant.name,
      description: grant.description,
      availableFunds: ethers.formatEther(grant.availableFunds),
      provider: grant.provider,
      isActive: grant.isActive,
      categories: grant.categories,
      createdAt: new Date(Number(grant.createdAt) * 1000)
    };
  } catch (error) {
    log('Failed to get grant: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Create a grant match between a grant and a project
 * @param signer The signer for the transaction
 * @param grantId The ID of the grant
 * @param projectId The ID of the project
 * @param amount The amount to match in ETH
 * @param matchScore The match score (0-10000)
 * @returns The transaction receipt
 */
export async function createGrantMatch(
  signer: ethers.Wallet,
  grantId: number,
  projectId: number,
  amount: number,
  matchScore: number
): Promise<ethers.TransactionReceipt> {
  try {
    const amountWei = ethers.parseEther(amount.toString());
    // Convert match score from 0-1 to 0-10000 (basis points)
    const basisPoints = Math.floor(matchScore * 10000);
    
    const contract = hyperCrowdContract.connect(signer);
    
    const tx = await contract.createGrantMatch(grantId, projectId, amountWei, basisPoints);
    
    const receipt = await tx.wait();
    return receipt!;
  } catch (error) {
    log('Failed to create grant match: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Approve a grant match
 * @param signer The signer for the transaction
 * @param grantId The ID of the grant
 * @param projectId The ID of the project
 * @returns The transaction receipt
 */
export async function approveGrantMatch(
  signer: ethers.Wallet,
  grantId: number,
  projectId: number
): Promise<ethers.TransactionReceipt> {
  try {
    const contract = hyperCrowdContract.connect(signer);
    
    const tx = await contract.approveGrantMatch(grantId, projectId);
    
    const receipt = await tx.wait();
    return receipt!;
  } catch (error) {
    log('Failed to approve grant match: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Claim a grant match
 * @param signer The signer for the transaction
 * @param grantId The ID of the grant
 * @param projectId The ID of the project
 * @returns The transaction receipt
 */
export async function claimGrantMatch(
  signer: ethers.Wallet,
  grantId: number,
  projectId: number
): Promise<ethers.TransactionReceipt> {
  try {
    const contract = hyperCrowdContract.connect(signer);
    
    const tx = await contract.claimGrantMatch(grantId, projectId);
    
    const receipt = await tx.wait();
    return receipt!;
  } catch (error) {
    log('Failed to claim grant match: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}

/**
 * Get the grant matches for a project
 * @param projectId The ID of the project
 * @returns The grant matches
 */
export async function getProjectGrantMatches(projectId: number): Promise<any[]> {
  try {
    const matches = await hyperCrowdContract.getProjectGrantMatches(projectId);
    
    // Transform the grant matches data
    return matches.map((match: any) => ({
      grantId: Number(match.grantId),
      projectId: Number(match.projectId),
      amount: ethers.formatEther(match.amount),
      matchScore: Number(match.matchScore) / 10000, // Convert from basis points (0-10000) to 0-1
      isApproved: match.isApproved,
      isClaimed: match.isClaimed,
      claimedAt: match.claimedAt > 0 ? new Date(Number(match.claimedAt) * 1000) : null
    }));
  } catch (error) {
    log('Failed to get project grant matches: ' + (error as Error).message, 'blockchain');
    throw error;
  }
}
