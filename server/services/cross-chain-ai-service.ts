import { logger } from '../utils/logger.js';
import { solanaService } from './solana-service';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES Modules compatible __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import OpenAI from 'openai';
import { ethers } from 'ethers';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Define blockchain metrics for AI decision making
interface BlockchainMetrics {
  name: string;
  gasPrice: number;  // in native currency
  txFee: number;     // average transaction fee in USD
  confirmationTime: number; // average confirmation time in seconds
  congestion: number; // 0-1 scale (1 being most congested)
  reliability: number; // 0-1 scale (1 being most reliable)
}

/**
 * Cross-chain AI Optimization Service
 * Uses AI to optimize cross-chain transactions and interactions
 */
class CrossChainAIService {
  private blockchains: Map<string, BlockchainMetrics> = new Map();
  private lastMetricsUpdate: number = 0;
  private metricsUpdateInterval: number = 5 * 60 * 1000; // 5 minutes
  
  constructor() {
    // Initialize with some default metrics
    // In production, these would be dynamically updated
    this.initializeBlockchainMetrics();
    logger.info('Cross-Chain AI Optimization Service initialized');
  }

  /**
   * Initialize blockchain metrics
   * In production, these should be fetched from real-time APIs
   */
  private initializeBlockchainMetrics(): void {
    // Polygon zkEVM Cardona testnet metrics (primary network)
    this.blockchains.set('polygon-zkevm-cardona', {
      name: 'Polygon zkEVM Cardona Testnet',
      gasPrice: 8, // in gwei
      txFee: 0.02, // Low transaction fees
      confirmationTime: 2, // Fast confirmations due to zkEVM
      congestion: 0.15, // Low congestion
      reliability: 0.98, // High reliability
    });
    
    // Solana testnet metrics
    this.blockchains.set('solana-testnet', {
      name: 'Solana Testnet',
      gasPrice: 0,  // Solana doesn't use gas in the same way as Ethereum
      txFee: 0.000005,  // Very low transaction fees
      confirmationTime: 0.5,  // Subsecond finality
      congestion: 0.1,  // Typically low congestion
      reliability: 0.95  // High reliability but it's a testnet
    });

    // Ethereum Goerli testnet metrics
    this.blockchains.set('ethereum-goerli', {
      name: 'Ethereum Goerli',
      gasPrice: 20, // in gwei
      txFee: 0.05,  // Higher transaction fees
      confirmationTime: 15,  // Slower confirmations
      congestion: 0.3,  // Moderate congestion
      reliability: 0.95 // High reliability but it's a testnet
    });

    // Polygon Mumbai testnet metrics
    this.blockchains.set('polygon-mumbai', {
      name: 'Polygon Mumbai',
      gasPrice: 30, // in gwei
      txFee: 0.001, // Low transaction fees
      confirmationTime: 3,  // Faster than Ethereum
      congestion: 0.2,  // Low-moderate congestion
      reliability: 0.92 // Good reliability but it's a testnet
    });

    this.lastMetricsUpdate = Date.now();
  }

  /**
   * Update blockchain metrics
   * In production, fetch real-time data from network APIs
   */
  async updateBlockchainMetrics(): Promise<void> {
    // Only update if the interval has passed
    if (Date.now() - this.lastMetricsUpdate < this.metricsUpdateInterval) {
      return;
    }

    try {
      // Fetch Solana metrics
      const solanaStatus = await solanaService.getNetworkStatus();
      if (solanaStatus.status === 'connected') {
        const currentMetrics = this.blockchains.get('solana-testnet');
        // Update metrics based on current network conditions
        // In a real implementation, derive congestion and reliability from network stats
        this.blockchains.set('solana-testnet', {
          ...currentMetrics,
          confirmationTime: 0.5, // Dynamic update based on current network
          congestion: Math.random() * 0.3, // Simplified simulation of network congestion
        });
      }

      // In a real implementation, add similar updates for other blockchains
      // For example, fetch gas prices from Ethereum and Polygon networks

      this.lastMetricsUpdate = Date.now();
      logger.info('Blockchain metrics updated');
    } catch (error) {
      logger.error('Error updating blockchain metrics:', error);
    }
  }

