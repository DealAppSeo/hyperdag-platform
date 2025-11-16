import { logger } from '../utils/logger';
import { iotaService } from './iota-service';
import { polygonService } from './polygon-service';
import { solanaService } from './solana-service';
import { storage } from '../storage';
import { getTransactionRouter } from './transaction-router-service';

/**
 * Service that bridges different wallet systems and provides unified access
 * to blockchain and DAG functionality
 */
class WalletBridgeService {
  
  /**
   * Get all wallet balances for a user across different chains/DAGs
   * @param userId User ID
   * @returns Object with balances from different chains
   */
  async getUserWalletBalances(userId: number) {
    try {
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize result object
      const result: any = {
        success: true,
        data: {
          systemWallets: {},
          connectedWallets: {}
        }
      };

      // Get system wallet balances
      try {
        const iotaBalance = await iotaService.getBalance(userId);
        result.data.systemWallets.iota = iotaBalance;
      } catch (error: any) {
        logger.error(`Error getting IOTA balance: ${error.message}`);
        result.data.systemWallets.iota = { error: 'Failed to fetch balance' };
      }

      try {
        const polygonBalance = await polygonService.getBalance(userId);
        result.data.systemWallets.polygon = polygonBalance;
      } catch (error: any) {
        logger.error(`Error getting Polygon balance: ${error.message}`);
        result.data.systemWallets.polygon = { error: 'Failed to fetch balance' };
      }

      try {
        const solanaBalance = await solanaService.getBalance(userId);
        result.data.systemWallets.solana = solanaBalance;
      } catch (error: any) {
        logger.error(`Error getting Solana balance: ${error.message}`);
        result.data.systemWallets.solana = { error: 'Failed to fetch balance' };
      }

      // Get connected wallet balances if available
      if (user.connectedWallets) {
        for (const [chain, address] of Object.entries(user.connectedWallets)) {
          if (!address) continue;
          
          try {
            let balance;
            switch (chain) {
              case 'polygon':
                balance = await polygonService.getExternalWalletBalance(address as string);
                break;
              case 'solana':
                balance = await solanaService.getExternalWalletBalance(address as string);
                break;
              // IOTA doesn't support external wallet queries yet
            }
            
            if (balance) {
              result.data.connectedWallets[chain] = balance;
            }
          } catch (error: any) {
            logger.error(`Error getting ${chain} balance for connected wallet: ${error.message}`);
            result.data.connectedWallets[chain] = { error: 'Failed to fetch balance' };
          }
        }
      }

      return result;
    } catch (error: any) {
      logger.error(`Error in getUserWalletBalances: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute a transaction using the optimal route determined by the AI
   * @param userId User ID
   * @param toAddress Destination address
   * @param amount Amount to send
   * @param tokenSymbol Token symbol (e.g., 'IOTA', 'MATIC', 'SOL')
   * @param options Additional options for routing
   * @returns Transaction result
   */
  async executeTransaction(
    userId: number, 
    toAddress: string, 
    amount: number, 
    tokenSymbol: string,
    options: {
      useConnectedWallet?: boolean,
      prioritizeBy?: 'speed' | 'cost' | 'security' | 'auto',
      maxFeeAllowed?: number
    } = {}
  ) {
    try {
      const transactionRouter = getTransactionRouter();
      const routeDecision = await transactionRouter.determineOptimalRoute({
        userId,
        tokenSymbol,
        amount,
        destination: toAddress,
        prioritizeBy: options.prioritizeBy || 'auto',
        maxFeeAllowed: options.maxFeeAllowed
      });

      // If user wants to use their connected wallet and it's available
      if (options.useConnectedWallet) {
        const user = await storage.getUser(userId);
        if (!user || !user.connectedWallets || !user.connectedWallets[routeDecision.network.toLowerCase()]) {
          throw new Error(`No connected wallet available for ${routeDecision.network}`);
        }
        
        // For connected wallets, we return the transaction details for the frontend to execute
        // since we don't have the private keys
        return {
          success: true,
          action: 'WALLET_SIGN_REQUIRED',
          data: {
            network: routeDecision.network,
            params: routeDecision.params,
            estimatedFee: routeDecision.estimatedFee,
            estimatedTime: routeDecision.estimatedTimeSeconds
          }
        };
      }
      
      // Otherwise, use system wallets to execute the transaction
      let txResult;
      switch (routeDecision.network.toLowerCase()) {
        case 'iota':
          txResult = await iotaService.transfer(userId, toAddress, amount);
          break;
        case 'polygon':
          txResult = await polygonService.transfer(userId, toAddress, amount);
          break;
        case 'solana':
          txResult = await solanaService.transfer(userId, toAddress, amount);
          break;
        default:
          throw new Error(`Unsupported network: ${routeDecision.network}`);
      }

      return {
        success: true,
        data: {
          transactionId: txResult.transactionId,
          network: routeDecision.network,
          amount,
          fee: txResult.fee || routeDecision.estimatedFee,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      logger.error(`Error in executeTransaction: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Connect an external wallet to the user's account
   * @param userId User ID
   * @param walletAddress Wallet address to connect
   * @param network Network (e.g., 'polygon', 'solana', 'iota')
   * @param signature Signature proving ownership
   * @returns Success status
   */
  async connectExternalWallet(
    userId: number, 
    walletAddress: string, 
    network: string,
    signature: string
  ) {
    try {
      // Verify wallet ownership using signature
      let verified = false;
      
      switch (network.toLowerCase()) {
        case 'polygon':
          verified = await polygonService.verifyWalletOwnership(walletAddress, signature);
          break;
        case 'solana':
          verified = await solanaService.verifyWalletOwnership(walletAddress, signature);
          break;
        case 'iota':
          // IOTA doesn't support external wallet connections yet
          throw new Error('IOTA external wallet connections not supported yet');
        default:
          throw new Error(`Unsupported network: ${network}`);
      }

      if (!verified) {
        throw new Error('Wallet ownership verification failed');
      }

      // Update user record with connected wallet
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize connectedWallets if it doesn't exist
      const connectedWallets = user.connectedWallets || {};
      connectedWallets[network.toLowerCase()] = walletAddress;

      await storage.updateUserWallets(userId, connectedWallets);

      return {
        success: true,
        message: `${network} wallet connected successfully`
      };
    } catch (error: any) {
      logger.error(`Error in connectExternalWallet: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Disconnect an external wallet from the user's account
   * @param userId User ID
   * @param network Network to disconnect
   * @returns Success status
   */
  async disconnectExternalWallet(userId: number, network: string) {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize connectedWallets if it doesn't exist
      const connectedWallets = user.connectedWallets || {};
      
      // Remove the wallet if it exists
      if (connectedWallets[network.toLowerCase()]) {
        delete connectedWallets[network.toLowerCase()];
        await storage.updateUserWallets(userId, connectedWallets);
      }

      return {
        success: true,
        message: `${network} wallet disconnected successfully`
      };
    } catch (error: any) {
      logger.error(`Error in disconnectExternalWallet: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const walletBridgeService = new WalletBridgeService();