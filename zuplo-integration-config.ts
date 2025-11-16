/**
 * Zuplo API Gateway Configuration
 * Complete setup for unified AI ecosystem routing
 */

export interface ZuploConfig {
  gateway_url: string;
  api_key: string;
  environment: 'development' | 'staging' | 'production';
  routes: ZuploRoute[];
  policies: ZuploPolicy[];
  handlers: ZuploHandler[];
}

export interface ZuploRoute {
  path: string;
  methods: string[];
  summary: string;
  handler: string;
  policies: {
    inbound: string[];
    outbound?: string[];
  };
  cors?: {
    allowCredentials: boolean;
    allowedHeaders: string[];
    allowedMethods: string[];
    allowedOrigins: string[];
  };
}

export interface ZuploPolicy {
  name: string;
  module: string;
  options?: Record<string, any>;
}

export interface ZuploHandler {
  name: string;
  module: string;
  description: string;
}

/**
 * Complete Zuplo configuration for HyperDAG Unified AI Ecosystem
 */
export const ZUPLO_CONFIG: ZuploConfig = {
  gateway_url: process.env.ZUPLO_GATEWAY_URL || 'https://hyperdag-ai.zuplo.app',
  api_key: process.env.ZUPLO_API_KEY || '',
  environment: (process.env.NODE_ENV as any) || 'development',

  routes: [
    // OpenAI-Compatible Chat Completions
    {
      path: '/v1/chat/completions',
      methods: ['POST'],
      summary: 'OpenAI-compatible chat completions with cost optimization',
      handler: 'chat-completions-handler',
      policies: {
        inbound: [
          'customer-authentication',
          'tier-rate-limiting',
          'request-validation',
          'usage-tracking',
          'cost-optimization'
        ],
        outbound: [
          'response-caching',
          'billing-tracker',
          'analytics-logger'
        ]
      },
      cors: {
        allowCredentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        allowedMethods: ['POST', 'OPTIONS'],
        allowedOrigins: ['*']
      }
    },

    // Prompt Optimization Service
    {
      path: '/v1/prompts/optimize',
      methods: ['POST'],
      summary: 'AI prompt optimization via PromptLayer integration',
      handler: 'prompt-optimization-handler',
      policies: {
        inbound: [
          'customer-authentication',
          'subscription-check',
          'prompt-analytics',
          'version-control'
        ],
        outbound: ['analytics-logger']
      }
    },

    // Code Generation Service
    {
      path: '/v1/generate/code',
      methods: ['POST'],
      summary: 'AI code generation via Lovable.dev integration',
      handler: 'code-generation-handler',
      policies: {
        inbound: [
          'customer-authentication',
          'premium-feature-check',
          'project-management',
          'github-integration'
        ],
        outbound: ['deployment-tracker']
      }
    },

    // Full Workflow Orchestration
    {
      path: '/v1/workflow/full',
      methods: ['POST'],
      summary: 'Complete AI development workflow: prompt → AI → code',
      handler: 'full-workflow-handler',
      policies: {
        inbound: [
          'customer-authentication',
          'workflow-orchestration',
          'comprehensive-analytics',
          'resource-allocation'
        ],
        outbound: ['workflow-tracker']
      }
    },

    // HuggingFace Direct Integration
    {
      path: '/v1/huggingface/{api_type}',
      methods: ['POST'],
      summary: 'Direct HuggingFace API access (inference/endpoints/providers)',
      handler: 'huggingface-handler',
      policies: {
        inbound: [
          'customer-authentication',
          'api-type-validation',
          'free-tier-optimization'
        ]
      }
    },

    // Service Status and Health
    {
      path: '/v1/status',
      methods: ['GET'],
      summary: 'Unified AI ecosystem status and health metrics',
      handler: 'status-handler',
      policies: {
        inbound: ['rate-limiting-light']
      }
    },

    // Customer Usage Analytics
    {
      path: '/v1/usage',
      methods: ['GET'],
      summary: 'Customer usage statistics and cost savings',
      handler: 'usage-analytics-handler',
      policies: {
        inbound: ['customer-authentication']
      }
    },

    // Real-time Cost Optimization
    {
      path: '/v1/optimize/cost',
      methods: ['POST'],
      summary: 'Real-time cost optimization recommendations',
      handler: 'cost-optimization-handler',
      policies: {
        inbound: [
          'customer-authentication',
          'usage-analysis',
          'recommendation-engine'
        ]
      }
    }
  ],

  policies: [
    // Authentication Policies
    {
      name: 'customer-authentication',
      module: '$import(./policies/customer-auth)',
      options: {
        api_key_header: 'X-API-Key',
        bearer_token_support: true,
        tier_detection: true,
        rate_limit_enforcement: true
      }
    },

    // Rate Limiting Policies
    {
      name: 'tier-rate-limiting',
      module: '$import(./policies/tier-rate-limiting)',
      options: {
        free_tier: { requests_per_minute: 10, burst: 5 },
        startup_tier: { requests_per_minute: 100, burst: 20 },
        professional_tier: { requests_per_minute: 1000, burst: 100 },
        enterprise_tier: { unlimited: true }
      }
    },

    {
      name: 'rate-limiting-light',
      module: '$import(./policies/rate-limiting)',
      options: {
        requests_per_minute: 100,
        burst: 20
      }
    },

    // Subscription and Feature Checks
    {
      name: 'subscription-check',
      module: '$import(./policies/subscription-check)',
      options: {
        required_tier: 'startup',
        feature: 'prompt_optimization',
        upgrade_url: '/pricing'
      }
    },

    {
      name: 'premium-feature-check',
      module: '$import(./policies/premium-features)',
      options: {
        required_tier: 'professional',
        feature: 'code_generation',
        upgrade_url: '/pricing'
      }
    },

    // Cost Optimization Policies
    {
      name: 'cost-optimization',
      module: '$import(./policies/cost-optimization)',
      options: {
        free_tier_priority: true,
        cache_aggressive: true,
        route_to_cheapest: true,
        savings_tracking: true
      }
    },

    {
      name: 'free-tier-optimization',
      module: '$import(./policies/free-tier-optimization)',
      options: {
        maximize_free_quota: true,
        quota_tracking: true,
        fallback_models: ['gpt2', 'distilbert-base-uncased']
      }
    },

    // Analytics and Tracking
    {
      name: 'usage-tracking',
      module: '$import(./policies/usage-tracking)',
      options: {
        track_tokens: true,
        track_cost: true,
        track_performance: true,
        billing_integration: true
      }
    },

    {
      name: 'analytics-logger',
      module: '$import(./policies/analytics-logger)',
      options: {
        log_requests: true,
        log_responses: false, // Privacy
        performance_metrics: true,
        cost_analysis: true
      }
    },

    // Workflow Management
    {
      name: 'workflow-orchestration',
      module: '$import(./policies/workflow-orchestration)',
      options: {
        max_workflow_time: 300000, // 5 minutes
        step_timeout: 30000, // 30 seconds
        error_recovery: true,
        progress_tracking: true
      }
    },

    // Caching Policies
    {
      name: 'response-caching',
      module: '$import(./policies/response-caching)',
      options: {
        ttl: 3600, // 1 hour
        cache_key_strategy: 'request_hash',
        vary_by_tier: true,
        cache_hit_tracking: true
      }
    },

    // Integration Policies
    {
      name: 'github-integration',
      module: '$import(./policies/github-integration)',
      options: {
        auto_sync: true,
        repository_creation: true,
        webhook_setup: true
      }
    },

    // Validation Policies
    {
      name: 'request-validation',
      module: '$import(./policies/request-validation)',
      options: {
        schema_validation: true,
        sanitization: true,
        max_request_size: '10mb'
      }
    },

    {
      name: 'api-type-validation',
      module: '$import(./policies/api-type-validation)',
      options: {
        allowed_types: ['inference', 'endpoints', 'providers'],
        route_validation: true
      }
    }
  ],

  handlers: [
    {
      name: 'chat-completions-handler',
      module: '$import(./handlers/chat-completions)',
      description: 'OpenAI-compatible chat completions with ANFIS routing'
    },

    {
      name: 'prompt-optimization-handler',
      module: '$import(./handlers/prompt-optimization)',
      description: 'PromptLayer integration for AI prompt optimization'
    },

    {
      name: 'code-generation-handler',
      module: '$import(./handlers/code-generation)',
      description: 'Lovable.dev integration for AI code generation'
    },

    {
      name: 'full-workflow-handler',
      module: '$import(./handlers/full-workflow)',
      description: 'Complete AI development pipeline orchestration'
    },

    {
      name: 'huggingface-handler',
      module: '$import(./handlers/huggingface)',
      description: 'HuggingFace API routing with cost optimization'
    },

    {
      name: 'status-handler',
      module: '$import(./handlers/status)',
      description: 'Service health and status monitoring'
    },

    {
      name: 'usage-analytics-handler',
      module: '$import(./handlers/usage-analytics)',
      description: 'Customer usage statistics and billing data'
    },

    {
      name: 'cost-optimization-handler',
      module: '$import(./handlers/cost-optimization)',
      description: 'Real-time cost optimization recommendations'
    }
  ]
};

