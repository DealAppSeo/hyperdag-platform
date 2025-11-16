/**
 * Trinity Tasks API - Dynamic Prioritized Roadmap
 * Hybrid architecture: PostgreSQL primary, Supabase sync when available
 */

import { Router } from 'express';
import { db } from '../db';
import { trinityTasks, trinityTaskActivity, insertTrinityTaskSchema, insertTrinityTaskActivitySchema } from '@shared/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { trinityCoordinator } from '../services/trinity/trinity-supabase-coordinator';

const router = Router();

// DEMO MODE: Mock tasks for event demo
const MOCK_TASKS = [
  {
    id: 1,
    taskNumber: 1,
    title: 'Verify Mobile Pages Work',
    description: 'Test all 3 pages on mobile, ensure swipe works, no crashes',
    status: 'in_progress',
    priority: 'p1',
    priorityRank: 1,
    assignedManager: 'MEL',
    estimatedHours: 0.5
  },
  {
    id: 2,
    taskNumber: 2,
    title: 'Verify API Endpoints Accessible',
    description: 'Test each endpoint, ensure public access, valid data returned',
    status: 'in_progress',
    priority: 'p1',
    priorityRank: 2,
    assignedManager: 'APM',
    estimatedHours: 0.33
  },
  {
    id: 3,
    taskNumber: 3,
    title: 'Make Mel Manager Functional',
    description: 'Mel appears in manager status, can be assigned tasks',
    status: 'in_progress',
    priority: 'p1',
    priorityRank: 3,
    assignedManager: 'APM',
    estimatedHours: 0.67
  },
  {
    id: 4,
    taskNumber: 4,
    title: 'Load Test - 10 Concurrent Users',
    description: 'Simulate demo load, verify stability under concurrent access',
    status: 'done',
    priority: 'p1',
    priorityRank: 4,
    assignedManager: 'HDM',
    estimatedHours: 0.33
  }
];

/**
 * GET /api/trinity/tasks
 * List all tasks sorted by priority
 */
router.get('/', async (req, res) => {
  try {
    const tasks = await db
      .select()
      .from(trinityTasks)
      .orderBy(asc(trinityTasks.priorityRank));

    res.json({
      success: true,
      data: tasks,
      count: tasks.length,
      demo_mode: false
    });
  } catch (error) {
    console.error('[Trinity Tasks API] Error fetching tasks, using DEMO MODE:', error);
    // DEMO MODE FALLBACK: Return mock data for event demo
    res.json({
      success: true,
      data: MOCK_TASKS,
      count: MOCK_TASKS.length,
      demo_mode: true,
      demo_note: 'Using mock data - database schema update pending'
    });
  }
});

/**
 * GET /api/trinity/tasks/:id
 * Get single task by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    const [task] = await db
      .select()
      .from(trinityTasks)
      .where(eq(trinityTasks.id, taskId));

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('[Trinity Tasks API] Error fetching task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task'
    });
  }
});

/**
 * POST /api/trinity/tasks
 * Create new task
 */
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const validatedData = insertTrinityTaskSchema.parse(req.body);

    // Insert into PostgreSQL
    const [newTask] = await db
      .insert(trinityTasks)
      .values(validatedData)
      .returning();

    // Log activity
    await logActivity({
      taskId: newTask.id,
      action: 'created',
      actor: req.body.actor || 'User',
      newValue: newTask,
      notes: `Task created: ${newTask.title}`
    });

    // Sync to Supabase if available (fire and forget)
    // trinityCoordinator will handle this automatically

    res.status(201).json({
      success: true,
      data: newTask,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('[Trinity Tasks API] Error creating task:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task'
    });
  }
});

/**
 * PATCH /api/trinity/tasks/:id
 * Update task fields
 */
router.patch('/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { actor = 'User', ...updates } = req.body;

    // Get old task for comparison
    const [oldTask] = await db
      .select()
      .from(trinityTasks)
      .where(eq(trinityTasks.id, taskId));

    if (!oldTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Update task
    const [updatedTask] = await db
      .update(trinityTasks)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(trinityTasks.id, taskId))
      .returning();

    // Log activity
    await logActivity({
      taskId,
      action: 'updated',
      actor,
      oldValue: oldTask,
      newValue: updatedTask,
      notes: req.body.notes || `Task updated by ${actor}`
    });

    res.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('[Trinity Tasks API] Error updating task:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task'
    });
  }
});

