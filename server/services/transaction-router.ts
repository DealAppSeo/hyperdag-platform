import { logger } from '../utils/logger.js';
import { crossChainAIService } from './cross-chain-ai-service';
import { transactionPrioritizer } from './transaction-prioritizer';
import { chainConfig } from '../utils/chain-config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import OpenAI from 'openai';

// ES Modules compatible __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// Transaction types
export enum TransactionType {
  PAYMENT = 'payment',
  DATA_STORAGE = 'data-storage',
  SMART_CONTRACT = 'smart-contract',
  TOKEN_TRANSFER = 'token-transfer',
  NFT_TRANSFER = 'nft-transfer',
  VERIFICATION = 'verification',
  IDENTITY = 'identity',
  DOCUMENT_NOTARIZATION = 'document-notarization'
}

// Transaction requirements
export interface TransactionRequirements {
  speed: number;       // 0-1 scale (how fast it needs to be)
  cost: number;        // 0-1 scale (how cost-sensitive it is)
  security: number;    // 0-1 scale (how secure it needs to be)
  privacy: number;     // 0-1 scale (how private it needs to be)
  dataSize: number;    // Size in bytes
  complexity: number;  // 0-1 scale (computational complexity)
}

// Network metrics
export interface NetworkMetrics {
  name: string;
  txFee: number;
  confirmationTime: number;
  congestion: number;
  reliability: number;
  privacy: number;
  dataStorageCost: number;
  smartContractSupport: boolean;
  dataStorageLimit: number;
  throughput: number;
}

// Routing recommendation
export interface RoutingRecommendation {
  network: string;
  reason: string;
  estimatedCost: number;
  estimatedTime: number;
  confidence: number;
  alternativeNetworks?: { network: string; reason: string }[];
}

/**
 * Transaction Router Service
 * Intelligent service that routes transactions to the optimal network based on
 * transaction type and real-time network conditions
 */
class TransactionRouter {
  private networkMetrics: Map<string, NetworkMetrics> = new Map();
  private lastMetricsUpdate: number = 0;
  private metricsUpdateInterval: number = 5 * 60 * 1000; // 5 minutes
  
  constructor() {
    this.initializeNetworkMetrics();
    logger.info('Transaction Router Service initialized');
  }
  
  /**
   * Initialize network metrics
   */
  private initializeNetworkMetrics(): void {
    // Polygon zkEVM Cardona
    this.networkMetrics.set('polygon-zkevm-cardona', {
      name: 'Polygon zkEVM Cardona Testnet',
      txFee: 0.02,
      confirmationTime: 2,
      congestion: 0.15,
      reliability: 0.98,
      privacy: 0.85,
      dataStorageCost: 0.03,
      smartContractSupport: true,
      dataStorageLimit: 50000,
      throughput: 2000
    });
    
    // Solana
    this.networkMetrics.set('solana-testnet', {
      name: 'Solana Testnet',
      txFee: 0.000005,
      confirmationTime: 0.5,
      congestion: 0.1,
      reliability: 0.95,
      privacy: 0.6,
      dataStorageCost: 0.001,
      smartContractSupport: true,
      dataStorageLimit: 10000,
      throughput: 50000
    });
    
    // Arweave-like storage network (simulated for data storage)
    this.networkMetrics.set('arweave-testnet', {
      name: 'Arweave-like Storage Testnet',
      txFee: 0.01,
      confirmationTime: 20,
      congestion: 0.05,
      reliability: 0.99,
      privacy: 0.7,
      dataStorageCost: 0.0001, // Very low cost per byte
      smartContractSupport: false,
      dataStorageLimit: 10000000, // Very high storage limit
      throughput: 100
    });
    
    // IPFS-like network (simulated for decentralized storage)
    this.networkMetrics.set('ipfs-node', {
      name: 'IPFS Node',
      txFee: 0.0,
      confirmationTime: 1,
      congestion: 0.05,
      reliability: 0.9,
      privacy: 0.5,
      dataStorageCost: 0.0,
      smartContractSupport: false,
      dataStorageLimit: 1000000000,
      throughput: 500
    });
    
    // DAG network (simulated for high throughput)
    this.networkMetrics.set('dag-testnet', {
      name: 'DAG Testnet',
      txFee: 0.0001,
      confirmationTime: 0.2,
      congestion: 0.05,
      reliability: 0.92,
      privacy: 0.7,
      dataStorageCost: 0.002,
      smartContractSupport: true,
      dataStorageLimit: 20000,
      throughput: 10000
    });
    
    this.lastMetricsUpdate = Date.now();
  }
  
