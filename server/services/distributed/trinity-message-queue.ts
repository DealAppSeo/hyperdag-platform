/**
 * Trinity Message Queue Service
 * 
 * Provides distributed pub/sub messaging using Supabase Realtime (free tier)
 * Enables zero-cost communication between Trinity deployments
 * 
 * Free Tier: Unlimited connections and messages
 */

import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { unifiedSupabase } from '../shared/unified-supabase-client';
import type {
  TrinityMessage,
  TrinityDeployment,
  MessageType,
  HeartbeatPayload,
} from './trinity-message-protocol';
import {
  getInboxChannel,
  getBroadcastChannel,
  createTrinityMessage,
  isMessageExpired,
  compareMessagePriority,
  TrinityChannels,
} from './trinity-message-protocol';

type MessageHandler = (message: TrinityMessage) => Promise<void> | void;

export class TrinityMessageQueue {
  private supabase: SupabaseClient | null = null;
  private deployment: TrinityDeployment;
  private channels: Map<string, RealtimeChannel> = new Map();
  private messageHandlers: Map<MessageType, MessageHandler[]> = new Map();
  private messageQueue: TrinityMessage[] = [];
  private isProcessing = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  // Configuration
  private config = {
    heartbeatIntervalMs: 30000, // 30 seconds
    messageRetentionMs: 300000, // 5 minutes
    maxQueueSize: 1000,
    processingBatchSize: 10,
  };

  constructor(deployment: TrinityDeployment) {
    this.deployment = deployment;
  }

  /**
   * Initialize connection to Supabase Realtime
   */
  async initialize(): Promise<boolean> {
    try {
      // Use unified Supabase client (eliminates duplicate client creation)
      if (!unifiedSupabase.isAvailable()) {
        console.warn('[Trinity MessageQueue] Supabase not configured - operating in local mode');
        console.warn('[Trinity MessageQueue] Set SUPABASE_URL and SUPABASE_ANON_KEY to enable distributed messaging');
        return false;
      }

      this.supabase = unifiedSupabase.getClient();

      // Subscribe to deployment-specific inbox
      await this.subscribeToChannel(getInboxChannel(this.deployment));
      
      // Subscribe to broadcast channels
      await this.subscribeToChannel(TrinityChannels.broadcast);
      await this.subscribeToChannel(TrinityChannels.heartbeat);
      await this.subscribeToChannel(TrinityChannels.learning);
      await this.subscribeToChannel(TrinityChannels.optimization);

      // Start heartbeat
      this.startHeartbeat();

      // Start message processing
      this.startMessageProcessing();

      console.log(`[Trinity MessageQueue] ✅ ${this.deployment} connected to distributed messaging`);
      console.log(`[Trinity MessageQueue] 📡 Subscribed to ${this.channels.size} channels`);
      
      return true;
    } catch (error) {
      console.error('[Trinity MessageQueue] ❌ Initialization failed:', error);
      return false;
    }
  }

  /**
   * Subscribe to a Supabase Realtime channel
   */
  private async subscribeToChannel(channelName: string): Promise<void> {
    if (!this.supabase) return;

    const channel = this.supabase
      .channel(channelName)
      .on('broadcast', { event: 'trinity-message' }, ({ payload }) => {
        this.handleIncomingMessage(payload as TrinityMessage);
      })
      .subscribe();

    this.channels.set(channelName, channel);
  }

  /**
   * Handle incoming message from any channel
   */
  private handleIncomingMessage(message: TrinityMessage): void {
    // Ignore messages from self
    if (message.from === this.deployment) return;

    // Check if message is for this deployment
    if (message.to !== 'broadcast' && message.to !== this.deployment) return;

    // Check expiration
    if (isMessageExpired(message)) {
      console.log(`[Trinity MessageQueue] ⏰ Dropped expired message: ${message.messageId}`);
      return;
    }

    // Add to queue
    this.messageQueue.push(message);
    
    // Sort by priority
    this.messageQueue.sort(compareMessagePriority);

    // Limit queue size
    if (this.messageQueue.length > this.config.maxQueueSize) {
      const dropped = this.messageQueue.splice(this.config.maxQueueSize);
      console.warn(`[Trinity MessageQueue] ⚠️ Dropped ${dropped.length} messages due to queue overflow`);
    }

    console.log(`[Trinity MessageQueue] 📨 Received ${message.type} from ${message.from} (queue: ${this.messageQueue.length})`);
  }

  /**
   * Process queued messages
   */
  private async processMessageQueue(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) return;

    this.isProcessing = true;

