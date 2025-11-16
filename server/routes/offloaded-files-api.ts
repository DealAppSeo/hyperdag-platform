/**
 * Offloaded Files API
 * Retrieve MD files and documentation stored in database
 * Now with caching for improved performance and rate limiting
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { db } from '../db';
import { offloadedFiles } from '../../shared/schema';
import { eq, like, sql } from 'drizzle-orm';

const router = Router();

// Rate limiter: Prevent scraping and abuse
const fileRetrievalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Apply rate limiting to all file retrieval endpoints
router.use(fileRetrievalLimiter);

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  expires: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Limit cache to 100 entries to prevent unbounded growth
  
  set(key: string, value: any, ttlSeconds: number = 300) {
    // Evict oldest entry if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data: value,
      expires: Date.now() + (ttlSeconds * 1000),
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  clear() {
    this.cache.clear();
  }
  
  size() {
    return this.cache.size;
  }
}

const cache = new SimpleCache();

/**
 * GET /api/offloaded-files
 * List all offloaded files with metadata
 */
router.get('/', async (req, res) => {
  try {
    const { category, type, search } = req.query;
    
    // Create cache key from query params
    const cacheKey = `list:${category || ''}:${type || ''}:${search || ''}`;
    
    // Try to get from cache
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('X-Cache', 'HIT');
      return res.json({
        ...cached,
        cached: true,
      });
    }
    
    let query = db.select({
      id: offloadedFiles.id,
      filePath: offloadedFiles.filePath,
      fileName: offloadedFiles.fileName,
      fileType: offloadedFiles.fileType,
      category: offloadedFiles.category,
      size: offloadedFiles.size,
      offloadedAt: offloadedFiles.offloadedAt,
    }).from(offloadedFiles);
    
    // Apply filters
    const conditions = [];
    if (category) {
      conditions.push(eq(offloadedFiles.category, category as string));
    }
    if (type) {
      conditions.push(eq(offloadedFiles.fileType, type as string));
    }
    if (search) {
      conditions.push(like(offloadedFiles.filePath, `%${search}%`));
    }
    
    // Only apply where clause if we have conditions
    const files = conditions.length > 0 
      ? await query.where(sql`${sql.join(conditions, sql` AND `)}`)
      : await query;
    
    const response = {
      success: true,
      count: files.length,
      files,
    };
    
    // Cache for 5 minutes
    cache.set(cacheKey, response, 300);
    
    // Set Cache-Control headers for HTTP caching
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('X-Cache', cached ? 'HIT' : 'MISS');
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/offloaded-files/stats
 * Get offload statistics (heavily cached)
 */
router.get('/stats', async (req, res) => {
  try {
    const cacheKey = 'stats';
    
    // Try to get from cache
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Cache', 'HIT');
      return res.json({
        ...cached,
        cached: true,
      });
    }
    
    const stats = await db
      .select({
        category: offloadedFiles.category,
        fileType: offloadedFiles.fileType,
        count: sql<string>`COALESCE(count(*), 0)::text`,
        totalSize: sql<string>`COALESCE(sum(${offloadedFiles.size}), 0)::text`,
      })
      .from(offloadedFiles)
      .groupBy(offloadedFiles.category, offloadedFiles.fileType);
    
    const totalResult = await db
      .select({
        count: sql<string>`COALESCE(count(*), 0)::text`,
        totalSize: sql<string>`COALESCE(sum(${offloadedFiles.size}), 0)::text`,
      })
      .from(offloadedFiles);
    
    // Convert strings to numbers
    const formattedStats = stats.map(s => ({
      category: s.category,
      fileType: s.fileType,
      count: parseInt(s.count) || 0,
      totalSize: parseInt(s.totalSize) || 0,
    }));
    
    const total = totalResult.length > 0 ? {
      count: parseInt(totalResult[0].count) || 0,
      totalSize: parseInt(totalResult[0].totalSize) || 0,
    } : { count: 0, totalSize: 0 };
    
    const response = {
      success: true,
      stats: formattedStats,
      total,
    };
    
    // Cache stats for 1 hour (stats rarely change)
    cache.set(cacheKey, response, 3600);
    
    // Set Cache-Control headers for HTTP caching
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Cache', cached ? 'HIT' : 'MISS');
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/offloaded-files/path/*
 * Get file content by path (e.g., /api/offloaded-files/path/README.md)
 */
router.get('/path/*', async (req, res) => {
  try {
    const filePath = (req.params as any)[0] as string;
    const cacheKey = `path:${filePath}`;
    
    // Try to get from cache
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      if (cached.isPlainText) {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('X-Cache', 'HIT');
        return res.send(cached.content);
      }
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Cache', 'HIT');
      return res.json({
        ...cached,
        cached: true,
      });
    }
    
    const [file] = await db
      .select()
      .from(offloadedFiles)
      .where(eq(offloadedFiles.filePath, filePath));
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Return as plain text for markdown/text files
    if (file.fileType === 'markdown' || file.fileType === 'text') {
      cache.set(cacheKey, { content: file.content, isPlainText: true }, 3600);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Cache', cached ? 'HIT' : 'MISS');
      return res.send(file.content);
    }
    
    const response = {
      success: true,
      file,
    };
    
    cache.set(cacheKey, response, 3600);
    
    // Set Cache-Control headers for HTTP caching
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Cache', cached ? 'HIT' : 'MISS');
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/offloaded-files/:id
 * Get file content by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `id:${id}`;
    
    // Try to get from cache
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Cache', 'HIT');
      return res.json({
        ...cached,
        cached: true,
      });
    }
    
    const [file] = await db
      .select()
      .from(offloadedFiles)
      .where(eq(offloadedFiles.id, parseInt(id)));
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const response = {
      success: true,
      file,
    };
    
    // Cache for 1 hour
    cache.set(cacheKey, response, 3600);
    
    // Set Cache-Control headers for HTTP caching
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Cache', cached ? 'HIT' : 'MISS');
    
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/offloaded-files/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', (req, res) => {
  res.json({
    success: true,
    cacheSize: cache.size(),
    message: 'Cache contains entries for faster repeated requests',
  });
});

/**
 * POST /api/offloaded-files/cache/clear
 * Clear the cache (admin only in production)
 */
router.post('/cache/clear', (req, res) => {
  cache.clear();
  res.json({
    success: true,
    message: 'Cache cleared successfully',
  });
});

export default router;
