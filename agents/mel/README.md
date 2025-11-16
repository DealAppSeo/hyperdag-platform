# MEL (ImageBearer) - Reflection Engine

## Overview

MEL is the third agent in Trinity Symphony, deployed on **Lovable.dev** (or similar Deno-based platform) and serving as the reflection and learning coordinator.

**Mission**: Cross-platform coordination, pattern learning, and Trinity Symphony orchestration

**Platform**: Lovable.dev (Deno Edge Functions) or Supabase Edge Functions  
**Technology**: Deno, TypeScript, Supabase JS SDK  
**Connection**: Reads/writes to HyperDAG Supabase database

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Trinity Symphony                       │
├─────────────┬──────────────────┬────────────────────────┤
│    HDM      │       APM        │         MEL            │
│  (Replit)   │    (Replit)      │   (Lovable/Deno)       │
├─────────────┼──────────────────┼────────────────────────┤
│ Hope        │ Prayer           │ Reflection             │
│ Listener    │ Writer           │ Engine                 │
│             │                  │                        │
│ Responds to │ Creates tasks    │ Learns patterns        │
│ prayers     │ from user needs  │ Coordinates agents     │
│             │                  │                        │
│ Empathy     │ Task             │ Cross-platform         │
│ scoring     │ prioritization   │ messaging              │
└─────────────┴──────────────────┴────────────────────────┘
              ▼                  ▼                  ▼
        ┌──────────────────────────────────────────────┐
        │    Supabase Database (Shared State)          │
        │  • trinity_tasks                             │
        │  • autonomous_logs                           │
        │  • agent_status                              │
        │  • learning_patterns                         │
        └──────────────────────────────────────────────┘
