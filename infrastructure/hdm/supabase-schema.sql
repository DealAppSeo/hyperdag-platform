-- Supabase Tables for Trinity Symphony
-- Run this in Supabase SQL Editor: https://qnnpjhlxljtqyigedwkb.supabase.co/project/_/sql

-- 1. Trinity Tasks Table
CREATE TABLE IF NOT EXISTS trinity_tasks (
  id SERIAL PRIMARY KEY,
  task_number INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT,
  summary TEXT NOT NULL DEFAULT '',
  rationale TEXT NOT NULL DEFAULT '',
  priority_rank INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  assigned_manager VARCHAR(50) NOT NULL DEFAULT 'All',
  dependencies INTEGER[] DEFAULT '{}',
  estimated_effort VARCHAR(20) DEFAULT 'moderate',
  impact VARCHAR(20) DEFAULT 'medium',
  is_autonomous BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Autonomous Logs Table
CREATE TABLE IF NOT EXISTS autonomous_logs (
  id SERIAL PRIMARY KEY,
  agent VARCHAR(50) NOT NULL,
  event VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  repid_tag VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Agent Status Table
CREATE TABLE IF NOT EXISTS agent_status (
  id SERIAL PRIMARY KEY,
  agent_name VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'idle',
  last_heartbeat TIMESTAMP DEFAULT NOW(),
  current_task TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trinity_tasks_status ON trinity_tasks(status);
CREATE INDEX IF NOT EXISTS idx_trinity_tasks_priority ON trinity_tasks(priority_rank);
CREATE INDEX IF NOT EXISTS idx_autonomous_logs_agent ON autonomous_logs(agent);
CREATE INDEX IF NOT EXISTS idx_autonomous_logs_event ON autonomous_logs(event);
CREATE INDEX IF NOT EXISTS idx_agent_status_name ON agent_status(agent_name);

-- Grant permissions (if needed)
ALTER TABLE trinity_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomous_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;

-- Create policies for anon access
CREATE POLICY "Enable read access for all users" ON trinity_tasks FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON trinity_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON trinity_tasks FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON autonomous_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON autonomous_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON agent_status FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON agent_status FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON agent_status FOR UPDATE USING (true);