  /**
   * Update network metrics from real-time data
   */
  async updateNetworkMetrics(): Promise<void> {
    // Only update if interval has passed
    if (Date.now() - this.lastMetricsUpdate < this.metricsUpdateInterval) {
      return;
    }
    
    try {
      // This would fetch real metrics from actual networks in production
      // For now, we'll make small random adjustments to simulate changing conditions
      
      for (const [network, metrics] of this.networkMetrics.entries()) {
        // Random fluctuation between 0.8 and 1.2 of current values
        const fluctuation = 0.8 + Math.random() * 0.4;
        
        // Update congestion with random variation
        let newCongestion = metrics.congestion * fluctuation;
        newCongestion = Math.max(0.05, Math.min(0.95, newCongestion));
        
        // Update transaction fees based on congestion
        let newTxFee = metrics.txFee * (1 + (newCongestion - metrics.congestion));
        newTxFee = Math.max(metrics.txFee * 0.8, newTxFee);
        
        // Update confirmation time based on congestion
        let newConfirmationTime = metrics.confirmationTime * (1 + (newCongestion - metrics.congestion) * 2);
        newConfirmationTime = Math.max(metrics.confirmationTime * 0.8, newConfirmationTime);
        
        // Update the metrics
        this.networkMetrics.set(network, {
          ...metrics,
          congestion: newCongestion,
          txFee: newTxFee,
          confirmationTime: newConfirmationTime
        });
      }
      
      this.lastMetricsUpdate = Date.now();
      logger.info('Network metrics updated');
    } catch (error) {
      logger.error('Error updating network metrics:', error);
    }
  }
  
  /**
   * Get default requirements based on transaction type
   * @param txType - Type of transaction
   * @returns Default requirements for the transaction type
   */
  getDefaultRequirements(txType: TransactionType): TransactionRequirements {
    switch (txType) {
      case TransactionType.PAYMENT:
        return {
          speed: 0.8,     // Payments should be fast
          cost: 0.5,      // Moderate cost sensitivity
          security: 0.9,   // High security needed
          privacy: 0.6,    // Moderate privacy
          dataSize: 500,   // Small data size
          complexity: 0.2  // Low complexity
        };
        
      case TransactionType.DATA_STORAGE:
        return {
          speed: 0.2,     // Speed not critical
          cost: 0.9,      // Very cost sensitive
          security: 0.7,   // Moderate security
          privacy: 0.5,    // Moderate privacy
          dataSize: 50000, // Large data size
          complexity: 0.3  // Low-moderate complexity
        };
        
      case TransactionType.SMART_CONTRACT:
        return {
          speed: 0.6,     // Moderately fast
          cost: 0.4,      // Less cost sensitive
          security: 0.95,  // Very high security
          privacy: 0.7,    // High privacy
          dataSize: 10000, // Moderate data size
          complexity: 0.9  // High complexity
        };
        
      case TransactionType.TOKEN_TRANSFER:
        return {
          speed: 0.7,     // Should be fairly fast
          cost: 0.6,      // Moderately cost sensitive
          security: 0.8,   // High security
          privacy: 0.5,    // Moderate privacy
          dataSize: 1000,  // Small data size
          complexity: 0.3  // Low complexity
        };
        
      case TransactionType.NFT_TRANSFER:
        return {
          speed: 0.6,     // Moderately fast
          cost: 0.4,      // Less cost sensitive
          security: 0.9,   // High security
          privacy: 0.6,    // Moderate privacy
          dataSize: 5000,  // Moderate data size
          complexity: 0.5  // Moderate complexity
        };
        
      case TransactionType.VERIFICATION:
        return {
          speed: 0.9,     // Needs to be very fast
          cost: 0.3,      // Not very cost sensitive
          security: 0.95,  // Very high security
          privacy: 0.7,    // High privacy
          dataSize: 2000,  // Small-moderate data size
          complexity: 0.4  // Moderate complexity
        };
        
      case TransactionType.IDENTITY:
        return {
          speed: 0.5,     // Moderate speed
          cost: 0.4,      // Less cost sensitive
          security: 0.99,  // Extremely high security
          privacy: 0.95,   // Very high privacy
          dataSize: 3000,  // Moderate data size
          complexity: 0.7  // High complexity
        };
        
      case TransactionType.DOCUMENT_NOTARIZATION:
        return {
          speed: 0.3,     // Speed not critical
          cost: 0.7,      // Cost sensitive
          security: 0.95,  // Very high security
          privacy: 0.8,    // High privacy
          dataSize: 30000, // Large data size
          complexity: 0.5  // Moderate complexity
        };
        
      default:
        // Balanced default
        return {
          speed: 0.5,
          cost: 0.5,
          security: 0.7,
          privacy: 0.6,
          dataSize: 5000,
          complexity: 0.5
        };
    }
  }
  
