import { db, pool } from './db';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run the analytics tables migration
 */
async function main() {
  try {
    console.log('[migration] Starting analytics tables migration');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'migrations', 'analytics-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    await pool.query(sql);

    console.log('[migration] Analytics tables migration completed successfully');
    
    // Close the database connection
    await pool.end();
    
    process.exit(0);
  } catch (error) {
    console.error('[migration] Error running analytics migration:', error);
    process.exit(1);
  }
}

main();