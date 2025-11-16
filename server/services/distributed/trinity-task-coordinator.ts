/**
 * Trinity Task Coordinator
 * 
 * Distributes tasks across the three Trinity deployments:
 * - HyperDAG: Workflow orchestration & parallel processing
 * - PurposeHub: AI routing & prompt optimization  
 * - ImageBearerAI: Creative AI & neuromorphic learning
 * 
 * Achieves zero-cost operation through intelligent free-tier rotation
 */

import type {
  TrinityMessage,
  TrinityDeployment,
  TaskAssignmentPayload,
  TaskResultPayload,
  LearningUpdatePayload,
} from './trinity-message-protocol';
import { createTrinityMessage } from './trinity-message-protocol';
import { getTrinityMessageQueue } from './trinity-message-queue';

export interface TaskDistributionStrategy {
  taskType: string;
  preferredDeployment: TrinityDeployment;
  fallbackDeployments: TrinityDeployment[];
  reason: string;
}

export interface TaskExecutionResult {
  taskId: string;
  success: boolean;
  executedBy: TrinityDeployment;
  result?: any;
  error?: string;
  metrics: {
    latency: number;
    cost: number;
    quality?: number;
  };
}

export class TrinityTaskCoordinator {
  private messageQueue = getTrinityMessageQueue();
  private pendingTasks: Map<string, {
    resolve: (result: TaskExecutionResult) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();

  private taskDistributionStrategies: TaskDistributionStrategy[] = [
    {
      taskType: 'workflow_execution',
      preferredDeployment: 'HyperDAG',
      fallbackDeployments: ['PurposeHub'],
      reason: 'HyperDAG specializes in DAG-based parallel workflow execution',
    },
    {
      taskType: 'ai_inference',
      preferredDeployment: 'PurposeHub',
      fallbackDeployments: ['HyperDAG', 'ImageBearerAI'],
      reason: 'PurposeHub has ANFIS routing for optimal AI provider selection',
    },
    {
      taskType: 'prompt_optimization',
      preferredDeployment: 'PurposeHub',
      fallbackDeployments: ['ImageBearerAI'],
      reason: 'PurposeHub runs AI-Prompt-Manager service',
    },
    {
      taskType: 'image_generation',
      preferredDeployment: 'ImageBearerAI',
      fallbackDeployments: ['PurposeHub'],
      reason: 'ImageBearerAI specializes in creative visual AI',
    },
    {
      taskType: 'neuromorphic_processing',
      preferredDeployment: 'ImageBearerAI',
      fallbackDeployments: ['HyperDAG'],
      reason: 'ImageBearerAI runs SynapticFlow-Manager',
    },
    {
      taskType: 'optimization',
      preferredDeployment: 'PurposeHub',
      fallbackDeployments: ['HyperDAG', 'ImageBearerAI'],
      reason: 'PurposeHub has optimization algorithms and ANFIS tuning',
    },
    {
      taskType: 'storage',
      preferredDeployment: 'HyperDAG',
      fallbackDeployments: ['PurposeHub'],
      reason: 'HyperDAG manages 4-layer storage arbitrage system',
    },
  ];

  constructor() {
    this.setupMessageHandlers();
  }

  /**
   * Initialize task coordinator and register message handlers
   */
  async initialize(): Promise<void> {
    await this.messageQueue.initialize();
    console.log('[Trinity TaskCoordinator] ✅ Initialized distributed task routing');
  }

  /**
   * Set up handlers for task-related messages
   */
  private setupMessageHandlers(): void {
    // Handle incoming task assignments
    this.messageQueue.onMessage('task_assignment', async (message: TrinityMessage) => {
      const payload = message.payload as TaskAssignmentPayload;
      console.log(`[Trinity TaskCoordinator] 📋 Received task assignment: ${payload.taskId}`);
      
      // Execute task locally
      const result = await this.executeTaskLocally(payload);
      
      // Send result back to requester
      const resultMessage = createTrinityMessage(
        this.messageQueue.getStatus().deployment,
        message.from,
        'task_result',
        result,
        { priority: message.priority }
      );
      
      await this.messageQueue.sendMessage(resultMessage);
    });

    // Handle task results
    this.messageQueue.onMessage('task_result', (message: TrinityMessage) => {
      const payload = message.payload as TaskResultPayload;
      console.log(`[Trinity TaskCoordinator] ✅ Received task result: ${payload.taskId}`);
      
      const pending = this.pendingTasks.get(payload.taskId);
      if (pending) {
        clearTimeout(pending.timeout);
        
        if (payload.success) {
          pending.resolve({
            taskId: payload.taskId,
            success: true,
            executedBy: message.from,
            result: payload.result,
            metrics: payload.metrics,
          });
        } else {
          pending.reject(new Error(payload.error || 'Task execution failed'));
        }
        
        this.pendingTasks.delete(payload.taskId);
      }
    });

    // Handle learning updates
    this.messageQueue.onMessage('learning_update', async (message: TrinityMessage) => {
      const payload = message.payload as LearningUpdatePayload;
      console.log(`[Trinity TaskCoordinator] 🧠 Received learning update: ${payload.category} from ${message.from}`);
      
      // Apply learning locally (integrate with existing optimization systems)
      await this.applyLearningUpdate(payload);
    });
  }

  /**
   * Distribute a task to the optimal deployment
   */
  async distributeTask(
    taskType: string,
    input: any,
    options?: {
      maxLatency?: number;
      costConstraint?: 'zero' | 'minimal';
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      timeout?: number;
    }
  ): Promise<TaskExecutionResult> {
    const strategy = this.getDistributionStrategy(taskType);
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[Trinity TaskCoordinator] 🎯 Distributing ${taskType} to ${strategy.preferredDeployment}`);
    
    // Create task assignment
    const taskPayload: TaskAssignmentPayload = {
      taskId,
      taskType: taskType as any,
      description: `Execute ${taskType} task`,
      input,
      requirements: {
        maxLatency: options?.maxLatency,
        costConstraint: options?.costConstraint || 'zero',
      },
    };

    // Send to preferred deployment
    const message = createTrinityMessage(
      this.messageQueue.getStatus().deployment,
      strategy.preferredDeployment,
      'task_assignment',
      taskPayload,
      {
        priority: options?.priority || 'normal',
        requiresAck: true,
        ttl: options?.timeout || 30000,
      }
    );

    // Create promise that resolves when result arrives
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingTasks.delete(taskId);
        reject(new Error(`Task ${taskId} timed out after ${options?.timeout || 30000}ms`));
      }, options?.timeout || 30000);

      this.pendingTasks.set(taskId, { resolve, reject, timeout });

      this.messageQueue.sendMessage(message).catch(error => {
        clearTimeout(timeout);
        this.pendingTasks.delete(taskId);
        reject(error);
      });
    });
  }

  /**
   * Execute a task locally (when this deployment receives a task assignment)
   */
  private async executeTaskLocally(task: TaskAssignmentPayload): Promise<TaskResultPayload> {
    const startTime = Date.now();
    
    try {
      // Route to appropriate local service based on task type
      let result: any;
      let provider: string | undefined;
      
      switch (task.taskType) {
        case 'ai_inference':
          // Route through ANFIS (if PurposeHub) or other AI service
          result = await this.executeAIInference(task.input);
          provider = result.provider;
          break;
          
        case 'workflow_execution':
          // Route through HyperDAGManager (if HyperDAG)
          result = await this.executeWorkflow(task.input);
          break;
          
        case 'image_generation':
          // Route through ImageBearerAI service
          result = await this.executeImageGeneration(task.input);
          provider = result.provider;
          break;
          
        case 'optimization':
          // Run optimization algorithms
          result = await this.executeOptimization(task.input);
          break;
          
        default:
          throw new Error(`Unknown task type: ${task.taskType}`);
      }

      const latency = Date.now() - startTime;

      return {
        taskId: task.taskId,
        success: true,
        result,
        metrics: {
          latency,
          cost: 0, // Zero cost from free-tier rotation
          provider,
          quality: 0.85,
        },
        learningData: {
          providerPerformance: { provider, latency, success: true },
          optimizationInsights: {},
        },
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        taskId: task.taskId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          latency,
          cost: 0,
        },
      };
    }
  }

  /**
   * Execute AI inference task
   */
  private async executeAIInference(input: any): Promise<any> {
    // TODO: Integrate with actual AI services (ANFIS router, etc.)
    console.log('[Trinity TaskCoordinator] Executing AI inference locally');
    return {
      success: true,
      provider: 'groq', // Example
      result: 'AI inference result',
    };
  }

  /**
   * Execute workflow task
   */
  private async executeWorkflow(input: any): Promise<any> {
    // TODO: Integrate with HyperDAGManager
    console.log('[Trinity TaskCoordinator] Executing workflow locally');
    return {
      success: true,
      result: 'Workflow execution result',
    };
  }

  /**
   * Execute image generation task
   */
  private async executeImageGeneration(input: any): Promise<any> {
    // TODO: Integrate with ImageBearerAI services
    console.log('[Trinity TaskCoordinator] Executing image generation locally');
    return {
      success: true,
      provider: 'huggingface-diffusion',
      result: 'Image generation result',
    };
  }

  /**
   * Execute optimization task
   */
  private async executeOptimization(input: any): Promise<any> {
    // TODO: Integrate with optimization services
    console.log('[Trinity TaskCoordinator] Executing optimization locally');
    return {
      success: true,
      result: 'Optimization result',
    };
  }

  /**
   * Get distribution strategy for a task type
   */
  private getDistributionStrategy(taskType: string): TaskDistributionStrategy {
    const strategy = this.taskDistributionStrategies.find(s => s.taskType === taskType);
    
    if (!strategy) {
      // Default: route to PurposeHub for general AI tasks
      return {
        taskType,
        preferredDeployment: 'PurposeHub',
        fallbackDeployments: ['HyperDAG', 'ImageBearerAI'],
        reason: 'Default routing to PurposeHub',
      };
    }
    
    return strategy;
  }

  /**
   * Apply learning updates from other deployments
   */
  private async applyLearningUpdate(learning: LearningUpdatePayload): Promise<void> {
    console.log(`[Trinity TaskCoordinator] 📚 Applying ${learning.category} learning update`);
    
    // TODO: Integrate with local optimization systems:
    // - Update ANFIS weights
    // - Adjust provider routing
    // - Update RepID scores
    // - Modify membership functions
    
    // For now, just log the learning
    if (learning.anfisWeights) {
      console.log('[Trinity TaskCoordinator] ANFIS weights update:', learning.anfisWeights);
    }
  }

  /**
   * Share learning with other deployments
   */
  async shareLearning(
    category: LearningUpdatePayload['category'],
    insights: LearningUpdatePayload['insights'],
    confidence: number
  ): Promise<void> {
    const learningPayload: LearningUpdatePayload = {
      learningId: `learning-${Date.now()}`,
      category,
      insights,
      confidence,
    };

    await this.messageQueue.broadcast('learning_update', learningPayload, 'normal');
    console.log(`[Trinity TaskCoordinator] 📡 Shared ${category} learning with network`);
  }

  /**
   * Get coordinator status
   */
  getStatus() {
    return {
      messageQueue: this.messageQueue.getStatus(),
      pendingTasks: this.pendingTasks.size,
      distributionStrategies: this.taskDistributionStrategies.length,
    };
  }
}

// Singleton instance
let coordinatorInstance: TrinityTaskCoordinator | null = null;

export function getTrinityTaskCoordinator(): TrinityTaskCoordinator {
  if (!coordinatorInstance) {
    coordinatorInstance = new TrinityTaskCoordinator();
  }
  return coordinatorInstance;
}
