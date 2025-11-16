/**
 * AI Agent System
 * 
 * This module implements the AI agent system that enables autonomous and
 * semi-autonomous processes to optimize platform operations, improve user
 * experience, and reduce costs through machine learning and AI techniques.
 */

import { v4 as uuid } from 'uuid';
import { logger } from '../../utils/logger';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { 
  Agent, 
  AgentTask, 
  AgentTaskStatus, 
  AgentTaskType,
  AgentTaskPriority,
  AgentExecutionMode,
  AgentCapability,
  AgentExecutionResult,
  AgentLearningEvent,
  AgentSystemMetrics
} from './types';
import { generateChatCompletion } from '../redundancy/ai';
import { OptimizationAgent } from './optimization-agent';
import { ContentAgent } from './content-agent';
import { AnalyticsAgent } from './analytics-agent';
import { MonitoringAgent } from './monitoring-agent';

/**
 * Agent System class
 * 
 * Manages the lifecycle of AI agents and coordinates task execution
 */
export class AgentSystem {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, AgentTask> = new Map();
  private learningEvents: AgentLearningEvent[] = [];
  private isInitialized: boolean = false;
  private taskQueue: string[] = [];
  private runningTasks: Set<string> = new Set();
  private maxConcurrentTasks: number = 10;
  private tableName: string = 'agent_tasks';
  private learningTableName: string = 'agent_learning';

  /**
   * Initialize the agent system
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    let dbInitialized = false;

    try {
      // Disable database initialization to prevent prepared statement errors
      try {
        // await this.initializeDatabase();
        // dbInitialized = true;
        logger.info('[agents] Running in memory-only mode (database initialization disabled)');
      } catch (dbError) {
        logger.warn('[agents] Database initialization failed, running in memory-only mode:', dbError);
        // Continue in memory-only mode
      }

      // Register built-in agents - always do this regardless of database state
      this.registerAgent(new OptimizationAgent());
      this.registerAgent(new ContentAgent());
      this.registerAgent(new AnalyticsAgent());
      this.registerAgent(new MonitoringAgent());

      // Load pending tasks from database only if DB was initialized
      if (dbInitialized) {
        try {
          await this.loadPendingTasks();
        } catch (loadError) {
          logger.warn('[agents] Failed to load pending tasks, starting with empty queue:', loadError);
          // Continue with an empty queue
        }
      }

      // Start the task processing loop
      this.startTaskProcessing();

      this.isInitialized = true;
      logger.info('[agents] Agent system initialized successfully');
      if (!dbInitialized) {
        logger.info('[agents] Running in memory-only mode (no database persistence)');
      }
    } catch (error) {
      logger.error('[agents] Failed to initialize agent system:', error);
      // Don't throw, let the system continue in a degraded state
      this.isInitialized = true;
      logger.info('[agents] Agent system initialized in degraded state');
    }
  }

  /**
   * Create necessary database tables
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // Check database connection first
      try {
        await db.execute(sql`SELECT 1`);
      } catch (connectionError) {
        logger.error('[agents] Database connection failed:', connectionError);
        throw new Error('Database connection failed');
      }

      // Create tasks table
      try {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS ${this.tableName} (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            status TEXT NOT NULL,
            priority TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            started_at TIMESTAMP,
            completed_at TIMESTAMP,
            deadline TIMESTAMP,
            description TEXT NOT NULL,
            params JSONB NOT NULL,
            result JSONB,
            error TEXT,
            progress INTEGER,
            execution_mode TEXT NOT NULL,
            agent_id TEXT NOT NULL,
            user_id INTEGER,
            requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
            approved BOOLEAN,
            approved_by INTEGER,
            ai_options JSONB,
            max_retries INTEGER,
            retry_count INTEGER DEFAULT 0,
            tags TEXT[],
            parent TEXT
          )
        `);
      } catch (tableError) {
        logger.error('[agents] Failed to create tasks table:', tableError);
        throw new Error('Failed to create tasks table');
      }

      // Create learning events table
      try {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS ${this.learningTableName} (
            id TEXT PRIMARY KEY,
            timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            agent_id TEXT NOT NULL,
            task_id TEXT,
            event_type TEXT NOT NULL,
            data JSONB NOT NULL,
            source TEXT NOT NULL,
            importance REAL NOT NULL
          )
        `);
      } catch (tableError) {
        logger.error('[agents] Failed to create learning events table:', tableError);
        throw new Error('Failed to create learning events table');
      }

      // Create indexes one at a time to avoid prepared statement issues
      try {
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON ${this.tableName} (status)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_id ON ${this.tableName} (agent_id)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_agent_tasks_user_id ON ${this.tableName} (user_id)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_agent_learning_agent_id ON ${this.learningTableName} (agent_id)`);
      } catch (indexError) {
        // Just log a warning but don't fail the entire initialization
        logger.warn('[agents] Failed to create some indexes:', indexError);
      }

      logger.info('[agents] Database tables initialized');
    } catch (error) {
      logger.error('[agents] Failed to initialize database tables:', error);
      throw error;
    }
  }

  /**
   * Register an agent with the system
   */
  public registerAgent(agent: Agent): void {
    if (this.agents.has(agent.id)) {
      logger.warn(`[agents] Agent with ID ${agent.id} already registered`);
      return;
    }

    this.agents.set(agent.id, agent);
    logger.info(`[agents] Registered agent: ${agent.name} (${agent.id})`);
  }

