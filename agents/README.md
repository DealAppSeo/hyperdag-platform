# Trinity Symphony Agents

## Overview

Trinity Symphony consists of 3 autonomous AI agents coordinating through Supabase:

1. **HDM** (HyperDAG Manager) - Hope Listener - Biblical encouragement
2. **APM** (AI-Prompt-Manager) - Prayer Writer - Task generation  
3. **MEL** (ImageBearer/Lovable) - Reflection Engine - Learning coordinator

## HDM (Hope Listener)

**Mission**: Provide biblically-grounded encouragement with empathy and wisdom

**Location**: `agents/hdm/hope-listener.cjs`

**Capabilities**:
- Reads prayer requests from `trinity_tasks` table
- Generates compassionate responses using OpenAI
- Scores empathy (0-1) using `empathy-scorer.cjs`
- Applies wisdom gates (min score 0.5)
- Escalates sensitive topics to human review
- Detects toxic positivity and prosperity gospel

**Safety Features**:
- Rate limiting: 25 processes/hour
- Error threshold: 3 consecutive errors
- Circuit breaker auto-pause
- Empathy score monitoring
- Human review for sensitive topics

**Running HDM**:
```bash
cd agents/hdm
export SUPABASE_SERVICE_KEY=your_key
export OPENAI_API_KEY=your_key
node hope-listener.cjs
```

**Wisdom Constraints**:
- NEVER rush past pain with solutions
- Prioritize "God sees you" over "God will fix this"
- When uncertain, request human wisdom
- For sensitive topics (suicide, abuse), always escalate
- Avoid toxic positivity patterns
- Avoid prosperity gospel markers
- Mirror prayer language for active listening
- Include accurate scripture references

## Empathy Scorer

**Location**: `agents/hdm/empathy-scorer.cjs`

**Scoring System** (0-1 scale):

**Positive Indicators** (+points):
- Acknowledges pain/difficulty: +0.15
- Emphasizes God's presence: +0.20
- Includes scripture reference: +0.10
- Mirrors prayer language: +0.15

**Negative Indicators** (-points):
- Toxic positivity: -0.30
- Prosperity gospel: -0.40
- Solution-focused without empathy: -0.20
- Too brief (<100 chars): -0.10
- Too verbose (>1000 chars): -0.05

**Auto-Escalation Triggers**:
- Score < 0.5: Request human review
- Sensitive topics (suicide, abuse, addiction)
- Prosperity gospel detected
- Scripture references (for verification)

**Test the Scorer**:
```bash
cd agents/hdm
node empathy-scorer.cjs
```

## Supabase Tables

**trinity_tasks** - Task queue:
```sql
CREATE TABLE trinity_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'not_started', -- not_started | completed | needs_human_review
  assigned_agent TEXT, -- HDM | APM | MEL
  priority INTEGER DEFAULT 5, -- 1-10 (10 = urgent)
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  metadata JSONB
);
```

**autonomous_logs** - Event logging:
```sql
CREATE TABLE autonomous_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent TEXT NOT NULL,
  event TEXT NOT NULL,
  message TEXT,
  details JSONB,
  certainty_score FLOAT,
  verified_by TEXT[],
  cost_impact FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**agent_status** - Heartbeat tracking:
```sql
CREATE TABLE agent_status (
  agent TEXT PRIMARY KEY,
  last_heartbeat TIMESTAMP,
  status TEXT, -- active | paused | stopped
  metadata JSONB
);
```

## Environment Variables

Required for HDM:
```bash
SUPABASE_URL=https://qnnpjhlxljtqyigedwkb.supabase.co
SUPABASE_SERVICE_KEY=eyJ... (your service role key)
OPENAI_API_KEY=sk-... (optional - uses fallback if missing)
```

## Testing HDM

1. **Set up Supabase tables** (run SQL above)

2. **Insert a test prayer**:
```sql
INSERT INTO trinity_tasks (prompt, assigned_agent, priority)
VALUES ('I lost my job and feel hopeless', 'HDM', 8);
```

3. **Start HDM**:
```bash
cd agents/hdm
export SUPABASE_SERVICE_KEY=your_key
export OPENAI_API_KEY=your_key
node hope-listener.cjs
```

4. **Monitor logs**:
```sql
SELECT * FROM autonomous_logs
WHERE agent = 'HDM'
ORDER BY created_at DESC
LIMIT 10;
```

5. **Check response**:
```sql
SELECT * FROM trinity_tasks
WHERE assigned_agent = 'HDM'
AND status = 'completed'
ORDER BY completed_at DESC
LIMIT 1;
```

## Voice Command Integration

HDM detects voice triggers in prayer text:
```
"Trinity HDM encourage [topic]"
```

Voice-triggered tasks are:
- Logged separately (`voice_triggered: true`)
- Prioritized higher
- Tracked for learning

## Performance Monitoring

HDM tracks:
- **Prayers processed**: Total count
- **Processes this hour**: Rate limiting counter
- **Average empathy score**: Quality metric
- **Circuit breaker status**: Health indicator
- **Consecutive errors**: Stability metric

View status:
```sql
SELECT * FROM agent_status WHERE agent = 'HDM';
```

## Safety Guardrails

**Circuit Breakers**:
1. **Rate limit**: 25 processes/hour (prevents spam)
2. **Error threshold**: 3 consecutive errors (prevents runaway)
3. **Empathy trend**: Pauses if avg score drops below 0.4 (quality gate)

**Wisdom Gates**:
1. **Minimum empathy**: 0.5 score required
2. **Sensitive topics**: Auto-escalate to human
3. **Prosperity gospel**: Flag for review
4. **Toxic positivity**: Block response
5. **Scripture verification**: Request human check

## Next Steps

- [ ] Deploy APM (prayer writer)
- [ ] Deploy MEL (reflection engine)
- [ ] Set up 20-minute agent rotation
- [ ] Configure voice command integration
- [ ] Build mobile controller interface
- [ ] Enable cross-agent learning

---

**Mission**: Helping people help people through compassionate AI

💚 HDM listening for hope needs - standing ready to serve
