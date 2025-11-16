/**
 * Smart AI Service
 * 
 * Enhanced AI service that uses the smart traffic router for cost-efficient
 * routing between different AI providers.
 */

import { 
  AITextGenerationOptions, 
  AITextGenerationResult, 
  AIProvider, 
  Message,
  AIFunctionParams,
  AIFunctionCallingOptions,
  AIFunctionCallResult
} from './types';

import { 
  SmartTrafficRouter, 
  TaskRequirements,
  CostAwareProviderMetrics
} from '../core/smart-traffic-router';

import { logger } from '../../../utils/logger';
import { db } from '../../../db';
import { sql } from 'drizzle-orm';

/**
 * Smart AI Service with cost-efficient routing
 */
export class SmartAIService {
  private router: SmartTrafficRouter<AIProvider>;
  private modelName: string = 'ai_routing_model';
  private saveModelInterval: NodeJS.Timeout | null = null;
  
  /**
   * Constructor
   */
  constructor(
    providers: AIProvider[],
    defaultProvider: string = 'Perplexity',
    saveModelIntervalMs: number = 300000 // 5 minutes
  ) {
    // Initialize the smart traffic router
    this.router = new SmartTrafficRouter<AIProvider>(
      providers,
      defaultProvider
    );
    
    // Configure router with initial provider capabilities
    this.configureProviderCapabilities();
    
    // Load previous model if available
    this.loadModel();
    
    // Start model persistence timer
    this.startModelPersistence(saveModelIntervalMs);
    
    logger.info('[smart-ai] Smart AI Service initialized with providers: ' + 
      providers.map(p => p.name).join(', '));
  }
  
  /**
   * Configure provider capabilities
   */
  private configureProviderCapabilities() {
    // Set up provider specialties and capabilities
    // These values are based on known provider strengths
    
    // Perplexity
    this.router.updateProviderMetrics('Perplexity', {
      capabilities: ['text-generation', 'chat-completion', 'web-search'],
      specialties: ['factual-queries', 'research', 'web-aware'],
      costPerUnit: 0.00001, // $0.01 per 1K tokens
      freeQuotaTotal: 5000, // Tokens per day (estimate)
      freeQuotaRemaining: 5000
    });
    
    // OpenAI
    this.router.updateProviderMetrics('OpenAI', {
      capabilities: ['text-generation', 'chat-completion', 'function-calling', 'image-analysis'],
      specialties: ['reasoning', 'coding', 'structured-output', 'multimodal'],
      costPerUnit: 0.00002, // $0.02 per 1K tokens (avg)
      freeQuotaTotal: 0, // No free tier
      freeQuotaRemaining: 0
    });
    
    // Anthropic
    this.router.updateProviderMetrics('Anthropic', {
      capabilities: ['text-generation', 'chat-completion', 'function-calling', 'image-analysis'],
      specialties: ['reasoning', 'safety', 'nuance', 'multimodal'],
      costPerUnit: 0.00002, // $0.02 per 1K tokens (avg)
      freeQuotaTotal: 100000, // Initial credit worth about 100K tokens
      freeQuotaRemaining: 100000
    });
    
    // HuggingFace
    this.router.updateProviderMetrics('HuggingFace', {
      capabilities: ['text-generation', 'chat-completion', 'embeddings'],
      specialties: ['open-models', 'research', 'custom-models'],
      costPerUnit: 0.000005, // $0.005 per 1K tokens (much cheaper)
      freeQuotaTotal: 30000, // Free tier requests per month
      freeQuotaRemaining: 30000
    });
  }
  
