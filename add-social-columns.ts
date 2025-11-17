import { pool, db } from './db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log("Adding social-related columns to users table...");
    
    // Add each column if it doesn't exist
    const columnsToAdd = [
      // OAuth related columns
      "googleIdHash text",
      "googleVerified boolean DEFAULT false",
      "youtubeIdHash text",
      "youtubeVerified boolean DEFAULT false",
      "youtubeSubscribers integer",
      "githubIdHash text",
      "githubVerified boolean DEFAULT false",
      "githubFollowers integer",
      "discordIdHash text",
      "discordVerified boolean DEFAULT false",
      "discordUsername text",
      
      // Social media columns
      "telegramId integer",
      "telegramUsername text",
      "telegramVerified boolean DEFAULT false",
      "telegramFollowers integer",
      "instagramUsername text",
      "instagramVerified boolean DEFAULT false",
      "instagramFollowers integer",
      "xIdHash text",
      "xUsername text",
      "xVerified boolean DEFAULT false",
      "xFollowers integer",
      "facebookIdHash text",
      "facebookVerified boolean DEFAULT false",
      "facebookFriends integer",
      "linkedinIdHash text",
      "linkedinVerified boolean DEFAULT false",
      "linkedinConnections integer"
    ];
    
    let addedColumns = 0;
    
    for (const columnDef of columnsToAdd) {
      const columnName = columnDef.split(' ')[0];
      
      // Check if column exists
      const result = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='${columnName}'
      `);
      
      if (result.rows.length === 0) {
        // Add the column
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${columnDef}`);
        console.log(`Added column: ${columnName}`);
        addedColumns++;
      } else {
        console.log(`Column already exists: ${columnName}`);
      }
    }
    
    console.log(`Added ${addedColumns} columns to the users table`);
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();