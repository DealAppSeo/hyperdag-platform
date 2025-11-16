/**
 * Purpose Hub API - Grants Search (Basic Implementation)
 * 
 * Works with existing grants table structure:
 * - id, name, description, source, amount, url, categories, requirements, deadline, is_active
 */

import express from 'express';
import { db } from '../db';
import { sql, eq, and, or, desc, asc, like, gte, lte, ilike } from 'drizzle-orm';

const router = express.Router();

// ========================================
// GRANTS API ENDPOINTS
// ========================================

// GET /api/purpose-hub/grants - Search and filter grants
router.get('/grants', async (req, res) => {
  try {
    const { 
      search, 
      category, 
      source,
      minAmount, 
      maxAmount,
      sortBy = 'created_at',
      sortOrder = 'desc',
      limit = 20,
      offset = 0 
    } = req.query;

    // Build dynamic where conditions using raw SQL for existing table
    const conditions = [];
    const params: any[] = [];
    
    // Search in name and description
    if (search) {
      conditions.push(`(name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 2})`);
      params.push(`%${search}%`, `%${search}%`);
    }

    // Filter by category (using array contains)
    if (category) {
      conditions.push(`$${params.length + 1} = ANY(categories)`);
      params.push(category);
    }

    // Filter by source/organization
    if (source) {
      conditions.push(`source ILIKE $${params.length + 1}`);
      params.push(`%${source}%`);
    }

    // Filter by amount range
    if (minAmount) {
      conditions.push(`amount >= $${params.length + 1}`);
      params.push(parseInt(minAmount as string));
    }
    if (maxAmount) {
      conditions.push(`amount <= $${params.length + 1}`);
      params.push(parseInt(maxAmount as string));
    }

    // Only show active grants
    conditions.push('is_active = true');

    // Build WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    const validSortColumns = ['created_at', 'name', 'amount', 'deadline'];
    const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : 'created_at';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Execute the query
    const query = `
      SELECT * FROM grants 
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const results = await db.execute(sql.raw(query, params));

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total FROM grants 
      ${whereClause}
    `;
    const countResult = await db.execute(sql.raw(countQuery, params.slice(0, -2))); // Remove limit/offset params
    const totalCount = parseInt(countResult.rows[0].total as string);

    res.json({
      grants: results.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + parseInt(limit as string) < totalCount
      },
      filters: {
        search,
        category,
        source,
        minAmount,
        maxAmount
      }
    });

  } catch (error) {
    console.error('Error fetching grants:', error);
    res.status(500).json({ error: 'Failed to fetch grants' });
  }
});

// GET /api/purpose-hub/grants/:id - Get specific grant details
router.get('/grants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `SELECT * FROM grants WHERE id = $1 AND is_active = true`;
    const result = await db.execute(sql.raw(query, [parseInt(id)]));

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grant not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching grant:', error);
    res.status(500).json({ error: 'Failed to fetch grant' });
  }
});

// GET /api/purpose-hub/grants/categories - Get all available categories
router.get('/grants/categories', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT unnest(categories) as category 
      FROM grants 
      WHERE is_active = true 
      ORDER BY category
    `;
    
    const result = await db.execute(sql.raw(query));
    const categories = result.rows.map(row => row.category);
    
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/purpose-hub/grants/sources - Get all grant sources/organizations
router.get('/grants/sources', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT source 
      FROM grants 
      WHERE is_active = true AND source IS NOT NULL
      ORDER BY source
    `;
    
    const result = await db.execute(sql.raw(query));
    const sources = result.rows.map(row => row.source);
    
    res.json({ sources });
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

// ========================================
// SEARCH SUGGESTIONS AND AUTOCOMPLETE
// ========================================

// GET /api/purpose-hub/search/suggestions - Get search suggestions
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || (q as string).length < 2) {
      return res.json({ suggestions: [] });
    }

    const searchTerm = `%${q}%`;
    
    // Search across grant names and sources
    const query = `
      SELECT DISTINCT 
        name as suggestion,
        'grant' as type,
        source as organization
      FROM grants 
      WHERE is_active = true 
      AND (name ILIKE $1 OR description ILIKE $1 OR source ILIKE $1)
      LIMIT 8
    `;
    
    const result = await db.execute(sql.raw(query, [searchTerm]));
    const suggestions = result.rows.map(row => ({
      text: row.suggestion,
      type: row.type,
      organization: row.organization
    }));

    res.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// ========================================
