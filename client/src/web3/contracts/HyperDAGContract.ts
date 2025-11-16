import { ethers } from 'ethers';
import type { Address } from 'viem';

// Basic ABI for HyperDAG token and project registration
const hyperDAGAbi = [
  // Events
  'event ProjectRegistered(uint256 indexed projectId, address indexed creator, string metadata)',
  'event FundsContributed(uint256 indexed projectId, address indexed contributor, uint256 amount)',
  'event FundsWithdrawn(uint256 indexed projectId, address indexed recipient, uint256 amount)',
  'event ReferralCreated(address indexed referrer, address indexed referee)',
  'event TokensMinted(address indexed user, uint256 amount, string reason)',
  
  // Project functions
  'function registerProject(string memory metadata) returns (uint256 projectId)',
  'function contributeToProject(uint256 projectId) payable',
  'function withdrawProjectFunds(uint256 projectId, uint256 amount)',
  
  // Referral functions
  'function createReferral(address referee)',
  'function getReferrals(address referrer) view returns (address[] memory)',
  'function getReferralCount(address referrer) view returns (uint256)',
  'function getReferralRewards(address referrer) view returns (uint256)',
  
  // Token functions
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function mint(address to, uint256 amount) returns (bool)',
  
  // View functions
  'function getProjectDetails(uint256 projectId) view returns (address creator, string memory metadata, uint256 balance, bool active)',
  'function getUserProjects(address user) view returns (uint256[] memory)',
];

// HyperDAG contract interface
class HyperDAGContract {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private contractAddress: Address = '0x0000000000000000000000000000000000000000' as Address;
  
  // Initialize contract
  public async initialize(contractAddress?: Address): Promise<void> {
    try {
      if (contractAddress) {
        this.contractAddress = contractAddress;
      }
      
      if (!window.ethereum) {
        throw new Error('Ethereum provider not found. Please install MetaMask.');
      }
      
      // Create provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      // Create contract instance
      this.contract = new ethers.Contract(
        this.contractAddress,
        hyperDAGAbi,
        this.signer
      );
      
      console.log('HyperDAG contract initialized successfully');
    } catch (error) {
      console.error('Failed to initialize HyperDAG contract:', error);
      throw error;
    }
  }
  
  // Register a new project
  public async registerProject(metadata: string): Promise<number> {
    if (!this.contract) {
      await this.initialize();
    }
    
    try {
      const tx = await this.contract?.registerProject(metadata);
      const receipt = await tx.wait();
      
      // Extract projectId from event
      const event = receipt.logs
        .map((log: any) => {
          try {
            return this.contract?.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: any) => event?.name === 'ProjectRegistered');
      
      return event?.args.projectId.toString() || 0;
    } catch (error) {
      console.error('Failed to register project:', error);
      throw error;
    }
  }
  
  // Contribute funds to a project
  public async contributeToProject(projectId: number, amount: string): Promise<boolean> {
    if (!this.contract) {
      await this.initialize();
    }
    
    try {
      const tx = await this.contract?.contributeToProject(projectId, {
        value: ethers.parseEther(amount),
      });
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Failed to contribute to project:', error);
      throw error;
    }
  }
  
  // Get project details
  public async getProjectDetails(projectId: number): Promise<any> {
    if (!this.contract) {
      await this.initialize();
    }
    
    try {
      const details = await this.contract?.getProjectDetails(projectId);
      return {
        creator: details[0],
        metadata: details[1],
        balance: ethers.formatEther(details[2]),
        active: details[3],
      };
    } catch (error) {
      console.error('Failed to get project details:', error);
      throw error;
    }
  }
  
  // Get projects created by a user
  public async getUserProjects(userAddress?: Address): Promise<number[]> {
    if (!this.contract) {
      await this.initialize();
    }
    
    try {
      const address = userAddress || (await this.signer?.getAddress());
      const projects = await this.contract?.getUserProjects(address);
      return projects.map((id: ethers.BigNumber) => id.toNumber());
    } catch (error) {
      console.error('Failed to get user projects:', error);
      throw error;
    }
  }
  
  // Create a referral
  public async createReferral(refereeAddress: Address): Promise<boolean> {
    if (!this.contract) {
      await this.initialize();
    }
    
    try {
      const tx = await this.contract?.createReferral(refereeAddress);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Failed to create referral:', error);
      throw error;
    }
  }
  
  // Get referrals created by a user
  public async getReferrals(referrerAddress?: Address): Promise<Address[]> {
    if (!this.contract) {
      await this.initialize();
    }
    
    try {
      const address = referrerAddress || (await this.signer?.getAddress());
      return await this.contract?.getReferrals(address);
    } catch (error) {
      console.error('Failed to get referrals:', error);
      throw error;
    }
  }
  
  // Get token balance
  public async getTokenBalance(userAddress?: Address): Promise<string> {
    if (!this.contract) {
      await this.initialize();
    }
    
    try {
      const address = userAddress || (await this.signer?.getAddress());
      const balance = await this.contract?.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to get token balance:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const hyperDAGContract = new HyperDAGContract();