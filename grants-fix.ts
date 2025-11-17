/**
 * Direct SQL implementation for grant sources API
 * This bypasses the schema mismatch between code and database
 */
import express from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { apiResponse } from './index';

const router = express.Router();

// Get all grant sources
router.get('/api/grants-fixed', async (req, res) => {
  try {
    // Direct SQL implementation to fix schema mismatch
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
    
    const sources = results.rows || [];
    
    // Filter by category if provided
    const category = req.query.category as string;
    if (category && sources.length > 0) {
      const filteredSources = sources.filter(source => 
        source.categories && Array.isArray(source.categories) && source.categories.includes(category)
      );
      return res.json(apiResponse(true, filteredSources));
    }
    
    return res.json(apiResponse(true, sources));
  } catch (error) {
    console.error('Error in fixed grant sources endpoint:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to fetch grant sources'));
  }
});

// Get specific grant source by ID
router.get('/api/grants-fixed/:id', async (req, res) => {
  try {
    const sourceId = parseInt(req.params.id);
    if (isNaN(sourceId)) {
      return res.status(400).json(apiResponse(false, null, 'Invalid grant source ID'));
    }

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
      WHERE id = ${sourceId}
    `);

    if (!results.rows || results.rows.length === 0) {
      return res.status(404).json(apiResponse(false, null, 'Grant source not found'));
    }

    return res.json(apiResponse(true, results.rows[0]));
  } catch (error) {
    console.error('Error fetching grant source:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to fetch grant source'));
  }
});

// Get available categories
router.get('/api/grants-fixed/categories', async (req, res) => {
  try {
    const results = await db.execute(sql`
      SELECT DISTINCT UNNEST(categories) as category
      FROM grant_sources
      WHERE categories IS NOT NULL
      ORDER BY category
    `);

    return res.json(apiResponse(true, results.rows.map(row => row.category)));
  } catch (error) {
    console.error('Error fetching grant categories:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to fetch grant categories'));
  }
});

export default router;