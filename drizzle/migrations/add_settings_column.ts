import { pgTable, json } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { db } from '../../server/db';

// Migration to add settings column to users table
export async function runMigration() {
  console.log('Adding settings column to users table...');
  
  try {
    // Add settings column to users table
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
    `);
    
    console.log('Migration completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}