  /**
   * Calculate network score based on requirements
   * @param network - Network metrics
   * @param requirements - Transaction requirements
   * @returns Score (higher is better)
   */
  private calculateNetworkScore(network: NetworkMetrics, requirements: TransactionRequirements): number {
    // Calculate component scores
    
    // Speed score - higher for faster networks when speed is important
    const speedScore = (1 / (network.confirmationTime + 0.1)) * requirements.speed;
    
    // Cost score - higher for cheaper networks when cost is important
    const costScore = (1 / (network.txFee + 0.001)) * requirements.cost;
    
    // Security score - higher for more reliable networks when security is important
    const securityScore = network.reliability * requirements.security;
    
    // Privacy score - higher for more private networks when privacy is important
    const privacyScore = network.privacy * requirements.privacy;
    
    // Storage score - higher for networks with low storage costs when storing large data
    const storageEfficiency = network.dataStorageLimit > requirements.dataSize ? 
      1 / (network.dataStorageCost + 0.0001) : 0;
    const storageScore = storageEfficiency * (requirements.dataSize / 10000);
    
    // Complexity score - higher for networks that support smart contracts when complexity is high
    const complexityScore = network.smartContractSupport ? 
      1 * requirements.complexity : 
      (1 - requirements.complexity) * 0.5;
    
    // Congestion penalty - reduce score for congested networks
    const congestionPenalty = network.congestion * 0.5;
    
    // Calculate total score with appropriate weights
    const totalScore = 
      speedScore * 2 + 
      costScore * 2 + 
      securityScore * 3 + 
      privacyScore * 1.5 + 
      storageScore * 1 + 
      complexityScore * 1.5 - 
      congestionPenalty;
    
    return totalScore;
  }
  
  /**
   * Find best network based on requirements using rule-based approach
   * @param requirements - Transaction requirements
   * @returns Routing recommendation
   */
  private findBestNetworkRuleBased(requirements: TransactionRequirements): RoutingRecommendation {
    // First, filter out networks that don't meet basic requirements
    const eligibleNetworks = Array.from(this.networkMetrics.entries())
      .filter(([_, metrics]) => {
        // Must be able to handle the data size
        if (metrics.dataStorageLimit < requirements.dataSize) {
          return false;
        }
        
        // If complexity is high, must support smart contracts
        if (requirements.complexity > 0.7 && !metrics.smartContractSupport) {
          return false;
        }
        
        return true;
      })
      .map(([id, metrics]) => ({
        id,
        metrics,
        score: this.calculateNetworkScore(metrics, requirements)
      }))
      .sort((a, b) => b.score - a.score); // Sort by score (descending)
    
    if (eligibleNetworks.length === 0) {
      // Fall back to Polygon zkEVM if no network meets the requirements
      const fallbackNetwork = this.networkMetrics.get('polygon-zkevm-cardona')!;
      return {
        network: 'polygon-zkevm-cardona',
        reason: 'No network fully meets all requirements. Using Polygon zkEVM as fallback.',
        estimatedCost: fallbackNetwork.txFee * (1 + requirements.dataSize / 10000),
        estimatedTime: fallbackNetwork.confirmationTime,
        confidence: 0.5
      };
    }
    
    // Get best network
    const bestNetwork = eligibleNetworks[0];
    
    // Generate reason based on why this network was chosen
    let reason = `Selected ${bestNetwork.metrics.name} for optimized `;
    
    // Find what factor contributed most to the score
    const factors = [];
    if (requirements.speed > 0.7) factors.push(`speed (${bestNetwork.metrics.confirmationTime.toFixed(1)}s)`);
    if (requirements.cost > 0.7) factors.push(`cost (${bestNetwork.metrics.txFee.toFixed(4)} units)`);
    if (requirements.security > 0.7) factors.push(`security (${(bestNetwork.metrics.reliability * 100).toFixed(0)}% reliability)`);
    if (requirements.privacy > 0.7) factors.push(`privacy (${(bestNetwork.metrics.privacy * 100).toFixed(0)}% privacy)`);
    if (requirements.dataSize > 10000) factors.push(`data storage (${bestNetwork.metrics.dataStorageLimit} bytes limit)`);
    
    if (factors.length > 0) {
      reason += factors.join(', ');
    } else {
      reason += 'balanced performance';
    }
    
    // Add alternatives
    const alternatives = eligibleNetworks
      .slice(1, 3)
      .map(network => ({
        network: network.id,
        reason: `Alternative with ${(network.score / bestNetwork.score * 100).toFixed(0)}% of optimal score`
      }));
    
    // Calculate estimated cost based on data size
    const estimatedCost = bestNetwork.metrics.txFee * (1 + requirements.dataSize / 10000);
    
    return {
      network: bestNetwork.id,
      reason,
      estimatedCost,
      estimatedTime: bestNetwork.metrics.confirmationTime,
      confidence: 0.85,
      alternativeNetworks: alternatives
    };
  }
  
