import { logger } from './logger.js';
import { solanaService } from '../services/solana-service';
import { crossChainAIService } from '../services/cross-chain-ai-service';
import { transactionPrioritizer } from '../services/transaction-prioritizer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES Modules compatible __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Interface for a transaction request
 */
interface TransactionRequest {
  id: string;
  fromUserId: number | string;
  toAddress: string;
  amount: number;
  amountUSD: number;
  priority: 'high' | 'medium' | 'low';
  type: 'transfer' | 'token-transfer' | 'smart-contract-interaction';
  preferredBlockchain?: string;
}

/**
 * Interface for a transaction result
 */
interface TransactionResult {
  id: string;
  success: boolean;
  blockchain: string;
  signature?: string;
  error?: string;
  metadata?: any;
}

/**
 * Utility for optimizing batch transactions across multiple blockchains
 */
class BatchTransactionOptimizer {
  /**
   * Process a batch of transactions with AI optimization
   * @param transactions - Array of transaction requests
   * @returns Array of transaction results
   */
  async processBatch(transactions: TransactionRequest[]): Promise<TransactionResult[]> {
    try {
      logger.info(`Processing batch of ${transactions.length} transactions`);
      
      // 1. Group transactions by similarity
      const groupedTransactions = this.groupTransactions(transactions);
      
      // 2. Optimize each group for the best blockchain
      const optimizedGroups = await this.optimizeGroups(groupedTransactions);
      
      // 3. Execute transactions for each group
      const results: TransactionResult[] = [];
      
      for (const [blockchain, txGroup] of Object.entries(optimizedGroups)) {
        logger.info(`Executing ${txGroup.length} transactions on ${blockchain}`);
        
        for (const tx of txGroup) {
          try {
            const result = await this.executeTransaction(blockchain, tx);
            results.push(result);
          } catch (error) {
            logger.error(`Error executing transaction ${tx.id}:`, error);
            results.push({
              id: tx.id,
              success: false,
              blockchain,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }
      
      // 4. Analyze results for future optimization
      this.analyzeResults(results);
      
      return results;
    } catch (error) {
      logger.error('Error processing batch transactions:', error);
      throw new Error(`Batch transaction processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Group transactions by similarity
   * @param transactions - Array of transaction requests
   * @returns Grouped transactions by type
   */
  private groupTransactions(transactions: TransactionRequest[]): Record<string, TransactionRequest[]> {
    const grouped: Record<string, TransactionRequest[]> = {};
    
    // Group by transaction type
    for (const tx of transactions) {
      const key = tx.type;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(tx);
    }
    
    // Further group by priority if needed
    const priorityGrouped: Record<string, TransactionRequest[]> = {};
    
    for (const [type, txs] of Object.entries(grouped)) {
      if (txs.length > 5) {
        // For larger groups, sub-group by priority
        for (const tx of txs) {
          const key = `${type}-${tx.priority}`;
          if (!priorityGrouped[key]) {
            priorityGrouped[key] = [];
          }
          priorityGrouped[key].push(tx);
        }
      } else {
        // For smaller groups, keep as is
        priorityGrouped[type] = txs;
      }
    }
    
    return priorityGrouped;
  }
  
  /**
   * Optimize transaction groups by choosing the best blockchain for each
   * @param groupedTransactions - Grouped transaction requests
   * @returns Optimized groups by blockchain
   */
  private async optimizeGroups(
    groupedTransactions: Record<string, TransactionRequest[]>
  ): Promise<Record<string, TransactionRequest[]>> {
    const optimizedGroups: Record<string, TransactionRequest[]> = {};
    
    for (const [groupKey, txs] of Object.entries(groupedTransactions)) {
      // Calculate total value and average priority
      const totalValue = txs.reduce((sum, tx) => sum + tx.amountUSD, 0);
      
      // Determine priority factor based on group's priority mix
      const priorityMap = { 'high': 'speed', 'medium': 'balanced', 'low': 'cost' };
      const priorities = txs.map(tx => tx.priority);
      const highCount = priorities.filter(p => p === 'high').length;
      const mediumCount = priorities.filter(p => p === 'medium').length;
      const lowCount = priorities.filter(p => p === 'low').length;
      
      let priorityFactor: 'speed' | 'cost' | 'reliability' | 'balanced' = 'balanced';
      
      if (highCount > mediumCount && highCount > lowCount) {
        priorityFactor = 'speed';
      } else if (lowCount > highCount && lowCount > mediumCount) {
        priorityFactor = 'cost';
      } else if (groupKey.includes('smart-contract')) {
        priorityFactor = 'reliability';
      }
      
      // Get optimal blockchain recommendation
      const recommendation = await crossChainAIService.getOptimalBlockchain(
        totalValue / txs.length, // Average transaction value
        priorityFactor
      );
      
      const blockchain = recommendation.recommendedBlockchain;
      
      // Assign transactions to the recommended blockchain
      if (!optimizedGroups[blockchain]) {
        optimizedGroups[blockchain] = [];
      }
      
      // Add all transactions from this group
      optimizedGroups[blockchain].push(...txs);
    }
    
    return optimizedGroups;
  }
  
  /**
   * Execute a single transaction on the specified blockchain
   * @param blockchain - Blockchain to use
   * @param transaction - Transaction request
   * @returns Transaction result
   */
  private async executeTransaction(
    blockchain: string,
    transaction: TransactionRequest
  ): Promise<TransactionResult> {
    try {
      // Determine which blockchain service to use
      if (blockchain.toLowerCase().includes('solana')) {
        // Use Solana service
        const result = await solanaService.transfer(
          transaction.fromUserId,
          transaction.toAddress,
          transaction.amount
        );
        
        return {
          id: transaction.id,
          success: result.success,
          blockchain,
          signature: result.signature,
          metadata: {
            amount: transaction.amount,
            from: result.from,
            to: result.to
          }
        };
      } else {
        // For demo purposes, simulate success for other blockchains
        return {
          id: transaction.id,
          success: true,
          blockchain,
          signature: `sim_${blockchain}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
          metadata: {
            amount: transaction.amount,
            simulated: true,
            message: `Transaction simulated on ${blockchain}`
          }
        };
      }
    } catch (error) {
      logger.error(`Error executing transaction on ${blockchain}:`, error);
      return {
        id: transaction.id,
        success: false,
        blockchain,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Analyze batch execution results for future optimization
   * @param results - Array of transaction results
   */
  private analyzeResults(results: TransactionResult[]): void {
    const totalTx = results.length;
    const successfulTx = results.filter(r => r.success).length;
    const successRate = (successfulTx / totalTx) * 100;
    
    const blockchainDistribution: Record<string, { total: number, success: number }> = {};
    
    for (const result of results) {
      const { blockchain, success } = result;
      
      if (!blockchainDistribution[blockchain]) {
        blockchainDistribution[blockchain] = { total: 0, success: 0 };
      }
      
      blockchainDistribution[blockchain].total += 1;
      if (success) {
        blockchainDistribution[blockchain].success += 1;
      }
    }
    
    logger.info(`Batch execution completed: ${successfulTx}/${totalTx} transactions successful (${successRate.toFixed(2)}%)`);
    
    for (const [blockchain, stats] of Object.entries(blockchainDistribution)) {
      const blockchainSuccessRate = (stats.success / stats.total) * 100;
      logger.info(`${blockchain}: ${stats.success}/${stats.total} successful (${blockchainSuccessRate.toFixed(2)}%)`);
    }
    
    // Future: Store these metrics for AI optimization learning
  }
}

// Export singleton instance
export const batchTransactionOptimizer = new BatchTransactionOptimizer();