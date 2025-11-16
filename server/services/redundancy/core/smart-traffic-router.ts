/**
 * Smart Traffic Router
 * 
 * Implements a reinforcement learning based approach to optimally route traffic
 * between different service providers based on cost, performance, and availability.
 * Uses a Q-learning algorithm to adapt routing decisions over time.
 */

import { logger } from '../../../utils/logger';
import { ServiceProvider, ProviderMetrics } from './index';

/**
 * Cost-aware provider metrics that track quota and cost information
 */
export interface CostAwareProviderMetrics extends ProviderMetrics {
  // Cost per unit (e.g., per token for AI, per GB for storage)
  costPerUnit: number;
  
  // Free quota information
  freeQuotaTotal: number;
  freeQuotaRemaining: number;
  freeQuotaResetTime: Date | null;
  
  // Usage tracking
  totalUnitsProcessed: number;
  totalCostIncurred: number;
  
  // Provider characteristics
  capabilities: string[];
  specialties: string[];
  
  // Last update timestamp
  lastUpdated: Date;
}

/**
 * Task requirements to help determine the best provider
 */
export interface TaskRequirements {
  // Priority level (0-10, where 10 is highest)
  priority: number;
  
  // Estimated units required (tokens, storage, etc.)
  estimatedUnits: number;
  
  // Maximum acceptable latency in ms
  maxLatency?: number;
  
  // Cost constraints
  maxCost?: number;
  preferFreeTier: boolean;
  
  // Capabilities required
  requiredCapabilities: string[];
  
  // Deadline (if any)
  deadline?: Date;
  
  // Task category (e.g., 'text-generation', 'image-analysis')
  category: string;
  
  // Routing hints
  routingHints?: {
    preferredProviders?: string[];
    excludedProviders?: string[];
  };
}

/**
 * Routing decision result
 */
export interface RoutingDecision {
  selectedProvider: string;
  fallbackProviders: string[];
  estimatedCost: number;
  estimatedLatency: number;
  confidence: number;
  rationale: string;
}

/**
 * Smart Traffic Router that uses reinforcement learning 
 * to optimize routing decisions
 */
export class SmartTrafficRouter<T extends ServiceProvider> {
  // Q-values for provider selection (provider -> task category -> q-value)
  private qValues: Map<string, Map<string, number>> = new Map();
  
  // Metrics for each provider
  private providerMetrics: Map<string, CostAwareProviderMetrics> = new Map();
  
  // Learning parameters
  private readonly alpha: number = 0.1;  // Learning rate
  private readonly gamma: number = 0.9;  // Discount factor
  private readonly epsilon: number = 0.1; // Exploration rate
  
  // Usage optimization
  private batchMode: boolean = false;
  private batchQueue: Map<string, any[]> = new Map();
  private batchThreshold: number = 10;
  private batchTimeWindow: number = 60000; // 1 minute
  
  /**
   * Constructor
   */
  constructor(
    private providers: T[],
    private defaultProvider: string,
    initialMetrics?: Map<string, Partial<CostAwareProviderMetrics>>,
  ) {
    // Initialize Q-values and metrics
    this.initializeQValues();
    this.initializeMetrics(initialMetrics);
    
    logger.info('[smart-router] Smart Traffic Router initialized with providers: ' + 
      providers.map(p => p.name).join(', '));
  }
  
  /**
   * Initialize Q-values for all providers and common task categories
   */
  private initializeQValues(): void {
    // Common task categories
    const categories = [
      'text-generation', 
      'chat-completion', 
      'function-calling',
      'image-analysis',
      'data-storage', 
      'data-retrieval',
      'batch-processing'
    ];
    
    // Initialize Q-values with small random values to break ties
    for (const provider of this.providers) {
      const categoryMap = new Map<string, number>();
      
      for (const category of categories) {
        // Initialize with small random value (0.01 to 0.1)
        categoryMap.set(category, 0.01 + Math.random() * 0.09);
      }
      
      this.qValues.set(provider.name, categoryMap);
    }
  }
  
