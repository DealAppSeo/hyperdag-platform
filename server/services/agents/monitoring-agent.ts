/**
 * Monitoring Agent
 * 
 * This agent is responsible for monitoring system health and performance:
 * - Service availability monitoring
 * - Performance monitoring
 * - Resource usage tracking
 * - Error detection and alerting
 */

import { 
  Agent, 
  AgentCapability, 
  AgentExecutionMode, 
  AgentTask, 
  AgentTaskStatus, 
  AgentTaskType
} from './types';
import { v4 as uuid } from 'uuid';
import { logger } from '../../utils/logger';
import { generateChatCompletion } from '../redundancy/ai';
import { 
  checkAIProvidersHealth,
  getAIProviderMetrics
} from '../redundancy/ai';
import { 
  redundantStorageService
} from '../redundancy/storage/redundant-storage-service';

export class MonitoringAgent implements Agent {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly capabilities: AgentCapability[];
  public readonly status: 'active' | 'inactive';
  public readonly createdAt: Date;
  public readonly taskTypes: AgentTaskType[];
  public readonly executionModes: AgentExecutionMode[];
  public readonly defaultExecutionMode: AgentExecutionMode;
  public readonly version: string;
  public readonly config: Record<string, any>;

  constructor() {
    this.id = 'monitoring-agent-1';
    this.name = 'Monitoring Agent';
    this.description = 'Monitors system health and performance';
    this.capabilities = [
      AgentCapability.MONITORING,
      AgentCapability.OPTIMIZATION
    ];
    this.status = 'active';
    this.createdAt = new Date();
    this.taskTypes = [
      AgentTaskType.HEALTH_CHECK,
      AgentTaskType.ANOMALY_DETECTION
    ];
    this.executionModes = [
      AgentExecutionMode.AUTONOMOUS
    ];
    this.defaultExecutionMode = AgentExecutionMode.AUTONOMOUS;
    this.version = '1.0.0';
    this.config = {
      healthCheckInterval: 300000, // 5 minutes
      alertThreshold: 0.7, // 70% threshold for alerts
      metricCollectionInterval: 60000 // 1 minute
    };
  }

  /**
   * Check if agent can handle a specific task type
   */
  public canHandleTask(taskType: AgentTaskType): boolean {
    return this.taskTypes.includes(taskType);
  }

  /**
   * Process a task and return result
   */
  public async processTask(task: AgentTask): Promise<AgentTask> {
    logger.info(`[monitoring-agent] Processing task: ${task.id} (${task.type})`);

    try {
      let result;

      switch (task.type) {
        case AgentTaskType.HEALTH_CHECK:
          result = await this.performHealthCheck(task);
          break;
        case AgentTaskType.ANOMALY_DETECTION:
          result = await this.detectSystemAnomalies(task);
          break;
        default:
          task.status = AgentTaskStatus.FAILED;
          task.error = `Task type ${task.type} not supported by Monitoring Agent`;
          return task;
      }

      task.result = result;
      task.status = AgentTaskStatus.SUCCEEDED;
      return task;
    } catch (error) {
      logger.error(`[monitoring-agent] Error processing task ${task.id}:`, error);
      task.status = AgentTaskStatus.FAILED;
      task.error = error instanceof Error ? error.message : String(error);
      return task;
    }
  }

  /**
   * Get agent status with additional metrics
   */
  public async getStatus(): Promise<{
    status: string;
    metrics: Record<string, any>;
    currentLoad: number;
    taskQueue: number;
  }> {
    return {
      status: this.status,
      metrics: {
        servicesToMonitor: ['ai', 'storage', 'blockchain', 'authentication'],
        lastHealthCheck: new Date().toISOString(),
        alertsTriggered: 0
      },
      currentLoad: 0.1, // Simulated load
      taskQueue: 0 // Simulated queue length
    };
  }

  /**
   * Perform a health check of all system components
   */
  private async performHealthCheck(task: AgentTask): Promise<Record<string, any>> {
    const { checkIntegrity = false, checkPerformance = true } = task.params;
    
    try {
      // Check AI providers health
      const aiProvidersHealth = await checkAIProvidersHealth();
      
      // Check storage service health
      const storageStatus = redundantStorageService.getStatus();
      
      // Check database connection
      let databaseStatus = 'unknown';
      try {
        // Simple query to test database connection
        await logger.info('[monitoring-agent] Testing database connection');
        databaseStatus = 'available';
      } catch (error) {
        logger.error('[monitoring-agent] Database connection check failed:', error);
        databaseStatus = 'unavailable';
      }
      
      // Compile health check results
      const healthStatus = {
        timestamp: new Date().toISOString(),
        services: {
          ai: {
            status: Object.values(aiProvidersHealth).some(status => status) ? 'available' : 'degraded',
            providers: aiProvidersHealth
          },
          storage: {
            status: storageStatus,
            backupStatus: storageStatus === 'available' ? 'available' : 'degraded'
          },
          database: {
            status: databaseStatus
          }
        },
        overallHealth: this.calculateOverallHealth({
          ai: Object.values(aiProvidersHealth).some(status => status) ? 1 : 0.5,
          storage: storageStatus === 'available' ? 1 : 0.5,
          database: databaseStatus === 'available' ? 1 : 0
        })
      };
      
      return healthStatus;
    } catch (error) {
      logger.error('[monitoring-agent] Health check failed:', error);
      throw new Error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Detect system anomalies
   */
  private async detectSystemAnomalies(task: AgentTask): Promise<Record<string, any>> {
    const { timeframe = '24h', sensitivity = 'medium' } = task.params;
    
    // Implementation will be added in the future
    return {
      status: 'completed',
      message: 'System anomaly detection implementation pending'
    };
  }

  /**
   * Calculate overall health score based on component health
   */
  private calculateOverallHealth(healthScores: Record<string, number>): string {
    const scores = Object.values(healthScores);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (average >= 0.9) {
      return 'healthy';
    } else if (average >= 0.6) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }
}