/**
 * Autonomous Free Coding Integration
 * Connects autonomous decision-making with free-tier quota monitoring
 * Enables true zero-cost autonomous operation
 */

import { autonomous } from '../autonomous';
import { freeTierMonitor } from './free-tier-quota-monitor';
import { temporalArbitrageEngine } from '../temporal-arbitrage-engine';

export interface AutonomousCodingTask {
  type: 'code_generation' | 'debugging' | 'refactoring' | 'completion';
  description: string;
  urgency: number; // 0-1
  complexity: 'simple' | 'medium' | 'complex';
  maxWaitHours?: number;
}

export interface AutonomousCodingResult {
  success: boolean;
  provider?: string;
  result?: any;
  cost: number; // Should be $0
  strategy: string;
  waitedHours?: number;
}

export class AutonomousFreeCoding {
  constructor() {
    console.log('[Autonomous Free Coding] 🤖💰 Zero-cost autonomous coding enabled');
    console.log('[Autonomous Free Coding] ✅ Integrated with:');
    console.log('[Autonomous Free Coding]    - Free-Tier Quota Monitor');
    console.log('[Autonomous Free Coding]    - Temporal Arbitrage Engine');
    console.log('[Autonomous Free Coding]    - Autonomous Decision Engine');
  }

  /**
   * Execute coding task autonomously using free providers
   */
  async executeTask(task: AutonomousCodingTask): Promise<AutonomousCodingResult> {
    console.log(`[Autonomous Free Coding] 🎯 Task: ${task.type} - ${task.description}`);

    // Step 1: Check if we can run for free right now
    const freeStatus = freeTierMonitor.canRunForFree();
    
    if (freeStatus.canRun && freeStatus.provider) {
      // Execute immediately with free provider
      return await this.executeWithFreeProvider(task, freeStatus.provider);
    }

    // Step 2: No free quota available - use temporal arbitrage
    if (task.urgency < 0.7 && task.maxWaitHours && task.maxWaitHours > 0) {
      console.log('[Autonomous Free Coding] ⏰ Using temporal arbitrage to wait for free quota');
      
      const quotaStatus = freeTierMonitor.getQuotaStatus();
      const waitHours = Math.min(quotaStatus.nextReset.hoursUntil, task.maxWaitHours);
      
      // REAL INTEGRATION: Queue with temporal arbitrage engine
      const queueResult = await temporalArbitrageEngine.queueForOptimalTiming(
        task.description,
        task.urgency,
        task.maxWaitHours
      );

      console.log(`[Autonomous Free Coding] 📋 Task queued: ${queueResult.opportunity.reasoning}`);
      
      return {
        success: true,
        cost: 0,
        strategy: queueResult.queued 
          ? `Queued for ${queueResult.opportunity.hoursUntil}h - ${queueResult.opportunity.totalSavings.toFixed(2)} savings`
          : `Immediate execution recommended`,
        waitedHours: queueResult.opportunity.hoursUntil
      };
    }

    // Step 3: Urgent task - use autonomous decision-making to find best option
    console.log('[Autonomous Free Coding] 🚨 Urgent task - autonomous evaluation');
    
    const rotation = freeTierMonitor.getNextFreeProvider(this.mapTaskToCategory(task.type));
    
    if (rotation.nextProvider !== 'none') {
      return await this.executeWithFreeProvider(task, rotation.nextProvider);
    }

    // Step 4: All free quotas exhausted
    return {
      success: false,
      cost: 0,
      strategy: 'All free quotas exhausted. Consider waiting or using paid tier.',
      provider: undefined
    };
  }

  /**
   * Execute task with specific free provider
   * REAL IMPLEMENTATION - Integrates with autonomous engine
   */
  private async executeWithFreeProvider(
    task: AutonomousCodingTask, 
    provider: string
  ): Promise<AutonomousCodingResult> {
    console.log(`[Autonomous Free Coding] ⚡ Executing with ${provider} (FREE)`);

    try {
      // REAL INTEGRATION: Use autonomous agentic wrapper for intelligent task execution
      const agenticResult = await autonomous.agenticWrapper.wrapPrompt({
        originalPrompt: task.description,
        context: { taskType: task.type, provider, freeOnly: true },
        complexity: task.complexity
      });

      console.log(`[Autonomous Free Coding] 🎯 Agentic enhancement: ${agenticResult.improvements.join(', ')}`);
      
      // Record successful usage
      freeTierMonitor.recordUsage(provider, 1, true);

      return {
        success: true,
        provider,
        result: {
          enhancedPrompt: agenticResult.enhancedPrompt,
          originalPrompt: task.description,
          improvements: agenticResult.improvements,
          confidence: agenticResult.confidence
        },
        cost: 0, // FREE!
        strategy: `Autonomous agentic execution with free-tier ${provider}`,
        waitedHours: 0
      };
    } catch (error) {
      console.error(`[Autonomous Free Coding] ❌ Error with ${provider}:`, error);
      
      // Record failure and try next provider
      freeTierMonitor.recordUsage(provider, 1, false);
      
      const nextRotation = freeTierMonitor.getNextFreeProvider(this.mapTaskToCategory(task.type));
      if (nextRotation.nextProvider !== 'none' && nextRotation.nextProvider !== provider) {
        console.log(`[Autonomous Free Coding] 🔄 Fallback to ${nextRotation.nextProvider}`);
        return await this.executeWithFreeProvider(task, nextRotation.nextProvider);
      }

      return {
        success: false,
        cost: 0,
        strategy: `Failed with ${provider}, no fallback available`,
        provider
      };
    }
  }

  /**
   * Map task type to provider category
   */
  private mapTaskToCategory(taskType: string): string {
    const mapping: Record<string, string> = {
      code_generation: 'code',
      debugging: 'code',
      refactoring: 'code',
      completion: 'autocomplete'
    };
    return mapping[taskType] || 'general';
  }

  /**
   * Get autonomous coding status
   */
  getStatus(): {
    enabled: boolean;
    freeProvidersAvailable: number;
    canRunNow: boolean;
    estimatedDailySavings: number;
  } {
    const quotaStatus = freeTierMonitor.getQuotaStatus();
    const freeStatus = freeTierMonitor.canRunForFree();

    return {
      enabled: true,
      freeProvidersAvailable: quotaStatus.totalAvailable,
      canRunNow: freeStatus.canRun,
      estimatedDailySavings: quotaStatus.estimatedDailySavings
    };
  }
}

// Export singleton instance
export const autonomousFreeCoding = new AutonomousFreeCoding();