  /**
   * Generate text completion using cost-efficient routing
   */
  public async generateTextCompletion(
    prompt: string,
    options?: AITextGenerationOptions
  ): Promise<AITextGenerationResult> {
    const start = Date.now();
    
    try {
      // Estimate token length - simplified approach (~1 token per 4 chars)
      const estimatedTokens = Math.ceil(prompt.length / 4) + 
        (options?.maxTokens || 256);
      
      // Create task requirements
      const requirements: TaskRequirements = {
        priority: options?.priority || 5,
        estimatedUnits: estimatedTokens,
        maxLatency: options?.timeout,
        preferFreeTier: options?.preferFreeTier || true,
        requiredCapabilities: ['text-generation'],
        category: 'text-generation',
        routingHints: {
          preferredProviders: options?.preferredProviders,
          excludedProviders: options?.excludedProviders
        }
      };
      
      // Get routing decision
      const decision = this.router.selectProvider(requirements);
      logger.debug(`[smart-ai] Selected provider ${decision.selectedProvider} for text completion`);
      
      // Find the selected provider
      const provider = this.findProvider(decision.selectedProvider);
      if (!provider) {
        throw new Error(`Selected provider ${decision.selectedProvider} not found`);
      }
      
      // Execute the request
      const result = await provider.generateTextCompletion(prompt, options);
      
      // Record successful outcome
      this.router.recordOutcome(
        provider.name,
        'text-generation',
        {
          success: true,
          responseTime: Date.now() - start,
          unitsProcessed: this.estimateTokensUsed(result)
        }
      );
      
      return result;
    } catch (error) {
      // Try fallback providers if available
      return this.handleProviderFailure(
        error,
        (provider) => provider.generateTextCompletion(prompt, options),
        'text-generation',
        Date.now() - start
      );
    }
  }
  
  /**
   * Generate chat completion using cost-efficient routing
   */
  public async generateChatCompletion(
    messages: Message[],
    options?: AITextGenerationOptions
  ): Promise<AITextGenerationResult> {
    const start = Date.now();
    
    try {
      // Estimate token length from messages
      const estimatedTokens = this.estimateTokensFromMessages(messages) + 
        (options?.maxTokens || 256);
      
      // Create task requirements
      const requirements: TaskRequirements = {
        priority: options?.priority || 5,
        estimatedUnits: estimatedTokens,
        maxLatency: options?.timeout,
        preferFreeTier: options?.preferFreeTier || true,
        requiredCapabilities: ['chat-completion'],
        category: 'chat-completion',
        routingHints: {
          preferredProviders: options?.preferredProviders,
          excludedProviders: options?.excludedProviders
        }
      };
      
      // Get routing decision
      const decision = this.router.selectProvider(requirements);
      logger.debug(`[smart-ai] Selected provider ${decision.selectedProvider} for chat completion`);
      
      // Find the selected provider
      const provider = this.findProvider(decision.selectedProvider);
      if (!provider) {
        throw new Error(`Selected provider ${decision.selectedProvider} not found`);
      }
      
      // Execute the request
      const result = await provider.generateChatCompletion(messages, options);
      
      // Record successful outcome
      this.router.recordOutcome(
        provider.name,
        'chat-completion',
        {
          success: true,
          responseTime: Date.now() - start,
          unitsProcessed: this.estimateTokensUsed(result)
        }
      );
      
      return result;
    } catch (error) {
      // Try fallback providers if available
      return this.handleProviderFailure(
        error,
        (provider) => provider.generateChatCompletion(messages, options),
        'chat-completion',
        Date.now() - start
      );
    }
  }
  
  /**
   * Call a function using cost-efficient routing
   */
  public async callFunction(
    params: {
      name: string;
      parameters: AIFunctionParams;
      prompt: string;
      options?: AIFunctionCallingOptions;
    }
  ): Promise<AIFunctionCallResult> {
    const { name, parameters, prompt, options } = params;
    const start = Date.now();
    
    try {
      // Estimate token length
      const estimatedTokens = Math.ceil(prompt.length / 4) + 
        Math.ceil(JSON.stringify(parameters).length / 8) + 
        (options?.maxResponseTokens || 256);
      
      // Create task requirements
      const requirements: TaskRequirements = {
        priority: options?.priority || 6, // Higher priority for function calls
        estimatedUnits: estimatedTokens,
        maxLatency: options?.timeout,
        preferFreeTier: options?.preferFreeTier || false, // Functions often need paid tier capabilities
        requiredCapabilities: ['function-calling'],
        category: 'function-calling',
        routingHints: {
          preferredProviders: options?.preferredProviders,
          excludedProviders: options?.excludedProviders
        }
      };
      
      // Get routing decision
      const decision = this.router.selectProvider(requirements);
      logger.debug(`[smart-ai] Selected provider ${decision.selectedProvider} for function call`);
      
      // Find the selected provider
      const provider = this.findProvider(decision.selectedProvider);
      if (!provider) {
        throw new Error(`Selected provider ${decision.selectedProvider} not found`);
      }
      
      // Execute the request
      const result = await provider.callFunction(name, parameters, prompt, options);
      
      // Record successful outcome
      this.router.recordOutcome(
        provider.name,
        'function-calling',
        {
          success: true,
          responseTime: Date.now() - start,
          unitsProcessed: estimatedTokens // Use estimate as proxy
        }
      );
      
      return result;
    } catch (error) {
      // Try fallback providers if available
      return this.handleProviderFailure(
        error,
        (provider) => provider.callFunction(name, parameters, prompt, options),
        'function-calling',
        Date.now() - start
      );
    }
  }
  
