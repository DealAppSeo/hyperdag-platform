import { ethers } from 'ethers';
import type { Address } from 'viem';

// Polygon configuration
const POLYGON_MAINNET_RPC = 'https://polygon-rpc.com';
const POLYGON_TESTNET_RPC = 'https://rpc-mumbai.maticvigil.com';

// Polygon utility class for handling Polygon-specific operations
// This will be compatible with Polygon Plonky3 as it develops
class PolygonUtils {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private isTestnet: boolean = false;
  
  // Initialize provider
  public async initialize(useTestnet: boolean = false): Promise<void> {
    this.isTestnet = useTestnet;
    const rpcUrl = useTestnet ? POLYGON_TESTNET_RPC : POLYGON_MAINNET_RPC;
    
    try {
      if (window.ethereum) {
        // Try to use the injected provider if available
        this.provider = new ethers.BrowserProvider(window.ethereum);
        
        // Check if connected to Polygon network
        const network = await this.provider.getNetwork();
        const chainId = Number(network.chainId);
        
        // Polygon Mainnet: 137, Mumbai Testnet: 80001
        const expectedChainId = useTestnet ? 80001 : 137;
        
        if (chainId !== expectedChainId) {
          console.warn('Not connected to Polygon network, switching to RPC provider');
          this.provider = new ethers.JsonRpcProvider(rpcUrl);
        }
      } else {
        // Fallback to RPC provider
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
      }
      
      if (window.ethereum) {
        try {
          this.signer = await this.provider.getSigner();
        } catch (error) {
          console.warn('Failed to get signer:', error);
        }
      }
      
      console.log(`Polygon utils initialized (${useTestnet ? 'testnet' : 'mainnet'})`);
    } catch (error) {
      console.error('Failed to initialize Polygon utils:', error);
      throw error;
    }
  }
  
  // Switch network to Polygon
  public async switchToPolygon(): Promise<boolean> {
    if (!window.ethereum) {
      console.error('No Ethereum provider found');
      return false;
    }
    
    const chainId = this.isTestnet ? '0x13881' : '0x89'; // Mumbai: 80001, Mainnet: 137
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
      
      // Reinitialize provider
      await this.initialize(this.isTestnet);
      return true;
    } catch (error: any) {
      // If the chain has not been added to MetaMask
      if (error.code === 4902) {
        return await this.addPolygonNetwork();
      }
      
      console.error('Failed to switch to Polygon network:', error);
      return false;
    }
  }
  
  // Add Polygon network to wallet
  private async addPolygonNetwork(): Promise<boolean> {
    if (!window.ethereum) {
      console.error('No Ethereum provider found');
      return false;
    }
    
    try {
      const params = this.isTestnet
        ? [
            {
              chainId: '0x13881',
              chainName: 'Polygon Mumbai Testnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
              },
              rpcUrls: [POLYGON_TESTNET_RPC],
              blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
            },
          ]
        : [
            {
              chainId: '0x89',
              chainName: 'Polygon Mainnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
              },
              rpcUrls: [POLYGON_MAINNET_RPC],
              blockExplorerUrls: ['https://polygonscan.com/'],
            },
          ];
      
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params,
      });
      
      // Reinitialize provider
      await this.initialize(this.isTestnet);
      return true;
    } catch (error) {
      console.error('Failed to add Polygon network:', error);
      return false;
    }
  }
  
  // Get MATIC balance
  public async getMaticBalance(address?: Address): Promise<string> {
    if (!this.provider) {
      await this.initialize(this.isTestnet);
    }
    
    try {
      let targetAddress: string;
      
      if (address) {
        targetAddress = address;
      } else if (this.signer) {
        targetAddress = await this.signer.getAddress();
      } else {
        throw new Error('No address provided and no signer available');
      }
      
      const balance = await this.provider?.getBalance(targetAddress);
      return ethers.formatEther(balance || '0');
    } catch (error) {
      console.error('Failed to get MATIC balance:', error);
      return '0';
    }
  }
  
  // Send MATIC
  public async sendMatic(to: Address, amount: string): Promise<string> {
    if (!this.provider || !this.signer) {
      await this.initialize(this.isTestnet);
      
      if (!this.signer) {
        throw new Error('No signer available');
      }
    }
    
    try {
      const tx = await this.signer?.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });
      
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Failed to send MATIC:', error);
      throw error;
    }
  }
  
  // Get transaction details
  public async getTransaction(txHash: string): Promise<ethers.TransactionResponse | null> {
    if (!this.provider) {
      await this.initialize(this.isTestnet);
    }
    
    try {
      return await this.provider?.getTransaction(txHash) || null;
    } catch (error) {
      console.error('Failed to get transaction:', error);
      return null;
    }
  }
  
  // Get Polygon network name
  public getNetworkName(): string {
    return this.isTestnet ? 'Polygon Mumbai Testnet' : 'Polygon Mainnet';
  }
  
  // Get block explorer URL
  public getExplorerUrl(txHash?: string): string {
    const baseUrl = this.isTestnet
      ? 'https://mumbai.polygonscan.com'
      : 'https://polygonscan.com';
    
    return txHash ? `${baseUrl}/tx/${txHash}` : baseUrl;
  }
}

// Export singleton instance
export const polygonUtils = new PolygonUtils();