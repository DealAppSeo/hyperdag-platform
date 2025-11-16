/**
 * Unified AI Ecosystem Orchestrator
 * Integrates HuggingFace + AI-Prompt-Manager + Lovable.dev through Zuplo
 */

interface UnifiedRequest {
  type: 'inference' | 'prompt-optimization' | 'code-generation' | 'full-workflow';
  tier: 'free' | 'startup' | 'professional' | 'enterprise';
  prompt: string;
  context?: {
    framework?: 'react' | 'vue' | 'angular';
    deployment?: boolean;
    model_preference?: string;
    optimization_level?: 'basic' | 'advanced' | 'custom';
  };
  user: {
    id: string;
    tier: string;
    usage_limits: Record<string, number>;
  };
}

interface ServiceEndpoints {
  huggingface: string;
  promptlayer: string;
  lovable: string;
  zuplo_gateway: string;
}

export class UnifiedAIOrchestrator {
  private endpoints: ServiceEndpoints;
  private apiKeys: Record<string, string>;

  constructor() {
    this.endpoints = {
      huggingface: process.env.ZUPLO_HF_ENDPOINT || 'https://hyperdag-hf.zuplo.app',
      promptlayer: process.env.ZUPLO_PROMPT_ENDPOINT || 'https://hyperdag-prompts.zuplo.app', 
      lovable: process.env.ZUPLO_LOVABLE_ENDPOINT || 'https://hyperdag-lovable.zuplo.app',
      zuplo_gateway: process.env.ZUPLO_GATEWAY_URL || 'https://hyperdag-ai.zuplo.app'
    };

    this.apiKeys = {
      huggingface: process.env.HUGGINGFACE_API_KEY || '',
      promptlayer: process.env.PROMPTLAYER_API_KEY || '',
      lovable: process.env.LOVABLE_API_KEY || '',
      hyperdag: process.env.HYPERDAG_API_KEY || ''
    };
  }

  /**
   * Main orchestration method - routes requests through the unified ecosystem
   */
  async processUnifiedRequest(request: UnifiedRequest): Promise<any> {
    try {
      console.log(`[Unified AI] Processing ${request.type} request for ${request.tier} tier`);

      // Check user limits and permissions
      await this.validateUserLimits(request.user, request.type);

      switch (request.type) {
        case 'inference':
          return await this.handleInferenceRequest(request);
        
        case 'prompt-optimization':
          return await this.handlePromptOptimization(request);
        
        case 'code-generation': 
          return await this.handleCodeGeneration(request);
        
        case 'full-workflow':
          return await this.handleFullWorkflow(request);
        
        default:
          throw new Error(`Unsupported request type: ${request.type}`);
      }
    } catch (error) {
      console.error('[Unified AI] Processing error:', error);
      throw error;
    }
  }

