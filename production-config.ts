/**
 * Production Configuration for HyperDAG MVP
 * Critical production settings and environment validation
 */

export interface ProductionConfig {
  database: {
    url: string;
    maxConnections: number;
    connectionTimeout: number;
    ssl: boolean;
  };
  security: {
    jwtSecret: string;
    sessionSecret: string;
    corsOrigins: string[];
    rateLimitWindow: number;
    rateLimitRequests: number;
  };
  authentication: {
    bcryptRounds: number;
    sessionDuration: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  external: {
    mailgun: {
      apiKey: string;
      domain: string;
      baseUrl: string;
    };
    telegram: {
      botToken: string;
      webhookUrl: string;
    };
    ai: {
      openaiKey: string;
      anthropicKey: string;
      cohereKey: string;
      huggingfaceKey: string;
    };
  };
  blockchain: {
    alchemyKey: string;
    networks: {
      mainnet: string;
      sepolia: string;
      polygon: string;
    };
  };
}

export class ProductionValidator {
  private static requiredEnvVars = [
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'ALCHEMY_API_KEY'
  ];

  static validateEnvironment(): { isValid: boolean; missing: string[]; warnings: string[] } {
    const missing: string[] = [];
    const warnings: string[] = [];

    // Check required environment variables
    this.requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    });

    // Check optional but recommended variables
    const optionalVars = ['MAILGUN_API_KEY', 'MAILGUN_DOMAIN', 'TELEGRAM_BOT_TOKEN', 'COHERE_API_KEY', 'HUGGINGFACE_API_KEY'];
    optionalVars.forEach(envVar => {
      if (!process.env[envVar]) {
        warnings.push(`Optional: ${envVar} not configured`);
      }
    });

    // Validate database URL format
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
      warnings.push('DATABASE_URL should use postgresql:// protocol for production');
    }

    return {
      isValid: missing.length === 0,
      missing,
      warnings
    };
  }

  static getProductionConfig(): ProductionConfig {
    const validation = this.validateEnvironment();
    
    if (!validation.isValid) {
      console.warn(`Missing recommended environment variables: ${validation.missing.join(', ')}`);
    }

    return {
      database: {
        url: process.env.DATABASE_URL!,
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
        connectionTimeout: parseInt(process.env.DB_TIMEOUT || '30000'),
        ssl: process.env.NODE_ENV === 'production'
      },
      security: {
        jwtSecret: process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
        sessionSecret: process.env.SESSION_SECRET || 'default-session-secret-change-in-production',
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'https://hyperdag.org'],
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
        rateLimitRequests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100')
      },
      authentication: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
        sessionDuration: parseInt(process.env.SESSION_DURATION || '86400000'), // 24 hours
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000') // 15 minutes
      },
      external: {
        mailgun: {
          apiKey: process.env.MAILGUN_API_KEY || '',
          domain: process.env.MAILGUN_DOMAIN || 'sandbox.mailgun.org',
          baseUrl: process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net'
        },
        telegram: {
          botToken: process.env.TELEGRAM_BOT_TOKEN || '',
          webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || ''
        },
        ai: {
          openaiKey: process.env.OPENAI_API_KEY || '',
          anthropicKey: process.env.ANTHROPIC_API_KEY || '',
          cohereKey: process.env.COHERE_API_KEY || '',
          huggingfaceKey: process.env.HUGGINGFACE_API_KEY || ''
        }
      },
      blockchain: {
        alchemyKey: process.env.ALCHEMY_API_KEY || '',
        networks: {
          mainnet: process.env.MAINNET_RPC || 'https://eth-mainnet.g.alchemy.com/v2/',
          sepolia: process.env.SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/',
          polygon: process.env.POLYGON_RPC || 'https://polygon-mainnet.g.alchemy.com/v2/'
        }
      }
    };
  }
}

// Production readiness checker
export class ProductionReadiness {
  static async checkSystemHealth(): Promise<{
    database: boolean;
    ai: boolean;
    blockchain: boolean;
    external: boolean;
    overall: boolean;
  }> {
    const results = {
      database: false,
      ai: false,
      blockchain: false,
      external: false,
      overall: false
    };

    try {
      // Check database connectivity
      if (process.env.DATABASE_URL) {
        results.database = true;
      }

      // Check AI services
      if (process.env.OPENAI_API_KEY && process.env.ANTHROPIC_API_KEY) {
        results.ai = true;
      }

      // Check blockchain services
      if (process.env.ALCHEMY_API_KEY) {
        results.blockchain = true;
      }

      // Check external services
      if (process.env.MAILGUN_API_KEY || process.env.TELEGRAM_BOT_TOKEN) {
        results.external = true;
      }

      results.overall = results.database && results.ai && results.blockchain;
    } catch (error) {
      console.error('Health check failed:', error);
    }

    return results;
  }

  static getDeploymentReadiness(): {
    ready: boolean;
    blockers: string[];
    recommendations: string[];
  } {
    const validation = ProductionValidator.validateEnvironment();
    const blockers: string[] = [];
    const recommendations: string[] = [];

    // Critical blockers
    if (!process.env.DATABASE_URL) {
      blockers.push('DATABASE_URL required for production database');
    }

    if (!process.env.OPENAI_API_KEY) {
      blockers.push('OPENAI_API_KEY required for AI functionality');
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      blockers.push('ANTHROPIC_API_KEY required for AI functionality');
    }

    // Recommendations
    if (!process.env.MAILGUN_API_KEY) {
      recommendations.push('Configure MAILGUN_API_KEY for email notifications');
    }

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      recommendations.push('Configure TELEGRAM_BOT_TOKEN for Telegram authentication');
    }

    if (!process.env.COHERE_API_KEY) {
      recommendations.push('Configure COHERE_API_KEY for enhanced AI capabilities');
    }

    return {
      ready: blockers.length === 0,
      blockers,
      recommendations
    };
  }
}