/**
 * Environment-specific configurations
 */
export const ENVIRONMENT_CONFIGS = {
  development: {
    gateway_url: 'https://hyperdag-dev.zuplo.app',
    debug_logging: true,
    rate_limits_relaxed: true,
    mock_services: true
  },

  staging: {
    gateway_url: 'https://hyperdag-staging.zuplo.app',
    debug_logging: true,
    rate_limits_normal: true,
    mock_services: false
  },

  production: {
    gateway_url: 'https://hyperdag-ai.zuplo.app',
    debug_logging: false,
    rate_limits_strict: true,
    mock_services: false,
    monitoring_enhanced: true
  }
};

/**
 * Service Integration Configurations
 */
export const SERVICE_INTEGRATIONS = {
  huggingface: {
    api_types: {
      inference: {
        endpoint: 'https://api-inference.huggingface.co',
        free_tier: true,
        rate_limits: { free: 10, pro: 1000 }
      },
      endpoints: {
        endpoint: 'https://api.endpoints.huggingface.cloud',
        dedicated: true,
        cost_per_hour: { cpu: 0.032, gpu_basic: 0.50, gpu_premium: 2.50 }
      },
      providers: {
        endpoint: 'https://api-inference.huggingface.co/providers',
        multi_provider: true,
        passthrough_billing: true
      }
    }
  },

  promptlayer: {
    endpoint: 'https://api.promptlayer.com',
    pricing: { per_user_monthly: 50 },
    features: ['optimization', 'versioning', 'ab_testing', 'analytics']
  },

  lovable: {
    endpoint: 'https://api.lovable.dev',
    pricing: { pro: 25, business: 50, scale: 100 },
    features: ['code_generation', 'deployment', 'github_sync']
  }
};

