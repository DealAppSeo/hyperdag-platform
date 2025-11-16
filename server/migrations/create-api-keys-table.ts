import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Creates the API keys table for developer API key management
 */
async function main() {
  console.log("Creating API keys table...");
  
  try {
    // Check if the table already exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'api_keys'
      );
    `);
    
    const tableExists = tableCheck.rows[0]?.exists;
    
    if (tableExists) {
      console.log("API keys table already exists");
      return;
    }
    
    // Create the API keys table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        key_hash VARCHAR(255) NOT NULL,
        key_prefix VARCHAR(10) NOT NULL,
        scopes TEXT[] NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        last_used TIMESTAMP WITH TIME ZONE
      )
    `);
    
    // Create index for faster lookups
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)
    `);
    
    console.log("API keys table created successfully");
  } catch (error) {
    console.error("Error creating API keys table:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in migration:", error);
    process.exit(1);
  });