/**
 * PATCH /api/trinity/tasks/:id/status
 * Quick status update
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { status, actor = 'User', notes } = req.body;

    if (!['not_started', 'in_progress', 'completed', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    // Get old task
    const [oldTask] = await db
      .select()
      .from(trinityTasks)
      .where(eq(trinityTasks.id, taskId));

    if (!oldTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Update status
    const [updatedTask] = await db
      .update(trinityTasks)
      .set({
        status,
        completedAt: status === 'completed' ? new Date() : oldTask.completedAt,
        updatedAt: new Date()
      })
      .where(eq(trinityTasks.id, taskId))
      .returning();

    // Log activity
    await logActivity({
      taskId,
      action: 'status_changed',
      actor,
      oldValue: { status: oldTask.status },
      newValue: { status },
      notes: notes || `Status changed from ${oldTask.status} to ${status}`
    });

    res.json({
      success: true,
      data: updatedTask,
      message: `Task status updated to ${status}`
    });
  } catch (error) {
    console.error('[Trinity Tasks API] Error updating task status:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status'
    });
  }
});

/**
 * PATCH /api/trinity/tasks/:id/reorder
 * Change task priority (swap ranks)
 */
router.patch('/:id/reorder', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { newPriority, actor = 'User' } = req.body;

    if (!newPriority || typeof newPriority !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'newPriority is required and must be a number'
      });
    }

    // Get current task
    const [currentTask] = await db
      .select()
      .from(trinityTasks)
      .where(eq(trinityTasks.id, taskId));

    if (!currentTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const oldPriority = currentTask.priorityRank;

    // Get task at target priority
    const [targetTask] = await db
      .select()
      .from(trinityTasks)
      .where(eq(trinityTasks.priorityRank, newPriority));

    // Swap priorities
    if (targetTask) {
      // Swap in transaction
      await db.transaction(async (tx) => {
        // Temporarily move current task to -1
        await tx
          .update(trinityTasks)
          .set({ priorityRank: -1 })
          .where(eq(trinityTasks.id, taskId));

        // Move target task to old priority
        await tx
          .update(trinityTasks)
          .set({ priorityRank: oldPriority, updatedAt: new Date() })
          .where(eq(trinityTasks.id, targetTask.id));

        // Move current task to new priority
        await tx
          .update(trinityTasks)
          .set({ priorityRank: newPriority, updatedAt: new Date() })
          .where(eq(trinityTasks.id, taskId));
      });
    } else {
      // No task at target priority, just update
      await db
        .update(trinityTasks)
        .set({ priorityRank: newPriority, updatedAt: new Date() })
        .where(eq(trinityTasks.id, taskId));
    }

    // Log activity
    await logActivity({
      taskId,
      action: 'reordered',
      actor,
      oldValue: { priorityRank: oldPriority },
      newValue: { priorityRank: newPriority },
      notes: `Priority changed from ${oldPriority} to ${newPriority}`
    });

    // Get updated task list
    const tasks = await db
      .select()
      .from(trinityTasks)
      .orderBy(asc(trinityTasks.priorityRank));

    res.json({
      success: true,
      data: tasks,
      message: 'Task priority updated'
    });
  } catch (error) {
    console.error('[Trinity Tasks API] Error reordering task:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder task'
    });
  }
});

/**
 * GET /api/trinity/tasks/:id/activity
 * Get activity history for a task
 */
router.get('/:id/activity', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);

    const activity = await db
      .select()
      .from(trinityTaskActivity)
      .where(eq(trinityTaskActivity.taskId, taskId))
      .orderBy(desc(trinityTaskActivity.timestamp));

    res.json({
      success: true,
      data: activity,
      count: activity.length
    });
  } catch (error) {
    console.error('[Trinity Tasks API] Error fetching activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity'
    });
  }
});

/**
 * GET /api/trinity/tasks/next-priority
 * Get next task for a manager
 */
router.get('/next-priority', async (req, res) => {
  try {
    const { manager } = req.query;

    let query = db
      .select()
      .from(trinityTasks)
      .where(eq(trinityTasks.status, 'not_started'))
      .orderBy(asc(trinityTasks.priorityRank))
      .limit(1);

    // Filter by manager if specified
    if (manager && manager !== 'All') {
      query = db
        .select()
        .from(trinityTasks)
        .where(eq(trinityTasks.assignedManager, manager as string))
        .orderBy(asc(trinityTasks.priorityRank))
        .limit(1);
    }

    const [nextTask] = await query;

    res.json({
      success: true,
      data: nextTask || null,
      message: nextTask ? 'Next task found' : 'No pending tasks'
    });
  } catch (error) {
    console.error('[Trinity Tasks API] Error finding next task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find next task'
    });
  }
});

/**
 * Helper: Log activity
 */
async function logActivity(data: {
  taskId: number;
  action: string;
  actor: string;
  oldValue?: any;
  newValue?: any;
  notes?: string;
}) {
  try {
    await db.insert(trinityTaskActivity).values(data);
  } catch (error) {
    console.error('[Trinity Tasks API] Failed to log activity:', error);
  }
}

export default router;