/**
 * Customer Tier Configurations
 */
export const CUSTOMER_TIERS = {
  free: {
    name: 'Developer',
    monthly_requests: 1000,
    rate_limit_rpm: 10,
    features: ['basic_ai_inference', 'community_support'],
    pricing: 0,
    services: {
      huggingface: 'inference_free_only',
      promptlayer: 'basic_optimization',
      lovable: 'disabled'
    }
  },

  startup: {
    name: 'Startup',
    monthly_requests: 25000,
    rate_limit_rpm: 100,
    features: ['prompt_optimization', 'email_support', 'analytics'],
    pricing: 99,
    services: {
      huggingface: 'inference_and_endpoints',
      promptlayer: 'full_features',
      lovable: 'basic_generation'
    }
  },

  professional: {
    name: 'Professional',
    monthly_requests: 100000,
    rate_limit_rpm: 1000,
    features: ['code_generation', 'priority_support', 'custom_limits'],
    pricing: 299,
    services: {
      huggingface: 'all_api_types',
      promptlayer: 'advanced_features',
      lovable: 'full_features'
    }
  },

  enterprise: {
    name: 'Enterprise',
    monthly_requests: -1, // Unlimited
    rate_limit_rpm: -1,   // Unlimited
    features: ['white_label', 'dedicated_support', 'sla'],
    pricing: -1, // Custom
    services: {
      huggingface: 'dedicated_endpoints',
      promptlayer: 'enterprise',
      lovable: 'enterprise'
    }
  }
};