  /**
   * Get routing recommendation using AI
   * @param txType - Transaction type
   * @param requirements - Transaction requirements
   * @returns Routing recommendation
   */
  private async getAIRoutingRecommendation(
    txType: TransactionType,
    requirements: TransactionRequirements
  ): Promise<RoutingRecommendation | null> {
    if (!openai) {
      return null;
    }
    
    try {
      // Prepare network data for AI
      const networkData = Array.from(this.networkMetrics.entries())
        .map(([id, metrics]) => ({
          id,
          name: metrics.name,
          txFee: metrics.txFee,
          confirmationTime: `${metrics.confirmationTime}s`,
          congestion: `${(metrics.congestion * 100).toFixed(0)}%`,
          reliability: `${(metrics.reliability * 100).toFixed(0)}%`,
          privacy: `${(metrics.privacy * 100).toFixed(0)}%`,
          dataStorageCost: metrics.dataStorageCost,
          smartContractSupport: metrics.smartContractSupport,
          dataStorageLimit: `${metrics.dataStorageLimit} bytes`,
          throughput: `${metrics.throughput} tx/s`
        }));
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI specialized in optimizing blockchain and distributed ledger transactions. 
            Your task is to select the optimal network for a transaction based on its requirements and 
            real-time network conditions. Provide your recommendation in JSON format.`
          },
          {
            role: "user",
            content: `I need to route a ${txType} transaction with the following requirements:
            - Speed importance: ${requirements.speed * 100}%
            - Cost sensitivity: ${requirements.cost * 100}%
            - Security needs: ${requirements.security * 100}%
            - Privacy needs: ${requirements.privacy * 100}%
            - Data size: ${requirements.dataSize} bytes
            - Computational complexity: ${requirements.complexity * 100}%
            
            Available networks with current metrics:
            ${JSON.stringify(networkData, null, 2)}
            
            Which network should I use? Provide output in JSON format with the following fields:
            - network: the network ID to use
            - reason: detailed explanation of why this network is optimal
            - estimatedCost: estimated transaction cost
            - estimatedTime: estimated confirmation time in seconds
            - confidence: your confidence in this recommendation (0-1)
            - alternativeNetworks: array of objects with {network, reason} for 1-2 alternative options`
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Verify the result has necessary fields
      if (!result.network || !result.reason) {
        throw new Error('AI response missing required fields');
      }
      
      return result;
    } catch (error) {
      logger.error('Error getting AI routing recommendation:', error);
      return null;
    }
  }
  
  /**
   * Route a transaction to the optimal network
   * @param txType - Type of transaction
   * @param customRequirements - Custom requirements (optional)
   * @returns Routing recommendation
   */
  async routeTransaction(
    txType: TransactionType,
    customRequirements?: Partial<TransactionRequirements>
  ): Promise<RoutingRecommendation> {
    try {
      // Update network metrics
      await this.updateNetworkMetrics();
      
      // Get default requirements for this transaction type
      const baseRequirements = this.getDefaultRequirements(txType);
      
      // Merge with custom requirements if provided
      const requirements = customRequirements ? 
        { ...baseRequirements, ...customRequirements } : 
        baseRequirements;
      
      // Try to get AI recommendation first
      const aiRecommendation = await this.getAIRoutingRecommendation(txType, requirements);
      
      if (aiRecommendation) {
        return {
          ...aiRecommendation,
          reason: `[AI] ${aiRecommendation.reason}`
        };
      }
      
      // Fall back to rule-based approach
      return this.findBestNetworkRuleBased(requirements);
    } catch (error) {
      logger.error('Error routing transaction:', error);
      
      // Default to Polygon zkEVM in case of errors
      const fallbackNetwork = this.networkMetrics.get('polygon-zkevm-cardona')!;
      return {
        network: 'polygon-zkevm-cardona',
        reason: 'Error in routing algorithm. Using Polygon zkEVM as fallback.',
        estimatedCost: fallbackNetwork.txFee,
        estimatedTime: fallbackNetwork.confirmationTime,
        confidence: 0.5
      };
    }
  }
  
  /**
   * Get current status of all supported networks
   */
  async getNetworkStatus(): Promise<any> {
    await this.updateNetworkMetrics();
    
    const networkStatus = Array.from(this.networkMetrics.entries()).map(([id, metrics]) => ({
      id,
      name: metrics.name,
      status: 'online', // In a real implementation, this would be fetched from actual network
      metrics: {
        txFee: metrics.txFee,
        confirmationTime: metrics.confirmationTime,
        congestion: metrics.congestion,
        reliability: metrics.reliability
      },
      capabilities: {
        smartContracts: metrics.smartContractSupport,
        maxDataSize: metrics.dataStorageLimit,
        throughput: metrics.throughput
      }
    }));
    
    return {
      networks: networkStatus,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const transactionRouter = new TransactionRouter();