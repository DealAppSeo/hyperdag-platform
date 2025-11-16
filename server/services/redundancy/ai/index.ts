/**
 * AI Redundancy Service
 * 
 * This module provides a redundant AI service implementation that can
 * fall back to alternative providers when the primary provider fails.
 * 
 * It now uses a smart traffic router with reinforcement learning to 
 * optimize for cost, performance, and availability.
 */

import { RedundancyService, ServiceProvider } from '../core';
import { 
  AITextGenerationOptions, 
  AITextGenerationResult, 
  AIProvider, 
  Message,
  AIFunctionParams,
  AIFunctionCallingOptions,
  AIFunctionCallResult
} from './types';
import { PerplexityProvider } from './perplexity-provider';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { HuggingFaceProvider } from './huggingface-provider';
import { SmartAIService, ensureModelPersistenceTable } from './smart-ai-service';
import { logger } from '../../../utils/logger';

// Legacy AI Redundancy Service (kept for compatibility while migrating)
class AIRedundancyService extends RedundancyService<AIProvider> {
  constructor(primaryProviderName: string = 'Perplexity') {
    super(primaryProviderName);
    this.initializeMetrics();
  }
  
  /**
   * Initialize metrics for each provider
   */
  protected initializeMetrics(): void {
    // Nothing to do here - metrics are initialized when providers are added
  }
  
  /**
   * Generate text completion using the first available provider
   */
  public async generateTextCompletion(
    prompt: string,
    options?: AITextGenerationOptions
  ): Promise<AITextGenerationResult> {
    return this.executeWithFallback(provider => 
      provider.generateTextCompletion(prompt, options)
    );
  }
  
  /**
   * Generate chat completion using the first available provider
   */
  public async generateChatCompletion(
    messages: Message[],
    options?: AITextGenerationOptions
  ): Promise<AITextGenerationResult> {
    return this.executeWithFallback(provider =>
      provider.generateChatCompletion(messages, options)
    );
  }
  
