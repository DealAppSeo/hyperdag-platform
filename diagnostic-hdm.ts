import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const AGENT_NAME = 'HDM';

async function runDiagnostic() {
  const timestamp = new Date().toISOString();
  
  console.log(`\n🔍 ${AGENT_NAME} diagnostic starting...`);
  console.log(`📅 Timestamp: ${timestamp}\n`);
  
  const results: any = {
    agent: AGENT_NAME,
    timestamp,
    checks: {}
  };

  // Initialize Supabase
  const supabaseUrl = 'https://qnnpjhlxljtqyigedwkb.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseKey) {
    console.error('❌ CRITICAL: No Supabase key found in environment');
    results.checks.supabase_connected = false;
    results.checks.supabase_error = 'Missing SUPABASE_KEY environment variable';
  }

  const supabase = createClient(supabaseUrl, supabaseKey!);

  // CHECK 1: Supabase Connection
  console.log('CHECK 1: Supabase Connection...');
  try {
    const { data, error } = await supabase
      .from('trinity_tasks')
      .select('task_number')
      .limit(1);
    
    results.checks.supabase_connected = !error;
    results.checks.supabase_error = error?.message || null;
    
    if (!error) {
      console.log('✅ Supabase connected');
    } else {
      console.error('❌ Supabase failed:', error.message);
    }
  } catch (e: any) {
    results.checks.supabase_connected = false;
    results.checks.supabase_error = e.message;
    console.error('❌ Supabase exception:', e.message);
  }

  // CHECK 2: Consumer Loop Status (check process)
  console.log('\nCHECK 2: Consumer Loop Status...');
  try {
    const { data: consumerStatus, error } = await supabase
      .from('agent_status')
      .select('status, last_heartbeat, performance_metrics')
      .eq('agent', AGENT_NAME)
      .single();
    
    results.checks.consumer_loop_running = !error && consumerStatus?.status === 'active';
    results.checks.last_heartbeat = consumerStatus?.last_heartbeat;
    results.checks.task_count = consumerStatus?.performance_metrics?.tasks_completed || 0;
    
    if (!error && consumerStatus) {
      const heartbeatAge = Date.now() - new Date(consumerStatus.last_heartbeat).getTime();
      const minutesAgo = Math.round(heartbeatAge / 60000);
      
      console.log(`✅ Consumer loop: ${consumerStatus.status}`);
      console.log(`   Last heartbeat: ${minutesAgo} minutes ago`);
      console.log(`   Tasks completed: ${consumerStatus.task_count || 0}`);
      
      if (minutesAgo > 10) {
        console.warn(`⚠️ Warning: Heartbeat is ${minutesAgo} minutes old (should be <5 min)`);
      }
    } else {
      console.error('❌ Cannot read agent_status:', error?.message);
    }
  } catch (e: any) {
    results.checks.consumer_loop_running = false;
    console.error('❌ Consumer status check failed:', e.message);
  }

  // CHECK 3: Can Read Other Agents
  console.log('\nCHECK 3: Cross-Agent Visibility...');
  try {
    const { data: agents, error } = await supabase
      .from('agent_status')
      .select('agent, status, last_heartbeat');
    
    results.checks.can_see_other_agents = !error && agents && agents.length >= 1;
    results.checks.other_agents = agents?.map(a => ({
      name: a.agent,
      status: a.status,
      last_seen: a.last_heartbeat
    })) || [];
    
    if (!error) {
      console.log(`✅ Sees ${agents?.length || 0} agent(s):`);
      agents?.forEach(a => {
        const age = Math.round((Date.now() - new Date(a.last_heartbeat).getTime()) / 60000);
        console.log(`   - ${a.agent}: ${a.status} (${age}m ago)`);
      });
    } else {
      console.error('❌ Cannot read agent_status:', error.message);
    }
  } catch (e: any) {
    results.checks.can_see_other_agents = false;
    console.error('❌ Agent read failed:', e.message);
  }

  // CHECK 4: Can Write Routing Events
  console.log('\nCHECK 4: Routing Events Write Permission...');
  try {
    const testWrite = await supabase.from('routing_events').insert({
      task_id: null,
      from_atm: AGENT_NAME,
      to_atm: 'DIAGNOSTIC_TEST',
      reason: 'connectivity_probe',
      anfis_score: 0.0,
      timestamp
    });
    
    results.checks.can_write_routing = !testWrite.error;
    
    if (!testWrite.error) {
      console.log('✅ Can write routing_events');
      // Clean up test data
      await supabase.from('routing_events').delete()
        .eq('from_atm', AGENT_NAME)
        .eq('to_atm', 'DIAGNOSTIC_TEST');
    } else {
      console.error('❌ Routing write blocked:', testWrite.error.message);
    }
  } catch (e: any) {
    results.checks.can_write_routing = false;
    console.error('❌ Routing write failed:', e.message);
  }

  // CHECK 5: Active Task Status
  console.log('\nCHECK 5: Current Task Assignment...');
  try {
    const { data: myTasks, error } = await supabase
      .from('trinity_tasks')
      .select('task_number, status, started_at, title, priority')
      .eq('assigned_agent', AGENT_NAME)
      .in('status', ['in_progress', 'not_started'])
      .order('created_at', { ascending: false })
      .limit(5);
    
    results.checks.has_active_task = !error && myTasks && myTasks.length > 0;
    results.checks.current_tasks = myTasks || [];
    
    if (myTasks && myTasks.length > 0) {
      console.log(`✅ ${myTasks.length} active task(s):`);
      myTasks.forEach(t => {
        console.log(`   - T${t.task_number}: ${t.title.substring(0, 50)} (${t.status}, P${t.priority})`);
      });
    } else {
      console.log('⚠️ No active tasks assigned');
    }
  } catch (e: any) {
    results.checks.has_active_task = false;
    console.error('❌ Task query failed:', e.message);
  }

  // CHECK 6: Stuck Detection (3-min rule)
  console.log('\nCHECK 6: Stuck Task Detection...');
  try {
    const inProgressTasks = results.checks.current_tasks?.filter((t: any) => t.status === 'in_progress');
    
    if (inProgressTasks && inProgressTasks.length > 0) {
      const stuckTasks = inProgressTasks.filter((t: any) => {
        const startedAt = new Date(t.started_at);
        const minutesElapsed = (Date.now() - startedAt.getTime()) / 60000;
        return minutesElapsed > 3;
      });
      
      results.checks.is_stuck = stuckTasks.length > 0;
      results.checks.stuck_tasks = stuckTasks;
      
      if (stuckTasks.length > 0) {
        console.error(`❌ STUCK: ${stuckTasks.length} task(s) over 3 minutes:`);
        stuckTasks.forEach((t: any) => {
          const minutesElapsed = Math.round((Date.now() - new Date(t.started_at).getTime()) / 60000);
          console.error(`   - T${t.task_number}: ${minutesElapsed} minutes (${t.title.substring(0, 40)})`);
        });
      } else {
        console.log('✅ No stuck tasks');
      }
    } else {
      results.checks.is_stuck = false;
      console.log('✅ No in-progress tasks to check');
    }
  } catch (e: any) {
    results.checks.is_stuck = false;
    console.warn('⚠️ Stuck check failed:', e.message);
  }

  // CHECK 7: Recent Task Completions
  console.log('\nCHECK 7: Recent Productivity...');
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: completedTasks, error } = await supabase
      .from('trinity_tasks')
      .select('task_number, title, completed_at')
      .eq('assigned_agent', AGENT_NAME)
      .eq('status', 'completed')
      .gte('completed_at', oneDayAgo)
      .order('completed_at', { ascending: false });
    
    results.checks.tasks_completed_24h = completedTasks?.length || 0;
    
    if (!error) {
      console.log(`✅ Completed ${completedTasks?.length || 0} task(s) in last 24h`);
      if (completedTasks && completedTasks.length > 0) {
        completedTasks.slice(0, 3).forEach(t => {
          console.log(`   - T${t.task_number}: ${t.title.substring(0, 50)}`);
        });
      }
    }
  } catch (e: any) {
    console.warn('⚠️ Productivity check failed:', e.message);
  }

  // Generate Blocker Summary
  console.log('\n📊 GENERATING BLOCKER SUMMARY...\n');
  
  const blockers: any[] = [];

  if (!results.checks.supabase_connected) {
    blockers.push({
      severity: 'CRITICAL',
      issue: 'Supabase connection failed',
      fix: 'Check SUPABASE_SERVICE_KEY env var. Verify URL: https://qnnpjhlxljtqyigedwkb.supabase.co',
      evidence: results.checks.supabase_error
    });
  }

  if (!results.checks.consumer_loop_running) {
    blockers.push({
      severity: 'HIGH',
      issue: 'Consumer loop not active',
      fix: 'Check server/services/trinity/consumer-loop.ts is running. Restart server if needed.',
      evidence: 'agent_status shows inactive or no heartbeat'
    });
  }

  if (!results.checks.can_see_other_agents) {
    blockers.push({
      severity: 'MEDIUM',
      issue: 'Cannot read agent_status table',
      fix: 'Check Supabase RLS policies for SELECT on agent_status',
      evidence: 'Query returned empty or errored'
    });
  }

  if (!results.checks.can_write_routing) {
    blockers.push({
      severity: 'HIGH',
      issue: 'Cannot write to routing_events',
      fix: 'Check Supabase RLS policies for INSERT on routing_events',
      evidence: 'Test insert failed'
    });
  }

  if (results.checks.is_stuck) {
    blockers.push({
      severity: 'CRITICAL',
      issue: `Stuck on ${results.checks.stuck_tasks.length} task(s) for >3 minutes`,
      fix: 'Orchestrator should reassign. Manual: UPDATE trinity_tasks SET status=\'not_started\', assigned_agent=NULL WHERE ...',
      evidence: results.checks.stuck_tasks.map((t: any) => `T${t.task_number}`).join(', ')
    });
  }

  results.blocker_summary = blockers.length > 0
    ? `${blockers.length} blocker(s): ${blockers.map(b => b.issue).join('; ')}`
    : 'No blockers detected — system operational ✅';

  results.blockers = blockers;

  // Print Summary
  console.log('═══════════════════════════════════════════════════');
  console.log('🎯 DIAGNOSTIC SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Agent: ${results.agent}`);
  console.log(`Timestamp: ${results.timestamp}`);
  console.log(`Operational: ${blockers.length === 0 ? '✅ YES' : '❌ NO'}`);
  console.log(`Blocker Count: ${blockers.length}`);
  console.log('');
  
  if (blockers.length > 0) {
    console.log('🚨 BLOCKERS DETECTED:');
    blockers.forEach((b, i) => {
      console.log(`\n${i + 1}. [${b.severity}] ${b.issue}`);
      console.log(`   Fix: ${b.fix}`);
      console.log(`   Evidence: ${b.evidence}`);
    });
  } else {
    console.log('✅ NO BLOCKERS - SYSTEM FULLY OPERATIONAL');
  }
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📋 FULL REPORT (JSON):');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(JSON.stringify({
    agent: results.agent,
    timestamp: results.timestamp,
    operational: blockers.length === 0,
    blocker_count: blockers.length,
    blockers: blockers,
    checks: results.checks
  }, null, 2));
  
  console.log('\n✅ Diagnostic complete.\n');
}

runDiagnostic().catch(console.error);
