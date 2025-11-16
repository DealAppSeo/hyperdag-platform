import { db } from "../db";
import { sql } from "drizzle-orm";
import { 
  networkingGoals,
  goalProgress,
  goalRewards
} from "@shared/schema";

export async function migrateNetworkingGoals() {
  console.log("[migration] Starting networking goals tables migration");
  
  try {
    // Create networking_goals table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS networking_goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        target_value INTEGER NOT NULL,
        current_value INTEGER DEFAULT 0,
        unit TEXT NOT NULL,
        deadline TIMESTAMP,
        priority TEXT DEFAULT 'medium',
        recurring BOOLEAN DEFAULT false,
        recurring_period TEXT,
        status TEXT DEFAULT 'active',
        reminder_frequency TEXT,
        visibility TEXT DEFAULT 'private',
        tags TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        last_milestone_at TIMESTAMP,
        streak_count INTEGER DEFAULT 0,
        best_streak_count INTEGER DEFAULT 0,
        ai_generated BOOLEAN DEFAULT false,
        related_goal_id INTEGER REFERENCES networking_goals(id)
      )
    `);
    
    console.log("[migration] networking_goals table created or verified");
    
    // Create goal_progress table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS goal_progress (
        id SERIAL PRIMARY KEY,
        goal_id INTEGER NOT NULL REFERENCES networking_goals(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        value INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        notes TEXT,
        source_tags TEXT[],
        milestone_reached BOOLEAN DEFAULT false,
        reward_points INTEGER DEFAULT 0,
        reward_tokens INTEGER DEFAULT 0,
        metadata JSONB
      )
    `);
    
    console.log("[migration] goal_progress table created or verified");
    
    // Create goal_rewards table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS goal_rewards (
        id SERIAL PRIMARY KEY,
        goal_id INTEGER NOT NULL REFERENCES networking_goals(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        amount INTEGER,
        badge_id INTEGER REFERENCES badges(id),
        description TEXT NOT NULL,
        awarded_at TIMESTAMP DEFAULT NOW(),
        claimed_at TIMESTAMP,
        expires_at TIMESTAMP,
        notified BOOLEAN DEFAULT false
      )
    `);
    
    console.log("[migration] goal_rewards table created or verified");
    
    console.log("[migration] Networking goals migration completed successfully");
  } catch (error) {
    console.error("[migration] Error during networking goals migration:", error);
    throw error;
  }
}