  /**
   * Get the optimal blockchain for a transaction based on requirements
   * @param amount - Transaction amount in USD
   * @param priorityFactor - What to prioritize: 'speed', 'cost', 'reliability', or 'balanced'
   * @returns The recommended blockchain and reasoning
   */
  async getOptimalBlockchain(amount: number, priorityFactor: 'speed' | 'cost' | 'reliability' | 'balanced' = 'balanced'): Promise<any> {
    try {
      await this.updateBlockchainMetrics();
      
      // Convert blockchain metrics to an array for analysis
      const chainOptions = Array.from(this.blockchains.entries()).map(([id, metrics]) => ({
        id,
        ...metrics
      }));

      // For larger amounts or more complex decisions, use AI
      if (amount > 100 || priorityFactor !== 'balanced') {
        return await this.getAIRecommendation(amount, priorityFactor, chainOptions);
      }
      
      // For simpler transactions, use rule-based logic
      return this.getRuleBasedRecommendation(amount, priorityFactor, chainOptions);
    } catch (error) {
      logger.error('Error getting optimal blockchain:', error);
      // Default to Polygon zkEVM Cardona Testnet if there's an error
      return {
        recommendedBlockchain: 'polygon-zkevm-cardona',
        reasoning: 'Default selection due to error in optimization process. Using Polygon zkEVM Cardona Testnet as the primary network.',
        confidence: 0.85
      };
    }
  }

  /**
   * Use rule-based logic for simpler transaction routing decisions
   */
  private getRuleBasedRecommendation(amount: number, priorityFactor: string, chainOptions: any[]): any {
    let selectedChain;
    let reasoning;
    
    switch (priorityFactor) {
      case 'speed':
        // Sort by confirmation time (ascending) and pick the fastest
        selectedChain = chainOptions.sort((a, b) => a.confirmationTime - b.confirmationTime)[0];
        reasoning = `Selected ${selectedChain.name} for its fast confirmation time of ${selectedChain.confirmationTime}s`;
        break;
        
      case 'cost':
        // Sort by transaction fee (ascending) and pick the cheapest
        selectedChain = chainOptions.sort((a, b) => a.txFee - b.txFee)[0];
        reasoning = `Selected ${selectedChain.name} for its low transaction fee of $${selectedChain.txFee}`;
        break;
        
      case 'reliability':
        // Sort by reliability (descending) and pick the most reliable
        selectedChain = chainOptions.sort((a, b) => b.reliability - a.reliability)[0];
        reasoning = `Selected ${selectedChain.name} for its high reliability score of ${selectedChain.reliability}`;
        break;
        
      case 'balanced':
      default:
        // Calculate a composite score
        selectedChain = chainOptions.reduce((best, current) => {
          const currentScore = 
            (1 / current.txFee) * 0.4 + 
            (1 / current.confirmationTime) * 0.3 + 
            current.reliability * 0.3;
            
          const bestScore = 
            (1 / best.txFee) * 0.4 + 
            (1 / best.confirmationTime) * 0.3 + 
            best.reliability * 0.3;
            
          return currentScore > bestScore ? current : best;
        }, chainOptions[0]);
        
        reasoning = `Selected ${selectedChain.name} based on optimal balance of cost, speed, and reliability`;
        break;
    }
    
    return {
      recommendedBlockchain: selectedChain.id,
      chainDetails: selectedChain,
      reasoning,
      confidence: 0.85,
      method: 'rule-based'
    };
  }