// ANALYTICS AND STATS
// ========================================

// GET /api/purpose-hub/stats - Get Purpose Hub statistics
router.get('/stats', async (req, res) => {
  try {
    const queries = [
      // Total grants count
      `SELECT COUNT(*) as total_grants FROM grants WHERE is_active = true`,
      
      // Total funding available
      `SELECT SUM(amount) as total_funding FROM grants WHERE is_active = true`,
      
      // Top categories
      `
        SELECT 
          unnest(categories) as category,
          COUNT(*) as grant_count
        FROM grants 
        WHERE is_active = true
        GROUP BY unnest(categories)
        ORDER BY grant_count DESC
        LIMIT 5
      `,
      
      // Top organizations
      `
        SELECT 
          source as organization, 
          COUNT(*) as grant_count
        FROM grants 
        WHERE is_active = true AND source IS NOT NULL
        GROUP BY source
        ORDER BY grant_count DESC
        LIMIT 5
      `
    ];

    const [totalGrantsResult, totalFundingResult, topCategoriesResult, topOrganizationsResult] = 
      await Promise.all(queries.map(query => db.execute(sql.raw(query))));

    res.json({
      totalGrants: parseInt(totalGrantsResult.rows[0].total_grants as string),
      totalFunding: parseFloat(totalFundingResult.rows[0].total_funding as string) || 0,
      topCategories: topCategoriesResult.rows.map(row => ({
        category: row.category,
        count: parseInt(row.grant_count as string)
      })),
      topOrganizations: topOrganizationsResult.rows.map(row => ({
        organization: row.organization,
        count: parseInt(row.grant_count as string)
      }))
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ========================================
// AI-POWERED MATCHING (BASIC IMPLEMENTATION)
// ========================================

// POST /api/purpose-hub/match - Get basic grant recommendations
router.post('/match', async (req, res) => {
  try {
    const { userProfile } = req.body;
    const { interests = [], preferredAmount } = userProfile || {};
    
    let conditions = ['is_active = true'];
    let params: any[] = [];
    
    // Match based on interests (categories)
    if (interests.length > 0) {
      const categoryConditions = interests.map((_: string, index: number) => 
        `$${params.length + index + 1} = ANY(categories)`
      );
      conditions.push(`(${categoryConditions.join(' OR ')})`);
      params.push(...interests);
    }
    
    // Filter by amount if preference given
    if (preferredAmount) {
      const { min, max } = preferredAmount;
      if (min) {
        conditions.push(`amount >= $${params.length + 1}`);
        params.push(min);
      }
      if (max) {
        conditions.push(`amount <= $${params.length + 1}`);
        params.push(max);
      }
    }
    
    const query = `
      SELECT * FROM grants 
      WHERE ${conditions.join(' AND ')}
      ORDER BY amount DESC
      LIMIT 10
    `;
    
    const result = await db.execute(sql.raw(query, params));
    
    // Add simple match scores (placeholder for real AI)
    const matchesWithScores = result.rows.map(grant => ({
      ...grant,
      matchScore: Math.random() * 0.4 + 0.6, // 60-100% match score
      matchReasons: [
        'Category alignment',
        'Funding amount match',
        'Active opportunity'
      ].slice(0, Math.floor(Math.random() * 3) + 1)
    }));
    
    res.json({
      matches: matchesWithScores,
      userProfile,
      totalMatches: matchesWithScores.length
    });
    
  } catch (error) {
    console.error('Error in matching:', error);
    res.status(500).json({ error: 'Failed to generate matches' });
  }
});

export default router;