import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { log } from '../vite';
import ws from 'ws';

// Configure Neon to use ws
neonConfig.webSocketConstructor = ws;

/**
 * Migration script to add Medium and Stack Overflow columns to the users table
 */
async function main() {
  try {
    log('[migration] Starting Medium and Stack Overflow columns migration');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });
    
    // Check if medium_id_hash column exists
    const mediumColumnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'medium_id_hash'
    `);
    
    if (mediumColumnExists.rows.length === 0) {
      log('[migration] Adding Medium columns to users table');
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN medium_id_hash TEXT,
        ADD COLUMN medium_username TEXT UNIQUE,
        ADD COLUMN medium_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN medium_followers INTEGER,
        ADD COLUMN medium_articles INTEGER
      `);
      log('[migration] Medium columns added successfully');
    } else {
      log('[migration] Medium columns already exist, skipping');
    }
    
    // Check if stackoverflow_id_hash column exists
    const stackoverflowColumnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'stackoverflow_id_hash'
    `);
    
    if (stackoverflowColumnExists.rows.length === 0) {
      log('[migration] Adding Stack Overflow columns to users table');
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN stackoverflow_id_hash TEXT,
        ADD COLUMN stackoverflow_username TEXT UNIQUE,
        ADD COLUMN stackoverflow_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN stackoverflow_reputation INTEGER
      `);
      log('[migration] Stack Overflow columns added successfully');
    } else {
      log('[migration] Stack Overflow columns already exist, skipping');
    }
    
    // Also update the auth_methods column default to include medium and stackoverflow
    log('[migration] Updating auth_methods default to include Medium and Stack Overflow');
    await db.execute(sql`
      ALTER TABLE users
      ALTER COLUMN auth_methods SET DEFAULT '{"password": true, "wallet": false, "google": false, "discord": false, "github": false, "twitter": false, "medium": false, "stackoverflow": false}'
    `);
    
    log('[migration] Medium and Stack Overflow migration completed successfully');
    await pool.end();
    
    return { success: true };
  } catch (error) {
    console.error('[migration] Error running Medium and Stack Overflow migration:', error);
    throw error;
  }
}

// Run the migration if this script is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

export default main;