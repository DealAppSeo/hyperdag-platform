// server/services/trinity/consumer-loop.ts
import { createClient } from '@supabase/supabase-js';
import { db } from '../../db';
import { trinityTasks } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const supabase = createClient(
  'https://qnnpjhlxljtqyigedwkb.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Use LOCAL database for task storage (PostgreSQL on Replit)
const useLocalDB = true;

interface Task {
  id: number;
  taskNumber?: number;
  title: string;
  summary?: string;
  prompt?: string;  // Legacy field for backwards compatibility
  priorityRank?: number;
  priority?: number;  // Legacy field
  status: string;
  createdAt?: string;
  created_at?: string;  // Legacy field
}

let isProcessing = false;
let circuitBreakerOpen = false;
let processedCount = 0;
const CIRCUIT_BREAKER_LIMIT = 100; // Reset limit

// Simple LLM call (using free tier)
async function generateResponse(prompt: string, taskTitle?: string): Promise<string> {
  try {
    // Dynamic system prompt based on task type
    const systemPrompt = taskTitle?.toLowerCase().includes('research') || taskTitle?.toLowerCase().includes('analysis')
      ? 'You are an expert AI researcher. Provide detailed, accurate technical analysis with specific examples and data.'
      : taskTitle?.toLowerCase().includes('blog') || taskTitle?.toLowerCase().includes('post') || taskTitle?.toLowerCase().includes('twitter') || taskTitle?.toLowerCase().includes('linkedin')
      ? 'You are a professional content writer. Create engaging, SEO-optimized content that drives engagement and conversions.'
      : taskTitle?.toLowerCase().includes('proposal') || taskTitle?.toLowerCase().includes('pitch') || taskTitle?.toLowerCase().includes('business')
      ? 'You are a business development expert. Write compelling proposals that highlight value propositions and ROI.'
      : 'You are an expert AI assistant. Provide comprehensive, actionable responses with specific examples and best practices.';

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('LLM generation error:', error);
    return `I hear your concern: "${prompt}". While I'm having technical difficulties providing a detailed response, please know that you're not alone. Philippians 4:6-7 reminds us to bring our worries to God in prayer. Consider reaching out to a trusted pastor or counselor for support.`;
  }
}

// Process a single task
async function processTask(task: Task): Promise<void> {
  // Get task content (support both old and new schema)
  const taskContent = task.prompt || task.title || '';
  const taskPreview = taskContent.substring(0, 50);
  
  console.log(`[HDM Consumer] Processing task #${task.taskNumber || task.id}: ${taskPreview}...`);

  // Update to in_progress status (LOCAL DATABASE)
  if (useLocalDB) {
    await db.update(trinityTasks)
      .set({ 
        status: 'in_progress',
        assignedManager: 'HDM',
        updatedAt: new Date()
      })
      .where(eq(trinityTasks.id, task.id));
  }

  try {
    // Build prompt from title + summary for Odyssey tasks
    const fullPrompt = task.summary 
      ? `Task: ${task.title}\n\nObjective: ${task.summary}\n\nProvide a comprehensive, actionable response.`
      : taskContent;
    
    // Generate response with task context
    const response = await generateResponse(fullPrompt, task.title);

    // Save completed task (LOCAL DATABASE)
    if (useLocalDB) {
      await db.update(trinityTasks)
        .set({
          status: 'completed',
          metadata: { response, completedBy: 'HDM' },
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(trinityTasks.id, task.id));
    }

    processedCount++;
    console.log(`[HDM Consumer] ✅ Completed task #${task.taskNumber || task.id} (${processedCount} total)`);

    // Log to autonomous_logs - Supabase only for now
    await supabase
      .from('autonomous_logs')
      .insert({
        agent: 'HDM',
        event: 'task_completed',
        details: { 
          task_id: task.id,
          task_number: task.taskNumber,
          title: task.title,
          preview: taskPreview
        },
        timestamp: new Date().toISOString()
      });

    // Check circuit breaker
    if (processedCount >= CIRCUIT_BREAKER_LIMIT) {
      circuitBreakerOpen = true;
      console.log(`[HDM Consumer] ⚠️ Circuit breaker OPEN - reached ${CIRCUIT_BREAKER_LIMIT} tasks`);
    }
  } catch (error: any) {
    console.error(`[HDM Consumer] ❌ Error processing task ${task.id}:`, error);

    // Mark as failed (LOCAL DATABASE)
    if (useLocalDB) {
      await db.update(trinityTasks)
        .set({
          status: 'failed',
          metadata: { error: error.message },
          updatedAt: new Date()
        })
        .where(eq(trinityTasks.id, task.id));
    }
  }
}

// Main consumer loop
export async function startConsumerLoop(): Promise<void> {
  console.log('[HDM Consumer] 🚀 Starting consumer loop...');

  // Reset circuit breaker every hour
  setInterval(() => {
    if (circuitBreakerOpen) {
      console.log('[HDM Consumer] 🔄 Resetting circuit breaker');
      circuitBreakerOpen = false;
      processedCount = 0;
    }
  }, 60 * 60 * 1000); // 1 hour

  // Main loop - check every 5 minutes
  setInterval(async () => {
    if (isProcessing) {
      console.log('[HDM Consumer] ⏳ Still processing previous batch, skipping...');
      return;
    }

    if (circuitBreakerOpen) {
      console.log('[HDM Consumer] 🛑 Circuit breaker open, waiting for reset...');
      return;
    }

    isProcessing = true;

    try {
      // Fetch pending tasks from LOCAL DATABASE
      let tasks;
      if (useLocalDB) {
        tasks = await db.select().from(trinityTasks)
          .where(eq(trinityTasks.status, 'not_started'))
          .orderBy(trinityTasks.priorityRank)
          .limit(10);
      } else {
        // Fallback to Supabase (legacy)
        const { data, error } = await supabase
          .from('trinity_tasks')
          .select('*')
          .eq('status', 'not_started')
          .order('priority', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(10);

        if (error) {
          console.error('[HDM Consumer] ❌ Error fetching tasks:', error);
          isProcessing = false;
          return;
        }
        tasks = data;
      }

      if (!tasks || tasks.length === 0) {
        console.log('[HDM Consumer] ✨ No tasks with status=not_started');
        isProcessing = false;
        return;
      }

      console.log(`[HDM Consumer] 📋 Found ${tasks.length} pending tasks`);

      // Process tasks sequentially
      for (const task of tasks) {
        if (circuitBreakerOpen) {
          console.log('[HDM Consumer] 🛑 Circuit breaker opened mid-batch, stopping');
          break;
        }
        await processTask(task);
      }

      console.log(`[HDM Consumer] ✅ Batch complete. Total processed: ${processedCount}`);
    } catch (error) {
      console.error('[HDM Consumer] ❌ Unexpected error in consumer loop:', error);
    } finally {
      isProcessing = false;
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Also run immediately on startup
  console.log('[HDM Consumer] 🔥 Running initial check...');
  setTimeout(async () => {
    console.log('[HDM Consumer] ⏰ Initial check timer fired!');
    isProcessing = true;
    try {
      if (useLocalDB) {
        console.log('[HDM Consumer] 📡 Fetching pending tasks from LOCAL DATABASE (PostgreSQL)...');
      } else {
        console.log('[HDM Consumer] 📡 Fetching pending tasks from Supabase...');
      }
      
      let tasks;
      if (useLocalDB) {
        tasks = await db.select().from(trinityTasks)
          .where(eq(trinityTasks.status, 'not_started'))
          .orderBy(trinityTasks.priorityRank)
          .limit(10);
      } else {
        // Fallback to Supabase
        const { data, error } = await supabase
          .from('trinity_tasks')
          .select('*')
          .eq('status', 'not_started')
          .order('priority', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(10);

        if (error) {
          console.error('[HDM Consumer] ❌ Supabase error:', error);
          isProcessing = false;
          return;
        }
        tasks = data;
      }

      if (!tasks || tasks.length === 0) {
        console.log('[HDM Consumer] ✨ No tasks with status=not_started found in initial check');
        isProcessing = false;
        return;
      }

      console.log(`[HDM Consumer] 📋 Processing ${tasks.length} tasks immediately`);
      for (const task of tasks) {
        if (circuitBreakerOpen) {
          console.log('[HDM Consumer] 🛑 Circuit breaker opened during initial check');
          break;
        }
        await processTask(task);
      }
      console.log('[HDM Consumer] ✅ Initial check complete');
    } catch (error) {
      console.error('[HDM Consumer] ❌ Error in initial check:', error);
    } finally {
      isProcessing = false;
    }
  }, 5000); // 5 seconds after startup
}

// Manual circuit breaker reset (call this if needed)
export function resetCircuitBreaker(): void {
  circuitBreakerOpen = false;
  processedCount = 0;
  console.log('[HDM Consumer] 🔄 Circuit breaker manually reset');
}
