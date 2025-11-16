-- ============================================
-- TRINITY SYMPHONY - SUPABASE TABLES
-- Create these in Supabase SQL Editor
-- ============================================

-- Table 1: routing_events (ANFIS Coordination)
CREATE TABLE IF NOT EXISTS routing_events (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT,
  from_atm TEXT NOT NULL,
  to_atm TEXT NOT NULL,
  reason TEXT,
  anfis_score DECIMAL(4, 3),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for performance
CREATE INDEX idx_routing_events_timestamp ON routing_events(timestamp DESC);
CREATE INDEX idx_routing_events_from_atm ON routing_events(from_atm);
CREATE INDEX idx_routing_events_to_atm ON routing_events(to_atm);

-- Table 2: orchestrator_state (Rotation Management)
CREATE TABLE IF NOT EXISTS orchestrator_state (
  id BIGSERIAL PRIMARY KEY,
  orchestrator_atm TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rotation_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for active orchestrator lookups
CREATE INDEX idx_orchestrator_state_active ON orchestrator_state(active);

-- Insert default orchestrator (HDM)
INSERT INTO orchestrator_state (orchestrator_atm, active, started_at, rotation_reason)
VALUES ('HDM', TRUE, NOW(), 'Initial setup')
ON CONFLICT DO NOTHING;

-- Table 3: blockers (Auto-Diagnostic Support)
CREATE TABLE IF NOT EXISTS blockers (
  blocker_id BIGSERIAL PRIMARY KEY,
  task_id BIGINT,
  atm TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for blocker queries
CREATE INDEX idx_blockers_atm ON blockers(atm);
CREATE INDEX idx_blockers_unresolved ON blockers(atm) WHERE resolved_at IS NULL;

-- Enable Row Level Security (RLS) - Allow all operations for service role
ALTER TABLE routing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestrator_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockers ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (service role bypasses RLS)
CREATE POLICY "Allow all operations on routing_events" ON routing_events
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on orchestrator_state" ON orchestrator_state
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on blockers" ON blockers
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions to authenticated and anon roles
GRANT SELECT, INSERT, UPDATE, DELETE ON routing_events TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON orchestrator_state TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON blockers TO authenticated, anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE routing_events_id_seq TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE orchestrator_state_id_seq TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE blockers_blocker_id_seq TO authenticated, anon;

-- ============================================
-- DONE! Now HDM can coordinate with APM/MEL/ATS
-- ============================================
