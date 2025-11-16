import { logger } from '../utils/logger';

interface RoutingOptions {
  userId: number;
  tokenSymbol: string;
  amount: number;
  destination: string;
  prioritizeBy?: 'speed' | 'cost' | 'security' | 'auto';
  maxFeeAllowed?: number;
}

interface RouteDecision {
  network: string;
  params: any;
  estimatedFee: number;
  estimatedTimeSeconds: number;
  securityScore: number;
  reasoning: string;
}

/**
 * Service that determines the optimal transaction routing based on 
 * user preferences, transaction attributes, and network conditions
 */
class TransactionRouterService {
  private networkWeights = {
    polygon: {
      speed: 0.75,    // Medium-fast
      cost: 0.85,     // Low cost
      security: 0.9   // High security
    },
    solana: {
      speed: 0.95,    // Very fast
      cost: 0.92,     // Very low cost
      security: 0.75  // Good security
    },
    iota: {
      speed: 0.9,     // Fast
      cost: 1.0,      // Feeless
      security: 0.75  // Good security
    }
  };

  /**
   * Determine the optimal route for a transaction based on user preferences and network conditions
   * @param options Routing options
   * @returns Route decision with detailed reasoning
   */
  async determineOptimalRoute(options: RoutingOptions): Promise<RouteDecision> {
    try {
      const { tokenSymbol, amount, prioritizeBy = 'auto' } = options;
      
      // Determine which networks support this token
      const supportedNetworks = this.getSupportedNetworks(tokenSymbol);
      
      if (supportedNetworks.length === 0) {
        throw new Error(`No networks support the token ${tokenSymbol}`);
      }
      
      // If only one network supports this token, return it directly
      if (supportedNetworks.length === 1) {
        const network = supportedNetworks[0];
        return {
          network,
          params: this.getTransactionParams(network, options),
          estimatedFee: this.estimateTransactionFee(network, amount),
          estimatedTimeSeconds: this.estimateTransactionTime(network),
          securityScore: this.networkWeights[network as keyof typeof this.networkWeights].security * 10,
          reasoning: `${network} is the only network that supports ${tokenSymbol}`
        };
      }
      
      // Calculate scores for each supported network
      const networkScores = supportedNetworks.map(network => {
        const weights = this.networkWeights[network as keyof typeof this.networkWeights];
        const fee = this.estimateTransactionFee(network, amount);
        const timeSeconds = this.estimateTransactionTime(network);
        
        // Check if fee exceeds max allowed
        if (options.maxFeeAllowed !== undefined && fee > options.maxFeeAllowed) {
          return {
            network,
            totalScore: 0,
            fee,
            timeSeconds,
            securityScore: weights.security * 10
          };
        }
        
        // Calculate weighted score based on priority
        let totalScore;
        let reasoning;
        
        switch (prioritizeBy) {
          case 'speed':
            totalScore = weights.speed * 0.7 + weights.cost * 0.15 + weights.security * 0.15;
            reasoning = `Prioritizing transaction speed (70%), with less emphasis on cost (15%) and security (15%)`;
            break;
          case 'cost':
            totalScore = weights.cost * 0.7 + weights.speed * 0.15 + weights.security * 0.15;
            reasoning = `Prioritizing transaction cost (70%), with less emphasis on speed (15%) and security (15%)`;
            break;
          case 'security':
            totalScore = weights.security * 0.7 + weights.speed * 0.15 + weights.cost * 0.15;
            reasoning = `Prioritizing transaction security (70%), with less emphasis on speed (15%) and cost (15%)`;
            break;
          case 'auto':
          default:
            // For auto, consider amount - use security for high-value transactions
            if (amount > 1000) {
              totalScore = weights.security * 0.5 + weights.speed * 0.3 + weights.cost * 0.2;
              reasoning = `Auto-detected high-value transaction: prioritizing security (50%), speed (30%), and cost (20%)`;
            } 
            // Medium value, balance all factors
            else if (amount > 100) {
              totalScore = weights.security * 0.33 + weights.speed * 0.33 + weights.cost * 0.34;
              reasoning = `Auto-detected medium-value transaction: balancing security (33%), speed (33%), and cost (34%)`;
            } 
            // Low value, prioritize cost and speed
            else {
              totalScore = weights.cost * 0.5 + weights.speed * 0.4 + weights.security * 0.1;
              reasoning = `Auto-detected low-value transaction: prioritizing cost (50%) and speed (40%) over security (10%)`;
            }
        }
        
        return {
          network,
          totalScore,
          fee,
          timeSeconds,
          securityScore: weights.security * 10,
          reasoning
        };
      });
      
      // Find the network with the highest score
      const bestRoute = networkScores.reduce((best, current) => {
        return current.totalScore > best.totalScore ? current : best;
      });
      
      return {
        network: bestRoute.network,
        params: this.getTransactionParams(bestRoute.network, options),
        estimatedFee: bestRoute.fee,
        estimatedTimeSeconds: bestRoute.timeSeconds,
        securityScore: bestRoute.securityScore,
        reasoning: bestRoute.reasoning
      };
    } catch (error: any) {
      logger.error(`Error determining optimal route: ${error.message}`);
      // Default to Polygon if there's an error in route determination
      return {
        network: 'polygon',
        params: this.getTransactionParams('polygon', options),
        estimatedFee: this.estimateTransactionFee('polygon', options.amount),
        estimatedTimeSeconds: this.estimateTransactionTime('polygon'),
        securityScore: this.networkWeights.polygon.security * 10,
        reasoning: `Defaulting to Polygon due to error in route determination: ${error.message}`
      };
    }
  }
  
