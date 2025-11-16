import Moralis from 'moralis';
import { log } from '../vite';

// Initialize Moralis
if (!process.env.MORALIS_API_KEY) {
  throw new Error('MORALIS_API_KEY environment variable is required');
}

// Start Moralis and handle any errors
try {
  Moralis.start({
    apiKey: process.env.MORALIS_API_KEY,
  });
  log('Moralis API initialized successfully', 'moralis');
} catch (error) {
  log(`Failed to initialize Moralis API: ${error}`, 'moralis');
  throw error;
}

export class MoralisService {
  // Get native balance for an address
  async getNativeBalance(address: string, chain: string = 'eth'): Promise<string> {
    try {
      const response = await Moralis.EvmApi.balance.getNativeBalance({
        address,
        chain,
      });
      return response.raw.balance;
    } catch (error) {
      log(`Error getting native balance: ${error}`, 'moralis');
      throw error;
    }
  }

  // Get ERC20 token balances for an address
  async getTokenBalances(address: string, chain: string = 'eth'): Promise<any[]> {
    try {
      const response = await Moralis.EvmApi.token.getWalletTokenBalances({
        address,
        chain,
      });
      return response.raw;
    } catch (error) {
      log(`Error getting token balances: ${error}`, 'moralis');
      throw error;
    }
  }

  // Get NFTs owned by an address
  async getNFTs(address: string, chain: string = 'eth'): Promise<any[]> {
    try {
      const response = await Moralis.EvmApi.nft.getWalletNFTs({
        address,
        chain,
      });
      return response.raw.result;
    } catch (error) {
      log(`Error getting NFTs: ${error}`, 'moralis');
      throw error;
    }
  }

  // Get transaction history for an address
  async getTransactionHistory(address: string, chain: string = 'eth'): Promise<any[]> {
    try {
      const response = await Moralis.EvmApi.transaction.getWalletTransactions({
        address,
        chain,
      });
      return response.raw.result;
    } catch (error) {
      log(`Error getting transaction history: ${error}`, 'moralis');
      throw error;
    }
  }

  // Get token transfers for an address
  async getTokenTransfers(address: string, chain: string = 'eth'): Promise<any[]> {
    try {
      const response = await Moralis.EvmApi.token.getWalletTokenTransfers({
        address,
        chain,
      });
      return response.raw.result;
    } catch (error) {
      log(`Error getting token transfers: ${error}`, 'moralis');
      throw error;
    }
  }

  // Get token price
  async getTokenPrice(address: string, chain: string = 'eth'): Promise<any> {
    try {
      const response = await Moralis.EvmApi.token.getTokenPrice({
        address,
        chain,
      });
      return response.raw;
    } catch (error) {
      log(`Error getting token price: ${error}`, 'moralis');
      throw error;
    }
  }

  // Resolve ENS domain to address
  async resolveENS(domain: string): Promise<string | null> {
    try {
      const response = await Moralis.EvmApi.resolve.resolveENSDomain({
        domain,
      });
      if (response && response.raw) {
        return response.raw.address;
      }
      return null;
    } catch (error) {
      log(`Error resolving ENS domain: ${error}`, 'moralis');
      return null;
    }
  }

  // Resolve address to ENS domain
  async resolveAddress(address: string): Promise<string | null> {
    try {
      const response = await Moralis.EvmApi.resolve.resolveAddress({
        address,
      });
      if (response && response.raw) {
        return response.raw.name;
      }
      return null;
    } catch (error) {
      log(`Error resolving address to ENS: ${error}`, 'moralis');
      return null;
    }
  }

  // Get contract ABI
  async getContractABI(address: string, chain: string = 'eth'): Promise<any> {
    try {
      // This API might change in newer versions of Moralis
      // We'll use a compatibility approach here
      const url = `https://deep-index.moralis.io/api/v2/${address}/function?chain=${chain}`;
      const response = await fetch(url, {
        headers: {
          'accept': 'application/json',
          'X-API-Key': process.env.MORALIS_API_KEY || ''
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      log(`Error getting contract ABI: ${error}`, 'moralis');
      throw error;
    }
  }

  // Get multi-chain native balances
  async getMultiChainBalances(address: string, chains: string[] = ['eth', 'polygon', 'bsc']): Promise<any[]> {
    try {
      const balances = await Promise.all(
        chains.map(async (chain) => {
          try {
            const balance = await this.getNativeBalance(address, chain);
            return { chain, balance };
          } catch (e) {
            log(`Error getting balance for chain ${chain}: ${e}`, 'moralis');
            return { chain, balance: '0', error: true };
          }
        })
      );
      return balances;
    } catch (error) {
      log(`Error getting multi-chain balances: ${error}`, 'moralis');
      throw error;
    }
  }

  // Get NFT metadata
  async getNFTMetadata(address: string, tokenId: string, chain: string = 'eth'): Promise<any> {
    try {
      const response = await Moralis.EvmApi.nft.getNFTMetadata({
        address,
        tokenId,
        chain,
      });
      if (response && response.raw) {
        return response.raw;
      }
      return null;
    } catch (error) {
      log(`Error getting NFT metadata: ${error}`, 'moralis');
      throw error;
    }
  }

  // Get block by timestamp
  async getBlockByTimestamp(timestamp: number, chain: string = 'eth'): Promise<any> {
    try {
      const response = await Moralis.EvmApi.block.getDateToBlock({
        date: new Date(timestamp),
        chain,
      });
      return response.raw;
    } catch (error) {
      log(`Error getting block by timestamp: ${error}`, 'moralis');
      throw error;
    }
  }

  // Run a contract function
  async runContractFunction({
    address,
    functionName,
    abi,
    params = {},
    chain = 'eth',
  }: {
    address: string;
    functionName: string;
    abi: any[];
    params?: Record<string, any>;
    chain?: string;
  }): Promise<any> {
    try {
      const response = await Moralis.EvmApi.utils.runContractFunction({
        address,
        functionName,
        abi,
        params,
        chain,
      });
      return response.raw;
    } catch (error) {
      log(`Error running contract function ${functionName}: ${error}`, 'moralis');
      throw error;
    }
  }
}

export const moralisService = new MoralisService();
