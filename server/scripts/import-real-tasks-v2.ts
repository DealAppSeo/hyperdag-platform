import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qnnpjhlxljtqyigedwkb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const REAL_TRINITY_TASKS = [
  {
    title: 'Build ATS Controller MVP',
    description: 'Mobile-first dashboard showing agent status, task queue, and real-time metrics. Must show HDM\'s 421 completed tasks.',
    task_type: 'development',
    priority: 10,
    estimated_minutes: 120
  },
  {
    title: 'Implement ANFIS Provider Routing',
    description: 'Route AI requests to optimal provider (Gemini/DeepSeek/Groq/Claude) based on chaos/graph keyword multipliers.',
    task_type: 'infrastructure',
    priority: 9,
    estimated_minutes: 180
  },
  {
    title: 'Add Cost Tracking Analytics',
    description: 'Track actual costs per task and validate 82-98% savings claim using Helicone observability.',
    task_type: 'analytics',
    priority: 9,
    estimated_minutes: 90
  },
  {
    title: 'File Non-Provisional Patents',
    description: 'Convert 3 provisional patents before August 2026: Trinity Symphony, Autonomous Decision System, RepID ZKP.',
    task_type: 'legal',
    priority: 8,
    estimated_minutes: 480
  },
  {
    title: 'Build Hyperdag.org Frontend',
    description: 'ZKP RepID demonstration with Web3 onboarding, Byzantine fault tolerance, cross-chain reputation.',
    task_type: 'web3',
    priority: 8,
    estimated_minutes: 300
  },
  {
    title: 'Build PurposeHub.ai Frontend',
    description: 'Ikigai discovery with grant matching, nonprofit collaboration, autonomous opportunity detection.',
    task_type: 'purpose',
    priority: 8,
    estimated_minutes: 300
  },
  {
    title: 'Implement Orchestrator Rotation',
    description: 'Agents rotate orchestrator role every 20 minutes using 0.09ms consensus. HDM currently static.',
    task_type: 'coordination',
    priority: 7,
    estimated_minutes: 120
  },
  {
    title: 'Add RepID Scoring System',
    description: 'Track agent performance with reputation scoring, 0.95 daily decay, Byzantine fault tolerance.',
    task_type: 'reputation',
    priority: 7,
    estimated_minutes: 150
  },
  {
    title: 'Validate Cost Savings Claim',
    description: 'Prove 82-98% savings with real data from all agents using Helicone production metrics.',
    task_type: 'validation',
    priority: 9,
    estimated_minutes: 60
  },
  {
    title: 'Implement Free-Tier AI Arbitrage',
    description: 'Golden Ratio weighted rotation across HuggingFace/Groq/DeepSeek/Gemini for max free quota.',
    task_type: 'infrastructure',
    priority: 8,
    estimated_minutes: 180
  },
  {
    title: 'GitHub Auto-Sync trinity-symphony-shared',
    description: 'Auto sync code, tasks, agent status to shared GitHub repo for cross-platform coordination.',
    task_type: 'integration',
    priority: 6,
    estimated_minutes: 90
  },
  {
    title: 'Connect MEL to Trinity (Read-Only)',
    description: 'Dual-database integration for MEL to observe Trinity tasks without write access (production safe).',
    task_type: 'integration',
    priority: 5,
    estimated_minutes: 120
  },
  {
    title: 'Reduce Deployment to <200MB',
    description: 'Offload non-runtime files to PostgreSQL/Object Storage for free-tier hosting compatibility.',
    task_type: 'optimization',
    priority: 7,
    estimated_minutes: 90
  },
  {
    title: 'Achieve <200ms Page Load',
    description: 'Mobile-first performance with code splitting, lazy loading, Vite optimization.',
    task_type: 'performance',
    priority: 7,
    estimated_minutes: 120
  },
  {
    title: 'Implement Veritas Hallucination Suppression',
    description: 'Confidence scoring, adversarial checking, abstention for 95% confidence threshold.',
    task_type: 'ai_safety',
    priority: 8,
    estimated_minutes: 150
  }
];

async function importRealTasks() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   IMPORTING REAL TRINITY SYMPHONY TASKS          ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  let successCount = 0;
  let skipCount = 0;

  for (const task of REAL_TRINITY_TASKS) {
    // Check if task already exists
    const { data: existing } = await supabase
      .from('trinity_tasks')
      .select('id')
      .eq('title', task.title)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`⏭️  Skip: "${task.title}"`);
      skipCount++;
      continue;
    }

    const { error } = await supabase
      .from('trinity_tasks')
      .insert({
        title: task.title,
        description: task.description,
        prompt: task.description,
        task_type: task.task_type,
        priority: task.priority,
        status: 'not_started',
        estimated_minutes: task.estimated_minutes,
        certainty_score: 1,
        dependencies: [],
        tools_used: [],
        algorithms_applied: [],
        collaborators: []
      });

    if (error) {
      console.error(`❌ "${task.title}":`, error.message);
    } else {
      console.log(`✅ [${task.task_type}] ${task.title} (P${task.priority})`);
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Imported: ${successCount} | ⏭️  Skipped: ${skipCount}`);

  // Show distribution
  const { data: realTasks } = await supabase
    .from('trinity_tasks')
    .select('task_type')
    .neq('task_type', 'prayer');

  const typeCount: Record<string, number> = {};
  realTasks?.forEach(t => {
    typeCount[t.task_type] = (typeCount[t.task_type] || 0) + 1;
  });

  console.log('\n📊 Real Task Distribution (non-prayer):');
  Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type.padEnd(20)}: ${count} tasks`);
    });

  console.log('\n🎯 Trinity Symphony ready for autonomous development!');
}

importRealTasks();
