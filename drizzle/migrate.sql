-- Create RFIs table
CREATE TABLE IF NOT EXISTS rfis (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  submitter_id INTEGER NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  category VARCHAR(50),
  tags TEXT,
  funding_goal INTEGER,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  total_staked INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create RFPs table
CREATE TABLE IF NOT EXISTS rfps (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  rfi_id INTEGER REFERENCES rfis(id),
  submitter_id INTEGER NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  category VARCHAR(50),
  tags TEXT,
  funding_goal INTEGER,
  deadline TIMESTAMP,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  total_staked INTEGER NOT NULL DEFAULT 0,
  total_funded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  rfp_id INTEGER NOT NULL REFERENCES rfps(id),
  submitter_id INTEGER NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'submitted',
  funding_request INTEGER,
  milestone_count INTEGER NOT NULL DEFAULT 1,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Votes table
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  rfi_id INTEGER REFERENCES rfis(id),
  rfp_id INTEGER REFERENCES rfps(id),
  proposal_id INTEGER REFERENCES proposals(id),
  vote_type VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT one_vote_target CHECK (
    (rfi_id IS NOT NULL AND rfp_id IS NULL AND proposal_id IS NULL) OR
    (rfi_id IS NULL AND rfp_id IS NOT NULL AND proposal_id IS NULL) OR
    (rfi_id IS NULL AND rfp_id IS NULL AND proposal_id IS NOT NULL)
  ),
  CONSTRAINT unique_user_vote_rfi UNIQUE (user_id, rfi_id),
  CONSTRAINT unique_user_vote_rfp UNIQUE (user_id, rfp_id),
  CONSTRAINT unique_user_vote_proposal UNIQUE (user_id, proposal_id)
);

-- Create Stakes table
CREATE TABLE IF NOT EXISTS stakes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  rfi_id INTEGER REFERENCES rfis(id),
  rfp_id INTEGER REFERENCES rfps(id),
  proposal_id INTEGER REFERENCES proposals(id),
  amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT one_stake_target CHECK (
    (rfi_id IS NOT NULL AND rfp_id IS NULL AND proposal_id IS NULL) OR
    (rfi_id IS NULL AND rfp_id IS NOT NULL AND proposal_id IS NULL) OR
    (rfi_id IS NULL AND rfp_id IS NULL AND proposal_id IS NOT NULL)
  )
);

-- Create Donations table
CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  rfp_id INTEGER REFERENCES rfps(id),
  proposal_id INTEGER REFERENCES proposals(id),
  amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  transaction_hash VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT one_donation_target CHECK (
    (rfp_id IS NOT NULL AND proposal_id IS NULL) OR
    (rfp_id IS NULL AND proposal_id IS NOT NULL)
  )
);

-- Create Grant Sources table
CREATE TABLE IF NOT EXISTS grant_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  website_url VARCHAR(255),
  category VARCHAR(50),
  focus_areas TEXT,
  min_funding INTEGER,
  max_funding INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Grant Matches table
CREATE TABLE IF NOT EXISTS grant_matches (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER REFERENCES proposals(id),
  grant_source_id INTEGER REFERENCES grant_sources(id),
  match_score FLOAT NOT NULL,
  match_reasons TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'suggested',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_proposal_grant_match UNIQUE (proposal_id, grant_source_id)
);

-- Create Grant Flow Activities table
CREATE TABLE IF NOT EXISTS grant_flow_activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  activity_type VARCHAR(50) NOT NULL,
  rfi_id INTEGER REFERENCES rfis(id),
  rfp_id INTEGER REFERENCES rfps(id),
  proposal_id INTEGER REFERENCES proposals(id),
  reputation_earned INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Grants table 
CREATE TABLE IF NOT EXISTS grants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  grant_source_id INTEGER REFERENCES grant_sources(id),
  proposal_id INTEGER REFERENCES proposals(id),
  amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  application_date TIMESTAMP,
  approval_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
