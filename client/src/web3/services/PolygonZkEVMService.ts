import { polygonUtils } from '@/web3/utils/PolygonUtils';
import { ethers } from 'ethers';
import type { Address } from 'viem';

// Polygon Testnet RPC Endpoints
const POLYGON_ZKEVM_MAINNET_RPC = 'https://zkevm-rpc.com';
// For Amoy Testnet, we'll use the environment variable in the frontend
const POLYGON_AMOY_TESTNET_RPC = import.meta.env.VITE_INFURA_POLYGON_URL || 'https://polygon-amoy.infura.io/v3/your-api-key';
const POLYGON_ZKEVM_TESTNET_RPC = 'https://rpc.public.zkevm-test.net';

/**
 * Service for interacting with Polygon zkEVM
 * This extends the base Polygon functionality with zkEVM-specific features
 */
class PolygonZkEVMService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private isTestnet: boolean = false;
  private initialized: boolean = false;

  /**
   * Initialize the zkEVM service
   * @param useTestnet Whether to use testnet or mainnet
   */
  private isCardona: boolean = true; // Use Cardona by default

  /**
   * Initialize the zkEVM service
   * @param useTestnet Whether to use testnet or mainnet
   * @param useAmoy Whether to use Amoy testnet (if useTestnet is true)
   */
  public async initialize(useTestnet: boolean = false, useAmoy: boolean = true): Promise<boolean> {
    this.isTestnet = useTestnet;
    this.isCardona = false; // We're now using Amoy instead of Cardona
    
    let rpcUrl;
    if (useTestnet) {
      rpcUrl = useAmoy ? POLYGON_AMOY_TESTNET_RPC : POLYGON_ZKEVM_TESTNET_RPC;
    } else {
      rpcUrl = POLYGON_ZKEVM_MAINNET_RPC;
    }
    
    try {
      // First initialize with rpcURL
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Try to get injected provider if available
      if (window.ethereum) {
        try {
          // Try using the browser provider
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          
          // Get the network to check if we're on zkEVM
          const network = await browserProvider.getNetwork();
          const chainId = Number(network.chainId);
          
          // zkEVM Mainnet: 1101, zkEVM Testnet: 1442
          const expectedChainId = useTestnet ? 1442 : 1101;
          
          if (chainId === expectedChainId) {
            // We're on the right network, use browser provider
            this.provider = browserProvider;
            this.signer = await browserProvider.getSigner();
          }
        } catch (error) {
          console.warn('Failed to setup browser provider for zkEVM:', error);
          // We'll continue with the RPC provider
        }
      }
      
      this.initialized = true;
      console.log(`Polygon zkEVM service initialized (${useTestnet ? 'testnet' : 'mainnet'})`);
      return true;
    } catch (error) {
      console.error('Failed to initialize Polygon zkEVM service:', error);
      return false;
    }
  }

  /**
   * Switch wallet network to Polygon zkEVM
   */
  public async switchToZkEVM(): Promise<boolean> {
    if (!window.ethereum) {
      console.error('No Ethereum provider found');
      return false;
    }
    
    const chainId = this.isTestnet ? '0x5a2' : '0x44d'; // Testnet: 1442, Mainnet: 1101
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
      
      // Reinitialize provider with the same Cardona setting
      return await this.initialize(this.isTestnet, this.isCardona);
    } catch (error: any) {
      // If the chain has not been added to MetaMask
      if (error.code === 4902) {
        return await this.addZkEVMNetwork();
      }
      
      console.error('Failed to switch to Polygon zkEVM network:', error);
      return false;
    }
  }

  /**
   * Add Polygon zkEVM network to wallet
   */
  private async addZkEVMNetwork(): Promise<boolean> {
    if (!window.ethereum) {
      console.error('No Ethereum provider found');
      return false;
    }
    
    try {
      let params;
      
      if (this.isTestnet) {
        if (this.isCardona) {
          params = [
            {
              chainId: '0x5a2', // We still use the same chain ID for Cardona testnet
              chainName: 'Polygon zkEVM Cardona Testnet',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [POLYGON_ZKEVM_CARDONA_TESTNET_RPC],
              blockExplorerUrls: ['https://cardona-zkevm.polygonscan.com/'],
            },
          ];
        } else {
          params = [
            {
              chainId: '0x5a2',
              chainName: 'Polygon zkEVM Testnet',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [POLYGON_ZKEVM_TESTNET_RPC],
              blockExplorerUrls: ['https://testnet-zkevm.polygonscan.com/'],
            },
          ];
        }
      } else {
        params = [
          {
            chainId: '0x44d',
            chainName: 'Polygon zkEVM Mainnet',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: [POLYGON_ZKEVM_MAINNET_RPC],
            blockExplorerUrls: ['https://zkevm.polygonscan.com/'],
          },
        ];
      }
      
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params,
      });
      
      // Reinitialize provider with the same Cardona setting
      return await this.initialize(this.isTestnet, this.isCardona);
    } catch (error) {
      console.error('Failed to add Polygon zkEVM network:', error);
      return false;
    }
  }

  /**
   * Get ETH balance on zkEVM
   */
  public async getBalance(address?: Address): Promise<string> {
    if (!this.initialized) {
      await this.initialize(this.isTestnet, this.isCardona);
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
      console.error('Failed to get ETH balance on zkEVM:', error);
      return '0';
    }
  }

  /**
   * Bridge assets from Polygon PoS to zkEVM
   * This implementation focuses on the setup and UI preparation.
   * The actual bridge interaction would require integration with the zkEVM bridge contracts.
   */
  public async bridgeFromPolygon(amount: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize(this.isTestnet, this.isCardona);
    }
    
    // 1. Verify we're on Polygon PoS
    try {
      // Temporarily initialize Polygon PoS
      await polygonUtils.initialize(this.isTestnet);
      
      // For a real implementation, this would interact with the bridge contract
      console.log(`Preparing to bridge ${amount} MATIC from Polygon PoS to Polygon zkEVM`);
      
      // This would need to be replaced with actual bridge contract interaction
      return true;
    } catch (error) {
      console.error('Failed to bridge from Polygon PoS to zkEVM:', error);
      return false;
    }
  }

  /**
   * Get the explorer URL for a transaction
   */
  public getExplorerUrl(txHash?: string): string {
    let baseUrl;
    
    if (this.isTestnet) {
      baseUrl = this.isCardona
        ? 'https://cardona-zkevm.polygonscan.com' // Cardona testnet explorer
        : 'https://testnet-zkevm.polygonscan.com'; // Regular testnet explorer
    } else {
      baseUrl = 'https://zkevm.polygonscan.com'; // Mainnet explorer
    }
    
    return txHash ? `${baseUrl}/tx/${txHash}` : baseUrl;
  }

  /**
   * Get the network name
   */
  public getNetworkName(): string {
    if (this.isTestnet) {
      return this.isCardona ? 'Polygon zkEVM Cardona Testnet' : 'Polygon zkEVM Testnet';
    }
    return 'Polygon zkEVM Mainnet';
  }
}

// Export as singleton instance
export const polygonZkEVMService = new PolygonZkEVMService();
