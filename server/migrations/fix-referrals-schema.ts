import { db, pool } from '../db';

/**
 * Migration to add status column to referrals table if it doesn't exist
 */
export async function addStatusColumnToReferrals(): Promise<boolean> {
  console.log('[migration] Checking if status column exists in referrals table...');
  
  try {
    // Check if the status column exists
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'referrals' AND column_name = 'status'
    `);
    
    if (result.rows.length === 0) {
      console.log('[migration] Status column does not exist, adding it...');
      
      // Add the status column with a default value of 'pending'
      await pool.query(`
        ALTER TABLE referrals 
        ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
      `);
      
      console.log('[migration] Status column added to referrals table');
      return true;
    } else {
      console.log('[migration] Status column already exists in referrals table');
      return false;
    }
  } catch (error) {
    console.error('[migration] Error updating referrals table:', error);
    throw error;
  }
}