```

---

## Deno Edge Function (Lovable Deployment)

**File**: `supabase/functions/mel-coordinator/index.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req) => {
  try {
    // Connect to HyperDAG Supabase
    const hyperdag = createClient(
      Deno.env.get('HYPERDAG_SUPABASE_URL')!,
      Deno.env.get('HYPERDAG_SUPABASE_ANON_KEY')!
    )

    // MEL's core responsibilities:
    // 1. Read completed tasks from HDM and APM
    // 2. Extract learning patterns
    // 3. Coordinate agent rotation (20-min cycles)
    // 4. Monitor Trinity health
    // 5. Escalate issues to human

    const { data: completedTasks, error } = await hyperdag
      .from('trinity_tasks')
      .select('*')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10)

    if (error) throw error

    // Learning extraction
    const patterns = extractPatterns(completedTasks)

    // Log MEL activity
    await hyperdag
      .from('autonomous_logs')
      .insert({
        agent: 'MEL',
        event: 'learning_cycle',
        message: `Analyzed ${completedTasks.length} tasks`,
        details: { patterns },
        certainty_score: 1.0,
        verified_by: ['MEL']
      })

    return new Response(
      JSON.stringify({
        success: true,
        agent: 'MEL',
        tasksAnalyzed: completedTasks.length,
        patternsFound: patterns.length
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (e) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: e.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})

function extractPatterns(tasks: any[]) {
  // TODO: Implement pattern learning
  // - Common prayer themes
  // - Empathy score trends
  // - Task completion times
  // - Agent performance metrics
  return []
}
```

---

## Environment Variables (Lovable)

Set these in your Lovable project settings or Supabase Edge Function secrets:

```bash
HYPERDAG_SUPABASE_URL=https://qnnpjhlxljtqyigedwkb.supabase.co
HYPERDAG_SUPABASE_ANON_KEY=your_anon_key_here
HYPERDAG_SUPABASE_SERVICE_KEY=your_service_key_here  # For admin operations
```

---

## Connection Test Script

**File**: `agents/mel/test-connection.ts` (Deno script)

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req) => {
  try {
    // Create client with HyperDAG credentials
    const hyperdag = createClient(
      Deno.env.get('HYPERDAG_SUPABASE_URL')!,
      Deno.env.get('HYPERDAG_SUPABASE_ANON_KEY')!
    )

    // Test 1: Can we query tables?
    const { data: tables, error: tablesError } = await hyperdag
      .from('trinity_tasks')
      .select('*')
      .limit(1)

    if (tablesError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          test: 'query',
          error: tablesError.message 
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Test 2: Can we insert a test record?
    const { data: insertData, error: insertError } = await hyperdag
      .from('trinity_tasks')
      .insert({
        prompt: 'TEST_CONNECTION from MEL',
        assigned_agent: 'MEL',
        status: 'not_started',
        priority: 1,
        created_at: new Date().toISOString()
      })
      .select()

    if (insertError) {
      return new Response(
        JSON.stringify({ 
          success: false,
          test: 'insert',
          error: insertError.message,
          queryWorked: true
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Success!
    return new Response(
      JSON.stringify({
        success: true,
        message: 'HyperDAG proxy works!',
        readTest: tables ? 'PASS' : 'FAIL',
        writeTest: insertData ? 'PASS' : 'FAIL',
        sampleTask: tables?.[0],
        insertedTask: insertData?.[0]
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (e) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: e.message,
        stack: e.stack
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})
```

---

## MEL's Responsibilities

### 1. Learning Coordinator
- Analyze completed tasks from HDM and APM
- Extract patterns (common themes, empathy trends, success rates)
- Store insights in `learning_patterns` table
- Share learnings back to HDM and APM

### 2. Agent Rotation Manager
- Monitor 20-minute rotation cycles
- Ensure each agent gets equal work time
- Track performance metrics per agent
- Pause underperforming agents

### 3. Trinity Health Monitor
- Check heartbeats from all agents
- Detect missing agents (Dead Man's Switch)
- Alert user if any agent offline for 24+ hours
- Coordinate recovery procedures

### 4. Cross-Platform Bridge
- Read from Replit-hosted agents (HDM, APM)
- Write coordination messages
- Handle async communication
- Resolve conflicts

### 5. Human Escalation
- Collect flagged tasks needing review
- Summarize for user dashboard
- Track resolution outcomes
- Update agent behavior based on feedback

---

## Deployment Steps (Lovable)

### 1. Create Lovable Project
```bash
# On Lovable.dev
1. Create new project
2. Enable Supabase integration
3. Set environment variables
```

### 2. Deploy Edge Function
```bash
# In Lovable project
supabase functions deploy mel-coordinator \
  --project-ref your-lovable-project-id
```

### 3. Test Connection
```bash
curl https://your-lovable-project.supabase.co/functions/v1/mel-coordinator
```

Expected response:
```json
{
  "success": true,
  "agent": "MEL",
  "tasksAnalyzed": 5,
  "patternsFound": 3
}
```

---

## Supabase Tables (MEL-specific)

### learning_patterns
```sql
CREATE TABLE learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL, -- theme | empathy_trend | performance
  description TEXT,
  frequency INTEGER DEFAULT 1,
  confidence FLOAT, -- 0-1
  discovered_by TEXT, -- MEL
  first_seen TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```

### agent_coordination
```sql
CREATE TABLE agent_coordination (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  message_type TEXT, -- rotation | learning | alert
  content JSONB,
  sent_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP
);
```

---

## 20-Minute Rotation Logic

MEL manages agent rotation:

```typescript
// Pseudo-code for rotation
const ROTATION_INTERVAL = 20 * 60 * 1000; // 20 minutes

setInterval(async () => {
  const agents = ['HDM', 'APM', 'MEL'];
  const currentAgent = await getCurrentActiveAgent();
  const nextAgent = getNextAgent(currentAgent, agents);
  
  // Pause current agent
  await updateAgentStatus(currentAgent, 'paused');
  
  // Activate next agent
  await updateAgentStatus(nextAgent, 'active');
  
  // Log rotation
  await logRotation(currentAgent, nextAgent);
  
}, ROTATION_INTERVAL);
```

---

## Testing MEL Locally (Deno)

```bash
# Install Deno
curl -fsSL https://deno.land/x/install/install.sh | sh

# Run test script
export HYPERDAG_SUPABASE_URL=https://qnnpjhlxljtqyigedwkb.supabase.co
export HYPERDAG_SUPABASE_ANON_KEY=your_key

deno run --allow-net --allow-env test-connection.ts
```

---

## Integration with HDM and APM

**Communication Pattern**:

1. **APM** writes prayer request → `trinity_tasks` table
2. **HDM** picks up task, generates response → updates `trinity_tasks`
3. **MEL** analyzes completed task → extracts pattern → writes to `learning_patterns`
4. **MEL** shares insight → writes to `autonomous_logs` with `verified_by: ['MEL']`
5. **HDM/APM** read MEL's insights → adjust behavior

**Example Flow**:
```
APM: "User needs encouragement about job loss"
  ↓ (writes to trinity_tasks)
HDM: Generates response, scores 0.85 empathy
  ↓ (completes task)
MEL: Detects pattern "job_loss theme, high empathy"
  ↓ (learns)
MEL: "HDM handles job loss well, prioritize similar tasks"
  ↓ (shares insight)
APM: Assigns more job loss prayers to HDM
```

---

## Next Steps

- [ ] Deploy MEL Edge Function on Lovable
- [ ] Test connection to HyperDAG Supabase
- [ ] Implement pattern learning algorithm
- [ ] Build 20-minute rotation system
- [ ] Create mobile dashboard for monitoring
- [ ] Enable voice command integration

---

**Mission**: Coordinating the Trinity Symphony for maximum compassion and efficiency

🧠 MEL - The reflective mind of Trinity Symphony
