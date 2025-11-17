import { pool } from './db';

async function main() {
  try {
    console.log("Directly adding social media columns via SQL commands...");
    
    // Add columns using direct SQL (more reliable than the schema-based approach)
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS google_id_hash TEXT,
      ADD COLUMN IF NOT EXISTS google_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS youtube_id_hash TEXT,
      ADD COLUMN IF NOT EXISTS youtube_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS youtube_subscribers INTEGER,
      ADD COLUMN IF NOT EXISTS github_id_hash TEXT,
      ADD COLUMN IF NOT EXISTS github_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS github_followers INTEGER,
      ADD COLUMN IF NOT EXISTS discord_id_hash TEXT,
      ADD COLUMN IF NOT EXISTS discord_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS discord_username TEXT,
      ADD COLUMN IF NOT EXISTS telegram_id INTEGER,
      ADD COLUMN IF NOT EXISTS telegram_username TEXT,
      ADD COLUMN IF NOT EXISTS telegram_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS telegram_followers INTEGER,
      ADD COLUMN IF NOT EXISTS instagram_username TEXT,
      ADD COLUMN IF NOT EXISTS instagram_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS instagram_followers INTEGER,
      ADD COLUMN IF NOT EXISTS x_id_hash TEXT,
      ADD COLUMN IF NOT EXISTS x_username TEXT,
      ADD COLUMN IF NOT EXISTS x_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS x_followers INTEGER,
      ADD COLUMN IF NOT EXISTS facebook_id_hash TEXT,
      ADD COLUMN IF NOT EXISTS facebook_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS facebook_friends INTEGER,
      ADD COLUMN IF NOT EXISTS linkedin_id_hash TEXT,
      ADD COLUMN IF NOT EXISTS linkedin_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS linkedin_connections INTEGER
    `);
    
    // Verify columns were added
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='google_id_hash'
    `);
    
    console.log(`Column google_id_hash exists: ${result.rows.length > 0}`);
    
    if (result.rows.length > 0) {
      console.log("Direct SQL column addition successful");
    } else {
      throw new Error("Column addition failed to take effect");
    }
  } catch (error) {
    console.error("Error during direct column addition:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();