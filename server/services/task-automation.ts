/**
 * Task Automation Service
 * Monitors files and automatically processes new tasks
 */

import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import cron from 'node-cron';
import { googleDriveService } from './google-drive-automation';

interface TaskFile {
  name: string;
  priority: 'high' | 'medium' | 'low';
  deadline?: string;
  instructions: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  results?: string;
}

export class TaskAutomationService {
  private taskQueue: TaskFile[] = [];
  private processing = false;
  private watcher: chokidar.FSWatcher | null = null;

  constructor() {
    this.initializeTaskDirectory();
    this.startFileWatcher();
    this.startScheduledTasks();
  }

  private async initializeTaskDirectory() {
    try {
      await fs.mkdir('./tasks', { recursive: true });
      await fs.mkdir('./tasks/completed', { recursive: true });
      await fs.mkdir('./tasks/failed', { recursive: true });
      console.log('[Task Automation] Directories initialized');
    } catch (error) {
      console.error('[Task Automation] Directory setup failed:', error);
    }
  }

  /**
   * Start watching for new task files
   */
  private startFileWatcher() {
    this.watcher = chokidar.watch('./tasks/*.md', {
      persistent: true,
      ignoreInitial: false,
    });

    this.watcher.on('add', async (filePath) => {
      console.log(`[Task Automation] New task file detected: ${filePath}`);
      await this.processTaskFile(filePath);
    });

    this.watcher.on('change', async (filePath) => {
      console.log(`[Task Automation] Task file updated: ${filePath}`);
      await this.processTaskFile(filePath);
    });

    console.log('[Task Automation] File watcher started');
  }

  /**
   * Process a task file
   */
  private async processTaskFile(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const task = this.parseTaskFile(content, filePath);
      
      if (task) {
        await this.addTaskToQueue(task);
        await this.processTaskQueue();
      }
    } catch (error) {
      console.error(`[Task Automation] Failed to process task file: ${filePath}`, error);
    }
  }

  /**
   * Parse task file content
   */
  private parseTaskFile(content: string, filePath: string): TaskFile | null {
    try {
      const lines = content.split('\n');
      const task: Partial<TaskFile> = {
        name: path.basename(filePath, '.md'),
        status: 'pending',
        createdAt: new Date(),
      };

      for (const line of lines) {
        if (line.startsWith('**Priority**:')) {
          task.priority = line.split(':')[1].trim().toLowerCase() as any;
        } else if (line.startsWith('**Deadline**:')) {
          task.deadline = line.split(':')[1].trim();
        } else if (line.startsWith('**Instructions**:')) {
          const instructionIndex = lines.indexOf(line);
          task.instructions = lines.slice(instructionIndex + 1).join('\n').trim();
        }
      }

      if (!task.instructions) {
        task.instructions = content;
      }

      return task as TaskFile;
    } catch (error) {
      console.error('[Task Automation] Failed to parse task file:', error);
      return null;
    }
  }

  /**
   * Add task to processing queue
   */
  private async addTaskToQueue(task: TaskFile) {
    this.taskQueue.push(task);
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    console.log(`[Task Automation] Task added to queue: ${task.name} (Priority: ${task.priority})`);
  }

  /**
   * Process task queue
   */
  private async processTaskQueue() {
    if (this.processing || this.taskQueue.length === 0) {
      return;
    }

    this.processing = true;
    
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (task) {
        await this.executeTask(task);
      }
    }

    this.processing = false;
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: TaskFile) {
    try {
      console.log(`[Task Automation] Executing task: ${task.name}`);
      task.status = 'processing';

      // Simulate task execution (replace with actual task logic)
      const results = await this.performTask(task);
      
      task.status = 'completed';
      task.completedAt = new Date();
      task.results = results;

      // Save results
      await this.saveTaskResults(task);
      
      // Upload to Google Drive
      await this.uploadTaskResults(task);

      console.log(`[Task Automation] Task completed: ${task.name}`);
    } catch (error) {
      console.error(`[Task Automation] Task failed: ${task.name}`, error);
      task.status = 'failed';
      await this.saveTaskResults(task);
    }
  }

  /**
   * Perform the actual task (implement your task logic here)
   */
  private async performTask(task: TaskFile): Promise<string> {
    // This is where you'd implement actual task processing
    // For now, returning a sample result
    return `Task "${task.name}" completed successfully.\n\nInstructions processed:\n${task.instructions}\n\nResults: Task automation system operational.`;
  }

  /**
   * Save task results to file
   */
  private async saveTaskResults(task: TaskFile) {
    try {
      const resultsDir = task.status === 'completed' ? './tasks/completed' : './tasks/failed';
      const resultsFile = path.join(resultsDir, `${task.name}_results.md`);
      
      const content = `# Task Results: ${task.name}

**Status**: ${task.status}
**Priority**: ${task.priority}
**Created**: ${task.createdAt.toISOString()}
**Completed**: ${task.completedAt?.toISOString() || 'N/A'}

## Original Instructions
${task.instructions}

## Results
${task.results || 'No results available'}
`;

      await fs.writeFile(resultsFile, content);
      console.log(`[Task Automation] Results saved: ${resultsFile}`);
    } catch (error) {
      console.error('[Task Automation] Failed to save results:', error);
    }
  }

  /**
   * Upload task results to Google Drive
   */
  private async uploadTaskResults(task: TaskFile) {
    try {
      const resultsDir = task.status === 'completed' ? './tasks/completed' : './tasks/failed';
      const resultsFile = path.join(resultsDir, `${task.name}_results.md`);
      
      const uploadUrl = await googleDriveService.uploadFile(resultsFile);
      if (uploadUrl) {
        console.log(`[Task Automation] Results uploaded to Google Drive: ${uploadUrl}`);
      }
    } catch (error) {
      console.error('[Task Automation] Failed to upload results:', error);
    }
  }

  /**
   * Start scheduled tasks (every 5 minutes)
   */
  private startScheduledTasks() {
    cron.schedule('*/5 * * * *', async () => {
      console.log('[Task Automation] Running scheduled task check');
      await this.processTaskQueue();
    });
  }

  /**
   * Create a new task file programmatically
   */
  async createTask(name: string, instructions: string, priority: 'high' | 'medium' | 'low' = 'medium', deadline?: string): Promise<void> {
    try {
      const taskContent = `# Task: ${name}
**Priority**: ${priority}
${deadline ? `**Deadline**: ${deadline}` : ''}
**Instructions**: 
${instructions}
`;

      const fileName = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.md`;
      const filePath = path.join('./tasks', fileName);
      
      await fs.writeFile(filePath, taskContent);
      console.log(`[Task Automation] Task created: ${filePath}`);
    } catch (error) {
      console.error('[Task Automation] Failed to create task:', error);
    }
  }

  /**
   * Get task queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.taskQueue.length,
      processing: this.processing,
      tasks: this.taskQueue.map(t => ({
        name: t.name,
        priority: t.priority,
        status: t.status,
        deadline: t.deadline,
      })),
    };
  }

  /**
   * Stop the automation service
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
    console.log('[Task Automation] Service stopped');
  }
}

// Initialize the service
export const taskAutomationService = new TaskAutomationService();