  /**
   * Initialize metrics for all providers
   */
  private initializeMetrics(initialMetrics?: Map<string, Partial<CostAwareProviderMetrics>>): void {
    for (const provider of this.providers) {
      // Start with default metrics
      const defaultMetrics: CostAwareProviderMetrics = {
        successRate: 1.0,
        avgResponseTime: 0,
        costPerRequest: 0,
        lastFailure: null,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        costPerUnit: 0,
        freeQuotaTotal: 0,
        freeQuotaRemaining: 0,
        freeQuotaResetTime: null,
        totalUnitsProcessed: 0,
        totalCostIncurred: 0,
        capabilities: [],
        specialties: [],
        lastUpdated: new Date()
      };
      
      // Override with provided metrics if available
      if (initialMetrics && initialMetrics.has(provider.name)) {
        const overrides = initialMetrics.get(provider.name);
        this.providerMetrics.set(provider.name, {
          ...defaultMetrics,
          ...overrides,
          lastUpdated: new Date()
        });
      } else {
        this.providerMetrics.set(provider.name, defaultMetrics);
      }
    }
  }
  
  /**
   * Update provider metrics
   */
  public updateProviderMetrics(
    providerName: string, 
    metrics: Partial<CostAwareProviderMetrics>
  ): void {
    const currentMetrics = this.providerMetrics.get(providerName);
    
    if (currentMetrics) {
      // Update metrics
      this.providerMetrics.set(providerName, {
        ...currentMetrics,
        ...metrics,
        lastUpdated: new Date()
      });
      
      logger.debug(`[smart-router] Updated metrics for provider ${providerName}`);
    } else {
      logger.warn(`[smart-router] Attempted to update metrics for unknown provider: ${providerName}`);
    }
  }
  
  /**
   * Calculate reward based on task outcome
   */
  private calculateReward(
    providerName: string,
    taskCategory: string,
    result: {
      success: boolean,
      responseTime: number,
      unitsProcessed: number,
      error?: Error
    }
  ): number {
    const metrics = this.providerMetrics.get(providerName);
    if (!metrics) return -1; // Penalize unknown providers
    
    // Base reward for successful completion
    let reward = result.success ? 1.0 : -1.0;
    
    // Adjust for response time (faster is better)
    if (result.responseTime > 0) {
      // Compare to average, normalize so faster is better
      const responseTimeFactor = metrics.avgResponseTime > 0 
        ? Math.min(metrics.avgResponseTime / result.responseTime, 2.0)
        : 1.0;
      
      reward *= responseTimeFactor;
    }
    
    // Adjust for cost efficiency (cheaper is better)
    if (result.unitsProcessed > 0 && metrics.costPerUnit > 0) {
      // Free quota is best
      if (metrics.freeQuotaRemaining >= result.unitsProcessed) {
        reward *= 1.5; // Bonus for using free quota
      } else {
        // Cost efficiency factor (lower cost is better)
        const costFactor = Math.min(2.0, 0.1 / (metrics.costPerUnit * result.unitsProcessed));
        reward *= costFactor;
      }
    }
    
    // Cap reward between -2 and 2
    reward = Math.max(-2, Math.min(2, reward));
    
    logger.debug(`[smart-router] Calculated reward for ${providerName} (${taskCategory}): ${reward.toFixed(4)}`);
    
    return reward;
  }
  
  /**
   * Update Q-values based on experience
   */
  public updateQValues(
    providerName: string, 
    taskCategory: string, 
    reward: number
  ): void {
    // Get current Q-value
    const providerQValues = this.qValues.get(providerName);
    if (!providerQValues) return;
    
    const currentQValue = providerQValues.get(taskCategory) || 0;
    
    // Update using Q-learning formula: Q(s,a) = Q(s,a) + alpha * (reward + gamma * maxQ(s',a') - Q(s,a))
    // Since we don't model state transitions explicitly, we use a simplified form
    const newQValue = currentQValue + this.alpha * (reward - currentQValue);
    
    // Update Q-value
    providerQValues.set(taskCategory, newQValue);
    this.qValues.set(providerName, providerQValues);
    
    logger.debug(`[smart-router] Updated Q-value for ${providerName} (${taskCategory}): ${newQValue.toFixed(4)}`);
  }
  
