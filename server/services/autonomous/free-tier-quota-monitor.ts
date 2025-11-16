/**
 * Free-Tier Quota Monitor
 * Tracks and rotates free API quotas to enable autonomous zero-cost coding
 * 
 * Integrates with:
 * - Resource Arbitrage Engine (free AI providers)
 * - Temporal Arbitrage Engine (optimal timing)
 * - Autonomous Decision-Making System
 */

export interface FreeProviderQuota {
  provider: string;
  dailyLimit: number;
  used: number;
  resetTime: Date;
  available: boolean;
  latency: number; // Average response time in ms
  successRate: number; // 0-1
  strengths: string[];
  lastUsed?: Date;
}

export interface QuotaRotationStrategy {
  currentProvider: string;
  nextProvider: string;
  switchReason: string;
  estimatedSavings: number;
  confidenceScore: number;
}

export class FreeTierQuotaMonitor {
  private quotas: Map<string, FreeProviderQuota> = new Map();
  private rotationHistory: Array<{ timestamp: Date; from: string; to: string; reason: string }> = [];
  private readonly PHI = 1.618033988749895; // Golden ratio for optimal rotation
  
  constructor() {
    this.initializeQuotas();
    this.startDailyReset();
    console.log('[Free-Tier Monitor] 🆓 Zero-cost quota tracking initialized');
    console.log('[Free-Tier Monitor] 📊 Monitoring', this.quotas.size, 'free-tier providers');
  }

  /**
   * Initialize free-tier provider quotas
   */
  private initializeQuotas(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Coding-focused free providers
    const freeProviders: Omit<FreeProviderQuota, 'used' | 'available' | 'lastUsed'>[] = [
      {
        provider: 'HuggingFace',
        dailyLimit: 30000,
        resetTime: tomorrow,
        latency: 800,
        successRate: 0.92,
        strengths: ['simple_chat', 'summarization', 'classification']
      },
      {
        provider: 'Groq',
        dailyLimit: 14400, // 240 requests/min * 60 min
        resetTime: tomorrow,
        latency: 350,
        successRate: 0.95,
        strengths: ['ultra_fast_inference', 'code_completion', 'chat']
      },
      {
        provider: 'DeepSeek',
        dailyLimit: 10000,
        resetTime: tomorrow,
        latency: 1200,
        successRate: 0.88,
        strengths: ['code_generation', 'reasoning', 'math']
      },
      {
        provider: 'Continue.dev',
        dailyLimit: 999999,
        resetTime: tomorrow,
        latency: 600,
        successRate: 0.90,
        strengths: ['code_completion', 'refactoring', 'debugging']
      },
      {
        provider: 'Supermaven',
        dailyLimit: 100000,
        resetTime: tomorrow,
        latency: 250,
        successRate: 0.93,
        strengths: ['ultra_fast_completion', 'autocomplete', 'suggestions']
      },
      {
        provider: 'Gemini-Free',
        dailyLimit: 1500, // 60 req/min
        resetTime: tomorrow,
        latency: 900,
        successRate: 0.91,
        strengths: ['multimodal', 'long_context', 'reasoning']
      },
      {
        provider: 'Cohere-Free',
        dailyLimit: 1000,
        resetTime: tomorrow,
        latency: 700,
        successRate: 0.89,
        strengths: ['embeddings', 'classification', 'reranking']
      }
    ];

    for (const provider of freeProviders) {
      this.quotas.set(provider.provider, {
        ...provider,
        used: 0,
        available: true,
        lastUsed: undefined
      });
    }
  }

  /**
   * Get next available free provider using golden ratio rotation
   */
  getNextFreeProvider(taskType?: string): QuotaRotationStrategy {
    const availableProviders = Array.from(this.quotas.values())
      .filter(q => q.available && q.used < q.dailyLimit * 0.95) // Keep 5% buffer
      .sort((a, b) => {
        // Score providers by: availability, success rate, latency, task match
        const scoreA = this.calculateProviderScore(a, taskType);
        const scoreB = this.calculateProviderScore(b, taskType);
        return scoreB - scoreA;
      });

    if (availableProviders.length === 0) {
      // All quotas exhausted - use temporal arbitrage to wait for reset
      const nextReset = this.getNextQuotaReset();
      return {
        currentProvider: 'none',
        nextProvider: nextReset.provider,
        switchReason: `All quotas exhausted. Next reset: ${nextReset.provider} in ${nextReset.hoursUntil}h`,
        estimatedSavings: 1.0, // 100% savings (free)
        confidenceScore: 0.95
      };
    }

    const best = availableProviders[0];
    const current = this.getMostRecentProvider();

    return {
      currentProvider: current || 'none',
      nextProvider: best.provider,
      switchReason: this.getRotationReason(best, taskType),
      estimatedSavings: 1.0, // 100% savings (all free)
      confidenceScore: best.successRate
    };
  }

