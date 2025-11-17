import { pool, db } from './db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log("Adding auth_methods column to users table...");
    
    // Check if the column already exists
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='auth_methods'
    `);
    
    if (result.rows.length === 0) {
      // Column doesn't exist, so add it
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS auth_methods jsonb DEFAULT '{"password": true, "wallet": false, "google": false, "discord": false, "github": false, "twitter": false}'
      `);
      console.log("auth_methods column added successfully");
    } else {
      console.log("auth_methods column already exists");
    }
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();