/**
 * API Response Templates
 */
export const RESPONSE_TEMPLATES = {
  success: {
    chat_completion: {
      id: 'chatcmpl-{id}',
      object: 'chat.completion',
      created: '{timestamp}',
      model: '{model}',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: '{content}'
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: '{prompt_tokens}',
        completion_tokens: '{completion_tokens}',
        total_tokens: '{total_tokens}'
      },
      hyperdag_metadata: {
        cost_optimization: '{savings_percentage}',
        cache_hit: '{cache_hit}',
        service_used: '{service}',
        routing_time_ms: '{routing_time}'
      }
    }
  },

  error: {
    authentication_failed: {
      error: {
        message: 'Invalid API key',
        type: 'authentication_error',
        code: 'invalid_api_key'
      }
    },
    rate_limit_exceeded: {
      error: {
        message: 'Rate limit exceeded',
        type: 'rate_limit_error',
        code: 'rate_limit_exceeded',
        retry_after: '{retry_after}'
      }
    },
    insufficient_quota: {
      error: {
        message: 'Insufficient quota',
        type: 'quota_error',
        code: 'insufficient_quota',
        upgrade_url: '/pricing'
      }
    }
  }
};

/**
 * Deployment Configuration
 */
export const DEPLOYMENT_CONFIG = {
  regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
  scaling: {
    min_instances: 2,
    max_instances: 100,
    target_cpu: 70,
    scale_up_cooldown: 300,
    scale_down_cooldown: 600
  },
  monitoring: {
    health_check_path: '/v1/status',
    health_check_interval: 30,
    unhealthy_threshold: 3,
    healthy_threshold: 2
  },
  security: {
    ssl_required: true,
    hsts_enabled: true,
    cors_enabled: true,
    rate_limiting: true
  }
};

/**
 * Generate complete Zuplo configuration file
 */
export function generateZuploConfig(environment: 'development' | 'staging' | 'production' = 'development'): string {
  const config = {
    ...ZUPLO_CONFIG,
    ...ENVIRONMENT_CONFIGS[environment]
  };

  return JSON.stringify({
    name: 'hyperdag-unified-ai-gateway',
    version: '1.0.0',
    description: 'HyperDAG Unified AI Development Ecosystem Gateway',
    
    environment: {
      HYPERDAG_API_KEY: '$env(HYPERDAG_API_KEY)',
      HUGGINGFACE_API_KEY: '$env(HUGGINGFACE_API_KEY)',
      PROMPTLAYER_API_KEY: '$env(PROMPTLAYER_API_KEY)',
      LOVABLE_API_KEY: '$env(LOVABLE_API_KEY)',
      STRIPE_SECRET_KEY: '$env(STRIPE_SECRET_KEY)',
      DEEPSEEK_AI_SYMPHONY: '$env(DEEPSEEK_AI_SYMPHONY)',
      MYNINJA_API_KEY: '$env(MYNINJA_API_KEY)',
      DATABASE_URL: '$env(DATABASE_URL)',
      REDIS_URL: '$env(REDIS_URL)'
    },

    routes: config.routes.map(route => ({
      path: route.path,
      methods: route.methods,
      summary: route.summary,
      handler: {
        export: 'default',
        module: `$import(./handlers/${route.handler.replace('-handler', '')})`
      },
      policies: {
        inbound: route.policies.inbound,
        ...(route.policies.outbound && { outbound: route.policies.outbound })
      },
      ...(route.cors && { cors: route.cors })
    })),

    policies: config.policies.reduce((acc, policy) => {
      acc[policy.name] = {
        export: 'default',
        module: policy.module,
        ...(policy.options && { options: policy.options })
      };
      return acc;
    }, {} as Record<string, any>)

  }, null, 2);
}

/**
 * Validate Zuplo configuration
 */
export function validateZuploConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.gateway_url) {
    errors.push('Gateway URL is required');
  }

  if (!config.routes || config.routes.length === 0) {
    errors.push('At least one route must be defined');
  }

  if (!config.handlers || config.handlers.length === 0) {
    errors.push('At least one handler must be defined');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Export default configuration
export default ZUPLO_CONFIG;