  /**
   * Handle AI inference requests through optimized HuggingFace routing
   */
  private async handleInferenceRequest(request: UnifiedRequest): Promise<any> {
    const { prompt, context, tier } = request;

    // Route through Zuplo for HuggingFace optimization
    const response = await fetch(`${this.endpoints.huggingface}/v1/inference`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKeys.hyperdag}`,
        'Content-Type': 'application/json',
        'X-User-Tier': tier,
        'X-Priority': this.getTierPriority(tier)
      },
      body: JSON.stringify({
        inputs: prompt,
        model: context?.model_preference || 'auto',
        parameters: {
          max_length: this.getTierMaxLength(tier),
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HuggingFace inference failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Track usage for billing
    await this.trackUsage(request.user.id, 'inference', result);
    
    return {
      service: 'huggingface',
      response: result,
      metadata: {
        model_used: result.model || 'auto-selected',
        cost_optimization: result.cost_savings || '0%',
        cache_hit: response.headers.get('X-Cache') === 'HIT'
      }
    };
  }

  /**
   * Handle prompt optimization through AI-Prompt-Manager integration
   */
  private async handlePromptOptimization(request: UnifiedRequest): Promise<any> {
    const { prompt, tier } = request;

    // Only optimize for paid tiers
    if (tier === 'free') {
      return {
        service: 'prompt-manager',
        response: { optimized_prompt: prompt },
        metadata: { optimization_applied: false, reason: 'free_tier_limitation' }
      };
    }

    // Route through PromptLayer for optimization
    const response = await fetch(`${this.endpoints.promptlayer}/v1/prompts/optimize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKeys.promptlayer}`,
        'Content-Type': 'application/json',
        'X-User-Tier': tier
      },
      body: JSON.stringify({
        prompt: prompt,
        optimization_level: request.context?.optimization_level || 'basic',
        target_model: request.context?.model_preference || 'gpt-4',
        use_case: 'general'
      })
    });

    if (!response.ok) {
      // Fallback to original prompt if optimization fails
      console.warn('[Prompt Optimization] Failed, using original prompt');
      return {
        service: 'prompt-manager',
        response: { optimized_prompt: prompt },
        metadata: { optimization_applied: false, reason: 'service_unavailable' }
      };
    }

    const result = await response.json();
    await this.trackUsage(request.user.id, 'prompt-optimization', result);

    return {
      service: 'prompt-manager',
      response: result,
      metadata: {
        optimization_applied: true,
        improvement_score: result.improvement_score || 0,
        version: result.version || '1.0'
      }
    };
  }

  /**
   * Handle code generation through Lovable.dev integration
   */
  private async handleCodeGeneration(request: UnifiedRequest): Promise<any> {
    const { prompt, context, tier } = request;

    // Check if user has code generation access
    if (tier === 'free') {
      throw new Error('Code generation requires paid subscription');
    }

    // Route through Lovable API
    const response = await fetch(`${this.endpoints.lovable}/v1/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKeys.lovable}`,
        'Content-Type': 'application/json',
        'X-User-Tier': tier
      },
      body: JSON.stringify({
        description: prompt,
        framework: context?.framework || 'react',
        deploy: context?.deployment || false,
        complexity: this.getTierComplexity(tier)
      })
    });

    if (!response.ok) {
      throw new Error(`Code generation failed: ${response.statusText}`);
    }

    const result = await response.json();
    await this.trackUsage(request.user.id, 'code-generation', result);

    return {
      service: 'lovable',
      response: result,
      metadata: {
        framework_used: result.framework || context?.framework,
        files_generated: result.files?.length || 0,
        deployment_url: result.deployment_url || null
      }
    };
  }

  /**
   * Handle full workflow: prompt optimization → AI inference → code generation
   */
  private async handleFullWorkflow(request: UnifiedRequest): Promise<any> {
    console.log('[Unified AI] Starting full workflow');

    // Step 1: Optimize prompt (if eligible)
    const promptResult = await this.handlePromptOptimization(request);
    const optimizedPrompt = promptResult.response.optimized_prompt || request.prompt;

    // Step 2: Generate AI response with optimized prompt
    const inferenceRequest = {
      ...request,
      prompt: optimizedPrompt,
      type: 'inference' as const
    };
    const aiResult = await this.handleInferenceRequest(inferenceRequest);

    // Step 3: Generate code if AI response suggests implementation
    let codeResult = null;
    if (this.shouldGenerateCode(aiResult.response) && request.tier !== 'free') {
      try {
        const codeRequest = {
          ...request,
          prompt: aiResult.response.generated_text || aiResult.response[0]?.generated_text,
          type: 'code-generation' as const
        };
        codeResult = await this.handleCodeGeneration(codeRequest);
      } catch (error) {
        console.warn('[Full Workflow] Code generation failed:', error);
        // Continue without code generation
      }
    }

    // Combine results
    const workflowResult = {
      workflow_id: this.generateWorkflowId(),
      steps: {
        prompt_optimization: promptResult,
        ai_inference: aiResult,
        code_generation: codeResult
      },
      metadata: {
        total_cost: this.calculateWorkflowCost([promptResult, aiResult, codeResult]),
        processing_time: Date.now(),
        tier: request.tier
      }
    };

    await this.trackUsage(request.user.id, 'full-workflow', workflowResult);
    return workflowResult;
  }

  /**
   * Utility methods
   */
  private async validateUserLimits(user: any, requestType: string): Promise<void> {
    // Check monthly usage limits based on tier
    const currentUsage = await this.getCurrentUsage(user.id, requestType);
    const limit = user.usage_limits[requestType] || 0;

    if (limit > 0 && currentUsage >= limit) {
      throw new Error(`Monthly limit exceeded for ${requestType}. Upgrade your plan for more usage.`);
    }
  }

  private getTierPriority(tier: string): string {
    const priorities = {
      free: 'low',
      startup: 'normal', 
      professional: 'high',
      enterprise: 'critical'
    };
    return priorities[tier as keyof typeof priorities] || 'normal';
  }

  private getTierMaxLength(tier: string): number {
    const lengths = {
      free: 512,
      startup: 2048,
      professional: 4096,
      enterprise: 8192
    };
    return lengths[tier as keyof typeof lengths] || 512;
  }

  private getTierComplexity(tier: string): string {
    const complexity = {
      free: 'simple',
      startup: 'moderate',
      professional: 'advanced',
      enterprise: 'complex'
    };
    return complexity[tier as keyof typeof complexity] || 'simple';
  }

  private shouldGenerateCode(aiResponse: any): boolean {
    // Check if AI response suggests code implementation
    const text = aiResponse.generated_text || aiResponse[0]?.generated_text || '';
    const codeKeywords = ['implement', 'create', 'build', 'develop', 'code', 'function', 'class', 'component'];
    
    return codeKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateWorkflowCost(results: any[]): number {
    // Calculate total cost across all services
    return results.reduce((total, result) => {
      if (!result) return total;
      return total + (result.metadata?.cost || 0);
    }, 0);
  }

  private async getCurrentUsage(userId: string, requestType: string): Promise<number> {
    // In production, query usage database
    // For now, return mock data
    return 0;
  }

  private async trackUsage(userId: string, serviceType: string, result: any): Promise<void> {
    // Track usage for billing and analytics
    const usage = {
      user_id: userId,
      service_type: serviceType,
      timestamp: new Date(),
      cost: result.metadata?.cost || 0,
      tokens: result.metadata?.tokens || 0,
      success: true
    };

    console.log('[Usage Tracking]', usage);
    // In production, save to analytics database
  }
}

// Export singleton instance
export const unifiedOrchestrator = new UnifiedAIOrchestrator();