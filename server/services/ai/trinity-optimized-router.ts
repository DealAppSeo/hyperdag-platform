/**
 * Trinity Optimized Router - Ultimate AI Provider Management
 * Combines ProviderRouter + LiteLLM + Enhanced ANFIS for maximum efficiency
 */

import { providerRouter } from '../provider-router';
import { liteLLMGateway } from './litellm-gateway';
import { enhancedANFISAutoFailover } from './enhanced-anfis-auto-failover';

interface OptimizedRoutingOptions {
  prioritizeCost?: boolean;
  maxTokens?: number;
  temperature?: number;
  taskType?: string;
}

export class TrinityOptimizedRouter {
  async executeWithIntelligentRouting(
    prompt: string, 
    options: OptimizedRoutingOptions = {}
  ): Promise<{
    success: boolean;
    provider: string;
    cost: number;
    result: string;
    responseTime: number;
    routingStrategy: string;
  }> {
    const startTime = Date.now();
    
    try {
      // TIER 1: Primary routing through optimized ProviderRouter (Anthropic first)
      console.log('[Trinity Router] 🎯 Tier 1: Trying primary providers');
      
      const primaryResult = await providerRouter.executeTask({
        type: options.taskType || 'inference',
        payload: prompt,
        prioritizeCost: options.prioritizeCost || false
      });
      
      return {
        success: true,
        provider: primaryResult.provider,
        cost: primaryResult.cost,
        result: primaryResult.result,
        responseTime: Date.now() - startTime,
        routingStrategy: 'primary-optimized'
      };
      
    } catch (primaryError) {
      console.log('[Trinity Router] ⚡ Tier 1 failed, trying LiteLLM gateway...');
      
      try {
        // TIER 2: LiteLLM Gateway for zero-markup access
        const liteLLMResult = await liteLLMGateway.executeWithFailover(prompt, {
          maxTokens: options.maxTokens || 500,
          temperature: options.temperature || 0.7
        });
        
        return {
          success: true,
          provider: `LiteLLM-${liteLLMResult.provider}`,
          cost: liteLLMResult.cost,
          result: liteLLMResult.result,
          responseTime: Date.now() - startTime,
          routingStrategy: 'litellm-failover'
        };
        
      } catch (liteLLMError) {
        console.log('[Trinity Router] 🆘 Tier 2 failed, using Enhanced ANFIS...');
        
        try {
          // TIER 3: Enhanced ANFIS with all available providers + Akash fallback
          const anfisResult = await enhancedANFISAutoFailover.executeWithFailover(
            prompt, 
            options.taskType || 'inference'
          );
          
          return {
            success: true,
            provider: anfisResult.provider || 'ANFIS-Unknown',
            cost: anfisResult.cost || 0.001,
            result: anfisResult.result,
            responseTime: Date.now() - startTime,
            routingStrategy: 'anfis-ultimate-failover'
          };
          
        } catch (anfisError) {
          // All tiers failed
          const errorMessage = anfisError instanceof Error ? anfisError.message : String(anfisError);
          throw new Error(`Trinity Router: All tiers failed. Final error: ${errorMessage}`);
        }
      }
    }
  }

  // Get comprehensive system status
  async getSystemStatus(): Promise<{
    primaryProviders: any[];
    liteLLMProviders: Record<string, any>;
    anfisProviders: Record<string, any>;
    overallHealth: string;
  }> {
    try {
      const liteLLMStatus = liteLLMGateway.getProviderStatus();
      const anfisStatus = enhancedANFISAutoFailover.getProviderStatus();
      
      // Count working providers
      const workingLiteLLM = Object.values(liteLLMStatus).filter((p: any) => p.enabled).length;
      const workingANFIS = Object.values(anfisStatus).filter((p: any) => p.available).length;
      
      let health = 'excellent';
      if (workingLiteLLM < 2) health = 'good';
      if (workingLiteLLM < 1) health = 'limited';
      
      return {
        primaryProviders: [], // Would need to expose from ProviderRouter
        liteLLMProviders: liteLLMStatus,
        anfisProviders: anfisStatus,
        overallHealth: health
      };
    } catch (error) {
      return {
        primaryProviders: [],
        liteLLMProviders: {},
        anfisProviders: {},
        overallHealth: 'error'
      };
    }
  }

  // Health check all tiers
  async healthCheckAllTiers(): Promise<{
    tier1: boolean;
    tier2: Record<string, boolean>;
    tier3: any;
    recommendation: string;
  }> {
    let tier1Working = false;
    let tier2Results = {};
    let tier3Status = null;
    
    try {
      // Test tier 1 (ProviderRouter)
      await providerRouter.executeTask({
        type: 'health_check',
        payload: 'test',
        prioritizeCost: false
      });
      tier1Working = true;
    } catch (error) {
      tier1Working = false;
    }
    
    try {
      // Test tier 2 (LiteLLM)
      tier2Results = await liteLLMGateway.healthCheck();
    } catch (error) {
      tier2Results = {};
    }
    
    try {
      // Test tier 3 (ANFIS)
      tier3Status = enhancedANFISAutoFailover.getRotationStatus();
    } catch (error) {
      tier3Status = null;
    }
    
    // Generate recommendation
    let recommendation = 'System operating optimally';
    if (!tier1Working && Object.keys(tier2Results).length === 0) {
      recommendation = 'Critical: Check API keys and provider status';
    } else if (!tier1Working) {
      recommendation = 'Primary tier down - operating on backup systems';
    }
    
    return {
      tier1: tier1Working,
      tier2: tier2Results,
      tier3: tier3Status,
      recommendation
    };
  }
}

export const trinityOptimizedRouter = new TrinityOptimizedRouter();