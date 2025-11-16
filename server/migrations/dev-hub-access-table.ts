import { db } from '../db';
import { sql } from 'drizzle-orm';
import { log } from '../vite';

/**
 * Creates the dev_hub_access table if it doesn't exist
 */
export async function createDevHubAccessTable() {
  try {
    // Check if the table already exists
    const tableExists = await checkTableExists('dev_hub_access');
    
    if (!tableExists) {
      log('Creating dev_hub_access table...', 'migration');
      
      // Create the dev_hub_access table with all the required columns
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS dev_hub_access (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
          github_handle TEXT NOT NULL,
          has_access BOOLEAN DEFAULT FALSE,
          pending_request BOOLEAN DEFAULT TRUE,
          request_date TIMESTAMP DEFAULT NOW(),
          approved_date TIMESTAMP,
          reviewed_by INTEGER REFERENCES users(id),
          last_access_date TIMESTAMP,
          notes TEXT
        )
      `);
      
      log('Successfully created dev_hub_access table', 'migration');
      return true;
    } else {
      log('dev_hub_access table already exists, skipping creation', 'migration');
      return false;
    }
  } catch (error) {
    log(`Error creating dev_hub_access table: ${error.message}`, 'migration');
    return false;
  }
}

/**
 * Checks if a table exists in the database
 */
async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      )
    `);
    
    return result.rows[0]?.exists === true;
  } catch (error) {
    log(`Error checking if table ${tableName} exists: ${error.message}`, 'migration');
    return false;
  }
}