  /**
   * Calculate provider score using golden ratio weighting
   */
  private calculateProviderScore(quota: FreeProviderQuota, taskType?: string): number {
    const availabilityScore = (quota.dailyLimit - quota.used) / quota.dailyLimit;
    const successScore = quota.successRate;
    const latencyScore = 1 / (quota.latency / 1000); // Inverse latency (lower is better)
    
    // Task match bonus
    let taskMatchScore = 0.5;
    if (taskType && quota.strengths.some(s => s.includes(taskType))) {
      taskMatchScore = 1.0;
    }

    // Golden ratio weighted combination
    const score = (
      availabilityScore * this.PHI +
      successScore * this.PHI +
      latencyScore +
      taskMatchScore * this.PHI
    ) / (this.PHI * 3 + 1);

    return score;
  }

  /**
   * Record provider usage
   */
  recordUsage(provider: string, requestCount: number = 1, success: boolean = true): void {
    const quota = this.quotas.get(provider);
    if (!quota) {
      console.warn(`[Free-Tier Monitor] ⚠️  Unknown provider: ${provider}`);
      return;
    }

    quota.used += requestCount;
    quota.lastUsed = new Date();

    // Update success rate with exponential moving average
    quota.successRate = quota.successRate * 0.9 + (success ? 1 : 0) * 0.1;

    // Mark as unavailable if quota exhausted
    if (quota.used >= quota.dailyLimit * 0.95) {
      quota.available = false;
      console.log(`[Free-Tier Monitor] 🚫 ${provider} quota exhausted (${quota.used}/${quota.dailyLimit})`);
    }

    console.log(`[Free-Tier Monitor] 📊 ${provider}: ${quota.used}/${quota.dailyLimit} used (${((quota.used/quota.dailyLimit)*100).toFixed(1)}%)`);
  }

  /**
   * Get rotation reason for user transparency
   */
  private getRotationReason(quota: FreeProviderQuota, taskType?: string): string {
    const reasons: string[] = [];
    
    if (quota.used === 0) {
      reasons.push('Fresh quota available');
    } else {
      const percentUsed = (quota.used / quota.dailyLimit) * 100;
      if (percentUsed < 30) {
        reasons.push('Low usage quota');
      }
    }

    if (quota.latency < 500) {
      reasons.push('Ultra-fast response');
    }

    if (quota.successRate > 0.92) {
      reasons.push('High reliability');
    }

    if (taskType && quota.strengths.some(s => s.includes(taskType))) {
      reasons.push(`Optimized for ${taskType}`);
    }

    return reasons.join(', ') || 'Best available option';
  }

  /**
   * Get next quota reset time
   */
  private getNextQuotaReset(): { provider: string; hoursUntil: number } {
    const now = new Date();
    let earliest = { provider: '', hoursUntil: Infinity };

    for (const quota of Array.from(this.quotas.values())) {
      const hoursUntil = (quota.resetTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntil < earliest.hoursUntil) {
        earliest = { provider: quota.provider, hoursUntil };
      }
    }

    return earliest;
  }

  /**
   * Get most recently used provider
   */
  private getMostRecentProvider(): string | null {
    let mostRecent: { provider: string; time: Date } | null = null;

    for (const [provider, quota] of Array.from(this.quotas)) {
      if (quota.lastUsed && (!mostRecent || quota.lastUsed > mostRecent.time)) {
        mostRecent = { provider, time: quota.lastUsed };
      }
    }

    return mostRecent?.provider || null;
  }

  /**
   * Daily quota reset scheduler
   */
  private startDailyReset(): void {
    setInterval(() => {
      const now = new Date();
      
      for (const [provider, quota] of Array.from(this.quotas)) {
        if (now >= quota.resetTime) {
          console.log(`[Free-Tier Monitor] 🔄 Resetting quota for ${provider}`);
          quota.used = 0;
          quota.available = true;
          
          // Set next reset time (tomorrow)
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          quota.resetTime = tomorrow;
        }
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  /**
   * Get current quota status (for dashboard)
   */
  getQuotaStatus(): {
    providers: FreeProviderQuota[];
    totalAvailable: number;
    totalExhausted: number;
    estimatedDailySavings: number;
    nextReset: { provider: string; hoursUntil: number };
  } {
    const providers = Array.from(this.quotas.values());
    const available = providers.filter(p => p.available).length;
    const exhausted = providers.length - available;

    // Estimate savings: assume $0.002 per request (typical paid API cost)
    const totalRequests = providers.reduce((sum, p) => sum + p.used, 0);
    const estimatedDailySavings = totalRequests * 0.002;

    return {
      providers,
      totalAvailable: available,
      totalExhausted: exhausted,
      estimatedDailySavings,
      nextReset: this.getNextQuotaReset()
    };
  }

  /**
   * Check if autonomous coding can run for free
   */
  canRunForFree(): { canRun: boolean; provider?: string; reason: string } {
    const rotation = this.getNextFreeProvider('code');
    
    if (rotation.nextProvider === 'none') {
      return {
        canRun: false,
        reason: rotation.switchReason
      };
    }

    return {
      canRun: true,
      provider: rotation.nextProvider,
      reason: `Using ${rotation.nextProvider} - ${rotation.switchReason}`
    };
  }
}

// Export singleton instance
export const freeTierMonitor = new FreeTierQuotaMonitor();
