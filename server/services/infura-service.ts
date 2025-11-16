/**
 * Infura Service for HyperDAG Web3 Operations
 * Provides unified interface to Infura's Web3 infrastructure
 */

import axios from 'axios';

export class InfuraService {
  private projectId: string;
  private projectSecret: string;
  private baseUrl: string;
  private ipfsUrl: string;

  constructor() {
    // Support both PROJECT_ID format and API_KEY format
    this.projectId = process.env.INFURA_PROJECT_ID || process.env.INFURA_API_KEY || '';
    this.projectSecret = process.env.INFURA_PROJECT_SECRET || '';
    this.baseUrl = 'https://mainnet.infura.io/v3';
    this.ipfsUrl = 'https://ipfs.infura.io:5001/api/v0';
    
    if (!this.projectId) {
      console.log('[Infura] ⚠️ No API credentials configured - Web3 operations will use fallback');
    } else {
      console.log('[Infura] ✅ Service initialized with credentials:', this.projectId.substring(0, 8) + '...');
      console.log('[Infura] 🔗 Supporting Polygon zkEVM and multi-chain operations');
    }
  }

  // Ethereum network operations
  async ethereumCall(method: string, params: any[] = [], network: string = 'mainnet') {
    const networkUrls: Record<string, string> = {
      mainnet: `${this.baseUrl}/${this.projectId}`,
      goerli: `https://goerli.infura.io/v3/${this.projectId}`,
      sepolia: `https://sepolia.infura.io/v3/${this.projectId}`,
      holesky: `https://holesky.infura.io/v3/${this.projectId}`
    };

    const url = networkUrls[network] || networkUrls.mainnet;

    try {
      const response = await axios.post(url, {
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now()
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      return {
        success: true,
        data: response.data,
        network,
        provider: 'infura'
      };
    } catch (error: any) {
      console.error(`[Infura] Ethereum ${network} call failed:`, error.message);
      return {
        success: false,
        error: error.message,
        network,
        provider: 'infura'
      };
    }
  }

  // Polygon network operations (including zkEVM)
  async polygonCall(method: string, params: any[] = [], network: string = 'mainnet') {
    const networkUrls: Record<string, string> = {
      mainnet: `https://polygon-mainnet.infura.io/v3/${this.projectId}`,
      mumbai: `https://polygon-mumbai.infura.io/v3/${this.projectId}`,
      zkevmMainnet: `https://polygon-zkevm-mainnet.infura.io/v3/${this.projectId}`,
      zkevmTestnet: `https://polygon-zkevm-testnet.infura.io/v3/${this.projectId}`,
      zkevmCardona: `https://polygon-zkevm-cardona.infura.io/v3/${this.projectId}`
    };

    const polygonUrl = networkUrls[network] || networkUrls.mainnet;

    try {
      const response = await axios.post(polygonUrl, {
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now()
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      return {
        success: true,
        data: response.data,
        network: `polygon-${network}`,
        provider: 'infura'
      };
    } catch (error: any) {
      console.error(`[Infura] Polygon ${network} call failed:`, error.message);
      return {
        success: false,
        error: error.message,
        network: `polygon-${network}`,
        provider: 'infura'
      };
    }
  }

  // IPFS operations
  async ipfsUpload(data: Buffer | string, filename?: string) {
    if (!this.projectSecret) {
      return {
        success: false,
        error: 'IPFS operations require PROJECT_SECRET'
      };
    }

    try {
      const formData = new FormData();
      
      if (typeof data === 'string') {
        formData.append('file', new Blob([data], { type: 'text/plain' }), filename || 'data.txt');
      } else {
        formData.append('file', new Blob([data]), filename || 'data.bin');
      }

      const auth = Buffer.from(`${this.projectId}:${this.projectSecret}`).toString('base64');
      
      const response = await axios.post(`${this.ipfsUrl}/add`, formData, {
        headers: {
          'Authorization': `Basic ${auth}`
        },
        timeout: 60000
      });

      return {
        success: true,
        hash: response.data.Hash,
        size: response.data.Size,
        name: response.data.Name,
        provider: 'infura-ipfs'
      };
    } catch (error: any) {
      console.error('[Infura] IPFS upload failed:', error.message);
      return {
        success: false,
        error: error.message,
        provider: 'infura-ipfs'
      };
    }
  }

  async ipfsRetrieve(hash: string) {
    try {
      const response = await axios.get(`https://infura-ipfs.io/ipfs/${hash}`, {
        timeout: 30000
      });

      return {
        success: true,
        data: response.data,
        hash,
        provider: 'infura-ipfs'
      };
    } catch (error: any) {
      console.error('[Infura] IPFS retrieve failed:', error.message);
      return {
        success: false,
        error: error.message,
        hash,
        provider: 'infura-ipfs'
      };
    }
  }

  // Smart contract operations
  async deployContract(bytecode: string, abi: any[], constructorParams: any[] = [], network: string = 'mainnet') {
    try {
      // Prepare deployment transaction
      const deployTx = {
        data: bytecode,
        value: '0x0'
      };

      const result = await this.ethereumCall('eth_sendTransaction', [deployTx], network);
      
      return {
        success: result.success,
        transactionHash: result.success ? result.data.result : null,
        network,
        provider: 'infura'
      };
    } catch (error: any) {
      console.error('[Infura] Contract deployment failed:', error.message);
      return {
        success: false,
        error: error.message,
        network,
        provider: 'infura'
      };
    }
  }

  // Transaction operations
  async sendTransaction(transaction: any, network: string = 'mainnet') {
    try {
      const result = await this.ethereumCall('eth_sendTransaction', [transaction], network);
      
      return {
        success: result.success,
        transactionHash: result.success ? result.data.result : null,
        network,
        provider: 'infura'
      };
    } catch (error: any) {
      console.error('[Infura] Transaction failed:', error.message);
      return {
        success: false,
        error: error.message,
        network,
        provider: 'infura'
      };
    }
  }

  async getTransactionReceipt(txHash: string, network: string = 'mainnet') {
    try {
      const result = await this.ethereumCall('eth_getTransactionReceipt', [txHash], network);
      
      return {
        success: result.success,
        receipt: result.success ? result.data.result : null,
        network,
        provider: 'infura'
      };
    } catch (error: any) {
      console.error('[Infura] Get transaction receipt failed:', error.message);
      return {
        success: false,
        error: error.message,
        network,
        provider: 'infura'
      };
    }
  }

  // Health check
  async healthCheck() {
    const checks = {
      ethereum: false,
      polygon: false,
      ipfs: false
    };

    // Test Ethereum
    try {
      const ethResult = await this.ethereumCall('eth_blockNumber');
      checks.ethereum = ethResult.success;
    } catch (error) {
      checks.ethereum = false;
    }

    // Test Polygon (including zkEVM)
    try {
      const polyResult = await this.polygonCall('eth_blockNumber', [], 'zkevmCardona');
      checks.polygon = polyResult.success;
    } catch (error) {
      checks.polygon = false;
    }

    // Test IPFS
    if (this.projectSecret) {
      try {
        const auth = Buffer.from(`${this.projectId}:${this.projectSecret}`).toString('base64');
        const ipfsResponse = await axios.post(`${this.ipfsUrl}/version`, {}, {
          headers: { 'Authorization': `Basic ${auth}` },
          timeout: 5000
        });
        checks.ipfs = ipfsResponse.status === 200;
      } catch (error) {
        checks.ipfs = false;
      }
    }

    return {
      overall: checks.ethereum && checks.polygon,
      services: checks,
      provider: 'infura',
      projectId: this.projectId ? this.projectId.substring(0, 8) + '...' : 'not-configured'
    };
  }

  // Configuration status
  getStatus() {
    return {
      configured: !!this.projectId,
      hasSecret: !!this.projectSecret,
      services: {
        ethereum: !!this.projectId,
        polygon: !!this.projectId,
        ipfs: !!(this.projectId && this.projectSecret)
      }
    };
  }
}

// Create singleton instance
export const infuraService = new InfuraService();