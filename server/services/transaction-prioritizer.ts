import { logger } from '../utils/logger.js';
import { crossChainAIService } from './cross-chain-ai-service';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import OpenAI from 'openai';

// ES Modules compatible __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Transaction context interface
interface TransactionContext {
  amount: number;
  amountUSD: number;
  transactionType: string;
  userRiskTolerance?: 'low' | 'medium' | 'high';
  timeConstraint?: 'urgent' | 'normal' | 'flexible';
  fromChain?: string;
  toChain?: string;
  isSmartContract?: boolean;
  contractComplexity?: 'simple' | 'moderate' | 'complex';
  isDAGEnabled?: boolean;
  dagConsensusLevel?: number;
}

// Priority factors interface
interface PriorityFactors {
  speed: number;
  cost: number;
  security: number;
}

// Transaction strategy interface
interface TransactionStrategy {
  priorityFactors: PriorityFactors;
  recommendedChain: string;
  gasStrategy?: string;
  gasMultiplier?: number;
  timeoutSeconds?: number;
  batchingRecommended?: boolean;
  securityChecks?: string[];
  dagIntegrationStrategy?: string;
  aiReasoning: string;
  confidenceScore: number;
}

/**
 * Transaction Prioritizer Service
 * Uses AI to determine optimal transaction parameters based on context
 */
class TransactionPrioritizer {
  constructor() {
    logger.info('Transaction Prioritizer Service initialized');
  }

  /**
   * Get prioritization factors based on transaction context
   * @param context - Transaction context
   * @returns Priority factors (speed, cost, security)
   */
  async getPrioritizationFactors(context: TransactionContext): Promise<PriorityFactors> {
    try {
      // If AI service is available, use it for more advanced prioritization
      if (process.env.OPENAI_API_KEY) {
        return await this.getAIPrioritizationFactors(context);
      }
      
      // Rule-based prioritization as fallback
      return this.getRuleBasedPrioritizationFactors(context);
    } catch (error) {
      logger.error('Error determining prioritization factors:', error);
      // Return balanced factors as fallback
      return { speed: 0.33, cost: 0.33, security: 0.34 };
    }
  }

  /**
   * Rule-based approach to determine prioritization factors
   * @param context - Transaction context
   * @returns Priority factors
   */
  private getRuleBasedPrioritizationFactors(context: TransactionContext): PriorityFactors {
    let speed = 0.33;
    let cost = 0.33;
    let security = 0.34;
    
    // Adjust based on user risk tolerance
    if (context.userRiskTolerance === 'low') {
      security = 0.6;
      speed = 0.2;
      cost = 0.2;
    } else if (context.userRiskTolerance === 'high') {
      security = 0.2;
      speed = 0.4;
      cost = 0.4;
    }
    
    // Adjust based on time constraint
    if (context.timeConstraint === 'urgent') {
      speed = Math.min(0.7, speed + 0.3);
      security = Math.max(0.1, security - 0.15);
      cost = Math.max(0.1, cost - 0.15);
    } else if (context.timeConstraint === 'flexible') {
      cost = Math.min(0.7, cost + 0.3);
      speed = Math.max(0.1, speed - 0.15);
      security = Math.max(0.1, security - 0.15);
    }
    
    // Adjust based on transaction type
    if (context.transactionType === 'smart-contract-interaction') {
      security = Math.min(0.7, security + 0.2);
      cost = Math.max(0.1, cost - 0.1);
      speed = Math.max(0.1, speed - 0.1);
    }
    
    // Normalize to ensure sum is 1.0
    const total = speed + cost + security;
    
    return {
      speed: parseFloat((speed / total).toFixed(2)),
      cost: parseFloat((cost / total).toFixed(2)),
      security: parseFloat((security / total).toFixed(2))
    };
  }

