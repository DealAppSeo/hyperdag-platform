import { supabase } from '../supabase-client';

let pollIntervalId: NodeJS.Timeout | null = null;
let rotationActive = false;
let heartbeatCount = 0;

interface TrinityTask {
  id: number;
  task_number: number;
  title: string;
  status: string;
  assigned_manager: string;
  priority_rank: number;
}

interface AutonomousLog {
  agent: string;
  event: string;
  details: any;
  repid_tag: string;
}

/**
 * Log to Supabase autonomous_logs table
 */
async function logToSupabase(log: AutonomousLog) {
  const { data, error } = await supabase
    .from('autonomous_logs')
    .insert([log])
    .select();
  
  if (error) {
    console.error('[HDM Supabase] Log error:', error);
    throw error;
  }
  
  console.log('[HDM Supabase] Logged:', log.event);
  return data;
}

/**
 * Poll trinity_tasks for new assignments
 */
async function pollTasks() {
  try {
    const { data: tasks, error } = await supabase
      .from('trinity_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('priority_rank', { ascending: true })
      .limit(10);
    
    if (error) {
      console.error('[HDM Supabase] Task poll error:', error);
      return;
    }
    
    console.log(`[HDM Supabase] Polled tasks: ${tasks?.length || 0} pending`);
    
    // Check for tasks that should be claimed by HDM
    const hdmTasks = tasks?.filter(t => 
      t.assigned_manager === 'HDM' || t.assigned_manager === 'All'
    );
    
    if (hdmTasks && hdmTasks.length > 0) {
      console.log(`[HDM Supabase] Found ${hdmTasks.length} tasks for HDM`);
    }
    
    return tasks;
  } catch (error) {
    console.error('[HDM Supabase] Task poll exception:', error);
  }
}

/**
 * Claim a task
 */
async function claimTask(taskId: number) {
  const { data, error } = await supabase
    .from('trinity_tasks')
    .update({ 
      status: 'in_progress',
      assigned_manager: 'HDM',
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select();
  
  if (error) {
    console.error('[HDM Supabase] Task claim error:', error);
    throw error;
  }
  
  console.log('[HDM Supabase] Claimed task:', taskId);
  
  // Log the claim
  await logToSupabase({
    agent: 'HDM',
    event: 'task_claimed',
    details: {
      task_id: taskId,
      timestamp: new Date().toISOString()
    },
    repid_tag: `VERIFIED:TaskClaimed:${taskId}`
  });
  
  return data;
}

/**
 * Start Trinity coordination with Supabase
 */
export async function startSupabaseCoordination() {
  const startTime = new Date();
  
  try {
    // Initial connection log
    await logToSupabase({
      agent: 'HDM',
      event: 'supabase_connected',
      details: {
        message: 'HDM connected to shared Supabase',
        timestamp: startTime.toISOString(),
        supabase_url: process.env.SUPABASE_URL,
        polling_interval: '30 seconds'
      },
      repid_tag: `VERIFIED:SupabaseConnected:${startTime.toISOString()}`
    });
    
    console.log('[HDM Supabase] Connected to shared Supabase for Trinity coordination');
    rotationActive = true;
    
    // Poll tasks every 30 seconds
    pollIntervalId = setInterval(async () => {
      heartbeatCount++;
      
      try {
        // Poll for tasks
        await pollTasks();
        
        // Log heartbeat
        await logToSupabase({
          agent: 'HDM',
          event: 'coordination_heartbeat',
          details: {
            message: 'HDM coordination heartbeat',
            heartbeat_number: heartbeatCount,
            timestamp: new Date().toISOString()
          },
          repid_tag: `VERIFIED:CoordinationHeartbeat:${heartbeatCount}`
        });
        
      } catch (error) {
        console.error('[HDM Supabase] Coordination error:', error);
      }
    }, 30000); // 30 seconds
    
    console.log('[HDM Supabase] Polling started - checking tasks every 30 seconds');
    
    return {
      status: 'connected',
      message: 'HDM connected to shared Supabase',
      supabase_url: process.env.SUPABASE_URL,
      polling_interval: '30 seconds',
      started_at: startTime.toISOString()
    };
    
  } catch (error) {
    console.error('[HDM Supabase] Connection error:', error);
    throw error;
  }
}

/**
 * Stop Supabase coordination
 */
export async function stopSupabaseCoordination() {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  
  rotationActive = false;
  
  await logToSupabase({
    agent: 'HDM',
    event: 'supabase_disconnected',
    details: {
      message: 'HDM disconnected from Supabase coordination',
      total_heartbeats: heartbeatCount,
      timestamp: new Date().toISOString()
    },
    repid_tag: 'VERIFIED:SupabaseDisconnected'
  });
  
  console.log('[HDM Supabase] Coordination stopped');
  return { status: 'stopped', heartbeats: heartbeatCount };
}

/**
 * Manually claim next available task
 */
export async function claimNextTask() {
  const tasks = await pollTasks();
  
  if (!tasks || tasks.length === 0) {
    return { status: 'no_tasks', message: 'No pending tasks available' };
  }
  
  // Find first HDM or All task
  const task = tasks.find(t => 
    t.assigned_manager === 'HDM' || t.assigned_manager === 'All'
  );
  
  if (!task) {
    return { status: 'no_hdm_tasks', message: 'No tasks for HDM' };
  }
  
  await claimTask(task.id);
  
  return {
    status: 'claimed',
    task: task
  };
}
