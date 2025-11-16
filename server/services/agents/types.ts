/**
 * Agent System Types
 * 
 * This file defines the types and interfaces used by the AI agent system.
 */

export enum AgentCapability {
  TEXT_GENERATION = 'text_generation',
  DATA_ANALYSIS = 'data_analysis',
  DECISION_MAKING = 'decision_making',
  OPTIMIZATION = 'optimization',
  LEARNING = 'learning',
  MONITORING = 'monitoring'
}

export enum AgentTaskType {
  // Optimization tasks
  OPTIMIZE_TRAFFIC = 'optimize_traffic',
  ANALYZE_COSTS = 'analyze_costs',
  RESOURCE_ALLOCATION = 'resource_allocation',
  FINE_TUNE_ROUTING = 'fine_tune_routing',
  
  // Content tasks
  ANALYZE_FEEDBACK = 'analyze_feedback',
  GENERATE_CONTENT = 'generate_content',
  
  // Analytics tasks
  DATA_ANALYSIS = 'data_analysis',
  AUDIT_LOG_ANALYSIS = 'audit_log_analysis',
  ANOMALY_DETECTION = 'anomaly_detection',
  
  // Monitoring tasks
  HEALTH_CHECK = 'health_check'
}

export enum AgentTaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

export enum AgentTaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  BACKGROUND = 'background'
}

export enum AgentExecutionMode {
  AUTONOMOUS = 'autonomous', // Fully autonomous execution
  SEMI_AUTONOMOUS = 'semi_autonomous', // Generate proposal, wait for approval
  SUPERVISED = 'supervised', // Step-by-step supervision
  COLLABORATIVE = 'collaborative' // Back-and-forth workflow
}

export interface AgentTask {
  id: string;
  type: AgentTaskType;
  status: AgentTaskStatus;
  priority: AgentTaskPriority;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  deadline?: Date;
  description: string;
  params: Record<string, any>;
  result?: any;
  error?: string;
  progress?: number;
  executionMode: AgentExecutionMode;
  agentId: string;
  userId?: number;
  requiresApproval: boolean;
  approved?: boolean;
  approvedBy?: number;
  aiOptions?: any;
  maxRetries?: number;
  retryCount: number;
  tags?: string[];
  parent?: string;
}

export interface AgentExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  metrics?: Record<string, any>;
}

export interface AgentLearningEvent {
  id: string;
  timestamp: Date;
  agentId: string;
  taskId?: string;
  eventType: string;
  data: Record<string, any>;
  source: string;
  importance: number;
}

export interface AgentSystemMetrics {
  activeAgents: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasksLast24h: number;
  failedTasksLast24h: number;
  avgExecutionTimeMs: number;
  resourceUtilization: number;
  costLast24h: number;
  savingsLast24h: number;
  learningEvents: number;
  modelImprovementRate: number;
}

export interface Agent {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly capabilities: AgentCapability[];
  readonly status: 'active' | 'inactive';
  readonly createdAt: Date;
  readonly taskTypes: AgentTaskType[];
  readonly executionModes: AgentExecutionMode[];
  readonly defaultExecutionMode: AgentExecutionMode;
  readonly version: string;
  readonly config: Record<string, any>;
  
  canHandleTask(taskType: AgentTaskType): boolean;
  processTask(task: AgentTask): Promise<AgentTask>;
  getStatus(): Promise<{
    status: string;
    metrics: Record<string, any>;
    currentLoad: number;
    taskQueue: number;
  }>;
}