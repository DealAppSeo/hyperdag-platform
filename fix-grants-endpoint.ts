/**
 * HyperDAG Grants API - Fixed Implementation
 * 
 * This implementation directly interacts with the database
 * to properly handle the grant sources data despite schema mismatches.
 */

import express from 'express';
import { db } from './db';
import { sql } from 'drizzle-orm';

const router = express.Router();

// Get all grant sources
router.get('/api/grants-fixed', async (req, res) => {
  try {
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

    const sources = results.rows || [];
    
    // Filter by category if provided
    const category = req.query.category as string;
    if (category && sources.length > 0) {
      const filteredSources = sources.filter(source => 
        source.categories && source.categories.includes(category)
      );
      return res.json({ success: true, data: filteredSources });
    }
    
    return res.json({ success: true, data: sources });
  } catch (error) {
    console.error('Error in fixed grant sources endpoint:', error);
    return res.status(500).json({ success: false, data: null, message: 'Failed to fetch grant sources' });
  }
});

// Get available categories from grant sources
router.get('/api/grants-fixed/categories', async (req, res) => {
  try {
    const results = await db.execute(sql`
      SELECT DISTINCT UNNEST(categories) as category
      FROM grant_sources
      WHERE categories IS NOT NULL
      ORDER BY category
    `);

    return res.json({ 
      success: true, 
      data: results.rows.map(row => row.category) 
    });
  } catch (error) {
    console.error('Error fetching grant categories:', error);
    return res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Failed to fetch grant categories' 
    });
  }
});

export default router;