  /**
   * Select the best provider for a task using epsilon-greedy policy
   */
  public selectProvider(taskRequirements: TaskRequirements): RoutingDecision {
    // Destructure for easier access
    const { 
      category, 
      estimatedUnits, 
      preferFreeTier, 
      maxLatency, 
      requiredCapabilities = [],
      routingHints
    } = taskRequirements;
    
    // Exploration: With probability epsilon, select a random provider
    if (Math.random() < this.epsilon) {
      const eligibleProviders = this.getEligibleProviders(taskRequirements);
      
      if (eligibleProviders.length === 0) {
        return this.createFallbackDecision(
          'No eligible providers found for exploration, using default',
          0.1
        );
      }
      
      // Choose random eligible provider
      const randomIndex = Math.floor(Math.random() * eligibleProviders.length);
      const selectedProvider = eligibleProviders[randomIndex];
      
      logger.debug(`[smart-router] Exploration: Selected ${selectedProvider} for ${category}`);
      
      return this.createRoutingDecision(
        selectedProvider,
        this.getBackupProviders(selectedProvider, taskRequirements),
        `Exploration: randomly selected provider to gather performance data`,
        0.5 // Medium confidence for exploration
      );
    }
    
    // Exploitation: Select provider with highest Q-value among eligible providers
    const eligibleProviders = this.getEligibleProviders(taskRequirements);
    
    if (eligibleProviders.length === 0) {
      return this.createFallbackDecision(
        'No eligible providers found for exploitation, using default',
        0.1
      );
    }
    
    // Rank providers by Q-value for this category
    const rankedProviders = eligibleProviders
      .map(provider => {
        const qValue = this.qValues.get(provider)?.get(category) || 0;
        return { provider, qValue };
      })
      .sort((a, b) => b.qValue - a.qValue);
    
    const selectedProvider = rankedProviders[0].provider;
    const confidence = Math.min(1.0, Math.max(0.1, rankedProviders[0].qValue / 2));
    
    // Why this provider was selected
    const rationale = this.generateRationale(selectedProvider, taskRequirements);
    
    logger.debug(`[smart-router] Exploitation: Selected ${selectedProvider} for ${category} (Q=${rankedProviders[0].qValue.toFixed(4)})`);
    
    return this.createRoutingDecision(
      selectedProvider,
      this.getBackupProviders(selectedProvider, taskRequirements),
      rationale,
      confidence
    );
  }
  
  /**
   * Get eligible providers that meet task requirements
   */
  private getEligibleProviders(task: TaskRequirements): string[] {
    const eligible: string[] = [];
    
    for (const provider of this.providers) {
      const metrics = this.providerMetrics.get(provider.name);
      if (!metrics) continue;
      
      // Check if explicitly excluded
      if (task.routingHints?.excludedProviders?.includes(provider.name)) {
        continue;
      }
      
      // Check required capabilities
      const hasRequiredCapabilities = task.requiredCapabilities.every(cap => 
        metrics.capabilities.includes(cap)
      );
      
      if (!hasRequiredCapabilities) continue;
      
      // Check latency constraints
      if (task.maxLatency && metrics.avgResponseTime > task.maxLatency) {
        continue;
      }
      
      // Check free tier preference
      if (task.preferFreeTier && metrics.freeQuotaRemaining < task.estimatedUnits) {
        // Skip if we need free tier but not enough quota remains
        // Unless this provider is explicitly preferred
        if (!task.routingHints?.preferredProviders?.includes(provider.name)) {
          continue;
        }
      }
      
      // Check cost constraints
      if (task.maxCost) {
        const estimatedCost = metrics.costPerUnit * task.estimatedUnits;
        if (estimatedCost > task.maxCost) {
          continue;
        }
      }
      
      // Provider is eligible
      eligible.push(provider.name);
    }
    
    // If we have preferred providers, prioritize them
    if (task.routingHints?.preferredProviders && task.routingHints.preferredProviders.length > 0) {
      // Keep only preferred providers that are eligible
      const preferred = task.routingHints.preferredProviders.filter(p => eligible.includes(p));
      
      // If we have eligible preferred providers, return only those
      if (preferred.length > 0) {
        return preferred;
      }
    }
    
    return eligible;
  }
  
  /**
   * Get backup providers for a task (excluding the selected provider)
   */
  private getBackupProviders(selectedProvider: string, task: TaskRequirements): string[] {
    // Get eligible providers excluding the selected one
    const eligibleBackups = this.getEligibleProviders(task)
      .filter(p => p !== selectedProvider);
    
    // Sort by Q-value
    return eligibleBackups
      .map(provider => {
        const qValue = this.qValues.get(provider)?.get(task.category) || 0;
        return { provider, qValue };
      })
      .sort((a, b) => b.qValue - a.qValue)
      .map(p => p.provider)
      .slice(0, 2); // Take top 2 backups
  }
  