  /**
   * Call a function using the first available provider
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
    
    return this.executeWithFallback(provider =>
      provider.callFunction(name, parameters, prompt, options)
    );
  }
}

// Initialize providers
const providers: AIProvider[] = [];

try {
  // Add the Perplexity provider if API key is available
  if (process.env.PERPLEXITY_API_KEY) {
    const perplexityProvider = new PerplexityProvider();
    providers.push(perplexityProvider);
    console.log('Added provider: Perplexity');
  } else {
    console.warn('Perplexity API key not found, skipping provider');
  }
} catch (error) {
  console.error('Failed to initialize Perplexity provider:', error);
}

try {
  // Add the OpenAI provider if API key is available
  if (process.env.OPENAI_API_KEY) {
    const openaiProvider = new OpenAIProvider();
    providers.push(openaiProvider);
    console.log('Added provider: OpenAI');
  } else {
    console.warn('OpenAI API key not found, skipping provider');
  }
} catch (error) {
  console.error('Failed to initialize OpenAI provider:', error);
}

try {
  // Add the Anthropic provider if API key is available
  if (process.env.ANTHROPIC_API_KEY) {
    const anthropicProvider = new AnthropicProvider();
    providers.push(anthropicProvider);
    console.log('Added provider: Anthropic');
  } else {
    console.warn('Anthropic API key not found, skipping provider');
  }
} catch (error) {
  console.error('Failed to initialize Anthropic provider:', error);
}

try {
  // Add the Hugging Face provider
  // Provider will use HF_API_KEY if available or default authentication
  const huggingFaceProvider = new HuggingFaceProvider();
  providers.push(huggingFaceProvider);
  console.log('Added provider: HuggingFace');
} catch (error) {
  console.error('Failed to initialize Hugging Face provider:', error);
}

// Ensure model persistence table exists
ensureModelPersistenceTable().catch(error => {
  logger.error('[ai-service] Failed to create model persistence table:', error);
});

// Create and configure the service
const aiRedundancyService = new AIRedundancyService('Perplexity');
const smartAIService = new SmartAIService(providers, 'Perplexity');

// Add providers to legacy service for backwards compatibility
for (const provider of providers) {
  aiRedundancyService.addProvider(provider);
}

// Use smart service by default
const useSmartRouter = process.env.USE_SMART_AI_ROUTER !== 'false';

logger.info(`[ai-service] AI Service initialized with ${providers.length} providers. Smart routing: ${useSmartRouter ? 'enabled' : 'disabled'}`);

// Export service functions
export const generateTextCompletion = (
  prompt: string,
  options?: AITextGenerationOptions
): Promise<AITextGenerationResult> => 
  useSmartRouter
    ? smartAIService.generateTextCompletion(prompt, options)
    : aiRedundancyService.generateTextCompletion(prompt, options);

export const generateChatCompletion = (
  messages: Message[],
  options?: AITextGenerationOptions
): Promise<AITextGenerationResult> =>
  useSmartRouter
    ? smartAIService.generateChatCompletion(messages, options)
    : aiRedundancyService.generateChatCompletion(messages, options);

export const callFunction = (
  params: {
    name: string;
    parameters: AIFunctionParams;
    prompt: string;
    options?: AIFunctionCallingOptions;
  }
): Promise<AIFunctionCallResult> =>
  useSmartRouter
    ? smartAIService.callFunction(params)
    : aiRedundancyService.callFunction(params);

/**
 * Check health of AI providers
 */
export const checkAIProvidersHealth = (): Promise<Record<string, boolean>> =>
  aiRedundancyService.checkProvidersHealth();

/**
 * Get provider metrics
 */
export const getAIProviderMetrics = (): Record<string, any> => {
  // If smart router is enabled, get enhanced metrics
  if (useSmartRouter) {
    return smartAIService.getRoutingMetrics().metrics;
  }
  return aiRedundancyService.getMetrics();
};

/**
 * Get list of available providers
 */
export const getAIProviders = (): string[] =>
  aiRedundancyService.getProviders();

/**
 * Set primary provider name
 */
export const setPrimaryProvider = (providerName: string): boolean => {
  const legacyResult = aiRedundancyService.setPrimaryProvider(providerName);
  
  // Also update smart service
  if (useSmartRouter) {
    smartAIService.updateProviderCosts(providerName, 0, 1000000); // Incentivize this provider
  }
  
  return legacyResult;
};

/**
 * Get primary provider name
 */
export const getPrimaryProvider = (): string =>
  aiRedundancyService.getPrimaryProvider();

/**
 * Reset provider quota
 */
export const resetProviderQuota = (
  providerName: string,
  newQuota: number
): void => {
  if (useSmartRouter) {
    smartAIService.resetProviderQuota(providerName, newQuota);
  }
};

/**
 * Update provider costs 
 */
export const updateProviderCost = (
  providerName: string,
  costPerUnit: number,
  freeQuotaTotal?: number
): void => {
  if (useSmartRouter) {
    smartAIService.updateProviderCosts(providerName, costPerUnit, freeQuotaTotal);
  }
};

/**
 * Get routing metrics including Q-values
 */
export const getRoutingMetrics = (): {
  metrics: Record<string, any>,
  qValues: Record<string, Record<string, number>>
} => {
  if (useSmartRouter) {
    return smartAIService.getRoutingMetrics();
  }
  
  // Return simple metrics for legacy service
  return {
    metrics: aiRedundancyService.getMetrics(),
    qValues: {}
  };
};

/**
 * Enable batch processing
 */
export const enableBatchProcessing = (
  enabled: boolean = true,
  threshold: number = 10,
  timeWindowMs: number = 60000
): void => {
  if (useSmartRouter) {
    smartAIService.setBatchMode(enabled, threshold, timeWindowMs);
  }
};