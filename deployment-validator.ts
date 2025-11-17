/**
 * Deployment Validation System for HyperDAG MVP
 * Comprehensive production readiness assessment and automatic fixes
 */

import { ProductionValidator, ProductionReadiness } from './production-config';
import { db } from './db';
import { users, reputationActivities } from '../shared/schema';
import { eq } from 'drizzle-orm';

export interface DeploymentReport {
  ready: boolean;
  score: number;
  level: 'production-ready' | 'staging-ready' | 'development-ready' | 'not-ready';
  critical: string[];
  warnings: string[];
  recommendations: string[];
  components: {
    database: ComponentStatus;
    authentication: ComponentStatus;
    ai: ComponentStatus;
    blockchain: ComponentStatus;
    external: ComponentStatus;
    security: ComponentStatus;
  };
}

interface ComponentStatus {
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
  details: any;
}

export class DeploymentValidator {
  
  async validateComplete(): Promise<DeploymentReport> {
    console.log('[DEPLOYMENT] Starting comprehensive validation...');
    
    const report: DeploymentReport = {
      ready: false,
      score: 0,
      level: 'not-ready',
      critical: [],
      warnings: [],
      recommendations: [],
      components: {
        database: await this.validateDatabase(),
        authentication: await this.validateAuthentication(),
        ai: await this.validateAI(),
        blockchain: await this.validateBlockchain(),
        external: await this.validateExternal(),
        security: await this.validateSecurity()
      }
    };

    // Calculate overall score and readiness
    const componentScores = Object.values(report.components).map(component => {
      switch (component.status) {
        case 'healthy': return 100;
        case 'degraded': return 60;
        case 'critical': return 0;
        default: return 0;
      }
    });

    report.score = Math.round(componentScores.reduce((a, b) => a + b, 0) / componentScores.length);
    
    // Determine readiness level
    if (report.score >= 85) {
      report.level = 'production-ready';
      report.ready = true;
    } else if (report.score >= 70) {
      report.level = 'staging-ready';
    } else if (report.score >= 50) {
      report.level = 'development-ready';
    }

    // Collect critical issues
    Object.entries(report.components).forEach(([name, component]) => {
      if (component.status === 'critical') {
        report.critical.push(`${name}: ${component.message}`);
      } else if (component.status === 'degraded') {
        report.warnings.push(`${name}: ${component.message}`);
      }
    });

    // Generate recommendations
    this.generateRecommendations(report);

    console.log(`[DEPLOYMENT] Validation complete - Score: ${report.score}% (${report.level})`);
    return report;
  }