  /**
   * AI-based approach to determine prioritization factors
   * @param context - Transaction context
   * @returns Priority factors
   */
  private async getAIPrioritizationFactors(context: TransactionContext): Promise<PriorityFactors> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI blockchain transaction optimizer. Your task is to determine the optimal 
            prioritization factors for a cross-chain transaction based on the provided context.
            Respond with ONLY a JSON object with three numeric values that sum to exactly 1.0:
            speed (importance of transaction speed), cost (importance of minimizing fees),
            and security (importance of transaction security). Each value should be between 0.1 and 0.8.`
          },
          {
            role: "user",
            content: `Determine the optimal prioritization factors for this transaction:
            - Amount: ${context.amount} (${context.amountUSD} USD)
            - Transaction type: ${context.transactionType}
            - User risk tolerance: ${context.userRiskTolerance || 'medium'}
            - Time constraint: ${context.timeConstraint || 'normal'}
            - Smart contract: ${context.isSmartContract ? 'Yes' : 'No'}
            ${context.contractComplexity ? `- Contract complexity: ${context.contractComplexity}` : ''}
            - DAG enabled: ${context.isDAGEnabled ? 'Yes' : 'No'}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Ensure all required factors are present and values are valid
      if (!result.speed || !result.cost || !result.security) {
        throw new Error('AI response missing required fields');
      }
      
      // Normalize to ensure values sum to 1.0
      const total = result.speed + result.cost + result.security;
      