  /**
   * Unregister an agent from the system
   */
  public unregisterAgent(agentId: string): boolean {
    const result = this.agents.delete(agentId);
    if (result) {
      logger.info(`[agents] Unregistered agent: ${agentId}`);
    } else {
      logger.warn(`[agents] Agent with ID ${agentId} not found`);
    }
    return result;
  }

  /**
   * Get an agent by ID
   */
  public getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   */
  public getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by capability
   */
  public getAgentsByCapability(capability: AgentCapability): Agent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.capabilities.includes(capability)
    );
  }

  /**
   * Get agents that can handle a specific task type
   */
  public getAgentsForTaskType(taskType: AgentTaskType): Agent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.taskTypes.includes(taskType)
    );
  }

  /**
   * Create a new task
   */
  public async createTask(
    taskType: AgentTaskType,
    description: string,
    params: Record<string, any>,
    options: {
      priority?: AgentTaskPriority;
      deadline?: Date;
      executionMode?: AgentExecutionMode;
      agentId?: string;
      userId?: number;
      requiresApproval?: boolean;
      aiOptions?: any;
      maxRetries?: number;
      tags?: string[];
      parent?: string;
    } = {}
  ): Promise<AgentTask> {
    // Set default options
    const priority = options.priority || AgentTaskPriority.MEDIUM;
    const executionMode = options.executionMode || AgentExecutionMode.AUTONOMOUS;
    const requiresApproval = options.requiresApproval ?? false;
    const maxRetries = options.maxRetries ?? 3;

    // If agent ID is not specified, select the best agent for this task type
    let agentId = options.agentId;
    if (!agentId) {
      const agents = this.getAgentsForTaskType(taskType);
      if (agents.length === 0) {
        throw new Error(`No agents available for task type: ${taskType}`);
      }
      // For now, just select the first agent, but this could be more sophisticated
      agentId = agents[0].id;
    }

    // Create task object
    const task: AgentTask = {
      id: uuid(),
      type: taskType,
      status: AgentTaskStatus.PENDING,
      priority,
      createdAt: new Date(),
      description,
      params,
      executionMode,
      agentId,
      userId: options.userId,
      requiresApproval,
      aiOptions: options.aiOptions,
      maxRetries,
      retryCount: 0,
      tags: options.tags,
      parent: options.parent
    };

    if (options.deadline) {
      task.deadline = options.deadline;
    }

    try {
      // Try to save task to database
      try {
        await db.execute(`
          INSERT INTO ${this.tableName} (
            id, type, status, priority, created_at, deadline, description, params,
            execution_mode, agent_id, user_id, requires_approval, ai_options,
            max_retries, tags, parent
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
          )
        `, [
          task.id, task.type, task.status, task.priority, task.createdAt, 
          task.deadline || null, task.description, JSON.stringify(task.params),
          task.executionMode, task.agentId, task.userId || null, task.requiresApproval,
          task.aiOptions ? JSON.stringify(task.aiOptions) : null,
          task.maxRetries, task.tags || null, task.parent || null
        ]);
      } catch (dbError) {
        // If database operation fails, just log the error but continue with in-memory task
        logger.error(`[agents] Database storage of task failed:`, dbError);
        logger.info(`[agents] Continuing with in-memory task only`);
      }

      // Add to memory cache regardless of database operation result
      this.tasks.set(task.id, task);
      this.taskQueue.push(task.id);

      logger.info(`[agents] Created task: ${task.id} (${task.type})`);
      return task;
    } catch (error) {
      logger.error(`[agents] Failed to create task:`, error);
      throw new Error('Failed to create task');
    }
  }

  /**
   * Get a task by ID
   */
  public async getTask(taskId: string): Promise<AgentTask | null> {
    // Check memory cache first
    if (this.tasks.has(taskId)) {
      return this.tasks.get(taskId)!;
    }

    // Otherwise, fetch from database
    try {
      const result = await db.execute(`
        SELECT * FROM ${this.tableName} WHERE id = $1
      `, [taskId]);

      if (result.rows && result.rows.length > 0) {
        const task = this.mapRowToTask(result.rows[0]);
        this.tasks.set(taskId, task);
        return task;
      }

      return null;
    } catch (error) {
      logger.error(`[agents] Failed to get task ${taskId}:`, error);
      return null;
    }
  }

  /**
   * Update a task's status
   */
  public async updateTaskStatus(
    taskId: string, 
    status: AgentTaskStatus, 
    updates: {
      result?: any;
      error?: string;
      progress?: number;
      approved?: boolean;
      approvedBy?: number;
    } = {}
  ): Promise<boolean> {
    try {
      const task = await this.getTask(taskId);
      if (!task) {
        logger.warn(`[agents] Cannot update non-existent task: ${taskId}`);
        return false;
      }

      task.status = status;
      
      if (status === AgentTaskStatus.RUNNING && !task.startedAt) {
        task.startedAt = new Date();
      }
      
      if ([AgentTaskStatus.SUCCEEDED, AgentTaskStatus.FAILED, AgentTaskStatus.CANCELLED, AgentTaskStatus.TIMEOUT].includes(status)) {
        task.completedAt = new Date();
      }

      if (updates.result !== undefined) {
        task.result = updates.result;
      }

      if (updates.error !== undefined) {
        task.error = updates.error;
      }

      if (updates.progress !== undefined) {
        task.progress = updates.progress;
      }

      if (updates.approved !== undefined) {
        task.approved = updates.approved;
      }

      if (updates.approvedBy !== undefined) {
        task.approvedBy = updates.approvedBy;
      }

      // Update in database
      try {
        await db.execute(`
          UPDATE ${this.tableName}
          SET status = $1, 
              started_at = $2,
              completed_at = $3,
              result = $4,
              error = $5,
              progress = $6,
              approved = $7,
              approved_by = $8
          WHERE id = $9
        `, [
          status,
          task.startedAt || null,
          task.completedAt || null,
          task.result ? JSON.stringify(task.result) : null,
          task.error || null,
          task.progress || null,
          task.approved === undefined ? null : task.approved,
          task.approvedBy || null,
          taskId
        ]);
      } catch (dbError) {
        // If database update fails, just log the error but continue
        // The in-memory model will still be updated
        logger.warn(`[agents] Failed to update task in database, continuing with in-memory only: ${dbError.message}`);
      }

      // Update in memory
      this.tasks.set(taskId, task);

      logger.info(`[agents] Updated task ${taskId} status to ${status}`);
      return true;
    } catch (error) {
      logger.error(`[agents] Failed to update task ${taskId}:`, error);
      return false;
    }
  }

  /**
   * Cancel a task 
   */
  public async cancelTask(taskId: string): Promise<boolean> {
    return this.updateTaskStatus(taskId, AgentTaskStatus.CANCELLED);
  }

  /**
   * Approve task results
   */
  public async approveTaskResults(taskId: string, userId: number): Promise<boolean> {
    try {
      const task = await this.getTask(taskId);
      if (!task) {
        return false;
      }

      // Only tasks that require approval and are completed can be approved
      if (!task.requiresApproval || task.status !== AgentTaskStatus.SUCCEEDED) {
        return false;
      }

      // Update approval status
      return this.updateTaskStatus(taskId, AgentTaskStatus.SUCCEEDED, {
        approved: true,
        approvedBy: userId
      });
    } catch (error) {
      logger.error(`[agents] Failed to approve task ${taskId}:`, error);
      return false;
    }
  }

  /**
   * Record a learning event
   */
  public async recordLearningEvent(event: Omit<AgentLearningEvent, 'id' | 'timestamp'>): Promise<string> {
    const id = uuid();
    const timestamp = new Date();
    
    const fullEvent: AgentLearningEvent = {
      id,
      timestamp,
      ...event
    };

    try {
      // Try to save to database, but continue even if it fails
      try {
        await db.execute(`
          INSERT INTO ${this.learningTableName} (
            id, timestamp, agent_id, task_id, event_type, data, source, importance
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
          )
        `, [
          id, timestamp, event.agentId, event.taskId || null, 
          event.eventType, JSON.stringify(event.data),
          event.source, event.importance
        ]);
      } catch (dbError) {
        // If database operation fails, just log it but continue with in-memory storage
        logger.warn(`[agents] Failed to store learning event in database, continuing with in-memory only: ${dbError.message}`);
      }

      // Add to memory cache (keep only recent events in memory)
      this.learningEvents.push(fullEvent);
      if (this.learningEvents.length > 1000) {
        this.learningEvents.shift();
      }

      logger.debug(`[agents] Recorded learning event: ${id} (${event.eventType})`);
      return id;
    } catch (error) {
      // Handle any other errors
      logger.error(`[agents] Failed to record learning event:`, error);
      // Still return the ID so the calling code can continue
      return id;
    }
  }

  /**
   * Get system metrics
   */
  public async getSystemMetrics(): Promise<AgentSystemMetrics> {
    // Calculate active agents - always available from memory
    const activeAgents = Array.from(this.agents.values()).filter(
      agent => agent.status === 'active'
    ).length;

    // Use memory for available metrics
    const pendingTasks = this.taskQueue.length;
    const runningTasks = this.runningTasks.size;
    const resourceUtilization = Math.min(1, runningTasks / this.maxConcurrentTasks);
    const learningEvents = this.learningEvents.length;

    // Initialize other metrics with default values
    let completedTasksLast24h = 0;
    let failedTasksLast24h = 0;
    let avgExecutionTimeMs = 0;
    const costLast24h = 0; // TODO: Implement real cost tracking
    const savingsLast24h = 0; // TODO: Implement real savings calculation
    const modelImprovementRate = 0; // TODO: Implement real model improvement rate measurement

    try {
      // Try to get database metrics but don't fail if unable to connect
      try {
        // Get completed tasks in last 24h
        const completedResult = await db.execute(`
          SELECT COUNT(*) as count FROM ${this.tableName} 
          WHERE status = $1 AND completed_at > NOW() - INTERVAL '24 hours'
        `, [AgentTaskStatus.SUCCEEDED]);
        completedTasksLast24h = parseInt(completedResult.rows?.[0]?.count || '0');

        // Get failed tasks in last 24h
        const failedResult = await db.execute(`
          SELECT COUNT(*) as count FROM ${this.tableName} 
          WHERE status = $1 AND completed_at > NOW() - INTERVAL '24 hours'
        `, [AgentTaskStatus.FAILED]);
        failedTasksLast24h = parseInt(failedResult.rows?.[0]?.count || '0');

        // Get average execution time
        const timeResult = await db.execute(`
          SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000) as avg_time 
          FROM ${this.tableName} 
          WHERE completed_at IS NOT NULL AND started_at IS NOT NULL
          AND completed_at > NOW() - INTERVAL '24 hours'
        `);
        avgExecutionTimeMs = parseFloat(timeResult.rows?.[0]?.avg_time || '0');
      } catch (dbError) {
        // Just log the error and continue with defaults
        logger.warn('[agents] Could not retrieve database metrics, using memory-only metrics', dbError);
      }

      return {
        activeAgents,
        pendingTasks,
        runningTasks,
        completedTasksLast24h,
        failedTasksLast24h,
        avgExecutionTimeMs,
        resourceUtilization,
        costLast24h,
        savingsLast24h,
        learningEvents,
        modelImprovementRate
      };
    } catch (error) {
      logger.error('[agents] Failed to get system metrics:', error);
      // Return minimal metrics based on memory
      return {
        activeAgents: this.agents.size,
        pendingTasks: this.taskQueue.length,
        runningTasks: this.runningTasks.size,
        completedTasksLast24h: 0,
        failedTasksLast24h: 0,
        avgExecutionTimeMs: 0,
        resourceUtilization: Math.min(1, this.runningTasks.size / this.maxConcurrentTasks),
        costLast24h: 0,
        savingsLast24h: 0,
        learningEvents: this.learningEvents.length,
        modelImprovementRate: 0
      };
    }
  }

  /**
   * Load pending tasks from database
   */
  private async loadPendingTasks(): Promise<void> {
    try {
      // First verify if the table exists and has the right structure 
      try {
        // First create a simple verification query to check table existence
        try {
          await db.execute(`SELECT EXISTS (
            SELECT FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = '${this.tableName}'
          )`);
        } catch (verifyError) {
          // If this verification query fails, we have a more fundamental DB issue
          logger.warn(`[agents] Could not verify task table existence: ${verifyError.message}`);
          return; // Exit early but don't throw
        }

        // Get all pending tasks
        const result = await db.execute(sql`
          SELECT * FROM ${sql.identifier(this.tableName)} 
          WHERE status = ${AgentTaskStatus.PENDING} OR status = ${AgentTaskStatus.RUNNING}
          ORDER BY 
            CASE 
              WHEN priority = ${AgentTaskPriority.CRITICAL} THEN 0
              WHEN priority = ${AgentTaskPriority.HIGH} THEN 1
              WHEN priority = ${AgentTaskPriority.MEDIUM} THEN 2
              WHEN priority = ${AgentTaskPriority.LOW} THEN 3
              WHEN priority = ${AgentTaskPriority.BACKGROUND} THEN 4
              ELSE 5
            END,
            created_at ASC
        `);

        if (result.length > 0) {
          // Reset queue
          this.taskQueue = [];
          
          // Add to memory and queue
          for (const row of result) {
            const task = this.mapRowToTask(row);
            this.tasks.set(task.id, task);
            
            // For tasks that were running when the server restarted,
            // mark them as pending again to be reprocessed
            if (task.status === AgentTaskStatus.RUNNING) {
              task.status = AgentTaskStatus.PENDING;
              // Try to update status in DB but continue even if it fails
              try {
                await this.updateTaskStatus(task.id, AgentTaskStatus.PENDING, {
                  error: 'Task requeued due to server restart'
                });
              } catch (updateError) {
                logger.warn(`[agents] Failed to update task status in DB for task ${task.id}, continuing with in-memory update only`);
              }
            }
            
            this.taskQueue.push(task.id);
          }
        }

        logger.info(`[agents] Loaded ${this.taskQueue.length} pending tasks`);
      } catch (dbError) {
        // Handle any database errors 
        const errorMsg = dbError.message || '';
        
        // Check for specific error codes in the message
        if (errorMsg.includes('42P01')) {
          // Relation does not exist
          logger.warn(`[agents] Tasks table does not exist yet, skipping task loading`);
        } else if (errorMsg.includes('42P02')) {
          // Column does not exist
          logger.warn(`[agents] Column in tasks table does not exist, may need migration`);
        } else if (errorMsg.includes('42703')) {
          // Undefined column
          logger.warn(`[agents] Undefined column in query, database schema may be outdated`);
        } else {
          // For other database errors, log but don't fail the entire system
          logger.warn(`[agents] Database issue with tasks table, skipping task loading: ${errorMsg}`);
        }
        
        // Continue with an empty queue regardless of the error type
        this.taskQueue = [];
      }
    } catch (error) {
      logger.error('[agents] Failed to load pending tasks:', error);
      // Don't throw, just continue with an empty queue
      this.taskQueue = [];
    }
  }

  /**
   * Start the task processing loop
   */
  private startTaskProcessing(): void {
    // ⚠️ BLOAT PURGE: Disable 1-second task loop to fix Vite HMR flashing
    // Re-enable by setting: ENABLE_AGENT_TASK_LOOP=true in .env
    if (process.env.ENABLE_AGENT_TASK_LOOP === 'true') {
      // Run the task processing loop every second
      setInterval(() => this.processNextTasks(), 1000);
      logger.info('[agents] ✅ Task processing loop ENABLED (1s interval)');
    } else {
      logger.info('[agents] ⚙️  Task processing loop DISABLED (reduce server load)');
    }
  }

  /**
   * Process the next pending tasks based on available capacity
   */
  private async processNextTasks(): Promise<void> {
    try {
      // If no tasks or already at capacity, skip
      if (this.taskQueue.length === 0 || this.runningTasks.size >= this.maxConcurrentTasks) {
        return;
      }

      // Start as many tasks as we have capacity for
      const availableSlots = this.maxConcurrentTasks - this.runningTasks.size;
      for (let i = 0; i < Math.min(availableSlots, this.taskQueue.length); i++) {
        const taskId = this.taskQueue.shift();
        if (taskId) {
          // Process in the background to avoid blocking the loop
          this.processTask(taskId).catch(error => {
            logger.error(`[agents] Error processing task ${taskId}:`, error);
          });
        }
      }
    } catch (error) {
      logger.error('[agents] Error in task processing loop:', error);
    }
  }

  /**
   * Process a single task
   */
  private async processTask(taskId: string): Promise<void> {
    // Mark as running
    this.runningTasks.add(taskId);

    try {
      const task = await this.getTask(taskId);
      if (!task || task.status !== AgentTaskStatus.PENDING) {
        this.runningTasks.delete(taskId);
        return;
      }

      // Update status to running
      await this.updateTaskStatus(taskId, AgentTaskStatus.RUNNING);

      // Get the agent
      const agent = this.agents.get(task.agentId);
      if (!agent) {
        await this.updateTaskStatus(taskId, AgentTaskStatus.FAILED, {
          error: `Agent ${task.agentId} not found`
        });
        this.runningTasks.delete(taskId);
        return;
      }

      // Check if agent is active
      if (agent.status !== 'active') {
        await this.updateTaskStatus(taskId, AgentTaskStatus.FAILED, {
          error: `Agent ${task.agentId} is not active`
        });
        this.runningTasks.delete(taskId);
        return;
      }

      // Process the task with appropriate execution mode
      let result: AgentTask;
      
      if (task.executionMode === AgentExecutionMode.AUTONOMOUS) {
        // Fully autonomous execution
        result = await agent.processTask(task);
        
        // Update task with result
        if (result.status === AgentTaskStatus.SUCCEEDED) {
          await this.updateTaskStatus(taskId, AgentTaskStatus.SUCCEEDED, {
            result: result.result,
            progress: 100
          });
          
          // Record learning event for successful task
          await this.recordLearningEvent({
            agentId: agent.id,
            taskId: task.id,
            eventType: 'success',
            data: { result: result.result },
            source: 'system',
            importance: 0.7
          });
        } else {
          await this.updateTaskStatus(taskId, result.status, {
            error: result.error,
            progress: result.progress
          });
          
          // Record learning event for failed task
          if (result.status === AgentTaskStatus.FAILED) {
            await this.recordLearningEvent({
              agentId: agent.id,
              taskId: task.id,
              eventType: 'failure',
              data: { error: result.error },
              source: 'system',
              importance: 0.8
            });
          }
        }
      } else {
        // For other execution modes, we would implement:
        // - Semi-autonomous: Generate proposal, wait for approval
        // - Supervised: Implement step-by-step supervision
        // - Collaborative: Implement back-and-forth workflow
        
        // For now, just mark as failed if not autonomous
        await this.updateTaskStatus(taskId, AgentTaskStatus.FAILED, {
          error: `Execution mode ${task.executionMode} not implemented yet`
        });
      }
    } catch (error) {
      // Handle unexpected errors
      logger.error(`[agents] Unexpected error processing task ${taskId}:`, error);
      await this.updateTaskStatus(taskId, AgentTaskStatus.FAILED, {
        error: `Internal error: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      // Remove from running tasks
      this.runningTasks.delete(taskId);
    }
  }

  /**
   * Map a database row to an AgentTask object
   */
  private mapRowToTask(row: any): AgentTask {
    return {
      id: row.id,
      type: row.type as AgentTaskType,
      status: row.status as AgentTaskStatus,
      priority: row.priority as AgentTaskPriority,
      createdAt: row.created_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      deadline: row.deadline,
      description: row.description,
      params: typeof row.params === 'string' ? JSON.parse(row.params) : row.params,
      result: row.result ? (typeof row.result === 'string' ? JSON.parse(row.result) : row.result) : undefined,
      error: row.error,
      progress: row.progress,
      executionMode: row.execution_mode as AgentExecutionMode,
      agentId: row.agent_id,
      userId: row.user_id,
      requiresApproval: row.requires_approval,
      approved: row.approved,
      approvedBy: row.approved_by,
      aiOptions: row.ai_options ? (typeof row.ai_options === 'string' ? JSON.parse(row.ai_options) : row.ai_options) : undefined,
      maxRetries: row.max_retries,
      retryCount: row.retry_count,
      tags: row.tags,
      parent: row.parent
    };
  }
}

// Create and export singleton instance
export const agentSystem = new AgentSystem();