import { db } from '../db';
import { sql } from 'drizzle-orm';
import { logger } from '../utils/logger';

/**
 * Create storage table for the advanced storage service
 * This table stores key-value data and references to decentralized storage
 */
async function main() {
  try {
    logger.info('[migration] Creating storage table...');
    
    // Check if table already exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'storage'
      );
    `);
    
    if (tableExists[0] && tableExists[0].exists === true) {
      logger.info('[migration] Storage table already exists, skipping creation');
      return;
    }
    
    // Create the storage table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS storage (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE
      )
    `);
    
    // Create index on expires_at for TTL cleanup
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_storage_expires_at ON storage (expires_at)
    `);
    
    logger.info('[migration] Storage table created successfully');
  } catch (error) {
    logger.error('[migration] Failed to create storage table:', error);
    throw error;
  }
}

export { main };