      return {
        speed: parseFloat((result.speed / total).toFixed(2)),
        cost: parseFloat((result.cost / total).toFixed(2)),
        security: parseFloat((result.security / total).toFixed(2))
      };
    } catch (error) {
      logger.error('Error getting AI prioritization factors:', error);
      // Fall back to rule-based approach
      return this.getRuleBasedPrioritizationFactors(context);
    }
  }

  /**
   * Get transaction strategy based on context
   * @param context - Transaction context
   * @returns Transaction strategy
   */
  async getTransactionStrategy(context: TransactionContext): Promise<TransactionStrategy> {
    try {
      // Get priority factors for the transaction
      const priorityFactors = await this.getPrioritizationFactors(context);
      
      // Get blockchain recommendation
      let priorityFactor: 'speed' | 'cost' | 'reliability' | 'balanced' = 'balanced';
      if (priorityFactors.speed > 0.5) priorityFactor = 'speed';
      else if (priorityFactors.cost > 0.5) priorityFactor = 'cost';
      else if (priorityFactors.security > 0.5) priorityFactor = 'reliability';
      
      const recommendation = await crossChainAIService.getOptimalBlockchain(
        context.amountUSD,
        priorityFactor
      );
      
      // If AI service is available, use it for detailed strategy
      if (process.env.OPENAI_API_KEY) {
        const aiStrategy = await this.getAITransactionStrategy(context, priorityFactors, recommendation);
        if (aiStrategy) return aiStrategy;
      }
      
      // Rule-based strategy as fallback
      return this.getRuleBasedTransactionStrategy(context, priorityFactors, recommendation);
    } catch (error) {
      logger.error('Error determining transaction strategy:', error);
      
      // Return a basic strategy as fallback
      return {
        priorityFactors: { speed: 0.33, cost: 0.33, security: 0.34 },
        recommendedChain: 'solana-testnet',
        gasStrategy: 'standard',
        timeoutSeconds: 30,
        batchingRecommended: false,
        aiReasoning: 'Default strategy due to optimization error',
        confidenceScore: 0.5
      };
    }
  }

  /**
   * Rule-based approach to determine transaction strategy
   * @param context - Transaction context
   * @param priorityFactors - Priority factors
   * @param recommendation - Blockchain recommendation
   * @returns Transaction strategy
   */
  private getRuleBasedTransactionStrategy(
    context: TransactionContext,
    priorityFactors: PriorityFactors,
    recommendation: any
  ): TransactionStrategy {
    const recommendedChain = recommendation.recommendedBlockchain;
    let gasStrategy = 'standard';
    let gasMultiplier = 1.0;
    let timeoutSeconds = 30;
    let batchingRecommended = false;
    let securityChecks = ['signature-verification'];
    let dagIntegrationStrategy = context.isDAGEnabled ? 'basic-integration' : undefined;
    let aiReasoning = 'Strategy based on rule-based prioritization';
    
    // Adjust gas strategy based on priority factors
    if (priorityFactors.speed > 0.5) {
      gasStrategy = 'aggressive';
      gasMultiplier = 1.2;
      timeoutSeconds = 15;
    } else if (priorityFactors.cost > 0.5) {
      gasStrategy = 'economic';
      gasMultiplier = 0.9;
      timeoutSeconds = 60;
    }
    
    // Adjust security based on context
    if (context.userRiskTolerance === 'low' || priorityFactors.security > 0.5) {
      securityChecks.push('advanced-validation', 'transaction-simulation');
    }
    
    // Adjust DAG strategy based on context
    if (context.isDAGEnabled) {
      dagIntegrationStrategy = context.dagConsensusLevel && context.dagConsensusLevel > 0.7 
        ? 'high-consensus-integration'
        : 'balanced-integration';
    }
    
    // Consider batching for cost-sensitive transactions
    if (priorityFactors.cost > 0.6 && context.transactionType === 'token-transfer') {
      batchingRecommended = true;
    }
    
    return {
      priorityFactors,
      recommendedChain,
      gasStrategy,
      gasMultiplier,
      timeoutSeconds,
      batchingRecommended,
      securityChecks,
      dagIntegrationStrategy,
      aiReasoning,
      confidenceScore: 0.75
    };
  }

  /**
   * AI-based approach to determine transaction strategy
   * @param context - Transaction context
   * @param priorityFactors - Priority factors
   * @param recommendation - Blockchain recommendation
   * @returns Transaction strategy
   */
  private async getAITransactionStrategy(
    context: TransactionContext,
    priorityFactors: PriorityFactors,
    recommendation: any
  ): Promise<TransactionStrategy | undefined> {
    try {
      // Prepare context data for AI
      const contextData = {
        amount: context.amount,
        amountUSD: context.amountUSD,
        transactionType: context.transactionType,
        userRiskTolerance: context.userRiskTolerance || 'medium',
        timeConstraint: context.timeConstraint || 'normal',
        isSmartContract: context.isSmartContract || false,
        contractComplexity: context.contractComplexity,
        isDAGEnabled: context.isDAGEnabled || false,
        dagConsensusLevel: context.dagConsensusLevel || 0.5,
        priorityFactors: {
          speed: priorityFactors.speed,
          cost: priorityFactors.cost,
          security: priorityFactors.security
        },
        recommendedBlockchain: recommendation.recommendedBlockchain,
        blockchainDetails: recommendation.chainDetails
      };

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI blockchain transaction optimizer. Your task is to determine the 
            optimal transaction strategy based on the provided context. Respond with a JSON object 
            that includes: gasStrategy (string), gasMultiplier (number), timeoutSeconds (number), 
            batchingRecommended (boolean), securityChecks (array of strings), 
            dagIntegrationStrategy (string or null), aiReasoning (string explanation), 
            and confidenceScore (number between 0-1).`
          },
          {
            role: "user",
            content: `Determine the optimal transaction strategy for this context:
            ${JSON.stringify(contextData, null, 2)}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const aiResult = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        priorityFactors,
        recommendedChain: recommendation.recommendedBlockchain,
        gasStrategy: aiResult.gasStrategy,
        gasMultiplier: aiResult.gasMultiplier,
        timeoutSeconds: aiResult.timeoutSeconds,
        batchingRecommended: aiResult.batchingRecommended,
        securityChecks: aiResult.securityChecks,
        dagIntegrationStrategy: aiResult.dagIntegrationStrategy,
        aiReasoning: aiResult.aiReasoning,
        confidenceScore: aiResult.confidenceScore
      };
    } catch (error) {
      logger.error('Error getting AI transaction strategy:', error);
      return undefined; // Fall back to rule-based approach
    }
  }

  /**
   * Validate that a transaction context is suitable for processing
   * @param context - Transaction context
   * @returns Validation result
   */
  validateTransactionContext(context: TransactionContext): { valid: boolean; message?: string } {
    // Basic validation
    if (!context.amount || context.amount <= 0) {
      return { valid: false, message: 'Invalid transaction amount' };
    }
    
    if (!context.transactionType) {
      return { valid: false, message: 'Transaction type is required' };
    }
    
    // Specific validations based on transaction type
    if (context.transactionType === 'smart-contract-interaction' && !context.isSmartContract) {
      context.isSmartContract = true; // Auto-correct inconsistency
    }
    
    if (context.isSmartContract && !context.contractComplexity) {
      context.contractComplexity = 'moderate'; // Default value
    }
    
    // DAG-specific validations
    if (context.isDAGEnabled && (context.dagConsensusLevel === undefined || context.dagConsensusLevel < 0 || context.dagConsensusLevel > 1)) {
      context.dagConsensusLevel = 0.5; // Default to a balanced consensus level
    }
    
    // All validations passed
    return { valid: true };
  }
}

// Export singleton instance
export const transactionPrioritizer = new TransactionPrioritizer();