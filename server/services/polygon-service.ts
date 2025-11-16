import { logger } from '../utils/logger.js';
import { ethers } from 'ethers';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// ES Modules compatible __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const KEYPAIRS_DIR = join(dirname(dirname(__dirname)), 'keypairs');

/**
 * Service for interacting with Polygon zkEVM Cardona Testnet
 */
class PolygonService {
  private provider: ethers.JsonRpcProvider;
  
  constructor() {
    // Polygon Amoy Testnet via Infura
    const infuraApiKey = process.env.INFURA_API_KEY;
    const rpcUrl = `https://polygon-amoy.infura.io/v3/${infuraApiKey}`;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Ensure keypairs directory exists
    if (!fs.existsSync(KEYPAIRS_DIR)) {
      fs.mkdirSync(KEYPAIRS_DIR, { recursive: true });
    }
    
    logger.info('Polygon Service initialized');
  }

  /**
   * Get network status
   * @returns Network status information
   */
  async getNetworkStatus(): Promise<{ status: string; blockNumber?: number; network?: any }> {
    try {
      // Check if provider is connected
      await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        status: 'connected',
        blockNumber,
        network: {
          name: 'Polygon zkEVM Cardona Testnet',
          chainId: 2442
        }
      };
    } catch (error) {
      logger.error('Error getting Polygon network status:', error);
      return { status: 'disconnected' };
    }
  }

  /**
   * Get user's Polygon account
   * @param userId - User ID
   * @returns Account information
   */
  async getAccount(userId: string | number): Promise<{ address: string; network: string } | null> {
    try {
      const keypair = await this.getOrCreateKeypair(userId);
      
      return {
        address: keypair.address,
        network: 'Polygon zkEVM Cardona Testnet'
      };
    } catch (error) {
      logger.error('Error getting Polygon account:', error);
      return null;
    }
  }

  /**
   * Create a new Polygon account
   * @param userId - User ID
   * @returns New account information
   */
  async createAccount(userId: string | number): Promise<{ address: string; network: string }> {
    try {
      // Delete existing keypair if it exists
      const keypairPath = join(KEYPAIRS_DIR, `polygon_${userId}.json`);
      if (fs.existsSync(keypairPath)) {
        fs.unlinkSync(keypairPath);
      }
      
      // Create and save new keypair
      const keypair = await this.getOrCreateKeypair(userId, true);
      
      return {
        address: keypair.address,
        network: 'Polygon zkEVM Cardona Testnet'
      };
    } catch (error) {
      logger.error('Error creating Polygon account:', error);
      throw new Error('Failed to create Polygon account');
    }
  }

  /**
   * Get balance of user's Polygon account
   * @param userId - User ID
   * @returns Balance information
   */
  async getBalance(userId: string | number): Promise<{ balance: string; balanceInEth: string; address: string }> {
    try {
      const keypair = await this.getOrCreateKeypair(userId);
      const balance = await this.provider.getBalance(keypair.address);
      
      return {
        balance: balance.toString(),
        balanceInEth: ethers.formatEther(balance),
        address: keypair.address
      };
    } catch (error) {
      logger.error('Error getting Polygon balance:', error);
      throw new Error('Failed to get balance');
    }
  }

  /**
   * Transfer ETH to another address
   * @param userId - User ID
   * @param toAddress - Recipient address
   * @param amount - Amount to transfer in ETH
   * @returns Transaction result
   */
  async transfer(
    userId: string | number,
    toAddress: string,
    amount: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Get keypair for the user
      const keypair = await this.getOrCreateKeypair(userId);
      const wallet = new ethers.Wallet(keypair.privateKey, this.provider);
      
      // Convert amount to wei
      const amountWei = ethers.parseEther(amount.toString());
      
      // Get current gas price and add 10% for faster confirmation
      const gasPrice = await this.provider.getFeeData();
      const adjustedGasPrice = gasPrice.gasPrice ? 
        gasPrice.gasPrice * BigInt(110) / BigInt(100) : 
        undefined;
      
      // Create transaction
      const tx = await wallet.sendTransaction({
        to: toAddress,
        value: amountWei,
        gasPrice: adjustedGasPrice
      });
      
      logger.info(`Polygon transfer initiated: ${tx.hash}`);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        return {
          success: true,
          txHash: tx.hash
        };
      } else {
        return {
          success: false,
          error: 'Transaction failed'
        };
      }
    } catch (error) {
      logger.error('Error transferring ETH:', error);
      return {
        success: false,
        error: 'Failed to transfer ETH'
      };
    }
  }

  /**
   * Get or create keypair for a user
   * @param userId - User ID
   * @param forceCreate - Force creation of new keypair
   * @returns User keypair
   */
  private async getOrCreateKeypair(
    userId: string | number,
    forceCreate = false
  ): Promise<{ address: string; privateKey: string }> {
    const keypairPath = join(KEYPAIRS_DIR, `polygon_${userId}.json`);
    
    // If keypair exists and not forcing recreation, return it
    if (!forceCreate && fs.existsSync(keypairPath)) {
      const keypairData = fs.readFileSync(keypairPath, 'utf8');
      return JSON.parse(keypairData);
    }
    
    // Generate new keypair
    const wallet = ethers.Wallet.createRandom();
    const keypair = {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
    
    // Save keypair to file
    fs.writeFileSync(keypairPath, JSON.stringify(keypair, null, 2));
    
    return keypair;
  }
}

export const polygonService = new PolygonService();