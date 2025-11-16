import { db } from '../db';
import { logger } from '../utils/logger';
import { sql } from 'drizzle-orm';

/**
 * Add the connected_wallets column to the users table
 */
export async function addConnectedWalletsColumn() {
  try {
    // Check if column already exists
    const result = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'connected_wallets'
    `);
    
    // Column already exists, skip creation
    if (result.rows && result.rows.length > 0) {
      logger.info('connected_wallets column already exists');
      return;
    }
    
    // Add column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN connected_wallets JSONB DEFAULT '{}'::jsonb NOT NULL
    `);
    
    logger.info('connected_wallets column added successfully');
  } catch (error: any) {
    logger.error(`Error adding connected_wallets column: ${error.message}`);
    throw error;
  }
}