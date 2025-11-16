-- SUPABASE SCHEMA FIX: Align with HDM's expectations
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qnnpjhlxljtqyigedwkb/sql

-- 1. Fix autonomous_logs table
ALTER TABLE autonomous_logs 
  ADD COLUMN IF NOT EXISTS repid_tag TEXT DEFAULT 'REPORTED',
  ADD COLUMN IF NOT EXISTS verified_by TEXT[] DEFAULT '{}';

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'autonomous_logs'
ORDER BY ordinal_position;

-- 2. Fix agent_status table  
ALTER TABLE agent_status
  ADD COLUMN IF NOT EXISTS current_task TEXT,
  ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}';

-- Verify columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'agent_status'
ORDER BY ordinal_position;

-- 3. Verify trinity_tasks has all required columns
ALTER TABLE trinity_tasks
  ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'trinity',
  ADD COLUMN IF NOT EXISTS empathy_score FLOAT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP DEFAULT NULL;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'trinity_tasks'
ORDER BY ordinal_position;

-- 4. Create agent_coordination table if missing
CREATE TABLE IF NOT EXISTS agent_coordination (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  message_type TEXT NOT NULL,
  content JSONB NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP DEFAULT NULL
);

-- 5. Create learning_patterns table if missing (for MEL)
CREATE TABLE IF NOT EXISTS learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL,
  description TEXT,
  frequency INTEGER DEFAULT 1,
  confidence FLOAT DEFAULT 0.5,
  discovered_by TEXT DEFAULT 'MEL',
  first_seen TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- 6. Grant permissions (if needed)
GRANT ALL ON autonomous_logs TO authenticated, anon;
GRANT ALL ON agent_status TO authenticated, anon;
GRANT ALL ON trinity_tasks TO authenticated, anon;
GRANT ALL ON agent_coordination TO authenticated, anon;
GRANT ALL ON learning_patterns TO authenticated, anon;

-- SUCCESS! Your HDM heartbeat/status updates should now work.