  /**
   * Find a provider by name
   */
  private findProvider(name: string): AIProvider | undefined {
    return this.router['providers'].find(p => p.name === name);
  }
  
  /**
   * Handle provider failure by trying fallback providers
   */
  private async handleProviderFailure<T>(
    error: any,
    operationFn: (provider: AIProvider) => Promise<T>,
    category: string,
    elapsedTime: number
  ): Promise<T> {
    logger.warn(`[smart-ai] Provider failed for ${category}: ${error?.message || 'Unknown error'}`);
    
    // Record failure in the last provider
    const lastProviderName = this.router.getPrimaryProvider();
    const lastProvider = this.findProvider(lastProviderName);
    
    if (lastProvider) {
      this.router.recordOutcome(
        lastProviderName,
        category,
        {
          success: false,
          responseTime: elapsedTime,
          unitsProcessed: 0,
          error: error instanceof Error ? error : new Error(String(error))
        }
      );
    }
    
    // Get a new decision excluding the failed provider
    const requirements: TaskRequirements = {
      priority: 10, // Max priority for fallback
      estimatedUnits: 1000, // Generous estimate
      preferFreeTier: false, // Don't restrict to free tier during fallback
      requiredCapabilities: [category],
      category,
      routingHints: {
        excludedProviders: [lastProviderName]
      }
    };
    
    // Try to find an alternative provider
    const decision = this.router.selectProvider(requirements);
    
    if (decision.selectedProvider !== lastProviderName) {
      logger.info(`[smart-ai] Attempting fallback to ${decision.selectedProvider}`);
      
      const fallbackProvider = this.findProvider(decision.selectedProvider);
      if (fallbackProvider) {
        try {
          const result = await operationFn(fallbackProvider);
          
          // Record successful fallback
          this.router.recordOutcome(
            fallbackProvider.name,
            category,
            {
              success: true,
              responseTime: Date.now() - (elapsedTime + Date.now()),
              unitsProcessed: 1000 // Use estimate since we can't know exactly
            }
          );
          
          return result;
        } catch (fallbackError) {
          logger.error(`[smart-ai] Fallback to ${decision.selectedProvider} also failed: ${fallbackError?.message || 'Unknown error'}`);
          
          // Record fallback failure
          this.router.recordOutcome(
            fallbackProvider.name,
            category,
            {
              success: false,
              responseTime: Date.now() - (elapsedTime + Date.now()),
              unitsProcessed: 0,
              error: fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError))
            }
          );
        }
      }
    }
    
    // If we get here, all attempts failed
    throw new Error(`All providers failed for ${category}: ${error?.message || 'Unknown error'}`);
  }
  
  /**
   * Estimate tokens from messages
   */
  private estimateTokensFromMessages(messages: Message[]): number {
    let estimate = 0;
    
    for (const message of messages) {
      // ~1 token per 4 characters of content
      if (typeof message.content === 'string') {
        estimate += Math.ceil(message.content.length / 4);
      } else if (Array.isArray(message.content)) {
        // Handle content array (text + images)
        for (const item of message.content) {
          if (typeof item === 'string' || typeof item.text === 'string') {
            const text = typeof item === 'string' ? item : item.text;
            estimate += Math.ceil(text.length / 4);
          }
          
          // Add fixed overhead for images
          if (typeof item === 'object' && 'type' in item && item.type === 'image') {
            estimate += 1000; // Rough estimate for image tokens
          }
        }
      }
      
      // Add overhead for message structure
      estimate += 4;
    }
    
    return estimate;
  }
  
  /**
   * Estimate tokens used from a result
   */
  private estimateTokensUsed(result: AITextGenerationResult): number {
    if (result.usage && result.usage.totalTokens) {
      return result.usage.totalTokens;
    }
    
    // Fallback estimation if usage is not provided
    return Math.ceil(result.text.length / 4) + 20; // text + overhead
  }
  
  /**
   * Save the current model to the database
   */
  private async saveModel(): Promise<void> {
    try {
      const model = this.router.exportModel();
      const now = new Date();
      
      // Save to database using Drizzle's sql helper
      await db.execute(sql`
        INSERT INTO ai_models (name, model_data, created_at, updated_at) 
        VALUES (${this.modelName}, ${JSON.stringify(model)}, ${now}, ${now}) 
        ON CONFLICT (name) DO UPDATE SET 
          model_data = ${JSON.stringify(model)}, 
          updated_at = ${now}
      `);
      
      logger.debug('[smart-ai] Saved routing model to database');
    } catch (error) {
      logger.error('[smart-ai] Failed to save routing model:', error);
    }
  }
  
  /**
   * Load the model from database
   */
  private async loadModel(): Promise<void> {
    try {
      const result = await db.execute(sql`
        SELECT model_data FROM ai_models WHERE name = ${this.modelName}
      `);
      
      if (result.length > 0 && result[0].model_data) {
        const model = JSON.parse(result[0].model_data);
        this.router.importModel(model);
        logger.info('[smart-ai] Loaded routing model from database');
      } else {
        logger.info('[smart-ai] No existing routing model found, using default configuration');
      }
    } catch (error) {
      logger.warn('[smart-ai] Failed to load routing model:', error);
    }
  }
  
  /**
   * Start model persistence timer
   */
  private startModelPersistence(intervalMs: number): void {
    if (this.saveModelInterval) {
      clearInterval(this.saveModelInterval);
    }
    
    this.saveModelInterval = setInterval(() => {
      this.saveModel();
    }, intervalMs);
    
    logger.info(`[smart-ai] Model persistence started with ${intervalMs}ms interval`);
  }
  
  /**
   * Stop model persistence timer
   */
  public stopModelPersistence(): void {
    if (this.saveModelInterval) {
      clearInterval(this.saveModelInterval);
      this.saveModelInterval = null;
      
      // Final save
      this.saveModel();
      
      logger.info('[smart-ai] Model persistence stopped');
    }
  }
  
  /**
   * Reset quotas for a provider (called when quotas refresh)
   */
  public resetProviderQuota(providerName: string, newQuota: number, resetTime?: Date): void {
    this.router.resetProviderQuota(
      providerName, 
      newQuota, 
      resetTime || new Date(Date.now() + 24 * 60 * 60 * 1000) // Default to 24h from now
    );
  }
  
  /**
   * Update provider cost metrics
   */
  public updateProviderCosts(
    providerName: string, 
    costPerUnit: number,
    freeQuotaTotal?: number
  ): void {
    const metrics: Partial<CostAwareProviderMetrics> = {
      costPerUnit,
      lastUpdated: new Date()
    };
    
    if (freeQuotaTotal !== undefined) {
      metrics.freeQuotaTotal = freeQuotaTotal;
      
      // Also refresh remaining quota if we're setting a new total
      metrics.freeQuotaRemaining = freeQuotaTotal;
    }
    
    this.router.updateProviderMetrics(providerName, metrics);
    logger.info(`[smart-ai] Updated cost metrics for ${providerName}: ${costPerUnit} per unit`);
  }
  
  /**
   * Get routing metrics and Q-values
   */
  public getRoutingMetrics(): {
    metrics: Record<string, CostAwareProviderMetrics>,
    qValues: Record<string, Record<string, number>>
  } {
    return {
      metrics: this.router.getProviderMetrics(),
      qValues: this.router.getQValues()
    };
  }
  
  /**
   * Enable or disable batch processing mode
   */
  public setBatchMode(enabled: boolean, threshold?: number, timeWindow?: number): void {
    this.router.setBatchMode(enabled, threshold, timeWindow);
  }
  
  /**
   * Add a task to the batch queue
   */
  public addToBatch(category: string, task: any): void {
    this.router.addToBatch(category, task);
  }
  
  /**
   * Get and process a batch if ready
   */
  public async processBatchIfReady(category: string): Promise<any[] | null> {
    if (!this.router.isBatchReady(category)) {
      return null;
    }
    
    const batch = this.router.getBatch(category);
    
    if (batch.length === 0) {
      return null;
    }
    
    logger.info(`[smart-ai] Processing batch of ${batch.length} tasks for ${category}`);
    
    // Return the batch for processing
    return batch;
  }
}

// Create table for model persistence if needed
export async function ensureModelPersistenceTable(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_models (
        name TEXT PRIMARY KEY,
        model_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    logger.info('[smart-ai] AI model persistence table created or verified');
  } catch (error) {
    logger.error('[smart-ai] Failed to create AI model persistence table:', error);
  }
}