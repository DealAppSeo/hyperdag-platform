import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Direct SQL implementation to fix the grant sources API
 * This works around the schema mismatch between our code and database
 */

// Get all grant sources with proper column mapping
export async function getAllGrantSources() {
  // Use raw SQL to get all grant sources with the correct columns
  const results = await db.execute(sql`
    SELECT 
      id, 
      name, 
      description, 
      website, 
      categories, 
      available_funds as "availableFunds", 
      application_url as "applicationUrl", 
      contact_email as "contactEmail",
      application_deadline as "applicationDeadline", 
      is_active as "isActive", 
      created_at as "createdAt", 
      updated_at as "updatedAt"
    FROM grant_sources
  `);

  return results.rows || [];
}

// Get active grant sources
export async function getActiveGrantSources() {
  const results = await db.execute(sql`
    SELECT 
      id, 
      name, 
      description, 
      website, 
      categories, 
      available_funds as "availableFunds", 
      application_url as "applicationUrl", 
      contact_email as "contactEmail",
      application_deadline as "applicationDeadline", 
      is_active as "isActive", 
      created_at as "createdAt", 
      updated_at as "updatedAt"
    FROM grant_sources
    WHERE is_active = true
  `);

  return results.rows || [];
}

// Get grant source by ID
export async function getGrantSourceById(id: number) {
  const results = await db.execute(sql`
    SELECT 
      id, 
      name, 
      description, 
      website, 
      categories, 
      available_funds as "availableFunds", 
      application_url as "applicationUrl", 
      contact_email as "contactEmail",
      application_deadline as "applicationDeadline", 
      is_active as "isActive", 
      created_at as "createdAt", 
      updated_at as "updatedAt"
    FROM grant_sources
    WHERE id = ${id}
  `);

  return results.rows && results.rows.length > 0 ? results.rows[0] : undefined;
}

// Create new grant source
export async function createGrantSource(data: any) {
  const results = await db.execute(sql`
    INSERT INTO grant_sources (
      name, 
      description, 
      website, 
      categories, 
      available_funds, 
      application_url, 
      contact_email,
      application_deadline, 
      is_active, 
      created_at, 
      updated_at
    ) VALUES (
      ${data.name},
      ${data.description},
      ${data.website},
      ${data.categories},
      ${data.availableFunds},
      ${data.applicationUrl},
      ${data.contactEmail},
      ${data.applicationDeadline ? new Date(data.applicationDeadline) : null},
      true,
      now(),
      now()
    )
    RETURNING 
      id, 
      name, 
      description, 
      website, 
      categories, 
      available_funds as "availableFunds", 
      application_url as "applicationUrl", 
      contact_email as "contactEmail",
      application_deadline as "applicationDeadline", 
      is_active as "isActive", 
      created_at as "createdAt", 
      updated_at as "updatedAt"
  `);

  return results.rows && results.rows.length > 0 ? results.rows[0] : undefined;
}

// Get available categories from grant sources
export async function getGrantCategories() {
  const results = await db.execute(sql`
    SELECT DISTINCT UNNEST(categories) as category
    FROM grant_sources
    WHERE categories IS NOT NULL
    ORDER BY category
  `);

  return results.rows.map(row => row.category);
}