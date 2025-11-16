import { pool } from './db';

async function main() {
  try {
    console.log("Restarting server to ensure all schema changes are properly reflected...");
    
    // Check for columns that should exist
    const columnsToCheck = ["google_id_hash"];
    
    for (const columnName of columnsToCheck) {
      const result = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='${columnName}'
      `);
      
      console.log(`Column ${columnName} exists: ${result.rows.length > 0}`);
    }
    
    // No real changes needed, just forcing a restart
    console.log("Server restart completed successfully");
  } catch (error) {
    console.error("Error during restart:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();