import { pool } from '../db';
import { log } from '../vite';

/**
 * Adds the auth_level column to the users table
 */
export async function addAuthLevelColumn() {
  try {
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'auth_level';
    `;
    
    const columnExists = await pool.query(checkColumnQuery);
    
    if (columnExists.rowCount && columnExists.rowCount > 0) {
      log('auth_level column already exists', 'migration');
      return;
    }
    
    // Add the auth_level column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN auth_level INTEGER DEFAULT 1;
    `);
    
    // Set authLevel based on existing onboarding_stage
    await pool.query(`
      UPDATE users 
      SET auth_level = 
        CASE 
          WHEN onboarding_stage IS NULL THEN 1
          WHEN onboarding_stage = 1 THEN 1
          WHEN onboarding_stage = 2 THEN 1
          WHEN onboarding_stage = 3 THEN 2
          WHEN onboarding_stage = 4 THEN 2
          WHEN onboarding_stage = 5 THEN 3
          ELSE 1
        END;
    `);
    
    log('Added auth_level column to users table', 'migration');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Error adding auth_level column: ${errorMessage}`, 'migration');
    throw error;
  }
}