import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Migration to add the 'type' column to the verification_codes table
 */
export async function addTypeColumnToVerificationCodes(): Promise<void> {
  try {
    // Check if the column already exists
    const checkColumnQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'verification_codes' AND column_name = 'type';
    `;
    
    const result = await db.execute(checkColumnQuery);
    const columnExists = result.rows.length > 0;
    
    if (!columnExists) {
      console.log('Adding type column to verification_codes table...');
      
      // Add the type column with a default value
      const addColumnQuery = sql`
        ALTER TABLE "verification_codes" 
        ADD COLUMN "type" text NOT NULL DEFAULT 'email_verification';
      `;
      
      await db.execute(addColumnQuery);
      console.log('Type column added successfully');
    } else {
      console.log('Type column already exists in verification_codes table');
    }
  } catch (error) {
    console.error('Error adding type column to verification_codes table:', error);
    throw error;
  }
}