  /**
   * Get list of networks that support the given token
   * @param tokenSymbol Token symbol
   * @returns Array of supported networks
   */
  private getSupportedNetworks(tokenSymbol: string): string[] {
    // This is a simplified version - in a production environment,
    // this would query a database or API for supported tokens per network
    const supportedTokens: Record<string, string[]> = {
      'MATIC': ['polygon'],
      'SOL': ['solana'],
      'IOTA': ['iota'],
      'ETH': ['polygon'],
      'USDC': ['polygon', 'solana'],
      'USDT': ['polygon', 'solana'],
      'DAI': ['polygon'],
      'SMR': ['iota']  // Shimmer token on IOTA
    };
    
    return supportedTokens[tokenSymbol.toUpperCase()] || [];
  }
  
  /**
   * Estimate transaction fee for a given network and amount
   * @param network Network name
   * @param amount Transaction amount
   * @returns Estimated fee
   */
  private estimateTransactionFee(network: string, amount: number): number {
    // This is a simplified estimation - in a production environment,
    // this would query current network conditions and fee estimators
    switch (network.toLowerCase()) {
      case 'polygon':
        return 0.001 + (amount * 0.0005);  // Base fee + percentage
      case 'solana':
        return 0.00001;  // Fixed fee regardless of amount
      case 'iota':
        return 0;  // Feeless
      default:
        return 0.01;  // Default fee
    }
  }
  
  /**
   * Estimate transaction time in seconds for a given network
   * @param network Network name
   * @returns Estimated time in seconds
   */
  private estimateTransactionTime(network: string): number {
    // This is a simplified estimation - in a production environment,
    // this would query current network conditions
    switch (network.toLowerCase()) {
      case 'polygon':
        return 30;  // ~30 seconds
      case 'solana':
        return 2;   // ~2 seconds
      case 'iota':
        return 10;  // ~10 seconds
      default:
        return 60;  // Default 1 minute
    }
  }
  
  /**
   * Get transaction parameters for a specific network
   * @param network Network name
   * @param options Transaction options
   * @returns Network-specific transaction parameters
   */
  private getTransactionParams(network: string, options: RoutingOptions): any {
    // This is a simplified version - in production, this would include
    // network-specific parameters like gas prices, etc.
    const { destination, amount, tokenSymbol } = options;
    
    const baseParams = {
      to: destination,
      amount,
      token: tokenSymbol
    };
    
    switch (network.toLowerCase()) {
      case 'polygon':
        return {
          ...baseParams,
          gasLimit: 200000,
          maxFeePerGas: 50000000000,  // 50 Gwei
          maxPriorityFeePerGas: 1500000000  // 1.5 Gwei
        };
      case 'solana':
        return {
          ...baseParams,
          recentBlockhash: 'placeholder-for-recent-blockhash',
          commitment: 'processed'
        };
      case 'iota':
        return {
          ...baseParams,
          remainderValueStrategy: {
            strategy: 'ReuseAddress'
          }
        };
      default:
        return baseParams;
    }
  }
}

// Create a single instance and export a getter function
const transactionRouterService = new TransactionRouterService();

export const getTransactionRouter = () => transactionRouterService;