    try {
      const batch = this.messageQueue.splice(0, this.config.processingBatchSize);
      
      for (const message of batch) {
        await this.processMessage(message);
      }
    } catch (error) {
      console.error('[Trinity MessageQueue] Error processing messages:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual message
   */
  private async processMessage(message: TrinityMessage): Promise<void> {
    const handlers = this.messageHandlers.get(message.type) || [];
    
    if (handlers.length === 0) {
      console.log(`[Trinity MessageQueue] ⚠️ No handlers for message type: ${message.type}`);
      return;
    }

    for (const handler of handlers) {
      try {
        await handler(message);
      } catch (error) {
        console.error(`[Trinity MessageQueue] Handler error for ${message.type}:`, error);
      }
    }

    // Send acknowledgment if required
    if (message.requiresAck) {
      await this.sendAcknowledgment(message);
    }
  }

  /**
   * Send acknowledgment for a message
   */
  private async sendAcknowledgment(originalMessage: TrinityMessage): Promise<void> {
    const ackMessage = createTrinityMessage(
      this.deployment,
      originalMessage.from,
      'task_result',
      {
        taskId: originalMessage.messageId,
        acknowledged: true,
        timestamp: Date.now(),
      },
      { priority: 'normal' }
    );

    await this.sendMessage(ackMessage);
  }

  /**
   * Register a handler for a specific message type
   */
  onMessage(type: MessageType, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(type) || [];
    handlers.push(handler);
    this.messageHandlers.set(type, handlers);
    
    console.log(`[Trinity MessageQueue] 🎯 Registered handler for ${type}`);
  }

  /**
   * Send a message to another deployment or broadcast
   */
  async sendMessage(message: TrinityMessage): Promise<boolean> {
    if (!this.supabase) {
      console.warn('[Trinity MessageQueue] Cannot send message - not connected');
      return false;
    }

    try {
      // Determine which channel to use
      let channelName: string;
      
      if (message.to === 'broadcast') {
        channelName = getBroadcastChannel(message.type);
      } else {
        channelName = getInboxChannel(message.to);
      }

      const channel = this.channels.get(channelName);
      if (!channel) {
        console.error(`[Trinity MessageQueue] Channel not found: ${channelName}`);
        return false;
      }

      // Send via Supabase Realtime broadcast
      await channel.send({
        type: 'broadcast',
        event: 'trinity-message',
        payload: message,
      });

      console.log(`[Trinity MessageQueue] 📤 Sent ${message.type} to ${message.to} via ${channelName}`);
      return true;
    } catch (error) {
      console.error('[Trinity MessageQueue] Send failed:', error);
      return false;
    }
  }

  /**
   * Broadcast a message to all deployments
   */
  async broadcast(type: MessageType, payload: any, priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'): Promise<boolean> {
    const message = createTrinityMessage(
      this.deployment,
      'broadcast',
      type,
      payload,
      { priority }
    );

    return await this.sendMessage(message);
  }

  /**
   * Send heartbeat to indicate this deployment is healthy
   */
  private async sendHeartbeat(): Promise<void> {
    const heartbeat = createTrinityMessage(
      this.deployment,
      'broadcast',
      'heartbeat',
      {
        deployment: this.deployment,
        status: 'healthy',
        metrics: {
          uptime: process.uptime() * 1000,
          tasksProcessed: 0, // TODO: Track actual tasks
          freeTierUtilization: 0.75, // TODO: Calculate actual utilization
          availableProviders: [], // TODO: Get from provider manager
          cacheHitRate: 0.85, // TODO: Get from cache stats
          avgResponseTime: 150, // TODO: Get actual metrics
        },
        capabilities: {
          canProcessTasks: true,
          availableCompute: 0.8,
          availableStorage: 0.9,
        },
      } as HeartbeatPayload,
      { priority: 'low' }
    );

    await this.sendMessage(heartbeat);
  }

  /**
   * Start periodic heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat().catch(error => {
        console.error('[Trinity MessageQueue] Heartbeat failed:', error);
      });
    }, this.config.heartbeatIntervalMs);

    // Send initial heartbeat
    this.sendHeartbeat();
  }

  /**
   * Start message processing loop
   */
  private startMessageProcessing(): void {
    setInterval(() => {
      this.processMessageQueue().catch(error => {
        console.error('[Trinity MessageQueue] Processing loop error:', error);
      });
    }, 1000); // Process every second
  }

  /**
   * Shutdown message queue
   */
  async shutdown(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Unsubscribe from all channels
    const channelEntries = Array.from(this.channels.entries());
    for (const [channelName, channel] of channelEntries) {
      await channel.unsubscribe();
      console.log(`[Trinity MessageQueue] Unsubscribed from ${channelName}`);
    }

    this.channels.clear();
    console.log(`[Trinity MessageQueue] 👋 ${this.deployment} disconnected from messaging`);
  }

  /**
   * Get current queue status
   */
  getStatus(): {
    deployment: TrinityDeployment;
    connected: boolean;
    queuedMessages: number;
    subscribedChannels: number;
    registeredHandlers: number;
  } {
    return {
      deployment: this.deployment,
      connected: this.supabase !== null,
      queuedMessages: this.messageQueue.length,
      subscribedChannels: this.channels.size,
      registeredHandlers: Array.from(this.messageHandlers.values()).reduce((sum, handlers) => sum + handlers.length, 0),
    };
  }
}

// Singleton instance for current deployment
let messageQueueInstance: TrinityMessageQueue | null = null;

export function getTrinityMessageQueue(deployment?: TrinityDeployment): TrinityMessageQueue {
  if (!messageQueueInstance) {
    const deploymentName = deployment || (process.env.TRINITY_DEPLOYMENT as TrinityDeployment) || 'HyperDAG';
    messageQueueInstance = new TrinityMessageQueue(deploymentName);
  }
  return messageQueueInstance;
}