  /**
   * Create a routing decision when no eligible providers are found
   */
  private createFallbackDecision(rationale: string, confidence: number): RoutingDecision {
    return {
      selectedProvider: this.defaultProvider,
      fallbackProviders: [],
      estimatedCost: -1, // Unknown
      estimatedLatency: -1, // Unknown
      confidence,
      rationale
    };
  }
  
  /**
   * Create a routing decision with details
   */
  private createRoutingDecision(
    selectedProvider: string,
    fallbackProviders: string[],
    rationale: string,
    confidence: number
  ): RoutingDecision {
    const metrics = this.providerMetrics.get(selectedProvider);
    
    return {
      selectedProvider,
      fallbackProviders,
      estimatedCost: metrics ? metrics.costPerUnit : -1,
      estimatedLatency: metrics ? metrics.avgResponseTime : -1,
      confidence,
      rationale
    };
  }
  
  /**
   * Generate a human-readable rationale for provider selection
   */
  private generateRationale(provider: string, task: TaskRequirements): string {
    const metrics = this.providerMetrics.get(provider);
    if (!metrics) return `Selected ${provider} as default choice`;
    
    const reasons: string[] = [];
    
    // Check if free quota is available and preferred
    if (task.preferFreeTier && metrics.freeQuotaRemaining >= task.estimatedUnits) {
      reasons.push(`has ${metrics.freeQuotaRemaining} free units available`);
    }
    
    // Check if it's a preferred provider
    if (task.routingHints?.preferredProviders?.includes(provider)) {
      reasons.push('is explicitly preferred for this task');
    }
    
    // Check success rate
    if (metrics.successRate > 0.95) {
      reasons.push(`has high reliability (${(metrics.successRate * 100).toFixed(1)}% success rate)`);
    }
    
    // Check response time
    if (metrics.avgResponseTime > 0 && task.maxLatency) {
      const latencyMargin = task.maxLatency - metrics.avgResponseTime;
      if (latencyMargin > 0) {
        reasons.push(`meets latency requirements with ${latencyMargin.toFixed(0)}ms margin`);
      }
    }
    
    // Check specialties
    const relevantSpecialties = metrics.specialties.filter(specialty => 
      specialty.toLowerCase().includes(task.category.toLowerCase())
    );
    
    if (relevantSpecialties.length > 0) {
      reasons.push(`specializes in ${relevantSpecialties.join(', ')}`);
    }
    
    // Format the rationale
    if (reasons.length === 0) {
      return `Selected ${provider} based on historical performance`;
    } else if (reasons.length === 1) {
      return `Selected ${provider} because it ${reasons[0]}`;
    } else {
      const lastReason = reasons.pop();
      return `Selected ${provider} because it ${reasons.join(', ')} and ${lastReason}`;
    }
  }
  
  /**
   * Record the outcome of a routing decision to improve future decisions
   */
  public recordOutcome(
    provider: string,
    taskCategory: string,
    result: {
      success: boolean,
      responseTime: number,
      unitsProcessed: number,
      error?: Error
    }
  ): void {
    // Calculate reward
    const reward = this.calculateReward(provider, taskCategory, result);
    
    // Update Q-values
    this.updateQValues(provider, taskCategory, reward);
    
    // Update provider metrics
    const metrics = this.providerMetrics.get(provider);
    if (metrics) {
      const updatedMetrics: Partial<CostAwareProviderMetrics> = {
        totalRequests: metrics.totalRequests + 1,
        totalUnitsProcessed: metrics.totalUnitsProcessed + result.unitsProcessed,
        lastUpdated: new Date()
      };
      
      if (result.success) {
        updatedMetrics.successfulRequests = metrics.successfulRequests + 1;
        
        // Update average response time (weighted moving average)
        const n = metrics.successfulRequests;
        updatedMetrics.avgResponseTime = (metrics.avgResponseTime * n + result.responseTime) / (n + 1);
        
        // Update cost tracking
        if (metrics.freeQuotaRemaining > result.unitsProcessed) {
          // Used free quota
          updatedMetrics.freeQuotaRemaining = metrics.freeQuotaRemaining - result.unitsProcessed;
        } else {
          // Used paid quota
          const cost = metrics.costPerUnit * result.unitsProcessed;
          updatedMetrics.totalCostIncurred = metrics.totalCostIncurred + cost;
          
          // If there was some free quota, use it first
          if (metrics.freeQuotaRemaining > 0) {
            updatedMetrics.freeQuotaRemaining = 0;
          }
        }
      } else {
        updatedMetrics.failedRequests = metrics.failedRequests + 1;
        updatedMetrics.lastFailure = new Date();
      }
      
      // Update success rate
      updatedMetrics.successRate = (metrics.successfulRequests + (result.success ? 1 : 0)) / 
        (metrics.totalRequests + 1);
        
      this.updateProviderMetrics(provider, updatedMetrics);
    }
    
    logger.debug(`[smart-router] Recorded outcome for ${provider} (${taskCategory}): ${result.success ? 'success' : 'failure'}`);
  }
  