  /**
   * Use AI to make more complex routing decisions
   */
  private async getAIRecommendation(amount: number, priorityFactor: string, chainOptions: any[]): Promise<any> {
    // Prepare the blockchain options data for the AI
    const blockchainsData = chainOptions.map(chain => ({
      name: chain.name,
      id: chain.id,
      txFee: `$${chain.txFee}`,
      confirmationTime: `${chain.confirmationTime} seconds`,
      congestion: `${chain.congestion * 100}%`,
      reliability: `${chain.reliability * 100}%`,
    }));

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI blockchain expert specialized in optimizing cross-chain transactions. 
            Your task is to select the optimal blockchain for a transaction based on the provided metrics 
            and user preferences. Provide your recommendation in JSON format with the following fields:
            recommendedBlockchain (the blockchain ID), reasoning (explanation for your choice), 
            confidence (0-1 scale), and additionalInsights (any other relevant information).`
          },
          {
            role: "user",
            content: `I need to perform a transaction worth $${amount}. My priority is ${priorityFactor}.
            Here are the available blockchain options with their current metrics:
            ${JSON.stringify(blockchainsData, null, 2)}
            Which blockchain should I use for optimal results?`
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      // Parse the AI response
      const aiRecommendation = JSON.parse(response.choices[0].message.content);
      
      // Enrich the response with the chain details
      const selectedChain = chainOptions.find(chain => chain.id === aiRecommendation.recommendedBlockchain);
      
      return {
        ...aiRecommendation,
        chainDetails: selectedChain,
        method: 'ai'
      };
    } catch (error) {
      logger.error('Error getting AI recommendation:', error);
      // Fall back to rule-based approach
      const fallbackRecommendation = this.getRuleBasedRecommendation(amount, priorityFactor, chainOptions);
      return {
        ...fallbackRecommendation,
        additionalInsights: 'AI recommendation failed, falling back to rule-based approach'
      };
    }
  }

  /**
   * Get optimal transaction parameters for a given blockchain
   * @param blockchain - The blockchain ID
   * @param transactionType - The type of transaction
   * @returns Optimal transaction parameters
   */
  async getOptimalTransactionParams(blockchain: string, transactionType: string): Promise<any> {
    await this.updateBlockchainMetrics();
    const metrics = this.blockchains.get(blockchain);
    
    if (!metrics) {
      throw new Error(`Blockchain ${blockchain} not supported`);
    }
    
    // Simple optimizations based on blockchain and transaction type
    switch (blockchain) {
      case 'polygon-zkevm-cardona':
        // Apply different gas strategies based on transaction type
        let zkEvmGasPrice;
        let zkEvmRecommendation;
        
        if (transactionType === 'token-transfer') {
          zkEvmGasPrice = metrics.gasPrice * 1.05; // Slightly higher for faster processing
          zkEvmRecommendation = 'Using slightly elevated gas price for faster token transfer on Polygon zkEVM';
        } else if (transactionType === 'smart-contract-interaction') {
          zkEvmGasPrice = metrics.gasPrice * 1.1; // Higher for complex operations
          zkEvmRecommendation = 'Using elevated gas price for reliable smart contract interaction on Polygon zkEVM';
        } else {
          zkEvmGasPrice = metrics.gasPrice;
          zkEvmRecommendation = 'Using standard gas price for basic transaction on Polygon zkEVM';
        }
        
        return {
          gasPrice: `${zkEvmGasPrice} gwei`,
          estimatedTime: `${metrics.confirmationTime} seconds`,
          recommendation: zkEvmRecommendation,
          zeroKnowledgeProofBenefits: 'Leveraging zkEVM for enhanced privacy and faster transaction verification'
        };
      
      case 'solana-testnet':
        return {
          priorityFee: 0, // Solana doesn't use the concept of priority fees
          estimatedTime: `${metrics.confirmationTime} seconds`,
          recommendation: 'Standard Solana transaction is optimal due to low fees and fast confirmation'
        };
        
      case 'ethereum-goerli':
        // Apply different gas strategies based on transaction type
        let gasPriceGwei;
        let recommendation;
        
        if (transactionType === 'token-transfer') {
          gasPriceGwei = metrics.gasPrice * 1.1; // Slightly higher for faster processing
          recommendation = 'Using slightly elevated gas price for faster token transfer';
        } else if (transactionType === 'smart-contract-interaction') {
          gasPriceGwei = metrics.gasPrice * 1.2; // Higher for complex operations
          recommendation = 'Using elevated gas price for reliable smart contract interaction';
        } else {
          gasPriceGwei = metrics.gasPrice;
          recommendation = 'Using standard gas price for basic transaction';
        }
        
        return {
          gasPrice: `${gasPriceGwei} gwei`,
          estimatedTime: `${metrics.confirmationTime} seconds`,
          recommendation
        };
        
      case 'polygon-mumbai':
        // Similar logic for Polygon Mumbai
        return {
          gasPrice: `${metrics.gasPrice * 1.05} gwei`, // Slightly higher for Polygon
          estimatedTime: `${metrics.confirmationTime} seconds`,
          recommendation: 'Using standard Polygon gas strategy with slight increase for reliability'
        };
        
      default:
        return {
          recommendation: 'No specific optimization available for this blockchain'
        };
    }
  }

  /**
   * Analyze historical transaction data to improve routing algorithms
   * @param transactionHistory - Array of historical transactions
   * @returns Analysis results
   */
  async analyzeTransactionHistory(transactionHistory: any[]): Promise<any> {
    try {
      // In a real implementation, this would use ML techniques to analyze patterns
      // For now, we'll use a simplified analysis
      
      // Count transactions by blockchain
      const blockchainCounts = transactionHistory.reduce((counts, tx) => {
        counts[tx.blockchain] = (counts[tx.blockchain] || 0) + 1;
        return counts;
      }, {});
      
      // Calculate average success rates
      const successRates = {};
      Object.keys(blockchainCounts).forEach(blockchain => {
        const txs = transactionHistory.filter(tx => tx.blockchain === blockchain);
        const successfulTxs = txs.filter(tx => tx.status === 'successful');
        successRates[blockchain] = successfulTxs.length / txs.length;
      });
      
      // Calculate average confirmation times
      const avgConfirmationTimes = {};
      Object.keys(blockchainCounts).forEach(blockchain => {
        const txs = transactionHistory.filter(tx => tx.blockchain === blockchain);
        const totalTime = txs.reduce((sum, tx) => sum + tx.confirmationTime, 0);
        avgConfirmationTimes[blockchain] = totalTime / txs.length;
      });
      
      return {
        transactionCounts: blockchainCounts,
        successRates,
        averageConfirmationTimes: avgConfirmationTimes,
        insights: this.generateInsightsFromHistory(blockchainCounts, successRates, avgConfirmationTimes)
      };
    } catch (error) {
      logger.error('Error analyzing transaction history:', error);
      throw new Error(`Failed to analyze transaction history: ${error.message}`);
    }
  }

  /**
   * Generate insights from historical data
   */
  private generateInsightsFromHistory(counts: any, successRates: any, confirmationTimes: any): string[] {
    const insights = [];
    
    // Find most used blockchain
    const mostUsedBlockchain = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    insights.push(`Most frequently used blockchain: ${mostUsedBlockchain} (${counts[mostUsedBlockchain]} transactions)`);
    
    // Find most reliable blockchain
    const mostReliableBlockchain = Object.keys(successRates).reduce((a, b) => successRates[a] > successRates[b] ? a : b);
    insights.push(`Most reliable blockchain: ${mostReliableBlockchain} (${(successRates[mostReliableBlockchain] * 100).toFixed(2)}% success rate)`);
    
    // Find fastest blockchain
    const fastestBlockchain = Object.keys(confirmationTimes).reduce((a, b) => confirmationTimes[a] < confirmationTimes[b] ? a : b);
    insights.push(`Fastest blockchain: ${fastestBlockchain} (${confirmationTimes[fastestBlockchain].toFixed(2)} seconds average confirmation)`);
    
    return insights;
  }
}

// Export singleton instance
export const crossChainAIService = new CrossChainAIService();