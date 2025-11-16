/**
 * Trinity Symphony Distributed Message Protocol
 * 
 * Enables zero-cost communication between three deployments:
 * - HyperDAG (Replit) - Workflow orchestration
 * - PurposeHub (Replit) - AI routing & prompt optimization
 * - ImageBearerAI (Lovable) - Neuromorphic learning & creative AI
 * 
 * Uses free-tier Supabase Realtime for pub/sub messaging
 */

export type TrinityDeployment = 'HyperDAG' | 'PurposeHub' | 'ImageBearerAI';

export type MessageType = 
  | 'task_assignment'      // Request another deployment to execute a task
  | 'task_result'          // Return task execution results
  | 'learning_update'      // Share performance insights for bilateral learning
  | 'optimization_sync'    // Sync ANFIS/optimization parameters
  | 'heartbeat'            // Health check ping
  | 'resource_request'     // Request free-tier resource allocation
  | 'provider_status'      // Share AI provider availability/quota status
  | 'cache_sync';          // Synchronize semantic RAG cache

export interface TrinityMessage {
  messageId: string;
  from: TrinityDeployment;
  to: TrinityDeployment | 'broadcast';
  type: MessageType;
  timestamp: number;
  payload: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requiresAck: boolean;
  expiresAt?: number;
}

export interface TaskAssignmentPayload {
  taskId: string;
  taskType: 'ai_inference' | 'workflow_execution' | 'image_generation' | 'optimization' | 'storage';
  description: string;
  input: any;
  requirements: {
    maxLatency?: number;
    qualityThreshold?: number;
    costConstraint?: 'zero' | 'minimal';
    privacyLevel?: 'public' | 'private';
  };
  deadline?: number;
}

export interface TaskResultPayload {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  metrics: {
    latency: number;
    cost: number;
    provider?: string;
    quality?: number;
  };
  learningData?: {
    providerPerformance: any;
    optimizationInsights: any;
  };
}

export interface LearningUpdatePayload {
  learningId: string;
  category: 'provider_performance' | 'anfis_optimization' | 'pattern_discovery' | 'cost_arbitrage';
  insights: {
    provider?: string;
    successRate?: number;
    avgLatency?: number;
    costSavings?: number;
    qualityScore?: number;
    patternDescription?: string;
  };
  anfisWeights?: Record<string, number>;
  membershipFunctions?: any;
  confidence: number;
}

export interface HeartbeatPayload {
  deployment: TrinityDeployment;
  status: 'healthy' | 'degraded' | 'offline';
  metrics: {
    uptime: number;
    tasksProcessed: number;
    freeTierUtilization: number;
    availableProviders: string[];
    cacheHitRate: number;
    avgResponseTime: number;
  };
  capabilities: {
    canProcessTasks: boolean;
    availableCompute: number; // 0-1
    availableStorage: number; // 0-1
  };
}

export interface ResourceRequestPayload {
  resourceType: 'compute' | 'storage' | 'ai_inference';
  amount: number;
  urgency: 'low' | 'normal' | 'high';
  preferredProvider?: string;
  fallbackStrategy: 'queue' | 'distribute' | 'fail';
}

export interface ProviderStatusPayload {
  provider: string;
  quotaRemaining: number;
  quotaResetAt: number;
  isAvailable: boolean;
  currentLatency: number;
  errorRate: number;
  recommendations: string[];
}

export interface OptimizationSyncPayload {
  optimizationType: 'anfis_weights' | 'rsi_parameters' | 'repid_scoring' | 'membership_functions';
  parameters: Record<string, any>;
  performanceGain: number;
  validatedBy: TrinityDeployment;
  applyGlobally: boolean;
}

/**
 * Message channels for pub/sub routing
 */
export const TrinityChannels = {
  // Deployment-specific inboxes
  hyperdag: 'trinity:hyperdag:inbox',
  purposehub: 'trinity:purposehub:inbox',
  imagebearer: 'trinity:imagebearer:inbox',
  
  // Broadcast channels
  broadcast: 'trinity:all:broadcast',
  heartbeat: 'trinity:all:heartbeat',
  learning: 'trinity:all:learning',
  optimization: 'trinity:all:optimization',
  
  // Special purpose
  urgent: 'trinity:all:urgent',
  cache: 'trinity:all:cache',
} as const;

/**
 * Get inbox channel for a specific deployment
 */
export function getInboxChannel(deployment: TrinityDeployment): string {
  const channelMap: Record<TrinityDeployment, string> = {
    HyperDAG: TrinityChannels.hyperdag,
    PurposeHub: TrinityChannels.purposehub,
    ImageBearerAI: TrinityChannels.imagebearer,
  };
  return channelMap[deployment];
}

/**
 * Get broadcast channel for a specific message type
 */
export function getBroadcastChannel(type: MessageType): string {
  const channelMap: Record<MessageType, string> = {
    task_assignment: TrinityChannels.broadcast,
    task_result: TrinityChannels.broadcast,
    learning_update: TrinityChannels.learning,
    optimization_sync: TrinityChannels.optimization,
    heartbeat: TrinityChannels.heartbeat,
    resource_request: TrinityChannels.broadcast,
    provider_status: TrinityChannels.broadcast,
    cache_sync: TrinityChannels.cache,
  };
  return channelMap[type] || TrinityChannels.broadcast;
}

/**
 * Create a new Trinity message
 */
export function createTrinityMessage(
  from: TrinityDeployment,
  to: TrinityDeployment | 'broadcast',
  type: MessageType,
  payload: any,
  options?: {
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    requiresAck?: boolean;
    ttl?: number;
  }
): TrinityMessage {
  const messageId = `${from}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = Date.now();
  
  return {
    messageId,
    from,
    to,
    type,
    timestamp,
    payload,
    priority: options?.priority || 'normal',
    requiresAck: options?.requiresAck || false,
    expiresAt: options?.ttl ? timestamp + options.ttl : undefined,
  };
}

/**
 * Validate message hasn't expired
 */
export function isMessageExpired(message: TrinityMessage): boolean {
  if (!message.expiresAt) return false;
  return Date.now() > message.expiresAt;
}

/**
 * Priority-based message sorting
 */
export function compareMessagePriority(a: TrinityMessage, b: TrinityMessage): number {
  const priorityMap = { urgent: 4, high: 3, normal: 2, low: 1 };
  const aPriority = priorityMap[a.priority];
  const bPriority = priorityMap[b.priority];
  
  if (aPriority !== bPriority) {
    return bPriority - aPriority; // Higher priority first
  }
  
  return a.timestamp - b.timestamp; // Earlier timestamp first
}