  /**
   * Enable or disable batch mode
   */
  public setBatchMode(enabled: boolean, threshold?: number, timeWindow?: number): void {
    this.batchMode = enabled;
    
    if (threshold) {
      this.batchThreshold = threshold;
    }
    
    if (timeWindow) {
      this.batchTimeWindow = timeWindow;
    }
    
    logger.info(`[smart-router] Batch mode ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Add a task to the batch queue
   */
  public addToBatch(category: string, task: any): void {
    if (!this.batchMode) return;
    
    if (!this.batchQueue.has(category)) {
      this.batchQueue.set(category, []);
    }
    
    this.batchQueue.get(category)!.push(task);
    
    logger.debug(`[smart-router] Added task to batch queue for ${category}, current size: ${this.batchQueue.get(category)!.length}`);
  }
  
  /**
   * Check if a category has reached the batch threshold
   */
  public isBatchReady(category: string): boolean {
    if (!this.batchMode) return false;
    
    return (this.batchQueue.get(category)?.length || 0) >= this.batchThreshold;
  }
  
  /**
   * Get and clear the batch for a category
   */
  public getBatch(category: string): any[] {
    if (!this.batchQueue.has(category)) {
      return [];
    }
    
    const batch = this.batchQueue.get(category) || [];
    this.batchQueue.set(category, []);
    
    logger.debug(`[smart-router] Retrieved batch for ${category}, size: ${batch.length}`);
    
    return batch;
  }
  
  /**
   * Reset provider quota information (typically called on quota refresh)
   */
  public resetProviderQuota(providerName: string, newQuota: number, resetTime: Date): void {
    const metrics = this.providerMetrics.get(providerName);
    
    if (metrics) {
      this.updateProviderMetrics(providerName, {
        freeQuotaTotal: newQuota,
        freeQuotaRemaining: newQuota,
        freeQuotaResetTime: resetTime
      });
      
      logger.info(`[smart-router] Reset quota for ${providerName} to ${newQuota} units`);
    }
  }
  
  /**
   * Get a report of Q-values for all providers
   */
  public getQValues(): Record<string, Record<string, number>> {
    const result: Record<string, Record<string, number>> = {};
    
    for (const [provider, categoryMap] of this.qValues.entries()) {
      result[provider] = {};
      
      for (const [category, qValue] of categoryMap.entries()) {
        result[provider][category] = qValue;
      }
    }
    
    return result;
  }
  
  /**
   * Get provider metrics
   */
  public getProviderMetrics(): Record<string, CostAwareProviderMetrics> {
    const result: Record<string, CostAwareProviderMetrics> = {};
    
    for (const [provider, metrics] of this.providerMetrics.entries()) {
      result[provider] = { ...metrics };
    }
    
    return result;
  }
  
  /**
   * Export the current model (Q-values and metrics) for persistence
   */
  public exportModel(): {
    qValues: Record<string, Record<string, number>>,
    metrics: Record<string, CostAwareProviderMetrics>
  } {
    return {
      qValues: this.getQValues(),
      metrics: this.getProviderMetrics()
    };
  }
  
  /**
   * Import a previously saved model
   */
  public importModel(model: {
    qValues: Record<string, Record<string, number>>,
    metrics: Record<string, CostAwareProviderMetrics>
  }): void {
    // Import Q-values
    for (const [provider, categories] of Object.entries(model.qValues)) {
      const categoryMap = new Map<string, number>();
      
      for (const [category, qValue] of Object.entries(categories)) {
        categoryMap.set(category, qValue);
      }
      
      this.qValues.set(provider, categoryMap);
    }
    
    // Import metrics
    for (const [provider, metrics] of Object.entries(model.metrics)) {
      this.providerMetrics.set(provider, {
        ...metrics,
        lastUpdated: new Date() // Update timestamp to current
      });
    }
    
    logger.info('[smart-router] Imported model data');
  }
}