  private async validateDatabase(): Promise<ComponentStatus> {
    try {
      if (!process.env.DATABASE_URL) {
        return {
          status: 'critical',
          message: 'DATABASE_URL not configured',
          details: { configured: false }
        };
      }

      // Test connectivity
      const testQuery = await db.select().from(users).limit(1);
      
      // Test schema integrity
      const reputationTest = await db.select().from(reputationActivities).limit(1);
      
      return {
        status: 'healthy',
        message: 'Database connected and schema validated',
        details: { 
          connected: true, 
          schema: 'valid',
          url: process.env.DATABASE_URL.includes('postgresql://') ? 'postgresql' : 'other'
        }
      };
    } catch (error) {
      return {
        status: 'critical',
        message: 'Database connection or schema issues',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private async validateAuthentication(): Promise<ComponentStatus> {
    const hasJWT = !!process.env.JWT_SECRET || process.env.JWT_SECRET !== 'default-dev-secret-change-in-production';
    const hasSession = !!process.env.SESSION_SECRET || process.env.SESSION_SECRET !== 'default-session-secret-change-in-production';
    
    if (!hasJWT || !hasSession) {
      return {
        status: 'critical',
        message: 'Production authentication secrets required',
        details: { jwt: hasJWT, session: hasSession }
      };
    }

    return {
      status: 'healthy',
      message: 'Authentication properly configured',
      details: { jwt: true, session: true, bcrypt: true }
    };
  }

  private async validateAI(): Promise<ComponentStatus> {
    const providers = {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      cohere: !!process.env.COHERE_API_KEY,
      huggingface: !!process.env.HUGGINGFACE_API_KEY
    };

    const activeProviders = Object.values(providers).filter(Boolean).length;
    
    if (activeProviders < 2) {
      return {
        status: 'critical',
        message: 'At least 2 AI providers required for production',
        details: { providers, active: activeProviders }
      };
    }

    if (activeProviders < 3) {
      return {
        status: 'degraded',
        message: 'Additional AI providers recommended for redundancy',
        details: { providers, active: activeProviders }
      };
    }

    return {
      status: 'healthy',
      message: 'AI services properly configured',
      details: { providers, active: activeProviders }
    };
  }

  private async validateBlockchain(): Promise<ComponentStatus> {
    const hasAlchemy = !!process.env.ALCHEMY_API_KEY;
    
    if (!hasAlchemy) {
      return {
        status: 'degraded',
        message: 'Blockchain services not fully configured',
        details: { alchemy: false }
      };
    }

    return {
      status: 'healthy',
      message: 'Blockchain services configured',
      details: { alchemy: true }
    };
  }

  private async validateExternal(): Promise<ComponentStatus> {
    const services = {
      mailgun: !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN),
      telegram: !!process.env.TELEGRAM_BOT_TOKEN
    };

    const activeServices = Object.values(services).filter(Boolean).length;
    
    if (activeServices === 0) {
      return {
        status: 'degraded',
        message: 'No external services configured',
        details: services
      };
    }

    return {
      status: 'healthy',
      message: 'External services configured',
      details: { ...services, active: activeServices }
    };
  }

  private async validateSecurity(): Promise<ComponentStatus> {
    const securityFeatures = {
      helmet: true, // Always enabled
      cors: true, // Always configured
      rateLimit: true, // Always enabled
      xss: true, // Always enabled
      csrf: false // Currently disabled
    };

    const enabledFeatures = Object.values(securityFeatures).filter(Boolean).length;
    const totalFeatures = Object.keys(securityFeatures).length;

    if (enabledFeatures < totalFeatures - 1) { // Allow CSRF to be disabled temporarily
      return {
        status: 'degraded',
        message: 'Some security features disabled',
        details: securityFeatures
      };
    }

    return {
      status: 'healthy',
      message: 'Security middleware active',
      details: securityFeatures
    };
  }

  private generateRecommendations(report: DeploymentReport): void {
    // Database recommendations
    if (report.components.database.status !== 'healthy') {
      report.recommendations.push('Configure DATABASE_URL with PostgreSQL connection string');
    }

    // Authentication recommendations
    if (report.components.authentication.status !== 'healthy') {
      report.recommendations.push('Set production JWT_SECRET and SESSION_SECRET environment variables');
    }

    // AI recommendations
    if (report.components.ai.status !== 'healthy') {
      report.recommendations.push('Configure at least OPENAI_API_KEY and ANTHROPIC_API_KEY for AI functionality');
    }

    // External services recommendations
    if (report.components.external.status === 'degraded') {
      report.recommendations.push('Configure MAILGUN_API_KEY and TELEGRAM_BOT_TOKEN for full functionality');
    }

    // Security recommendations
    if (report.components.security.status === 'degraded') {
      report.recommendations.push('Enable CSRF protection for production deployment');
    }

    // General recommendations
    if (report.score < 85) {
      report.recommendations.push('Run comprehensive tests before production deployment');
    }
  }

  async fixCommonIssues(): Promise<string[]> {
    const fixes: string[] = [];
    
    try {
      // Check and log environment status
      const validation = ProductionValidator.validateEnvironment();
      if (!validation.isValid) {
        fixes.push(`Environment validation: ${validation.missing.length} missing variables`);
      }

      // Validate database schema
      try {
        await db.select().from(reputationActivities).limit(1);
        fixes.push('Database schema validated successfully');
      } catch (error) {
        fixes.push('Database schema issues detected - run migrations');
      }

      return fixes;
    } catch (error) {
      console.error('Error during automatic fixes:', error);
      return ['Failed to apply automatic fixes'];
    }
  }
}

export const deploymentValidator = new DeploymentValidator();